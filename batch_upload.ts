import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const supabaseUrl = 'https://fbwqgbsalqgcrfxhoure.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZid3FnYnNhbHFnY3JmeGhvdXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MjYyNTEsImV4cCI6MjA5NDAwMjI1MX0.bY7uUlTAKGa2L_m6JO5b5H6ZPhp1LgWQM2S8qDMlaH0';
const SOURCE_DIR = '/Users/aj/Music/เดสก์ท็อบ/Top';
const DEFAULT_ARTWORK = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- METADATA PARSING ---
function parseFilename(filename: string) {
  const name = filename.replace(/\.(mp3|wav|aif)$/i, '');
  
  // Pattern 1: Artist - Title [Version] - Key
  // e.g. 42 Dugg Ft. Doughboy Clay - It Get Deeper Pt.3 [Intro Dirty] - 2A
  const pattern1 = name.match(/^(.+?)\s*-\s*(.+?)\s*\[(.+?)\]\s*-\s*(.+)$/);
  if (pattern1) {
    return {
      artist: pattern1[1].trim(),
      title: pattern1[2].trim(),
      version: pattern1[3].trim(),
      key: pattern1[4].trim(),
      bpm: 0,
      version_type: pattern1[3].toLowerCase().includes('dirty') ? 'dirty' : 'clean'
    };
  }

  // Pattern 2: Artist - Title Version BPM
  // e.g. Cardi B F. Latto - Errtime Remix - Clean 154
  const pattern2 = name.match(/^(.+?)\s*-\s*(.+?)\s*-\s*(.+?)\s*(\d+)$/);
  if (pattern2) {
    return {
      artist: pattern2[1].trim(),
      title: pattern2[2].trim(),
      version: pattern2[3].trim(),
      key: '8A', // Default
      bpm: parseInt(pattern2[4]),
      version_type: pattern2[3].toLowerCase().includes('dirty') ? 'dirty' : 'clean'
    };
  }

  // Fallback simple split
  const parts = name.split(' - ');
  return {
    artist: parts[0] || 'Unknown Artist',
    title: parts[1] || name,
    version: parts[2] || '',
    key: '8A',
    bpm: 0,
    version_type: 'clean'
  };
}

async function uploadFile(filePath: string, fileName: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = fileName.split('.').pop();
  const remoteName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('audio')
    .upload(remoteName, fileBuffer, {
      contentType: 'audio/mpeg',
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error(`Error uploading ${fileName}:`, error.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from('audio').getPublicUrl(remoteName);
  return urlData.publicUrl;
}

async function run() {
  console.log('🚀 Starting batch upload from:', SOURCE_DIR);
  
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ Source directory does not exist!');
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.aif'));
  console.log(`Found ${files.length} tracks to process.`);

  for (const file of files) {
    const fullPath = path.join(SOURCE_DIR, file);
    const meta = parseFilename(file);
    
    console.log(`\nProcessing: ${file}`);
    console.log(`   -> Artist: ${meta.artist}, Title: ${meta.title}, Version: ${meta.version}`);

    try {
      const audioUrl = await uploadFile(fullPath, file);
      if (!audioUrl) continue;

      const { data, error } = await supabase
        .from('tracks')
        .insert([{
          title: meta.title,
          artist: meta.artist,
          version: meta.version,
          version_type: meta.version_type,
          duration: '0:00',
          bpm: meta.bpm,
          key: meta.key,
          genre: 'Top 40', // Default genre
          price: 1.99,
          audio_url: audioUrl,
          artwork_url: DEFAULT_ARTWORK,
          is_new: true,
          is_hot: false
        }])
        .select();

      if (error) {
        console.error(`   ❌ Error saving to DB:`, error.message);
      } else {
        console.log(`   ✅ Success! Track ID:`, data[0].id);
      }
    } catch (err) {
      console.error(`   ❌ Unexpected error:`, err);
    }
  }

  console.log('\n✨ Batch upload complete!');
}

run();
