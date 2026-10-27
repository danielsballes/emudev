import { SaveFormatError } from './migrate.js';

/**
 * Version of the persisted save format. Bump it together with a migration in `SAVE_MIGRATIONS`
 * whenever the shape of the save changes.
 */
export const SAVE_VERSION = 1;

/**
 * Migrations keyed by the version they produce. `SAVE_MIGRATIONS[2]` turns a v1 save into v2.
 * @type {Record<number, (data: object) => object>}
 */
export const SAVE_MIGRATIONS = Object.freeze({});

/**
 * @typedef {object} Save
 * @property {{ name: string, avatar: string, createdAt: string } | null} player
 * @property {number} xp
 * @property {Record<string, { completedAt: string, xpAwarded: number }>} lessons
 *   Keyed by `moduleId/lessonId`.
 * @property {Record<string, string>} code Last code written per exercise (`moduleId/lessonId`).
 * @property {Record<string, { earnedAt: string }>} badges Keyed by `moduleId/badgeId`.
 */

/**
 * @returns {Save}
 */
export function createEmptySave() {
  return { player: null, xp: 0, lessons: {}, code: {}, badges: {} };
}

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Validates the top-level shape of save data (e.g. from an imported backup file).
 * @param {unknown} data
 */
export function assertSaveData(data) {
  const isValid =
    isRecord(data) &&
    (data.player === null || isRecord(data.player)) &&
    Number.isSafeInteger(data.xp) &&
    data.xp >= 0 &&
    isRecord(data.lessons) &&
    isRecord(data.code) &&
    isRecord(data.badges);
  if (!isValid) {
    throw new SaveFormatError('invalid-format', 'Save data has an unexpected shape');
  }
}
