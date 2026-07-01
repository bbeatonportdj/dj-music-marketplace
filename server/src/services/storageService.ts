import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local uploads folder exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export class StorageService {
  /**
   * Upload file to storage (local fallback or cloud)
   * @param file Express.Multer.File object
   * @param folder Bucket folder ('artwork' or 'audio')
   * @param reqHost Current request host (e.g. 'localhost:5000') to format local url
   */
  static async uploadFile(file: Express.Multer.File, folder: 'artwork' | 'audio', reqHost: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    
    // Check for AWS S3 credentials
    if (
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET_NAME
    ) {
      console.log(`☁️ Cloud Storage: Uploading ${file.originalname} to AWS S3...`);
      try {
        const { S3Client } = await import('@aws-sdk/client-s3');
        const { Upload } = await import('@aws-sdk/lib-storage');
        
        const s3 = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });
        
        const key = `${folder}/${fileName}`;
        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
          },
        });
        
        await upload.done();
        const region = process.env.AWS_REGION || 'us-east-1';
        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
      } catch (err) {
        console.error('❌ AWS S3 Upload failed, falling back to local storage:', err);
      }
    }

    // Check for Google Cloud Storage credentials
    if (
      process.env.GCS_PROJECT_ID &&
      process.env.GCS_BUCKET_NAME &&
      (process.env.GCS_KEY_FILE || process.env.GCS_CREDENTIALS)
    ) {
      console.log(`☁️ Cloud Storage: Uploading ${file.originalname} to Google Cloud Storage...`);
      try {
        const { Storage } = await import('@google-cloud/storage');
        
        const gcsOptions: any = {
          projectId: process.env.GCS_PROJECT_ID,
        };
        if (process.env.GCS_KEY_FILE) {
          gcsOptions.keyFilename = process.env.GCS_KEY_FILE;
        } else if (process.env.GCS_CREDENTIALS) {
          gcsOptions.credentials = JSON.parse(process.env.GCS_CREDENTIALS);
        }
        
        const storage = new Storage(gcsOptions);
        const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
        const gcsFile = bucket.file(`${folder}/${fileName}`);
        
        await gcsFile.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
          public: true,
        });
        
        return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${folder}/${fileName}`;
      } catch (err) {
        console.error('❌ GCS Upload failed, falling back to local storage:', err);
      }
    }

    // Fallback: Local Disk Storage
    console.log(`📁 Local Storage: Saving ${file.originalname} to server disk...`);
    const localFilePath = path.join(uploadDir, fileName);
    fs.writeFileSync(localFilePath, file.buffer);
    
    // Return the HTTP link to access the file static route
    const protocol = reqHost.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${reqHost}/uploads/${fileName}`;
  }
}
