import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FOLDER_ID = '1OkcgSGqrgaPtNU6p6wqoInFNKCfTow0V';

const raw = process.env.GOOGLE_DRIVE_CREDENTIALS!;
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
const drive = google.drive({ version: 'v3', auth });

async function main() {
  console.log('📂 Scanning folder...\n');
  let files: any[] = [];
  let pageToken: string | undefined;
  do {
    const res: any = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, size, mimeType, modifiedTime), nextPageToken',
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files || []) {
      if (f.size && parseInt(f.size) > 10000) files.push(f);
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  // Sort by name
  files.sort((a, b) => a.name.localeCompare(b.name));

  const byExt: Record<string, { count: number; totalMB: number }> = {};
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() || '?';
    if (!byExt[ext]) byExt[ext] = { count: 0, totalMB: 0 };
    byExt[ext].count++;
    byExt[ext].totalMB += (parseInt(f.size) || 0) / 1024 / 1024;
  }

  console.log(`Total files: ${files.length}\n`);
  for (const [ext, v] of Object.entries(byExt)) {
    console.log(`  ${ext.toUpperCase()}: ${v.count} files (${v.totalMB.toFixed(1)} MB)`);
  }

  console.log(`\n--- All files ---`);
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = f.name.split('.').pop()?.toUpperCase();
    const mb = ((parseInt(f.size) || 0) / 1024 / 1024).toFixed(1);
    console.log(`${String(i+1).padStart(3)}. [${ext}] ${f.name} (${mb}MB)`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
