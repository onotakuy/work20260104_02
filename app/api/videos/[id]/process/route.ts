import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { processVideoFrames } from '@/lib/video/processor';
import { uploadToR2 } from '@/lib/r2/client';

/**
 * POST: 動画を処理（フレーム抽出、動体検知など）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 動画情報を取得
    const { data: video, error: videoError } = await supabaseAdmin
      .from('camera_videos')
      .select('*')
      .eq('id', params.id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // 既に処理中の場合はエラー
    if (video.status === 'processing') {
      return NextResponse.json(
        { error: 'Video is already being processed' },
        { status: 409 }
      );
    }

    // ステータスを処理中に更新
    await supabaseAdmin
      .from('camera_videos')
      .update({ status: 'processing' })
      .eq('id', params.id);

    try {
      // 動画を処理（フレーム抽出、動体検知）
      const result = await processVideoFrames(
        video.youtube_video_id,
        params.id,
        5 // 5秒間隔でフレームを抽出
      );

      // サムネイルをR2に保存
      if (video.thumbnail_url) {
        try {
          const thumbnailResponse = await fetch(video.thumbnail_url);
          const thumbnailBuffer = Buffer.from(await thumbnailResponse.arrayBuffer());
          const thumbnailKey = `videos/${params.id}/thumbnail.jpg`;
          await uploadToR2(thumbnailKey, thumbnailBuffer, 'image/jpeg');

          // データベースを更新
          await supabaseAdmin
            .from('camera_videos')
            .update({
              status: 'completed',
              r2_thumbnail_path: thumbnailKey,
            })
            .eq('id', params.id);
        } catch (thumbnailError) {
          console.error('Error saving thumbnail:', thumbnailError);
        }
      }

      // 解析結果をデータベースに保存
      await supabaseAdmin
        .from('video_analyses')
        .insert({
          camera_video_id: params.id,
          analysis_type: 'motion_detection',
          timestamp_seconds: 0,
          detected_objects: {
            frameCount: result.frameCount,
            motionDetectedFrames: result.motionDetectedFrames,
          },
          confidence_score: result.motionDetectedFrames / result.frameCount,
        });

      return NextResponse.json({
        message: 'Video processed successfully',
        result: {
          frameCount: result.frameCount,
          motionDetectedFrames: result.motionDetectedFrames,
        },
      });
    } catch (processError) {
      // エラー時はステータスを失敗に更新
      await supabaseAdmin
        .from('camera_videos')
        .update({
          status: 'failed',
        })
        .eq('id', params.id);

      throw processError;
    }
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process video',
      },
      { status: 500 }
    );
  }
}
