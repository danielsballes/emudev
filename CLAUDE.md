# CLAUDE.md

Guía para trabajar en este repositorio (personas y agentes). El roadmap y las decisiones de
producto están en [PLAN.md](PLAN.md).

## Qué es

EmuDev Academy: web estilo codedex (RPG pixel-art, XP, niveles, insignias) para aprender a
construir emuladores. Cada sistema es un **módulo** (una región del mapa). Sin backend por ahora:
el progreso se guarda en `localStorage` y el código del alumno se ejecuta en el navegador.

## Comandos

```bash
npm run dev            # servidor de desarrollo
npm run lint           # ESLint estricto, --max-warnings 0
npm run format:check   # Prettier
npm run test:coverage  # Vitest + cobertura (umbral 80 %)
npm run build          # build de producción (+ 404.html para GitHub Pages)
```

Antes de dar algo por terminado, los cuatro comandos (`lint`, `format:check`, `test:coverage`,
`build`) deben pasar. Son los mismos checks que exige el PR.

## Stack

Vue 3 (`<script setup>`), Vite, Vue Router, Pinia, vue-i18n, Tailwind CSS 4 (configuración
CSS-first en `src/styles/main.css`), Vitest + Vue Test Utils, ESLint (flat config) + Prettier.
JavaScript moderno (ESM, ES2025), sin TypeScript; JSDoc en las APIs públicas del engine.

## Convenciones

- **Idioma del código: inglés** (variables, funciones, archivos, comentarios, commits).
- **Textos visibles: español**, siempre vía i18n:
  - Interfaz: `src/i18n/locales/es.json` + `t('key')`. ESLint prohíbe texto sin traducir en
    templates (`@intlify/vue-i18n/no-raw-text`) y claves sin usar o inexistentes.
  - Contenido de lecciones: `src/modules/<id>/content/<locale>/`.
- Componentes en PascalCase (`PixelButton.vue`), el resto de archivos en kebab-case.
- Tests junto al código: `foo.js` → `foo.test.js`.
- Alias `@` → `src/`.
- Paleta y fuentes: usar los tokens de `@theme` (`bg-night`, `text-gold`, `font-pixel`…), no
  colores sueltos.
- No desactivar reglas de ESLint con comentarios salvo justificación explícita en el propio
  comentario.

## Git y releases

- **Nunca commitear sin autorización explícita de Daniel en ese momento.**
- Conventional Commits (commitlint en el hook `commit-msg`; lint-staged en `pre-commit`).
- Ramas desde `main`; PR con la plantilla; **squash merge**, así que el título del PR debe ser un
  Conventional Commit (lo valida el check `pr-title`).
- Un PR por fase o por pieza; no mezclar engine, UI y contenido en el mismo PR.
- `main` está protegida: checks requeridos `lint`, `test`, `build`, `pr-title`.
- Al hacer merge a `main`, `release.yml` ejecuta lint + tests, semantic-release (tag + GitHub
  Release con `dist` en zip, sin commits de vuelta a `main`) y deploy a GitHub Pages.
- La versión se inyecta en el build vía `VITE_APP_VERSION` → global `__APP_VERSION__`.

## Arquitectura (objetivo)

```
src/
├─ engine/        # agnóstico de módulos, cobertura alta
│  ├─ registry/   # descubre módulos con import.meta.glob('/src/modules/*/module.js')
│  ├─ storage/    # ProgressRepository: localStorage versionado + migraciones (luego ApiRepository)
│  ├─ runner/     # ejecuta código del alumno en un Web Worker con timeout
│  ├─ testing/    # mini-lib expect/assert para los tests de ejercicios
│  └─ progression/# XP, niveles, insignias, desbloqueos
├─ stores/        # Pinia sobre engine/storage
├─ components/    # ui/ (pixel UI) y lesson/ (editor, resultados, consola)
├─ views/         # WorldMap, ModuleMap, LessonView, Profile, Sandbox, CharacterCreate
└─ modules/<id>/  # un módulo por sistema emulado
```

Estado actual: bootstrap + engine. Aún no hay UI de juego ni módulos. Ver fases en PLAN.md.

Piezas del engine:

- `createEngine()` (`src/engine/plugin.js`): plugin de Vue que provee `{ registry, repository,
runner }`; `useEngine()` los obtiene. En tests se inyectan fakes.
- `useSaveStore()` (`src/stores/save.js`): partida del jugador. El save se reemplaza de forma
  inmutable (`shallowRef`) en cada cambio y se persiste vía el repositorio.
- Runner: protocolo `{ type: 'run', token, studentSource, testsSource }` → `{ type: 'result',
token, outcome }`. Estados: `passed`, `failed`, `error` (fase `student` | `tests` | `worker`),
  `timeout`. Los errores de aserción viajan como datos (`matcher`, `expected`, `actual`) para que
  la UI los explique en el idioma del alumno.
- Tests de ejercicio: `export default [{ name, run: ({ student, expect }) => …, hint? }]`.

## Cómo añadir un módulo

1. Crear `src/modules/<id>/module.js` con el manifiesto:

   ```js
   export default {
     id: 'chip8',
     order: 1,
     requires: ['fundamentals'],
     region: { titleKey: 'modules.chip8.title', theme: { primary: 'grass', accent: 'gold' }, icon },
     chapters: [
       {
         id: 'display',
         titleKey: 'modules.chip8.chapters.display',
         lessons: [
           {
             id: 'draw-sprite',
             type: 'exercise', // 'lesson' | 'exercise' | 'quiz' | 'boss'
             xp: 50,
             content: () => import('./content/es/07-draw-sprite.md'),
             exercise: { starter, tests, solution },
           },
         ],
       },
     ],
   };
   ```

2. Emulador de referencia en `src/modules/<id>/core/`, con tests por instrucción.
3. Componentes propios del módulo (pantalla, depurador…) en `src/modules/<id>/components/`.
4. Lecciones en `src/modules/<id>/content/es/NN-slug.md`.
5. Ejercicios en `src/modules/<id>/exercises/<lesson-id>/`:
   - `starter.js`: lo que ve el alumno; incluye resuelto lo de lecciones anteriores.
   - `solution.js`: solución de referencia.
   - `tests.js`: tests ocultos que corre el runner.
   - Meta-test obligatorio: `solution.js` pasa `tests.js` y `starter.js` los falla.
6. Textos de UI del módulo en `src/i18n/locales/es.json` bajo `modules.<id>`.

## ROMs, assets y licencias

- Código: AGPL-3.0-only. Contenido (`content/`, `exercises/`, arte propio): CC BY-NC-SA 4.0.
- Solo ROMs con licencia compatible o propias. Nunca BIOS, firmware ni claves con copyright
  (GBA BIOS, claves de Switch…): se emulan por HLE o se usan reemplazos libres.
- Cada ROM o asset de terceros se documenta en un `LICENSES.md` junto a él (autor, licencia, URL).
