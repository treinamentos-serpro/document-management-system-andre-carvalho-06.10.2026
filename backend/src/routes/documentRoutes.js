const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const multer = require('multer');
const express = require('express');
const createDocumentController = require('../controllers/documentController');

function createDocumentRoutes({ documentService, storageDir, maxFileSizeBytes }) {
  const router = express.Router();
  const controller = createDocumentController({ documentService });
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, callback) {
        fs.mkdir(storageDir, { recursive: true })
          .then(() => callback(null, storageDir), callback);
      },
      filename(req, file, callback) {
        callback(null, crypto.randomUUID());
      },
    }),
    limits: { fileSize: maxFileSizeBytes, files: 1 },
  });

  function requireUser(req, res, next) {
    const owner = req.get('X-User-Id')?.trim();
    if (!owner || owner.length > 128) {
      return res.status(400).json({
        error: { code: 'INVALID_USER', message: 'Informe um identificador de usuário válido.' },
      });
    }

    req.userId = owner;
    return next();
  }

  router.post('/upload', requireUser, upload.single('file'), controller.upload);
  router.get('/documents', requireUser, controller.list);
  router.get('/documents/:id/download', requireUser, controller.download);

  return router;
}

module.exports = createDocumentRoutes;