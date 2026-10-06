async function request(endpoint, userId, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'X-User-Id': userId,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Não foi possível concluir a solicitação.');
  }

  return response;
}

export async function listDocuments(userId) {
  const response = await request('/documents', userId);
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(userId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await request('/upload', userId, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function downloadDocument(userId, document) {
  const response = await request(
    `/documents/${encodeURIComponent(document.id)}/download`,
    userId,
  );
  const fileUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = fileUrl;
  link.download = document.originalName;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}

async function testApp(endpoint, userId, options = {}) {
  try {
    const response = await request(endpoint, userId, options);
    return await response.json();
  } catch (error) {
    console.error('Test app request failed:', error);
    throw error;
  }
}