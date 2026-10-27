import { describe, expect, it } from 'vitest';

import { router } from '@/router';

describe('router', () => {
  it('redirects unknown paths to home', async () => {
    await router.push('/does-not-exist');

    expect(router.currentRoute.value.name).toBe('home');
  });
});
