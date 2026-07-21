import { apiUrl } from './apiBase';

export async function directDownload(trackId: string, trackTitle: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/downloads/${trackId}`), { credentials: 'include' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Download failed' }));
    throw new Error(err.error || 'Download failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = trackTitle
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'track';
  link.setAttribute('download', `${safeName}.mp3`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
