export default function UploadForm({ file, onFileSelected, onSubmit, uploading }) {
  function handleDrop(event) {
    event.preventDefault();
    if (!uploading) onFileSelected(event.dataTransfer.files?.[0] || null);
  }

  return (
    <form className="upload-form" onSubmit={onSubmit}>
      <label
        className={`drop-zone${file ? ' drop-zone--selected' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={(event) => onFileSelected(event.target.files?.[0] || null)}
          disabled={uploading}
        />
        <span className="drop-zone__icon" aria-hidden="true">+</span>
        <span className="drop-zone__copy">
          <strong>{file ? file.name : 'Escolha um arquivo'}</strong>
          <span>{file ? 'Pronto para enviar' : 'ou arraste e solte aqui'}</span>
        </span>
        <span className="drop-zone__action">Procurar</span>
      </label>
      <button className="button button--primary upload-submit" type="submit" disabled={!file || uploading}>
        {uploading ? 'Enviando...' : 'Enviar documento'}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}