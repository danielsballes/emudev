# PLAN.md — EmuDev Academy build plan

## Vision

A codedex-style platform to learn emulation, from simple to complex: from a CHIP-8 interpreter to
contributing to a fork of Eden (a Nintendo Switch emulator). Each system is a region of the world
map, unlocked by completing the previous one.

## Platform phases

Each phase is one or more independent PRs. Engine, UI and content are never mixed.

- [x] **Phase 1: Bootstrap.** Vite + Vue, Tailwind, i18n, ESLint/Prettier, Vitest,
      husky/commitlint, templates, CI/CD with semantic-release and GitHub Pages.
- [x] **Phase 2: Engine.** Module registry, versioned storage, Web Worker runner, test
      mini-library, progression (XP, levels, badges, unlocks), `createEngine` plugin and
      `useSaveStore` Pinia store.
- [ ] **Phase 3: RPG shell.** Character creation, HUD, world map, module map, lesson view
      (content + CodeMirror editor + test results), profile, save export/import.
- [ ] **Phase 4: CHIP-8 core + Sandbox.** Reference emulator with tests per opcode; sandbox with a
      debugger (registers, memory, step by step) and ROM loading.
- [ ] **Phase 5: CHIP-8 content.** Chapters 1–7 (up to the IBM logo), then 8–14.
- [ ] **Phase 6: Module 0, Fundamentals.**
- [ ] **Phase 7+: Next modules** following the roadmap.
- [ ] **Backend** (see below), once user accounts or sync are needed.

## Module roadmap

| #   | Module              | Student language           | What is learned                                                                                       |
| --- | ------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| 0   | Fundamentals        | JS                         | Binary, hexadecimal, bitwise operations, endianness, how a CPU works (fetch/decode/execute)           |
| 1   | CHIP-8              | JS                         | Full interpreter: memory, registers, stack, XOR display, keypad, timers, quirks                       |
| 2   | Game Boy (DMG)      | JS                         | SM83 CPU, scanline PPU, timers, interrupts, MBC, cycle timing, blargg/mooneye test ROMs               |
| 3   | NES                 | JS                         | 6502, PPU, mappers, APU, CPU/PPU synchronization                                                      |
| 4   | Game Boy Advance    | JS (optional C++ → WASM)   | ARM7TDMI (ARM/Thumb), pipeline, DMA, BIOS HLE                                                         |
| 5   | NDS or PS1          | C++ (WASM or backend)      | Two CPUs / MIPS R3000, GTE, CD-ROM, performance                                                       |
| 6   | Advanced techniques | C++                        | JIT/dynarec, HLE vs LLE, shader translation, Vulkan, profiling                                        |
| 7   | Switch: Eden fork   | Local C++ + GitHub Actions | ARMv8, HLE of HOS services, Maxwell GPU, CMake builds, debugging and contributing to a large codebase |

Notes:

- Up to module 4 everything runs in the browser and is published on GitHub Pages.
- BIOS, firmware and keys are never distributed. In Eden the student uses their own dumps.
- Eden is GPL-3.0: the module 7 fork is a separate repository and keeps that license.

## Visual eras: the UI evolves with progress

The UI changes its look to match the hardware being emulated: it gains colors, resolution and
smoothness as the player advances. Progress is something you see, not just a number.

| Era        | Module               | Look                                                               |
| ---------- | -------------------- | ------------------------------------------------------------------ |
| `terminal` | 0. Fundamentals      | Text terminal: green/amber phosphor on black, blinking cursor      |
| `chip8`    | 1. CHIP-8            | 1-bit (two colors), big pixels, block borders, subtle CRT          |
| `gameboy`  | 2. Game Boy          | 4 shades of green, handheld RPG dialog frames                      |
| `nes`      | 3. NES               | 8-bit palette with few colors per element, double-bordered windows |
| `gba`      | 4. GBA               | 15-bit color, banded gradients, finer sprites, translucent windows |
| `early-3d` | 5. NDS / PS1         | Early 3D: simple polygons, dithering, depth, rotating transitions  |
| `modern`   | 6–7. Advanced / Eden | Modern UI: clean, smooth animations, soft shadows, high resolution |

Rules:

- **Shell** (world map, HUD, profile): uses the most advanced unlocked era.
- **Inside a module**: always that module's era (CHIP-8 lessons look 1-bit even if the player has
  reached NES).
- **Skins**: every unlocked era becomes a cosmetic the player can choose for the shell.
- **Readability first**: the era applies to the "chrome" (map, HUD, buttons, dialogs,
  transitions). Lesson text and the editor use a readable base with WCAG AA contrast in every era.
- **Accessibility**: honor `prefers-reduced-motion` (no flicker, CRT effects or abrupt
  transitions).
- **Unlocking**: completing a module plays a short "new era unlocked" scene (the screen "reboots"
  into the next generation). A homage, without logos, sounds or trademarks.

Implementation:

- Each era is a set of CSS variables (`[data-era="…"]`) in `src/themes/<era>/`: palette, fonts,
  borders, radii, shadows, pixel scale, animation curves and CodeMirror theme. Components only
  consume tokens.
- Each module manifest declares its `era`.
- The era chosen as skin is stored in the save (requires a save migration).
- **Phase 3** builds the theme system and fully designs the `terminal` and `chip8` eras. Each
  following era is designed (with the `frontend-design` skill) when its module arrives.

## Code execution strategy per language

WASM (WebAssembly) is a binary format that browsers run at near-native speed. C, C++ and Rust can
be compiled to WASM. Running a `.wasm` file is always possible in the browser; the decision is
**where the student's code gets compiled**.

| Option                                                           | Own backend | C++ | Rust | Intended use                    |
| ---------------------------------------------------------------- | ----------- | --- | ---- | ------------------------------- |
| JS in a Web Worker                                               | No          | —   | —    | Modules 0–4                     |
| clang compiled to WASM inside the browser (heavy first download) | No          | Yes | No   | Optional C++ in GBA and NDS/PS1 |
| Own compilation service (Judge0/Piston or isolated containers)   | Yes         | Yes | Yes  | Rust on the web, large projects |
| Local + GitHub Actions on the student's fork                     | No          | Yes | Yes  | Eden module                     |

Pending decision: choose between WASM and a backend when reaching module 4/5. The **execution**
backend is a separate service from the **users and progress** backend.

## Backend

### Database: PostgreSQL recommended over MongoDB

- The data is relational: users ↔ progress ↔ lessons ↔ badges ↔ leaderboards ↔ submissions.
  Postgres provides referential integrity, transactions and aggregations (leaderboards, stats)
  without extra code.
- The flexible parts (lesson state, saved editor code, metadata) fit in `JSONB` columns, which
  give document-style convenience where needed.
- MongoDB would work for storing progress as one document per user, but leaderboards,
  relationships between entities and integrity would have to be handled in the application.

### Proposed stack

- Node.js + Fastify (REST API, JSON Schema validation).
- Drizzle ORM + versioned SQL migrations.
- Managed Postgres (Neon or Supabase) to start without operating servers.
- GitHub OAuth authentication (the audience is technical and the Eden module already uses
  GitHub).
- Its own repository (`emudev-api`) or a `server/` folder in an npm workspaces monorepo (decide
  when starting).
- Same standards: strict ESLint, Vitest, conventional commits, semantic-release.

### Initial data model (draft)

- `users` (id, github_id, display_name, avatar, created_at)
- `progress` (user_id, module_id, lesson_id, status, completed_at, xp_awarded)
- `submissions` (id, user_id, lesson_id, code, passed, results JSONB, created_at)
- `badges` (id, module_id, criteria JSONB) and `user_badges` (user_id, badge_id, earned_at)
- `saves` (user_id, payload JSONB, version) for free-form frontend state

Lesson content keeps living in the frontend repository; the database only stores identifiers
(`module_id`, `lesson_id`).

### Frontend integration

- The frontend accesses progress through the `ProgressRepository` interface. Today:
  `LocalStorageRepository`. With a backend: `ApiRepository`, without touching stores or views.
- On first login, the player is offered to import their existing local save.
- Without a session, the app keeps working in local mode.

### Backend phases

1. GitHub auth + profile.
2. Progress sync (import the local save, resolve conflicts by date).
3. Leaderboards, challenges and stats.
4. Code execution service for compiled languages (isolated containers without network, CPU and
   memory limits, queues), if that route is chosen.

## Open questions

- Final name and branding (placeholder: "EmuDev Academy").
- License of each test ROM to include; verified one by one before adding it.
- Final C++ strategy (WASM vs backend) from module 4 on.
- First version: semantic-release will publish `1.0.0` on the first `feat`/`fix` that reaches
  `main`.
