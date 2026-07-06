/**
 * Google Drive Service
 *
 * 📦 npm install googleapis
 *
 * Two client modes:
 *   - getDriveClient()      →  drive.readonly      (for streaming downloads)
 *   - getDriveWriteClient() →  drive               (full, for folder organization)
 */

import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

// ── Client cache ────────────────────────────────────────────
let readClient:  drive_v3.Drive | null = null;
let writeClient: drive_v3.Drive | null = null;

function getCredentials() {
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not configured');
  return JSON.parse(raw);
}

/** Read-only client — used for file streaming (downloads) */
function getDriveClient(): drive_v3.Drive {
  if (readClient) return readClient;
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  readClient = google.drive({ version: 'v3', auth });
  return readClient;
}

/** Read-write client — used for folder organization */
function getDriveWriteClient(): drive_v3.Drive {
  if (writeClient) return writeClient;
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  writeClient = google.drive({ version: 'v3', auth });
  return writeClient;
}

// ── File Streaming (Download) ───────────────────────────────

export async function getDriveFileStream(fileId: string): Promise<{
  stream: Readable;
  mimeType: string;
  fileName: string;
  fileSize: string;
}> {
  const drive = getDriveClient();
  const meta = await drive.files.get({ fileId, fields: 'name, mimeType, size' });
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return {
    stream: response.data as unknown as Readable,
    mimeType: meta.data.mimeType || 'application/octet-stream',
    fileName: meta.data.name || 'download',
    fileSize: meta.data.size || '0',
  };
}

// ── Folder Operations ───────────────────────────────────────

/** File info returned by listFiles */
export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
}

/**
 * List all files (non-folder) inside a Drive folder.
 */
export async function listFiles(folderId: string): Promise<DriveFileInfo[]> {
  const drive = getDriveWriteClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size)',
    pageSize: 200,
    orderBy: 'name',
  });
  return (res.data.files || []).filter(f => f.mimeType !== 'application/vnd.google-apps.folder') as DriveFileInfo[];
}

/**
 * List all subfolders inside a Drive folder.
 */
export async function listFolders(folderId: string): Promise<DriveFileInfo[]> {
  const drive = getDriveWriteClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name, mimeType)',
  });
  return (res.data.files || []) as DriveFileInfo[];
}

/**
 * Find a subfolder by name inside parentFolderId.
 * Returns null if not found.
 */
async function findFolder(parentFolderId: string, name: string): Promise<DriveFileInfo | null> {
  const drive = getDriveWriteClient();
  const res = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name, mimeType)',
  });
  return (res.data.files?.[0] as DriveFileInfo) || null;
}

/**
 * Create a subfolder inside parentFolderId.
 */
export async function createFolder(parentFolderId: string, folderName: string): Promise<DriveFileInfo> {
  const drive = getDriveWriteClient();
  const existing = await findFolder(parentFolderId, folderName);
  if (existing) return existing;

  const res = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id, name, mimeType',
  });
  return res.data as DriveFileInfo;
}

/**
 * Move a file into a target folder.
 */
export async function moveFile(fileId: string, targetFolderId: string): Promise<void> {
  const drive = getDriveWriteClient();
  // Get current parent folders
  const file = await drive.files.get({
    fileId,
    fields: 'parents',
  });
  const currentParents = file.data.parents?.join(',') || '';
  await drive.files.update({
    fileId,
    addParents: targetFolderId,
    removeParents: currentParents,
    fields: 'id, parents',
  });
}

export function clearDriveClients(): void {
  readClient = null;
  writeClient = null;
}
