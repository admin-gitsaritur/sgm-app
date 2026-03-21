import 'dotenv/config';
import { minioClient } from './minio.js';

async function makeBucketPublic() {
  const bucketName = 'saritur-sgm';
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: ['s3:GetObject'],
        Effect: 'Allow',
        Principal: '*',
        Resource: [`arn:aws:s3:::${bucketName}/brands/*`],
      },
    ],
  };

  try {
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`✅ Bucket '${bucketName}' agora está público para leitura!`);
  } catch (error) {
    console.error('❌ Erro ao configurar policy do bucket:', error);
  }
}

makeBucketPublic();
