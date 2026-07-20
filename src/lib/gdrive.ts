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

export function toStreamUrl(url: string): string {
  if (!url) return url;
  if (!isDriveUrl(url)) return url;
  const fileId = extractDriveFileId(url);
  if (!fileId) return url;
  const alreadyDirect = url.includes('export=download') || url.includes('confirm=t');
  if (alreadyDirect) return url;
  return getDriveStreamUrl(fileId);
}

export function rewriteAudioUrl(url: string): string {
  return toStreamUrl(url);
}
