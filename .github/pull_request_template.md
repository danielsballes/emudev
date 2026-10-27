<!--
El título del PR debe seguir Conventional Commits, por ejemplo:
  feat(chip8): add DXYN draw instruction lesson
  fix(runner): terminate worker on timeout
Se hace squash merge, así que el título es el commit que analiza semantic-release.
-->

## Resumen

<!-- Qué cambia y por qué. Enlaza el issue si existe: Closes #123 -->

## Tipo de cambio

- [ ] `feat`: nueva funcionalidad
- [ ] `fix`: corrección de un error
- [ ] `docs`: solo documentación
- [ ] `refactor`: cambio de código sin cambiar comportamiento
- [ ] `test`: añade o corrige tests
- [ ] `chore` / `ci` / `build`: tooling, dependencias, pipelines

## Área afectada

- [ ] Engine (registry, storage, runner, progression)
- [ ] Shell RPG / UI
- [ ] Módulo: <!-- p. ej. chip8 -->
- [ ] CI/CD / tooling

## Cómo probarlo

1.
2.

## Capturas

<!-- Obligatorias si cambia la UI. -->

## Checklist

- [ ] `npm run lint` y `npm run format:check` pasan sin avisos
- [ ] `npm run test:coverage` pasa y cubre el código nuevo
- [ ] `npm run build` funciona
- [ ] Los textos visibles están en `src/i18n/locales` o en el contenido del módulo (nada hardcodeado)
- [ ] El código, los comentarios y los commits están en inglés
- [ ] Si añade ROMs o assets de terceros, su licencia está documentada
- [ ] Hay breaking changes y están descritos (`BREAKING CHANGE:` en el cuerpo)
