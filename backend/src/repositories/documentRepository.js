const fs = require('node:fs/promises');
const path = require('node:path');

function createDocumentRepository({ storageDir }) {
  const documents = new Map();

  return {
    create(metadata, storageFilename) {
      const record = { ...metadata, storageFilename };
      documents.set(record.id, record);
      return { ...metadata };
    },

    listByOwner(owner) {
      return [...documents.values()]
        .filter((document) => document.owner === owner)
        .map(({ storageFilename, ...metadata }) => metadata);
    },

    async findByOwner(id, owner) {
      const record = documents.get(id);
      if (!record || record.owner !== owner) {
        return null;
      }

      const storagePath = path.join(storageDir, record.storageFilename);
      try {
        await fs.access(storagePath);
      } catch {
        return null;
      }

      const { storageFilename, ...metadata } = record;
      return { ...metadata, storagePath };
    },
  };
}

module.exports = createDocumentRepository;