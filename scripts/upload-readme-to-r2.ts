// .env.localから環境変数を読み込む（最初に実行）
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') });

// 環境変数を確認してからR2クライアントを作成
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT!;

const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function uploadReadmeToR2() {
  try {
    console.log('README.mdをR2にアップロードしています...\n');

    // README.mdファイルを読み込む
    const readmePath = resolve(process.cwd(), 'README.md');
    const readmeContent = readFileSync(readmePath, 'utf-8');

    // R2のパス（work20260104/README.md）
    const r2Key = 'work20260104/README.md';

    // R2にアップロード
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: readmeContent,
      ContentType: 'text/markdown',
    });

    await r2Client.send(command);

    console.log('✅ README.mdのアップロードが完了しました！');
    console.log(`\nアップロード先: ${r2Key}`);
    console.log(`バケット名: ${bucketName}`);
    console.log(`ファイルサイズ: ${readmeContent.length} bytes`);
  } catch (error) {
    console.error('❌ アップロードに失敗しました:');
    
    if (error instanceof Error) {
      console.error(`  エラーメッセージ: ${error.message}`);
    } else {
      console.error('  不明なエラー:', error);
    }
    
    process.exit(1);
  }
}

// スクリプトを実行
uploadReadmeToR2().catch((error) => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});
