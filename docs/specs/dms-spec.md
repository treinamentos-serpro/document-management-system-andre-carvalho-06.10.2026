# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem seus documentos, mantendo os arquivos no filesystem local da aplicação e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos associados a um usuário.
- Download de um documento pelo identificador, restrito ao usuário associado.
- Exibição de nome, tamanho e data de envio.
- Armazenamento dos arquivos localmente com `multer` e `diskStorage`.
- Interface web para envio, listagem e download.

### Fora do escopo

- Autenticação, autorização baseada em credenciais ou gestão de contas.
- Armazenamento externo, em nuvem ou em serviços de terceiros.
- Versionamento, edição ou exclusão de documentos.
- Persistência durável dos metadados.
- Compartilhamento de documentos entre usuários.
- Restrições de upload por tipo de arquivo.

### Premissas de identidade

O identificador do usuário é recebido no cabeçalho `X-User-Id`. Ele serve para associar e filtrar documentos, mas não comprova a identidade de quem faz a requisição. A aplicação não deve tratar esse mecanismo como autenticação ou proteção adequada para exposição pública.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um único arquivo em uma requisição `multipart/form-data`, no campo `file`. |
| RF-02 | O envio exige um identificador de usuário não vazio no cabeçalho `X-User-Id`, limitado a 128 caracteres. |
| RF-03 | O sistema gera um identificador único para cada documento. |
| RF-04 | O sistema mantém o nome original, tamanho, data de envio e identificador do dono como metadados. |
| RF-05 | O sistema grava o conteúdo do arquivo no filesystem local usando `multer` com `diskStorage`. |
| RF-06 | O nome usado no armazenamento local é gerado pela aplicação e não é derivado do nome enviado pelo usuário. |
| RF-07 | O usuário pode listar os metadados dos documentos associados ao seu identificador. |
| RF-08 | A listagem não inclui documentos associados a outros identificadores de usuário. |
| RF-09 | O usuário pode baixar um documento pelo identificador quando ele estiver associado ao seu identificador. |
| RF-10 | Uma requisição sem usuário, arquivo obrigatório ou identificador válido recebe uma resposta de erro adequada. |
| RF-11 | Uma requisição para documento inexistente ou pertencente a outro usuário recebe `404 Not Found`. |
| RF-12 | A interface permite enviar um arquivo, visualizar a lista retornada e iniciar o download de um documento. |
| RF-13 | `GET /health` informa o estado básico do serviço. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são armazenados somente no filesystem local, por padrão em `backend/storage`. |
| RNF-02 | Os uploads usam `multer` com `diskStorage`; nenhum provedor externo é permitido. |
| RNF-03 | Os metadados ficam em memória e podem ser perdidos quando o processo reiniciar. |
| RNF-04 | Configurações operacionais são fornecidas por variáveis de ambiente, seguindo o princípio 12-Factor. |
| RNF-05 | O limite padrão de upload é 10 MiB e pode ser configurado por ambiente. |
| RNF-06 | O nome original não é usado como caminho de armazenamento, evitando traversal de diretório. |
| RNF-07 | Erros são retornados em formato JSON consistente. |
| RNF-08 | O backend segue a direção `routes -> controllers -> services -> repositories`. |
| RNF-09 | O backend usa JavaScript CommonJS; o frontend usa React e Vite. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único gerado pela aplicação. |
| `originalName` | string | Sim | Nome original fornecido no upload, usado para exibição e download. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora do envio em formato ISO 8601. |
| `owner` | string | Sim | Identificador recebido em `X-User-Id`. |

Exemplo:

```json
{
  "id": "9d9e542e-4408-43a9-a274-0ff6e9e60b32",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-06T14:30:00.000Z",
  "owner": "usuario-123"
}
```

O repositório mantém também o nome interno gerado para o arquivo. Esse dado não é exposto pela API. O conteúdo fica no filesystem; os metadados e a associação ao nome interno ficam em memória.

## 6. Contratos de API

Respostas de erro usam o formato:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo para continuar."
  }
}
```

### `POST /upload`

Envia um documento para o usuário indicado.

- Cabeçalho obrigatório: `X-User-Id`.
- Corpo: `multipart/form-data` com um arquivo no campo `file`.
- Sucesso: `201 Created`, com os metadados públicos do documento.
- `400 Bad Request`: usuário ausente/inválido, arquivo ausente ou campo inesperado.
- `413 Payload Too Large`: arquivo acima do limite configurado.
- `500 Internal Server Error`: falha não recuperável ao gravar arquivo ou metadados.

### `GET /documents`

Lista os documentos associados ao usuário.

- Cabeçalho obrigatório: `X-User-Id`.
- Sucesso: `200 OK`, com `{ "documents": [...] }`; usuário sem documentos recebe lista vazia.
- `400 Bad Request`: cabeçalho de usuário ausente ou inválido.
- `500 Internal Server Error`: falha ao consultar metadados.

### `GET /documents/:id/download`

Baixa um documento associado ao usuário.

- Cabeçalho obrigatório: `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário com `Content-Disposition: attachment` e nome original.
- `400 Bad Request`: cabeçalho de usuário ausente ou inválido.
- `404 Not Found`: documento inexistente, não associado ao usuário ou arquivo local indisponível.
- `500 Internal Server Error`: falha de leitura do arquivo.

Retornar `404` tanto para documentos inexistentes quanto para documentos de outro usuário evita revelar a existência de documentos alheios.

### `GET /health`

- Sucesso: `200 OK`, com `{ "status": "ok" }`.

## 7. Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local para os arquivos enviados. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Tamanho máximo de cada arquivo, em bytes. |

O diretório de armazenamento deve permanecer no filesystem local da aplicação. Caminhos ou serviços externos não fazem parte desta especificação.

## 8. Decisões arquiteturais

- `routes` declara endpoints, configura o middleware `multer` e delega o tratamento HTTP.
- `controllers` valida a presença do arquivo e traduz resultados para respostas HTTP.
- `services` concentra regras de negócio e associação do documento ao usuário.
- `repositories` encapsula o armazenamento local dos arquivos e os metadados em memória.
- O caminho interno do arquivo não é exposto nos metadados retornados.
- O frontend acessa o backend pelo prefixo `/api`; o proxy de desenvolvimento do Vite remove esse prefixo.
- `X-User-Id` é uma convenção temporária, não um mecanismo de autenticação.
- Como os metadados são voláteis, após reinício os arquivos podem continuar no disco sem estarem disponíveis pela API. Essa limitação é aceita nesta fase.

## 9. Plano de execução

As etapas definem resultados verificáveis e não prescrevem alterações de arquivos específicos.

1. **Confirmar escopo e limites do MVP**: identidade temporária, limite de upload, respostas de erro e comportamento após reinício acordados.
2. **Entregar o fluxo de envio**: arquivo válido gravado localmente, metadados registrados em memória e resposta pública criada.
3. **Entregar listagem isolada por usuário**: somente documentos do identificador solicitado; lista vazia para usuário sem documentos.
4. **Entregar download com verificação de dono**: o dono baixa o arquivo; documento inexistente ou de outro usuário retorna `404`.
5. **Integrar os fluxos na interface**: envio, consulta da biblioteca e download disponíveis; erros apresentados ao usuário.
6. **Validar limites e condições operacionais**: arquivo ausente, excesso de tamanho, falhas de leitura/escrita, configuração por ambiente e endpoint de saúde verificados.

## 10. Critérios gerais de aceite

- Os endpoints previstos atendem aos contratos definidos.
- Os arquivos são gravados localmente com `multer` e `diskStorage`.
- Nenhuma resposta pública contém o caminho interno de armazenamento.
- Listagem e download respeitam o identificador do dono.
- O frontend usa `/api` para comunicação com o backend.
- A perda de metadados após reinício está documentada e não é confundida com persistência durável.
- Nenhum armazenamento externo ou versionamento é introduzido.