/**
 * Player avatars. In the terminal era an avatar is a single glyph; later eras can draw it as a
 * sprite from the same id. Glyphs stay within Latin-1 so every era font has them. Names come from
 * i18n (`avatars.<id>`).
 */
export const AVATARS = Object.freeze([
  { id: 'at', glyph: '@' },
  { id: 'ampersand', glyph: '&' },
  { id: 'section', glyph: '§' },
  { id: 'pilcrow', glyph: '¶' },
  { id: 'hash', glyph: '#' },
  { id: 'currency', glyph: '¤' },
]);

export const DEFAULT_AVATAR = AVATARS[0].id;

/**
 * @param {string} id
 */
export function getAvatarGlyph(id) {
  return (AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0]).glyph;
}
