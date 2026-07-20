export interface ImportPreset {
  name: string;
  folderId: string;
  genre: string;
  price: number;
  parseStrategy: 'standard' | 'bounce' | 'baile-funk' | 'top40';
  extractArtwork: boolean;
  recursive: boolean;
  wavPrice?: number;
  mp3Price?: number;
}

export const IMPORT_PRESETS: Record<string, ImportPreset> = {
  'tech-house': {
    name: 'Tech House',
    folderId: '1SBehpqKYivopTQqj6INAno2-xr-l9qtx',
    genre: 'House',
    price: 0.60,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: false,
  },
  'bass-house-1': {
    name: 'Bass House (Batch 1)',
    folderId: '1eC9T2sBSMHBPXDQuP7LdPJwpgNiyKdlM',
    genre: 'Bass House',
    price: 0.50,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: true,
  },
  'bass-house-2': {
    name: 'Bass House (Batch 2)',
    folderId: '1Y1fXVOLRZ7bi-B_hNJy-V5ppX4pP5LCQ',
    genre: 'Bass House',
    price: 0.50,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: false,
  },
  'hard-dance': {
    name: 'Hard Dance',
    folderId: '1mr__nNUeEeTOS5Pm06hbl5IwOaU_fdA9',
    genre: 'Hard Dance',
    price: 0.50,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: false,
  },
  'afro-house': {
    name: 'Afro House',
    folderId: '1GMAr-2QUDUsns_lIEpzffFq-DndwbFJd',
    genre: 'Afro House',
    price: 0.00,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: true,
  },
  'dnb': {
    name: 'Drum & Bass',
    folderId: '1cGYzJCUCVoRmHdN0hDmHnE8Z8JtLYbdg',
    genre: 'Drum & Bass',
    price: 1.90,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: false,
  },
  'bounce': {
    name: 'Bounce',
    folderId: '1IEP_GSf8lfTYKg2AMwAJXPsNlTwBFIKu',
    genre: 'Bounce',
    price: 0.00,
    wavPrice: 0.90,
    mp3Price: 0.00,
    parseStrategy: 'bounce',
    extractArtwork: true,
    recursive: false,
  },
  'baile-funk': {
    name: 'Baile Funk / Favela Bass',
    folderId: '1snWlPSb1M-ReaM-TDwQfRUy2QHIjbQ6a',
    genre: 'Baile Funk / Favela Bass',
    price: 0.00,
    parseStrategy: 'baile-funk',
    extractArtwork: true,
    recursive: true,
  },
  'top40': {
    name: 'Top 40',
    folderId: '1oQCLYz1SHHXfbP2B5MZ57UFdJnvNBeIw',
    genre: 'Top 40',
    price: 0.00,
    parseStrategy: 'top40',
    extractArtwork: true,
    recursive: true,
  },
  'tiktok-dance-v2': {
    name: 'TikTok Dance V.2',
    folderId: '1ZwNbjrdSzh0AS8GyzoUHo5l6IAUI9m-w',
    genre: 'EDM',
    price: 0.50,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: false,
  },
  'new-batch': {
    name: 'New Batch (Auto-classify)',
    folderId: '1e4Sv0FsvPggWN1u1npYyGujUfNLrJkMu',
    genre: 'Uncategorized',
    price: 0.60,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: false,
  },
  'hiphop-pop': {
    name: 'Hip-Hop / Pop',
    folderId: '1CuGs7nA9K5Gr2NB9DOSvY2D_l8rb0EVq',
    genre: 'Hip Hop',
    price: 0.60,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: false,
  },
  'house-folder3': {
    name: 'House (Folder 3)',
    folderId: '_RN3K9fb21Cypoy_ZRo8eGK-Jm5P0gZB',
    genre: 'House',
    price: 0.00,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: true,
  },
  'big-room': {
    name: 'Big Room',
    folderId: '1_RN3K9fb21Cypoy_ZRo8eGK-Jm5P0gZB',
    genre: 'Big Room',
    price: 0.00,
    parseStrategy: 'standard',
    extractArtwork: true,
    recursive: false,
  },
};

export function getPreset(name: string): ImportPreset | undefined {
  return IMPORT_PRESETS[name];
}

export function listPresets(): string[] {
  return Object.keys(IMPORT_PRESETS);
}
