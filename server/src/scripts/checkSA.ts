import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

async function main() {
  // List ALL folders the SA can access
  const res: any = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: 'files(id, name, parents)',
    pageSize: 100,
  });
  console.log('Folders accessible to SA:');
  for (const f of res.data.files || []) {
    console.log(`  ${f.name} (id: ${f.id}, parents: ${f.parents})`);
  }

  // Also list ALL files (not just folders)
  const res2: any = await drive.files.list({
    q: 'trashed = false',
    fields: 'files(id, name, mimeType)',
    pageSize: 100,
  });
  console.log('\nAll files:');
  for (const f of res2.data.files || []) {
    console.log(`  ${f.name} [${f.mimeType}]`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
