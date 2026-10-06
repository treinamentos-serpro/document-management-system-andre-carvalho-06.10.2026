function createDocumentController({ documentService }) {
  return {
    upload(req, res, next) {
      try {
        if (!req.file) {
          return res.status(400).json({
            error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo para continuar.' },
          });
        }

        const document = documentService.createDocument(req.file, req.userId);
        return res.status(201).json(document);
      } catch (error) {
        return next(error);
      }
    },

    list(req, res, next) {
      try {
        return res.status(200).json({
          documents: documentService.listDocuments(req.userId),
        });
      } catch (error) {
        return next(error);
      }
    },

    async download(req, res, next) {
      try {
        const document = await documentService.getDownload(req.params.id, req.userId);
        if (!document) {
          return res.status(404).json({
            error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
          });
        }

        res.type('application/octet-stream');
        return res.download(document.storagePath, document.originalName, (error) => {
          if (error) {
            if (res.headersSent) {
              return next(error);
            }
            if (error.code === 'ENOENT') {
              return res.status(404).json({
                error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
              });
            }
            return next(error);
          }
        });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = createDocumentController;