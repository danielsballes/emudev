// Lesson content is a placeholder until the module's content phase (see PLAN.md).
export default {
  id: 'fundamentals',
  order: 0,
  requires: [],
  era: 'terminal',
  region: { titleKey: 'modules.fundamentals.title' },
  chapters: [
    {
      id: 'numeros',
      titleKey: 'modules.fundamentals.chapters.numeros',
      lessons: [
        {
          id: 'bits-y-bytes',
          titleKey: 'modules.fundamentals.lessons.bits-y-bytes',
          type: 'lesson',
          xp: 10,
          content: () => import('./content/es/01-bits-y-bytes.md?raw'),
        },
        {
          id: 'hexadecimal',
          titleKey: 'modules.fundamentals.lessons.hexadecimal',
          type: 'lesson',
          xp: 10,
          content: () => import('./content/es/02-hexadecimal.md?raw'),
        },
      ],
    },
    {
      id: 'operaciones',
      titleKey: 'modules.fundamentals.chapters.operaciones',
      lessons: [
        {
          id: 'operaciones-bit-a-bit',
          titleKey: 'modules.fundamentals.lessons.operaciones-bit-a-bit',
          type: 'lesson',
          xp: 15,
          content: () => import('./content/es/03-operaciones-bit-a-bit.md?raw'),
        },
        {
          id: 'endianness',
          titleKey: 'modules.fundamentals.lessons.endianness',
          type: 'lesson',
          xp: 15,
          content: () => import('./content/es/04-endianness.md?raw'),
        },
      ],
    },
    {
      id: 'cpu',
      titleKey: 'modules.fundamentals.chapters.cpu',
      lessons: [
        {
          id: 'ciclo-de-la-cpu',
          titleKey: 'modules.fundamentals.lessons.ciclo-de-la-cpu',
          type: 'lesson',
          xp: 20,
          content: () => import('./content/es/05-ciclo-de-la-cpu.md?raw'),
        },
      ],
    },
  ],
};
