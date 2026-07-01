import { supabase } from './supabase';

export async function getDownloadUrl(trackId: string, userId: string) {
  try {
    // 1. Check if the user has purchased the track
    const { data: purchase, error: purchaseError } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .single();

    if (purchaseError || !purchase) {
      throw new Error('Unauthorized or not purchased');
    }

    // 2. Get the track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('audio_url')
      .eq('id', trackId)
      .single();

    if (trackError || !track || !track.audio_url) {
      throw new Error('Track file not found');
    }

    let filePath = track.audio_url;
    
    // Attempt to extract bucket and path if it's a Supabase storage URL
    if (filePath.includes('/storage/v1/object/public/')) {
      const parts = filePath.split('/storage/v1/object/public/');
      filePath = parts[1]; // e.g. "tracks/folder/file.mp3"
      
      const bucketName = filePath.split('/')[0];
      const actualPath = filePath.substring(bucketName.length + 1);
      
      // Create a presigned URL valid for 1 hour (3600 seconds)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(actualPath, 3600);
        
      if (error) throw error;
      return { url: data.signedUrl, error: null };
    }

    // If it's not a standard Supabase storage URL, fallback to original URL
    return { url: track.audio_url, error: null };
    
  } catch (error: any) {
    console.error('Download error:', error);
    return { url: null, error: error.message };
  }
}
