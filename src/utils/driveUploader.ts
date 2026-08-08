export const uploadPdfToDrive = async (token: string, pdfBlob: Blob, filename: string): Promise<string> => {
  const metadata = {
    name: filename,
    mimeType: 'application/pdf'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', pdfBlob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload to Drive: ${errorText}`);
  }

  const data = await res.json();
  return data.id;
};
