import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

let driveClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const credentialsRaw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!credentialsRaw) {
    throw new Error('GOOGLE_DRIVE_CREDENTIALS not configured in environment');
  }

  const credentials = JSON.parse(credentialsRaw);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export async function getDriveFileStream(fileId: string): Promise<{
  stream: Readable;
  mimeType: string;
  fileName: string;
  fileSize: string;
}> {
  const drive = getDriveClient();

  const meta = await drive.files.get({
    fileId,
    fields: 'name, mimeType, size',
  });

  const fileName = meta.data.name || 'download';
  const mimeType = meta.data.mimeType || 'application/octet-stream';
  const fileSize = meta.data.size || '0';

  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    { responseType: 'stream' }
  );

  const stream = response.data as unknown as Readable;

  return { stream, mimeType, fileName, fileSize };
}

export function clearDriveClient(): void {
  driveClient = null;
}
