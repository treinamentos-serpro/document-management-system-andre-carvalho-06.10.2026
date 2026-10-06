# Instruções do projeto - Document Management System (DMS)

## Contexto e documentação

- O contrato funcional e as decisões arquiteturais estão em [docs/specs/dms-spec.md](../docs/specs/dms-spec.md). Consulte-o antes de alterar endpoints, armazenamento ou comportamento de erro; mantenha estas instruções como guia operacional, sem duplicar a especificação.
- Backend: Node.js + Express, JavaScript CommonJS. Frontend: React + Vite, JavaScript ESM. Não introduza TypeScript nesta fase.
- Não há scripts na raiz; instale dependências e execute comandos no diretório do pacote correspondente.

## Arquitetura e limites

- Backend em `backend/src`: `routes -> controllers -> services -> repositories`. Rotas configuram HTTP e Multer; controllers traduzem HTTP; services contêm regras de negócio; repositories encapsulam metadados e filesystem.
- Frontend em `frontend/src`: organize por `pages/`, `components/` e `services/`; mantenha chamadas `fetch` à API nos services e reutilize componentes existentes.
- O frontend chama `/api`; o proxy do Vite em `frontend/vite.config.js` remove esse prefixo antes de encaminhar para o backend na porta `3000`. As rotas Express não incluem `/api`.

## Restrições e cuidados

- Uploads usam Multer `diskStorage` e ficam no filesystem local, por padrão em `backend/storage`; não use armazenamento externo. Gere nomes internos seguros, sem usar o nome original como caminho.
- Metadados ficam em memória: reiniciar o processo os perde, mesmo que os arquivos permaneçam no disco.
- `X-User-Id` é apenas um identificador fornecido pelo cliente, não autenticação. Não descreva nem trate o isolamento atual como proteção de identidade para exposição pública.
- Preserve os contratos de erro: documento alheio/inexistente ou arquivo ausente pode resultar em `404`; não converta falhas operacionais de filesystem, como permissão negada, em `404`.
- Configurações operacionais usam variáveis de ambiente (`PORT`, `STORAGE_DIR`, `MAX_FILE_SIZE_BYTES`); o limite padrão é 10 MiB.

## Convenções e validação

- Use nomes descritivos em inglês para símbolos; mensagens ao usuário e comentários em português. Prefira funções pequenas, dependências já instaladas e abstrações mínimas.
- Backend: `cd backend && npm ci && npm test`; execute com `npm run dev` ou `npm start`.
- Frontend (Node.js >= 24): `cd frontend && npm ci && npm run build`; execute com `npm run dev` e, para conferir a build, `npm run preview`.
- Testes backend usam `node:test`; adicione ou ajuste testes para mudanças de contrato e isole arquivos de teste em diretório temporário, sem gravar dados de teste em `backend/storage`.
