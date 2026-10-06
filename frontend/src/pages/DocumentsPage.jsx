import { useEffect, useState } from 'react';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from '../services/documentService.js';

function getSavedUserId() {
  try {
    return window.localStorage.getItem('dms-user-id') || 'usuario-demo';
  } catch {
    return 'usuario-demo';
  }
}

export default function DocumentsPage({ children }) {
  const [userId, setUserId] = useState(getSavedUserId);
  const [userIdDraft, setUserIdDraft] = useState(userId);
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotice(null);
    listDocuments(userId)
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((error) => {
        if (active) {
          setDocuments([]);
          setNotice({ type: 'error', message: error.message });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  function applyUser(event) {
    event.preventDefault();
    const nextUserId = userIdDraft.trim();
    if (!nextUserId) {
      setNotice({ type: 'error', message: 'Informe um identificador de usuário.' });
      return;
    }

    try {
      window.localStorage.setItem('dms-user-id', nextUserId);
    } catch {
      // A sessão continua funcional mesmo quando o navegador bloqueia o armazenamento local.
    }
    setUserId(nextUserId);
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) return;

    setUploading(true);
    setNotice(null);
    try {
      await uploadDocument(userId, file);
      setFile(null);
      setInputKey((current) => current + 1);
      setDocuments(await listDocuments(userId));
      setNotice({ type: 'success', message: 'Documento enviado com sucesso.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setNotice(null);
    try {
      await downloadDocument(userId, document);
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Dossiê, início">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Dossiê<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-label">ARQUIVO DIGITAL <span>·</span> ESPAÇO PESSOAL</div>
        <span className="connection-status"><i /> Local</span>
      </header>

      <main className="workspace">
        <section className="page-heading">
          <div>
            <p className="eyebrow">PAINEL DE DOCUMENTOS</p>
            <h1>Seus documentos<span>.</span></h1>
            <p className="heading-copy">Um lugar simples para guardar e acessar seus arquivos.</p>
          </div>
          <form className="user-switcher" onSubmit={applyUser}>
            <label htmlFor="user-id">IDENTIFICADOR DO USUÁRIO</label>
            <div className="user-switcher__controls">
              <input
                id="user-id"
                value={userIdDraft}
                maxLength={128}
                onChange={(event) => setUserIdDraft(event.target.value)}
                aria-describedby="user-id-note"
              />
              <button className="button button--quiet" type="submit">Aplicar</button>
            </div>
            <span id="user-id-note">Identidade de demonstração, sem autenticação.</span>
          </form>
        </section>

        {notice && (
          <div className={`notice notice--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
            <span>{notice.type === 'error' ? '!' : '✓'}</span>
            {notice.message}
            <button type="button" onClick={() => setNotice(null)} aria-label="Dispensar mensagem">×</button>
          </div>
        )}

        {children({
          uploadProps: {
            file,
            onFileSelected: setFile,
            onSubmit: handleUpload,
            uploading,
            inputKey,
          },
          listProps: {
            documents,
            loading,
            onDownload: handleDownload,
            downloadingId,
          },
        })}
      </main>

      <footer className="page-footer">
        <span>Dossiê <b>·</b> Gestão local de documentos</span>
        <span>Os arquivos permanecem neste servidor.</span>
      </footer>
    </div>
  );
}