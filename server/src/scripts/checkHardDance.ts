import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1mr__nNUeEeTOS5Pm06hbl5IwOaU_fdA9';

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

async function main() {
  let pageToken: string | undefined;
  let files: any[] = [];
  do {
    const res: any = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size), nextPageToken',
      pageSize: 1000,
      pageToken,
    });
    files = files.concat(res.data.files || []);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`Found ${files.length} files:\n`);
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase();
    const isAudio = ['mp3','flac','wav','aac','ogg','m4a'].includes(ext);
    console.log(`${isAudio ? '🎵' : '📁'} ${f.name} [${f.mimeType}] ${(f.size/1024).toFixed(0)}KB`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
