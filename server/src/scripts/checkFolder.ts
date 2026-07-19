import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1Y1fXVOLRZ7bi-B_hNJy-V5ppX4pP5LCQ';

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

async function listAll(folderId: string, depth = 0) {
  let pageToken: string | undefined;
  do {
    const res: any = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size), nextPageToken',
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files || []) {
      const indent = '  '.repeat(depth);
      const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
      console.log(`${indent}${isFolder ? '📁' : '🎵'} ${f.name} [${f.mimeType}] ${f.size || ''}`);
      if (isFolder) await listAll(f.id, depth + 1);
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
}

async function main() {
  console.log(`📂 Folder contents:\n`);
  await listAll(FOLDER_ID);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
