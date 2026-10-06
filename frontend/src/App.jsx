import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';

export default function App() {
  return (
    <DocumentsPage>
      {({ uploadProps, listProps }) => (
        <>
          <section className="upload-section" aria-labelledby="upload-title">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">ADICIONAR AO ARQUIVO</p>
                <h2 id="upload-title">Novo documento</h2>
              </div>
              <span className="section-index">01 / ENVIO</span>
            </div>
            <UploadComponent {...uploadProps} key={uploadProps.inputKey} />
          </section>

          <section className="documents-section" aria-labelledby="documents-title">
            <div className="section-title-row documents-heading">
              <div>
                <p className="eyebrow">BIBLIOTECA PESSOAL</p>
                <h2 id="documents-title">Documentos <span className="count-badge">{listProps.documents.length}</span></h2>
              </div>
              <span className="section-index">02 / ARQUIVO</span>
            </div>
            <DocumentList {...listProps} />
          </section>
        </>
      )}
    </DocumentsPage>
  );
}
