export class SaveFormatError extends Error {
  /**
   * @param {'invalid-json' | 'invalid-format' | 'unsupported-version'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'SaveFormatError';
    this.code = code;
  }
}

/**
 * Checks that a value is a save envelope: `{ version: positive integer, data: plain object }`.
 * @param {unknown} envelope
 */
export function assertEnvelope(envelope) {
  const isValid =
    typeof envelope === 'object' &&
    envelope !== null &&
    Number.isSafeInteger(envelope.version) &&
    envelope.version > 0 &&
    typeof envelope.data === 'object' &&
    envelope.data !== null &&
    !Array.isArray(envelope.data);
  if (!isValid) {
    throw new SaveFormatError('invalid-format', 'Save must be { version, data }');
  }
}

/**
 * Upgrades the data of a save envelope to `targetVersion` applying migrations in order.
 * @param {{ version: number, data: object }} envelope
 * @param {{ targetVersion: number, migrations: Record<number, (data: object) => object> }} options
 * @returns {object} Migrated data.
 */
export function migrateEnvelope(envelope, { targetVersion, migrations }) {
  assertEnvelope(envelope);
  if (envelope.version > targetVersion) {
    throw new SaveFormatError(
      'unsupported-version',
      `Save version ${envelope.version} is newer than supported version ${targetVersion}`,
    );
  }
  let data = envelope.data;
  for (let version = envelope.version + 1; version <= targetVersion; version += 1) {
    const migration = migrations[version];
    if (!migration) {
      throw new SaveFormatError('unsupported-version', `Missing migration to version ${version}`);
    }
    data = migration(data);
  }
  return data;
}
