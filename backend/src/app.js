const express = require('express');
const path = require('node:path');
const createDocumentRepository = require('./repositories/documentRepository');
const createDocumentService = require('./services/documentService');
const createDocumentRoutes = require('./routes/documentRoutes');

function createApp(options = {}) {
  const storageDir = options.storageDir || process.env.STORAGE_DIR || path.resolve(__dirname, '../storage');
  const configuredLimit = Number(options.maxFileSizeBytes || process.env.MAX_FILE_SIZE_BYTES);
  const maxFileSizeBytes = Number.isInteger(configuredLimit) && configuredLimit > 0
    ? configuredLimit
    : 10 * 1024 * 1024;
  const documentRepository = createDocumentRepository({ storageDir });
  const documentService = createDocumentService({ documentRepository });
  const app = express();

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentRoutes({ documentService, storageDir, maxFileSizeBytes }));

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const isMulterError = error.name === 'MulterError';
    const status = error.code === 'LIMIT_FILE_SIZE'
      ? 413
      : (error.status || (isMulterError ? 400 : 500));
    const code = error.code === 'LIMIT_FILE_SIZE'
      ? 'FILE_TOO_LARGE'
      : (isMulterError ? 'INVALID_UPLOAD' : 'INTERNAL_SERVER_ERROR');
    const message = status === 413
      ? 'O arquivo excede o tamanho máximo permitido.'
      : (status < 500 ? error.message : 'Ocorreu um erro interno.');

    res.status(status).json({ error: { code, message } });
  });

  return app;
}

const app = createApp();
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;