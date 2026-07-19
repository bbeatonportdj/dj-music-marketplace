const GENRE_RULES: Array<{ pattern: RegExp; genre: string }> = [
  { pattern: /\b(hardstyle|hard dance|hardcore|hard techno|rawstyle|euphoric|reverse bass|jumpstyle|bounce|raw|fcuk|uzed|sogma)\b/i, genre: 'Hard Dance' },
  { pattern: /\b(timmy trumpet|da tweekaz|w&w|showtek|blast|headhunterz|noise controllers|brennan heart|atmozfears|maxx power|rebelion|warface|angerfist)\b/i, genre: 'Hard Dance' },
  { pattern: /\b(psy trance|psytrance|goa|full-on|progressive psy|acid|trance dub)\b/i, genre: 'Psy Trance' },
  { pattern: /\b(trance|uplifting|progressive trance|vocal trance|epic trance)\b/i, genre: 'Trance' },
  { pattern: /\b(big room|bigroom|mainstage|festival|EDM banger)\b/i, genre: 'Big Room' },
  { pattern: /\b(bass house|bass|uk bass|grime|bassline)\b/i, genre: 'Bass House' },
  { pattern: /\b(drum.?n.?bass|dnb|drum and bass|jungle|liquid dnb)\b/i, genre: 'Drum & Bass' },
  { pattern: /\b(afro house|afro tech|amapiano|afrobeat)\b/i, genre: 'Afro House' },
  { pattern: /\b(house|deep house|tech house|progressive house|electro house|future house|slap house|tropical house)\b/i, genre: 'House' },
  { pattern: /\b(techno|melbourne|acid techno|dub techno|minimal techno|peak time|driving)\b/i, genre: 'Techno' },
  { pattern: /\b(hip hop|rap|trap|drill|cloud rap|phonk|memphis)\b/i, genre: 'Hip Hop' },
  { pattern: /\b(k-?pop|kpop|korean)\b/i, genre: 'K-Pop' },
  { pattern: /\b(top 40|pop|dance pop|electropop)\b/i, genre: 'Top 40' },
  { pattern: /\b(edm|electronic|dance|festival|club)\b/i, genre: 'EDM' },
  { pattern: /\b(reggaeton|latin|bachata|salsa|cumbia|guaracha)\b/i, genre: 'Latin' },
  { pattern: /\b(baile funk|favela|funk carioca)\b/i, genre: 'Baile Funk / Favela Bass' },
];

export function classifyGenre(title: string, artist: string): string {
  const text = `${title} ${artist}`;
  for (const rule of GENRE_RULES) {
    if (rule.pattern.test(text)) return rule.genre;
  }
  return 'Uncategorized';
}

export const GENRE_NORMALIZATION: Record<string, string> = {
  'house': 'House',
  'hip hop': 'Hip Hop',
  'techno': 'Techno',
  'mashup': 'Mashup',
  'remix': 'Remix',
  'Hardstyle': 'Hard Dance',
  'Hard Techno': 'Hard Dance',
  'Hard House': 'Hard Dance',
  'Hard Dance / Hardcore': 'Hard Dance',
  'Hyper Techno': 'Hard Dance',
  'BOUNCE': 'Hard Dance',
  'Big Room': 'Big Room',
  'Bigroom Techno': 'Big Room',
  'Big Room Techno': 'Big Room',
  'Mainstage': 'Big Room',
  'Mainstage EDM': 'Big Room',
  'Psy Trance': 'Psy Trance',
  'PsyTrance': 'Psy Trance',
  'trance / Psy-trance': 'Psy Trance',
  'Trance / Psy-Trance': 'Psy Trance',
  'Trance Dub': 'Psy Trance',
  'Trance': 'Trance',
  'Progressive House': 'House',
  'Electro House': 'House',
  'Tech House': 'House',
  'Melodic House / Techno': 'House',
  'Pop Dance Remix / House': 'House',
  'Electronic': 'EDM',
  'Dance & EDM': 'EDM',
  'Future Rave': 'EDM',
  'Pop Dance Mashup / Electro House': 'EDM',
  'MASHUP': 'Mashup',
  'Free Download': 'Other',
  'Music': 'Other',
  '240 SOUND': 'Other',
  'guaracha': 'Latin',
};
