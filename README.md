# EmuDev Academy

Plataforma interactiva con estética RPG para aprender a construir emuladores, inspirada en
[codedex.io](https://www.codedex.io/). Se avanza por regiones de un mapa: cada región es un
sistema (CHIP-8, Game Boy, NES, GBA… hasta trabajar sobre un fork de Eden para Switch) y cada
lección suma XP, niveles e insignias.

> Estado: fase de bootstrap. El roadmap completo está en [PLAN.md](PLAN.md).

## Requisitos

- Node.js 24 (ver `.nvmrc`)
- npm 11

## Puesta en marcha

```bash
npm install
npm run dev
```

## Scripts

| Script                  | Qué hace                                    |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo de Vite              |
| `npm run build`         | Build de producción en `dist/`              |
| `npm run preview`       | Sirve el build localmente                   |
| `npm run lint`          | ESLint estricto (falla con cualquier aviso) |
| `npm run lint:fix`      | ESLint con autofix                          |
| `npm run format`        | Formatea con Prettier                       |
| `npm run format:check`  | Comprueba el formato                        |
| `npm test`              | Ejecuta los tests con Vitest                |
| `npm run test:watch`    | Vitest en modo watch                        |
| `npm run test:coverage` | Tests con cobertura (umbral 80 %)           |

## Flujo de contribución

1. Crea una rama desde `main`.
2. Commits con [Conventional Commits](https://www.conventionalcommits.org/) (lo valida commitlint
   en el hook `commit-msg`).
3. Abre un PR usando la plantilla. El título también debe ser un Conventional Commit, porque se
   hace squash merge.
4. Checks requeridos: `lint`, `test`, `build` y `pr-title`.
5. Al hacer merge a `main`, semantic-release calcula la versión, publica el GitHub Release con el
   build adjunto y despliega en GitHub Pages.

## Licencias

- Código de la plataforma: [AGPL-3.0-only](LICENSE).
- Contenido educativo (lecciones, ejercicios, arte propio):
  [CC BY-NC-SA 4.0](LICENSE-CONTENT.md).
- ROMs y assets de terceros conservan su propia licencia, documentada junto a ellos.
