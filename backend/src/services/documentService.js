const { randomUUID } = require('node:crypto');

function createDocumentService({ documentRepository }) {
  return {
    createDocument(file, owner) {
      const metadata = {
        id: randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
      };

      return documentRepository.create(metadata, file.filename);
    },

    listDocuments(owner) {
      return documentRepository.listByOwner(owner);
    },

    getDownload(id, owner) {
      return documentRepository.findByOwner(id, owner);
    },
  };
}

module.exports = createDocumentService;