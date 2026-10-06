export default function DownloadButton({ document, onDownload, downloading = false }) {
  return (
    <button
      className="download-button"
      type="button"
      onClick={() => onDownload(document)}
      disabled={downloading}
      aria-label={`Baixar ${document.originalName}`}
      aria-busy={downloading}
      title={downloading ? 'Baixando documento...' : 'Baixar documento'}
    >
      <span aria-hidden="true">{downloading ? '...' : '\u2193'}</span>
    </button>
  );
}