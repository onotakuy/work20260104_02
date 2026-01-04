// .env.localから環境変数を読み込む（最初に実行）
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') });

// 環境変数を確認してからR2クライアントを作成
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

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

const R2_BUCKET_NAME = bucketName;

async function testR2Connection() {
  console.log('Cloudflare R2接続テストを開始します...\n');

  // 環境変数の確認
  const requiredEnvVars = [
    'CLOUDFLARE_R2_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'CLOUDFLARE_R2_ENDPOINT',
  ];

  console.log('環境変数の確認:');
  const missingVars: string[] = [];
  
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (value) {
      // 機密情報は一部のみ表示
      if (varName.includes('KEY') || varName.includes('SECRET')) {
        console.log(`  ✓ ${varName}: ${value.substring(0, 8)}...`);
      } else {
        console.log(`  ✓ ${varName}: ${value}`);
      }
    } else {
      console.log(`  ✗ ${varName}: 未設定`);
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.log('\n❌ 以下の環境変数が設定されていません:');
    missingVars.forEach(v => console.log(`  - ${v}`));
    console.log('\n.env.localファイルを確認してください。');
    process.exit(1);
  }

  console.log('\n環境変数はすべて設定されています。\n');

  // R2接続テスト
  try {
    console.log('R2バケットへの接続をテストしています...');
    
    // バケット内のオブジェクト一覧を取得（最大1件）して接続をテスト
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 1,
    });

    const response = await r2Client.send(listCommand);
    
    console.log('✓ R2への接続に成功しました！');
    console.log(`\nバケット名: ${R2_BUCKET_NAME}`);
    console.log(`オブジェクト数: ${response.KeyCount || 0}`);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log('\nバケット内のオブジェクト（最初の1件）:');
      response.Contents.forEach((obj, index) => {
        console.log(`  ${index + 1}. ${obj.Key} (${obj.Size} bytes, 更新日時: ${obj.LastModified})`);
      });
    } else {
      console.log('\nバケットは空です。');
    }

    console.log('\n✅ Cloudflare R2接続テストが正常に完了しました！');
  } catch (error) {
    console.error('\n❌ R2への接続に失敗しました:');
    
    if (error instanceof Error) {
      console.error(`  エラーメッセージ: ${error.message}`);
      
      // よくあるエラーの説明
      if (error.message.includes('InvalidAccessKeyId')) {
        console.error('\n  考えられる原因:');
        console.error('  - CLOUDFLARE_R2_ACCESS_KEY_IDが正しくありません');
      } else if (error.message.includes('SignatureDoesNotMatch')) {
        console.error('\n  考えられる原因:');
        console.error('  - CLOUDFLARE_R2_SECRET_ACCESS_KEYが正しくありません');
      } else if (error.message.includes('NoSuchBucket')) {
        console.error('\n  考えられる原因:');
        console.error('  - CLOUDFLARE_R2_BUCKET_NAMEが存在しないか、正しくありません');
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.error('\n  考えられる原因:');
        console.error('  - CLOUDFLARE_R2_ENDPOINTが正しくありません');
        console.error('  - ネットワーク接続に問題がある可能性があります');
      }
    } else {
      console.error('  不明なエラー:', error);
    }
    
    process.exit(1);
  }
}

// スクリプトを実行
testR2Connection().catch((error) => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});
