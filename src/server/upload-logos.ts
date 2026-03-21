import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { minioClient, uploadFile } from './minio.js';

async function uploadLogos() {
  const brandsDir = path.resolve('public/brands');
  const files = fs.readdirSync(brandsDir);

  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.svg')) {
      const filePath = path.join(brandsDir, file);
      const buffer = fs.readFileSync(filePath);
      
      const mimeType = file.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      
      console.log(`Uploading ${file}...`);
      const url = await uploadFile(`brands/${file}`, buffer, {
        'Content-Type': mimeType,
      });
      console.log(`✅ URL: ${url}`);
    }
  }
}

uploadLogos().catch(console.error);
