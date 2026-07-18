import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1riyYkskit_hiKbFsJYdMps3meZXTLP2i';

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(raw),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

const res = await drive.files.list({
  q: `'${FOLDER_ID}' in parents and mimeType contains 'audio'`,
  fields: 'files(id, name, size)',
  pageSize: 1000,
});

for (const f of res.data.files || []) {
  const mb = (Number(f.size) / 1024 / 1024).toFixed(1);
  console.log(`${f.name} | ${mb}MB | ${f.id}`);
}
console.log(`\nTotal: ${(res.data.files || []).length} files`);
