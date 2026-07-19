import { google } from 'googleapis';
import { parseFile } from 'music-metadata';
import fs from 'fs';

let driveInstance: any = null;

function getDrive() {
  if (driveInstance) return driveInstance;
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!raw) throw new Error('GOOGLE_DRIVE_CREDENTIALS not set');
  const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
  driveInstance = google.drive({ version: 'v3', auth });
  return driveInstance;
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = getDrive();
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data as ArrayBuffer);
}

export async function extractArtwork(fileId: string): Promise<string | null> {
  try {
    const buffer = await downloadFile(fileId);
    const tmpPath = `/tmp/temp_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;
    fs.writeFileSync(tmpPath, buffer);
    const metadata = await parseFile(tmpPath);
    fs.unlinkSync(tmpPath);

    const pictures = metadata.common.picture;
    if (pictures && pictures.length > 0) {
      const pic = pictures[0];
      const inputPath = `/tmp/aw_${Date.now()}`;
      const outputPath = `/tmp/aw_r_${Date.now()}.jpg`;
      fs.writeFileSync(inputPath, pic.data);
      const sharp = (await import('sharp')).default;
      await sharp(inputPath).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(outputPath);
      const resized = fs.readFileSync(outputPath);
      const base64 = resized.toString('base64');
      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (e) {}
  return null;
}

export async function getAllFiles(folderId: string, recursive: boolean = false): Promise<any[]> {
  const drive = getDrive();
  const all: any[] = [];
  let pageToken: string | undefined;

  do {
    const res: any = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, size, mimeType), nextPageToken',
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files || []) {
      if (f.mimeType?.includes('audio')) {
        all.push(f);
      } else if (recursive && f.mimeType?.includes('folder')) {
        const subFiles = await getAllFiles(f.id, true);
        all.push(...subFiles);
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return all;
}
