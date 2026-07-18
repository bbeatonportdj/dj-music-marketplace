import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1_RN3K9fb21Cypoy_ZRo8eGK-Jm5P0gZB';

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(raw),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

async function getAllFiles(folderId: string): Promise<any[]> {
  const all = [];
  let pageToken: string | undefined;
  do {
    const res: any = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, size, mimeType), nextPageToken',
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files || []) {
      if (f.mimeType === 'application/vnd.google-apps.folder') {
        const sub = await getAllFiles(f.id);
        all.push(...sub);
      } else if (f.mimeType?.includes('audio')) {
        all.push(f);
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return all;
}

const files = await getAllFiles(FOLDER_ID);
for (const f of files) {
  const mb = (Number(f.size) / 1024 / 1024).toFixed(1);
  console.log(`${f.name} | ${mb}MB | ${f.id}`);
}
console.log(`\nTotal: ${files.length} files`);
