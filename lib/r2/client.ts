import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT!;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
  throw new Error('Missing Cloudflare R2 environment variables');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const R2_BUCKET_NAME = bucketName;

/**
 * R2にファイルをアップロード
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);
  return key;
}

/**
 * R2からファイルを取得
 */
export async function getFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);
  const chunks: Uint8Array[] = [];
  
  if (response.Body) {
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

/**
 * R2からファイルを削除
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}
