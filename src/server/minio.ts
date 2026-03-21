import { Client } from 'minio';
import { config } from './config.js';

if (!config.minioAccessKey || !config.minioSecretKey) {
  console.warn('⚠️  Credenciais do MinIO não configuradas. Upload de arquivos não funcionará. Verifique o .env');
}

// Configuração central do Cliente MinIO (compatível com AWS S3)
export const minioClient = new Client({
  endPoint: config.minioEndpoint,
  port: config.minioPort,
  useSSL: config.minioUseSsl,
  accessKey: config.minioAccessKey,
  secretKey: config.minioSecretKey,
});

import { Readable } from 'stream';

/**
 * Função utilitária para fazer upload de um arquivo para o MinIO (S3).
 * @param objectName Nome/Caminho do arquivo no bucket (ex: 'avatares/user-123.jpg')
 * @param stream Buffer, string, ou Stream do arquivo (ex: req.file.buffer)
 * @param metaData Metadados opcionais (ex: { 'Content-Type': 'image/jpeg' })
 * @returns Retorna a URL final pública do arquivo
 */
export async function uploadFile(
  objectName: string,
  stream: Buffer | string | Readable,
  metaData: Record<string, string> = {}
): Promise<string> {
  try {
    const bucketName = config.minioBucket;

    // Verifica se o bucket existe; se não, pode tentar criar (idealmente isso deve ser feito na infra, mas ok como fallback)
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
       console.log(`🪣 Bucket '${bucketName}' não encontrado. Criando...`);
       await minioClient.makeBucket(bucketName, 'us-east-1');
    }

    // Faz o upload de fato
    await minioClient.putObject(bucketName, objectName, stream, undefined, metaData);
    
    // Monta a URL de acesso ao final
    const protocol = config.minioUseSsl ? 'https' : 'http';
    const portString = (config.minioPort === 80 || config.minioPort === 443) ? '' : `:${config.minioPort}`;
    
    return `${protocol}://${config.minioEndpoint}${portString}/${bucketName}/${objectName}`;
  } catch (error) {
    console.error('❌ Erro ao fazer upload para o MinIO:', error);
    throw error;
  }
}
