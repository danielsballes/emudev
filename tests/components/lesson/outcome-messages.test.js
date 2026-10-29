import { describe, expect, it } from 'vitest';

import { describeOutcome, describeTestError } from '@/components/lesson/outcome-messages.js';
import { i18n } from '@/i18n';

const { t } = i18n.global;

describe('describeOutcome', () => {
  it.each([
    [{ status: 'passed' }, 'Todos los tests pasan.', null],
    [{ status: 'failed' }, 'Pasan 0 de 0 tests.', null],
    [{ status: 'timeout' }, 'Tu código tardó demasiado. ¿Hay un bucle infinito?', null],
    [
      { status: 'error', phase: 'student', error: { message: 'Unexpected token' } },
      'Tu código no se pudo ejecutar.',
      'Error al cargar tu código: Unexpected token',
    ],
    [
      { status: 'error', phase: 'student' },
      'Tu código no se pudo ejecutar.',
      'Error al cargar tu código: ',
    ],
    [
      { status: 'error', phase: 'tests' },
      'Tu código no se pudo ejecutar.',
      'Los tests de este ejercicio no cargaron. No es culpa tuya: avísanos.',
    ],
    [
      { status: 'error', phase: 'worker' },
      'Tu código no se pudo ejecutar.',
      'El entorno de ejecución falló. Vuelve a intentarlo.',
    ],
  ])('describes %j', (outcome, summary, problem) => {
    expect(describeOutcome(outcome, t)).toEqual({ summary, problem });
  });
});

describe('describeTestError', () => {
  it('explains assertions and thrown errors', () => {
    expect(describeTestError({ matcher: 'toBe', expected: '5', actual: '0' }, t)).toBe(
      'Se esperaba 5 y se obtuvo 0.',
    );
    expect(describeTestError({ matcher: 'toBe', expected: '5', negated: true }, t)).toBe(
      'No se esperaba 5.',
    );
    expect(describeTestError({ message: 'boom' }, t)).toBe('Lanzó un error: boom');
  });
});
