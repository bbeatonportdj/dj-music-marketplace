export const GDRIVE_BASE = 'https://drive.google.com/uc';

export function getDriveStreamUrl(fileId: string): string {
  return `${GDRIVE_BASE}?export=download&id=${fileId}&confirm=t`;
}

export function isDriveUrl(url: string): boolean {
  return url.includes('drive.google.com');
}

export function extractDriveFileId(url: string): string | null {
  const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/file\/d\/([^/]+)/);
  return match ? match[1] : null;
}

export function rewriteAudioUrl(url: string): string {
  if (!url) return url;
  const fileId = extractDriveFileId(url);
  if (fileId) return getDriveStreamUrl(fileId);
  return url;
}
