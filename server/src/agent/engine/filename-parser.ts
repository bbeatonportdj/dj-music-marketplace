export interface ParsedFilename {
  artist: string;
  title: string;
  version: string;
  versionType: string;
  key: string;
  bpm: number;
}

function extractVersion(text: string): { version: string; versionType: string; cleaned: string } {
  let version = '';
  let versionType = 'clean';
  let cleaned = text;

  const bracketMatch = text.match(/\[([^\]]+)\]/g);
  if (bracketMatch) {
    const versions: string[] = [];
    for (const m of bracketMatch) {
      const inner = m.slice(1, -1);
      versions.push(inner);
    }
    version = versions.join(' ');
    const lower = version.toLowerCase();
    if (lower.includes('dirty')) versionType = 'dirty';
    else if (lower.includes('intro')) versionType = 'intro';
    else if (lower.includes('acapella')) versionType = 'acapella';
    else if (lower.includes('instrumental')) versionType = 'instrumental';
    else if (lower.includes('extended')) versionType = 'extended';
    cleaned = text.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();
  }

  const parenMatch = cleaned.match(/\((Intro\s+(?:Clean|Dirty)|Clean|Dirty|Extended|Instrumental|Acapella|Short Edit)\)/i);
  if (parenMatch) {
    version = parenMatch[1];
    const lower = version.toLowerCase();
    if (lower.includes('dirty')) versionType = 'dirty';
    else if (lower.includes('intro')) versionType = 'intro';
    else if (lower.includes('acapella')) versionType = 'acapella';
    else if (lower.includes('instrumental')) versionType = 'instrumental';
    else if (lower.includes('extended')) versionType = 'extended';
    cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  }

  if (/\b(dirty)\b/i.test(cleaned) && !version) { version = 'Dirty'; versionType = 'dirty'; cleaned = cleaned.replace(/\bdirty\b/gi, '').trim(); }
  else if (/\b(clean)\b/i.test(cleaned) && !version) { version = 'Clean'; versionType = 'clean'; cleaned = cleaned.replace(/\bclean\b/gi, '').trim(); }

  return { version, versionType, cleaned };
}

function extractKeyBpm(text: string): { key: string; bpm: number; cleaned: string } {
  let key = '';
  let bpm = 0;
  let cleaned = text;

  const keyBpmMatch = cleaned.match(/\s*-\s*([A-B]\d{1,2})\s*-\s*(\d{2,3})\s*$/);
  if (keyBpmMatch) {
    key = keyBpmMatch[1];
    bpm = parseInt(keyBpmMatch[2]);
    cleaned = cleaned.replace(/\s*-\s*[A-B]\d{1,2}\s*-\s*\d{2,3}\s*$/, '').trim();
  } else {
    const keyMatch = cleaned.match(/\b(\d{1,2}[A-B])\b/);
    const bpmMatch = cleaned.match(/(\d{2,3})\s*$/);
    if (keyMatch) key = keyMatch[1];
    if (bpmMatch) bpm = parseInt(bpmMatch[1]);
  }

  return { key, bpm, cleaned };
}

function splitArtistTitle(text: string): { artist: string; title: string } {
  const dashIdx = text.indexOf(' - ');
  if (dashIdx > 0) {
    return { artist: text.substring(0, dashIdx).trim(), title: text.substring(dashIdx + 3).trim() };
  }
  const lastDash = text.lastIndexOf(' - ');
  if (lastDash > 0) {
    return { artist: text.substring(0, lastDash).trim(), title: text.substring(lastDash + 3).trim() };
  }
  return { artist: 'Various Artists', title: text };
}

export function parseFilename(name: string, strategy: 'standard' | 'bounce' | 'baile-funk' | 'top40' = 'standard'): ParsedFilename {
  const base = name.replace(/\.(mp3|flac|wav|aac|ogg|m4a|aif|aiff)$/i, '').trim();
  let clean = base;

  clean = clean.replace(/^\d+\s*[-–]\s*/, '').trim();
  clean = clean.replace(/\s*-\s*\d{1,2}[A-B]\s*-\s*\d{2,3}\s*$/, '').trim();
  clean = clean.replace(/^\d{2,3}\s*[-–]\s*/, '').trim();
  clean = clean.replace(/^\d{2,3}\s+[A-B]\d{1,2}\s*[-–]\s*/, '').trim();
  clean = clean.replace(/_v\d+$/i, '').trim();

  const { version, versionType, cleaned: afterVersion } = extractVersion(clean);
  const { key, bpm, cleaned: afterKeyBpm } = extractKeyBpm(afterVersion);
  const { artist, title } = splitArtistTitle(afterKeyBpm);

  return { artist, title, version, versionType, key, bpm };
}
