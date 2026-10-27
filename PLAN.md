# PLAN.md — Plan de construcción de EmuDev Academy

## Visión

Una plataforma estilo codedex para aprender emulación, de menos a más complejidad: desde un
intérprete CHIP-8 hasta contribuir a un fork de Eden (emulador de Nintendo Switch). Cada sistema
es una región del mapa del mundo; se desbloquea al completar la anterior.

## Fases de la plataforma

Cada fase es uno o varios PRs independientes. No se mezclan engine, UI y contenido.

- [x] **Fase 1: Bootstrap.** Vite + Vue, Tailwind, i18n, ESLint/Prettier, Vitest,
      husky/commitlint, plantillas, CI/CD con semantic-release y GitHub Pages.
- [ ] **Fase 2: Engine.** Registry de módulos, storage versionado, runner en Web Worker,
      mini-lib de tests, progresión (XP, niveles, insignias, desbloqueos).
- [ ] **Fase 3: Shell RPG.** Creación de personaje, HUD, mapa del mundo, mapa del módulo, vista
      de lección (contenido + editor CodeMirror + resultados de tests), perfil, exportar/importar
      partida.
- [ ] **Fase 4: Core CHIP-8 + Sandbox.** Emulador de referencia con tests por opcode; sandbox
      con depurador (registros, memoria, paso a paso) y carga de ROMs.
- [ ] **Fase 5: Contenido CHIP-8.** Capítulos 1–7 (hasta el logo IBM) y luego 8–14.
- [ ] **Fase 6: Módulo 0, Fundamentos.**
- [ ] **Fase 7+: Siguientes módulos** según el roadmap.
- [ ] **Backend** (ver más abajo), cuando haga falta cuenta de usuario o sincronización.

## Roadmap de módulos

| #   | Módulo               | Lenguaje del alumno           | Qué se aprende                                                                                                   |
| --- | -------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 0   | Fundamentos          | JS                            | Binario, hexadecimal, operaciones bit a bit, endianness, cómo funciona una CPU (fetch/decode/execute)            |
| 1   | CHIP-8               | JS                            | Intérprete completo: memoria, registros, pila, display por XOR, teclado, timers, quirks                          |
| 2   | Game Boy (DMG)       | JS                            | CPU SM83, PPU por scanlines, timers, interrupciones, MBC, timing por ciclos, test ROMs de blargg/mooneye         |
| 3   | NES                  | JS                            | 6502, PPU, mappers, APU, sincronización CPU/PPU                                                                  |
| 4   | Game Boy Advance     | JS (C++ → WASM opcional)      | ARM7TDMI (ARM/Thumb), pipeline, DMA, HLE de la BIOS                                                              |
| 5   | NDS o PS1            | C++ (WASM o backend)          | Dos CPUs / MIPS R3000, GTE, CD-ROM, rendimiento                                                                  |
| 6   | Técnicas avanzadas   | C++                           | JIT/dynarec, HLE vs LLE, traducción de shaders, Vulkan, perfilado                                                |
| 7   | Switch: fork de Eden | C++ en local + GitHub Actions | ARMv8, servicios HOS en HLE, GPU Maxwell, compilación con CMake, depuración y contribución en un codebase grande |

Notas:

- Hasta el módulo 4 todo corre en el navegador y se publica en GitHub Pages.
- Nunca se distribuyen BIOS, firmware ni claves. En Eden el alumno usa sus propios volcados.
- Eden es GPL-3.0: el fork del módulo 7 es un repo aparte y mantiene esa licencia.

## Estrategia de ejecución de código por lenguaje

WASM (WebAssembly) es un formato binario que el navegador ejecuta casi a velocidad nativa. C, C++
y Rust pueden compilarse a WASM. Ejecutar un `.wasm` siempre se puede hacer en el navegador; la
decisión es **dónde se compila** el código del alumno.

| Opción                                                                  | Backend propio | C++ | Rust | Uso previsto                      |
| ----------------------------------------------------------------------- | -------------- | --- | ---- | --------------------------------- |
| JS en Web Worker                                                        | No             | —   | —    | Módulos 0–4                       |
| Compilador clang en WASM dentro del navegador (descarga inicial pesada) | No             | Sí  | No   | C++ opcional en GBA y NDS/PS1     |
| Servicio de compilación propio (Judge0/Piston o contenedores aislados)  | Sí             | Sí  | Sí   | Rust en la web, proyectos grandes |
| Local + GitHub Actions en el fork del alumno                            | No             | Sí  | Sí   | Módulo Eden                       |

Decisión pendiente: elegir entre WASM y backend al llegar al módulo 4/5. El backend de
**ejecución** es un servicio distinto del backend de **usuarios y progreso**.

## Backend

### Base de datos: recomendación PostgreSQL, no MongoDB

- Los datos son relacionales: usuarios ↔ progreso ↔ lecciones ↔ insignias ↔ rankings ↔ envíos.
  Postgres da integridad referencial, transacciones y agregaciones (leaderboards, estadísticas)
  sin código extra.
- Lo flexible (estado de una lección, código guardado del editor, metadatos) cabe en columnas
  `JSONB`, que dan la comodidad de un documento cuando hace falta.
- MongoDB funcionaría para guardar el progreso como un documento por usuario, pero los rankings,
  las relaciones entre entidades y la integridad tendrían que resolverse en la aplicación.

### Stack propuesto

- Node.js + Fastify (API REST, validación con JSON Schema).
- Drizzle ORM + migraciones SQL versionadas.
- Postgres gestionado (Neon o Supabase) para empezar sin operar servidores.
- Autenticación con GitHub OAuth (el público es técnico y el módulo Eden ya usa GitHub).
- Repo propio (`emudev-api`) o carpeta `server/` en monorepo con npm workspaces (decidir al
  empezar).
- Mismos estándares: ESLint estricto, Vitest, conventional commits, semantic-release.

### Modelo de datos inicial (borrador)

- `users` (id, github_id, display_name, avatar, created_at)
- `progress` (user_id, module_id, lesson_id, status, completed_at, xp_awarded)
- `submissions` (id, user_id, lesson_id, code, passed, results JSONB, created_at)
- `badges` (id, module_id, criteria JSONB) y `user_badges` (user_id, badge_id, earned_at)
- `saves` (user_id, payload JSONB, version) para el estado libre del frontend

El contenido de las lecciones sigue viviendo en el repo del frontend; la BD solo guarda
identificadores (`module_id`, `lesson_id`).

### Integración con el frontend

- El frontend accede al progreso a través de la interfaz `ProgressRepository`. Hoy:
  `LocalStorageRepository`. Con backend: `ApiRepository`, sin tocar stores ni vistas.
- Al primer login se ofrece importar la partida local existente.
- Sin sesión, la web sigue funcionando en modo local.

### Fases del backend

1. Auth con GitHub + perfil.
2. Sincronización de progreso (importar partida local, resolver conflictos por fecha).
3. Leaderboards, retos y estadísticas.
4. Servicio de ejecución de código para lenguajes compilados (contenedores aislados sin red, con
   límites de CPU y memoria y colas), si se elige esa vía.

## Puntos abiertos

- Nombre y branding definitivos (placeholder: "EmuDev Academy").
- Licencia de cada ROM de test a incluir; se verifica una por una antes de añadirla.
- Estrategia final para C++ (WASM vs backend) a partir del módulo 4.
- Primera versión: semantic-release publicará `1.0.0` en el primer `feat`/`fix` que llegue a
  `main`.
