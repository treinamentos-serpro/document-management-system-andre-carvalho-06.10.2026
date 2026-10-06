const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('envia, lista e baixa documentos somente para o usuário dono', async (context) => {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-'));
  const application = app.createApp({ storageDir });
  const server = application.listen(0);
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const form = new FormData();
  form.append('file', new Blob(['conteudo do documento']), 'relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-123' },
    body: form,
  });
  assert.strictEqual(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.deepStrictEqual(Object.keys(document).sort(), [
    'id', 'originalName', 'owner', 'size', 'uploadedAt',
  ]);
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.strictEqual(document.owner, 'usuario-123');
  assert.strictEqual(document.size, Buffer.byteLength('conteudo do documento'));

  const ownList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-123' },
  });
  assert.deepStrictEqual((await ownList.json()).documents, [document]);

  const otherList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'outro-usuario' },
  });
  assert.deepStrictEqual((await otherList.json()).documents, []);

  const download = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'usuario-123' },
  });
  assert.strictEqual(download.status, 200);
  assert.strictEqual(await download.text(), 'conteudo do documento');

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'outro-usuario' },
  });
  assert.strictEqual(forbiddenDownload.status, 404);
});

test('valida usuário, arquivo obrigatório e tamanho máximo', async (context) => {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-limits-'));
  const application = app.createApp({ storageDir, maxFileSizeBytes: 4 });
  const server = application.listen(0);
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const missingUserResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingUserResponse.status, 400);
  assert.strictEqual((await missingUserResponse.json()).error.code, 'INVALID_USER');

  const emptyForm = new FormData();
  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-123' },
    body: emptyForm,
  });
  assert.strictEqual(missingFileResponse.status, 400);
  assert.strictEqual((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['12345']), 'grande.txt');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-123' },
    body: oversizedForm,
  });
  assert.strictEqual(oversizedResponse.status, 413);
  assert.strictEqual((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');
});
