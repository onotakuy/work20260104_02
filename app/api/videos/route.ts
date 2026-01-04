import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { extractVideoId, isValidYouTubeUrl, getYouTubeVideoInfo } from '@/lib/youtube/utils';

/**
 * GET: 動画一覧を取得
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('camera_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ videos: data });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

/**
 * POST: 新しいYouTube動画を登録
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtubeUrl } = body;

    if (!youtubeUrl || typeof youtubeUrl !== 'string') {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Failed to extract video ID' },
        { status: 400 }
      );
    }

    // 既に登録されているかチェック
    const { data: existing } = await supabaseAdmin
      .from('camera_videos')
      .select('id')
      .eq('youtube_video_id', videoId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Video already registered', videoId: existing.id },
        { status: 409 }
      );
    }

    // YouTube動画情報を取得
    const videoInfo = await getYouTubeVideoInfo(videoId);

    // データベースに保存
    const { data, error } = await supabaseAdmin
      .from('camera_videos')
      .insert({
        youtube_url: youtubeUrl,
        youtube_video_id: videoId,
        title: videoInfo.title,
        description: videoInfo.description,
        thumbnail_url: videoInfo.thumbnailUrl,
        duration_seconds: videoInfo.duration,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ video: data }, { status: 201 });
  } catch (error) {
    console.error('Error registering video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register video' },
      { status: 500 }
    );
  }
}
