# CLAUDE.md

Guide for working in this repository (humans and agents). The roadmap and product decisions live
in [PLAN.md](PLAN.md).

## What it is

EmuDev Academy: a codedex-style web app (pixel-art RPG, XP, levels, badges) to learn how to build
emulators. Each system is a **module** (a region of the world map). No backend for now: progress
is stored in `localStorage` and the student's code runs in the browser.

## Commands

```bash
npm run dev            # development server
npm run lint           # strict ESLint, --max-warnings 0
npm run format:check   # Prettier
npm run test:coverage  # Vitest + coverage (80% threshold)
npm run build          # production build (+ 404.html for GitHub Pages)
npm run check          # all of the above except dev, same as CI
```

Checks run automatically through Husky, so there is no need to run them by hand:

| Hook         | What runs                                                                        |
| ------------ | -------------------------------------------------------------------------------- |
| `pre-commit` | lint-staged on staged files: ESLint `--fix`, Prettier and `vitest related` tests |
| `commit-msg` | commitlint (Conventional Commits)                                                |
| `pre-push`   | `npm run check`: full lint, format check, tests with coverage and build          |

`npm run check` mirrors the required PR checks, so a successful push means CI should pass too.

## Stack

Vue 3 (`<script setup>`), Vite, Vue Router, Pinia, vue-i18n, Tailwind CSS 4 (CSS-first
configuration in `src/styles/main.css`), Vitest + Vue Test Utils, ESLint (flat config) + Prettier.
Modern JavaScript (ESM, ES2025), no TypeScript; JSDoc on the engine's public APIs.

## Conventions

- **English in the repository**: code (variables, functions, files, comments), commits, PRs,
  documentation (`README.md`, `CLAUDE.md`, `PLAN.md`) and GitHub templates.
- **User-facing text: Spanish**, always through i18n:
  - UI: `src/i18n/locales/es.json` + `t('key')`. ESLint forbids untranslated text in templates
    (`@intlify/vue-i18n/no-raw-text`) as well as unused or missing keys.
  - Lesson content: `src/modules/<id>/content/<locale>/`.
- Components in PascalCase (`PixelButton.vue`), every other file in kebab-case.
- Tests live in `tests/`, mirroring `src/`: `src/engine/runner/foo.js` →
  `tests/engine/runner/foo.test.js`. They import application code through the `@/` alias. Shared
  fixtures live in `tests/fixtures/`.
- Alias `@` → `src/`.
- Style only with tokens from the active theme (colors, fonts, borders, shadows, motion), never
  hardcoded colors or fonts: the UI changes era and every component must look right in all of
  them.
- Do not disable ESLint rules with comments unless the comment itself explains why.

## Git and releases

- **Never commit without Daniel's explicit authorization at that moment.**
- **Commits and PRs in English**, including the PR title, description and template.
- Conventional Commits, enforced by the `commit-msg` hook (see the hooks table above).
- Branch from `main`; open a PR with the template; **squash merge**, so the PR title must be a
  Conventional Commit (validated by the `pr-title` check).
- One PR per phase or piece of work; do not mix engine, UI and content in the same PR.
- `main` is protected: required checks `lint`, `test`, `build`, `pr-title`.
- On merge to `main`, `release.yml` runs lint + tests, semantic-release (tag + GitHub Release with
  `dist` zipped, no commits pushed back to `main`) and deploys to GitHub Pages.
- The version is injected into the build through `VITE_APP_VERSION` → global `__APP_VERSION__`.

## Architecture (target)

```
src/
├─ engine/        # module-agnostic, high coverage
│  ├─ registry/   # discovers modules with import.meta.glob('/src/modules/*/module.js')
│  ├─ storage/    # ProgressRepository: versioned localStorage + migrations (later ApiRepository)
│  ├─ runner/     # runs student code in a Web Worker with a timeout
│  ├─ testing/    # expect/assert mini-library for exercise tests
│  └─ progression/# XP, levels, badges, unlocks
├─ stores/        # Pinia on top of engine/storage
├─ components/    # ui/ (pixel UI) and lesson/ (editor, results, console)
├─ themes/        # one folder per visual era: CSS tokens + editor theme (see PLAN.md)
├─ views/         # WorldMap, ModuleMap, LessonView, Profile, Sandbox, CharacterCreate
└─ modules/<id>/  # one module per emulated system
```

Current state: bootstrap + engine. There is no game UI or module yet. See the phases in
PLAN.md.

Engine pieces:

- `createEngine()` (`src/engine/plugin.js`): Vue plugin that provides `{ registry, repository,
runner }`; `useEngine()` returns them. Tests inject fakes.
- `useSaveStore()` (`src/stores/save.js`): the player's save. The save is replaced immutably
  (`shallowRef`) on every change, after being written through the repository (write first, so a
  failed write leaves the state unchanged).
- Runner: protocol `{ type: 'run', token, studentSource, testsSource }` → `{ type: 'result',
token, outcome }`. Statuses: `passed`, `failed`, `error` (phase `student` | `tests` | `worker`),
  `timeout`. Assertion errors travel as data (`matcher`, `expected`, `actual`) so the UI can
  explain them in the student's language.
- Exercise tests: `export default [{ name, run: ({ student, expect }) => …, hint? }]`.

## Adding a module

1. Create `src/modules/<id>/module.js` with the manifest. Heavy parts (lesson content, exercise
   sources, quizzes) are **loader functions**, so they are only downloaded when needed; the
   registry rejects plain objects there.

   ```js
   export default {
     id: 'chip8',
     order: 1,
     requires: ['fundamentals'], // only modules with a lower `order`
     era: 'chip8', // visual era used inside the module (src/themes/<era>), wired in phase 3
     region: { titleKey: 'modules.chip8.title', icon },
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
             exercise: () => import('./exercises/draw-sprite/index.js'), // exercise and boss
             // quiz: () => import('./quizzes/…'), // required for type 'quiz'
           },
         ],
       },
     ],
     badges: [
       // criteria.type: 'lesson' | 'chapter' (both need `id`) | 'module'
       {
         id: 'ibm-logo',
         titleKey: 'modules.chip8.badges.ibmLogo',
         criteria: { type: 'lesson', id: 'draw-sprite' },
       },
     ],
   };
   ```

2. Reference emulator in `src/modules/<id>/core/`, with tests per instruction.
3. Module-specific components (screen, debugger…) in `src/modules/<id>/components/`.
4. Lessons in `src/modules/<id>/content/es/NN-slug.md`.
5. Exercises in `src/modules/<id>/exercises/<lesson-id>/`:
   - `starter.js`: what the student sees; includes the solved parts from earlier lessons.
   - `solution.js`: reference solution.
   - `tests.js`: hidden tests run by the runner
     (`export default [{ name, run: ({ student, expect }) => …, hint? }]`).
   - `index.js`: the loader target, exporting the three files as source text:

     ```js
     export { default as starter } from './starter.js?raw';
     export { default as solution } from './solution.js?raw';
     export { default as tests } from './tests.js?raw';
     ```

   - Mandatory meta-test: `solution.js` passes `tests.js` and `starter.js` fails them.
6. Module UI strings in `src/i18n/locales/es.json` under `modules.<id>`.

## ROMs, assets and licenses

- Code: AGPL-3.0-only. Content (`content/`, `exercises/`, original art): CC BY-NC-SA 4.0.
- Only ROMs with a compatible license or our own. Never copyrighted BIOS, firmware or keys (GBA
  BIOS, Switch keys…): emulate them through HLE or use free replacements.
- Every third-party ROM or asset is documented in a `LICENSES.md` next to it (author, license,
  URL).
