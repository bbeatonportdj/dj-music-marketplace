import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

async function check() {
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!raw) { console.error('No credentials'); return; }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const folderId = '1JclMGtmxrmEZ-b4Zv2TIiERDgns3z4Xp';
  
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size)',
    pageSize: 100,
  });

  console.log(`Found ${res.data.files?.length || 0} files:`);
  for (const f of res.data.files || []) {
    console.log(`  ${f.name} (${f.mimeType}) ${f.size ? '(' + (parseInt(f.size)/1024).toFixed(1) + 'KB)' : ''}`);
  }
}

check().catch(console.error);
