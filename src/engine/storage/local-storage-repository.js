import { migrateEnvelope, SaveFormatError } from './migrate.js';

/**
 * @typedef {object} ProgressRepository
 * Persistence boundary for the player's save. Today it is backed by `localStorage`; a future
 * `ApiRepository` will implement the same methods against the backend.
 * @property {() => object} load Returns the stored data, or fresh initial data.
 * @property {(data: object) => void} save
 * @property {() => void} clear
 * @property {() => string} exportSave Serialized save, suitable for a backup file.
 * @property {(serialized: string) => object} importSave Validates, migrates and stores a backup.
 */

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new SaveFormatError('invalid-json', 'Save is not valid JSON');
  }
}

/**
 * @param {object} options
 * @param {string} options.key Storage key.
 * @param {number} options.version Current save version.
 * @param {Record<number, (data: object) => object>} [options.migrations]
 * @param {() => object} options.createInitialData
 * @param {(data: object) => void} [options.validate] Throws if migrated data is invalid.
 * @param {Storage} [options.storage]
 * @param {() => Date} [options.now]
 * @returns {ProgressRepository}
 */
export function createLocalStorageRepository({
  key,
  version,
  migrations = {},
  createInitialData,
  validate = () => {},
  storage = localStorage,
  now = () => new Date(),
}) {
  const toEnvelope = (data) => ({ version, savedAt: now().toISOString(), data });
  const readData = (text) => {
    const data = {
      ...createInitialData(),
      ...migrateEnvelope(parseJson(text), { targetVersion: version, migrations }),
    };
    validate(data);
    return data;
  };

  function save(data) {
    storage.setItem(key, JSON.stringify(toEnvelope(data)));
  }

  function load() {
    const stored = storage.getItem(key);
    if (stored === null) {
      return createInitialData();
    }
    try {
      return readData(stored);
    } catch {
      // Never lose a save silently: keep the unreadable copy aside and start fresh.
      storage.setItem(`${key}:backup:${now().getTime()}`, stored);
      return createInitialData();
    }
  }

  function clear() {
    storage.removeItem(key);
  }

  function exportSave() {
    return JSON.stringify(toEnvelope(load()), undefined, 2);
  }

  function importSave(serialized) {
    const data = readData(serialized);
    save(data);
    return data;
  }

  return { load, save, clear, exportSave, importSave };
}
