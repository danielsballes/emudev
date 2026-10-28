// Lesson content is a placeholder until the module's content phase (see PLAN.md).
export default {
  id: 'chip8',
  order: 1,
  requires: ['fundamentals'],
  era: 'chip8',
  region: { titleKey: 'modules.chip8.title' },
  chapters: [
    {
      id: 'introduccion',
      titleKey: 'modules.chip8.chapters.introduccion',
      lessons: [
        {
          id: 'que-es-un-emulador',
          titleKey: 'modules.chip8.lessons.que-es-un-emulador',
          type: 'lesson',
          xp: 10,
          content: () => import('./content/es/01-que-es-un-emulador.md?raw'),
        },
      ],
    },
    {
      id: 'memoria-y-registros',
      titleKey: 'modules.chip8.chapters.memoria-y-registros',
      lessons: [
        {
          id: 'memoria',
          titleKey: 'modules.chip8.lessons.memoria',
          type: 'lesson',
          xp: 20,
          content: () => import('./content/es/02-memoria.md?raw'),
        },
        {
          id: 'registros',
          titleKey: 'modules.chip8.lessons.registros',
          type: 'lesson',
          xp: 20,
          content: () => import('./content/es/03-registros.md?raw'),
        },
      ],
    },
    {
      id: 'ciclo',
      titleKey: 'modules.chip8.chapters.ciclo',
      lessons: [
        {
          id: 'fetch',
          titleKey: 'modules.chip8.lessons.fetch',
          type: 'lesson',
          xp: 25,
          content: () => import('./content/es/04-fetch.md?raw'),
        },
        {
          id: 'decode',
          titleKey: 'modules.chip8.lessons.decode',
          type: 'lesson',
          xp: 25,
          content: () => import('./content/es/05-decode.md?raw'),
        },
      ],
    },
  ],
};
