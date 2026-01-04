import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import sharp from 'sharp';
import { uploadToR2 } from '@/lib/r2/client';

/**
 * YouTube動画をダウンロードしてフレームを抽出
 */
export async function extractFramesFromVideo(
  videoId: string,
  intervalSeconds: number = 5
): Promise<{ frameNumber: number; timestamp: number; buffer: Buffer }[]> {
  return new Promise((resolve, reject) => {
    const frames: { frameNumber: number; timestamp: number; buffer: Buffer }[] = [];
    let frameIndex = 0;

    // YouTube動画ストリームを取得
    const videoStream = ytdl(videoId, {
      quality: 'lowest',
      filter: 'videoandaudio',
    });

    // PNGフレームのマジックナンバー
    const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    let currentFrame: Buffer[] = [];
    let inFrame = false;

    const outputStream = ffmpeg(videoStream)
      .inputOptions(['-re'])
      .outputOptions([
        '-vf', `fps=1/${intervalSeconds}`, // 指定秒数ごとにフレームを抽出
        '-f', 'image2pipe',
        '-vcodec', 'png',
        '-frames:v', '1000', // 最大1000フレームまで
        '-',
      ])
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .pipe();

    outputStream.on('data', (chunk: Buffer) => {
      // PNGシグネチャを検出
      const signatureIndex = chunk.indexOf(PNG_SIGNATURE);
      
      if (signatureIndex >= 0) {
        // 新しいフレームの開始
        if (inFrame && currentFrame.length > 0) {
          // 前のフレームを保存
          const frameBuffer = Buffer.concat(currentFrame);
          frames.push({
            frameNumber: frameIndex,
            timestamp: frameIndex * intervalSeconds,
            buffer: frameBuffer,
          });
          frameIndex++;
          currentFrame = [];
        }
        
        inFrame = true;
        // シグネチャ以降のデータを追加
        if (signatureIndex > 0) {
          currentFrame.push(chunk.subarray(signatureIndex));
        } else {
          currentFrame.push(chunk);
        }
      } else if (inFrame) {
        // フレームの続き
        currentFrame.push(chunk);
      }
    });

    outputStream.on('end', () => {
      // 最後のフレームを保存
      if (inFrame && currentFrame.length > 0) {
        const frameBuffer = Buffer.concat(currentFrame);
        frames.push({
          frameNumber: frameIndex,
          timestamp: frameIndex * intervalSeconds,
          buffer: frameBuffer,
        });
      }

      if (frames.length === 0) {
        reject(new Error('No frames extracted from video'));
      } else {
        resolve(frames);
      }
    });

    outputStream.on('error', (err) => {
      console.error('Stream error:', err);
      reject(new Error(`Stream error: ${err.message}`));
    });
  });
}

/**
 * フレームをリサイズして最適化
 */
export async function optimizeFrame(buffer: Buffer, maxWidth: number = 1920): Promise<Buffer> {
  return await sharp(buffer)
    .resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * 動体検知（簡易版：フレーム間の差分を計算）
 */
export async function detectMotion(
  frame1: Buffer,
  frame2: Buffer,
  threshold: number = 0.1
): Promise<{ hasMotion: boolean; difference: number }> {
  try {
    const img1 = sharp(frame1).resize(320, 240).greyscale().raw();
    const img2 = sharp(frame2).resize(320, 240).greyscale().raw();

    const [pixels1, pixels2] = await Promise.all([
      img1.toBuffer(),
      img2.toBuffer(),
    ]);

    let totalDiff = 0;
    const pixelCount = pixels1.length;

    for (let i = 0; i < pixelCount; i++) {
      const diff = Math.abs(pixels1[i] - pixels2[i]);
      totalDiff += diff;
    }

    const averageDiff = totalDiff / pixelCount / 255;
    const hasMotion = averageDiff > threshold;

    return {
      hasMotion,
      difference: averageDiff,
    };
  } catch (error) {
    console.error('Motion detection error:', error);
    return { hasMotion: false, difference: 0 };
  }
}

/**
 * 動画からフレームを抽出してR2に保存
 */
export async function processVideoFrames(
  videoId: string,
  videoDbId: string,
  intervalSeconds: number = 5
): Promise<{ frameCount: number; motionDetectedFrames: number }> {
  const frames = await extractFramesFromVideo(videoId, intervalSeconds);
  let motionDetectedCount = 0;

  // 各フレームを処理
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    
    // フレームを最適化
    const optimizedFrame = await optimizeFrame(frame.buffer);
    
    // R2に保存
    const r2Key = `videos/${videoDbId}/frames/${frame.frameNumber}.jpg`;
    await uploadToR2(r2Key, optimizedFrame, 'image/jpeg');

    // 動体検知（前のフレームと比較）
    if (i > 0) {
      const prevFrame = frames[i - 1];
      const motionResult = await detectMotion(prevFrame.buffer, frame.buffer);
      
      if (motionResult.hasMotion) {
        motionDetectedCount++;
      }
    }
  }

  return {
    frameCount: frames.length,
    motionDetectedFrames: motionDetectedCount,
  };
}
