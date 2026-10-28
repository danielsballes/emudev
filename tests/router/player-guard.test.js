import { describe, expect, it } from 'vitest';

import { getAvatarGlyph } from '@/components/player/avatars.js';
import { resolvePlayerRoute, ROUTE } from '@/router/player-guard.js';

const route = (meta) => ({ meta });

describe('resolvePlayerRoute', () => {
  it('sends players without a character to character creation', () => {
    expect(resolvePlayerRoute(route({ requiresPlayer: true }), false)).toEqual({
      name: ROUTE.CREATE_CHARACTER,
    });
  });

  it('sends players with a character away from character creation', () => {
    expect(resolvePlayerRoute(route({ guestOnly: true }), true)).toEqual({ name: ROUTE.HOME });
  });

  it('lets every other navigation through', () => {
    expect(resolvePlayerRoute(route({ requiresPlayer: true }), true)).toBe(true);
    expect(resolvePlayerRoute(route({ guestOnly: true }), false)).toBe(true);
    expect(resolvePlayerRoute(route({}), false)).toBe(true);
  });
});

describe('getAvatarGlyph', () => {
  it('returns the glyph of an avatar and falls back to the default one', () => {
    expect(getAvatarGlyph('pilcrow')).toBe('¶');
    expect(getAvatarGlyph('unknown')).toBe('@');
  });
});
