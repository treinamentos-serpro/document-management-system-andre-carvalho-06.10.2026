import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, loading, onDownload, downloadingId }) {
  if (loading) {
    return <div className="list-state" role="status">Carregando documentos...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="list-state list-state--empty">
        <span className="empty-mark" aria-hidden="true">0</span>
        <div>
          <strong>Nenhum documento por aqui</strong>
          <p>Os arquivos enviados para este usuário aparecerão nesta lista.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Documento</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <div className="file-cell">
                  <span className="file-mark" aria-hidden="true">DOC</span>
                  <span className="file-name" title={document.originalName}>{document.originalName}</span>
                </div>
              </td>
              <td className="muted-cell">{formatSize(document.size)}</td>
              <td className="muted-cell">{formatDate(document.uploadedAt)}</td>
              <td className="action-cell">
                <DownloadButton
                  document={document}
                  onDownload={onDownload}
                  downloading={downloadingId === document.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}