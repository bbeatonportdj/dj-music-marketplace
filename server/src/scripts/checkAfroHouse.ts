import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1GMAr-2QUDUsns_lIEpzffFq-DndwbFJd';

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(raw),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

async function main() {
  // Try listing ALL files regardless of parent
  const res: any = await drive.files.list({
    q: `'${FOLDER_ID}' in parents`,
    fields: 'files(id, name, mimeType, size, parents)',
    pageSize: 100,
  });
  console.log('Files:', JSON.stringify(res.data.files, null, 2));

  // Also try getting folder info
  try {
    const folder: any = await drive.files.get({
      fileId: FOLDER_ID,
      fields: 'id, name, mimeType',
    });
    console.log('\nFolder info:', JSON.stringify(folder.data, null, 2));
  } catch (e: any) {
    console.log('\nFolder error:', e.message);
  }

  // Try with different query
  const res2: any = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    pageSize: 100,
  });
  console.log('\nWith trashed=false:', JSON.stringify(res2.data.files, null, 2));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
