import '@fontsource/vt323/latin-400.css';
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/atkinson-hyperlegible-next/latin-400.css';
import '@fontsource/atkinson-hyperlegible-next/latin-700.css';
import '@fontsource/atkinson-hyperlegible-mono/latin-400.css';
import './styles/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { createEngine } from './engine/plugin.js';
import { i18n } from './i18n';
import { router } from './router';
import { resolvePlayerRoute } from './router/player-guard.js';
import { useSaveStore } from './stores/save.js';

const pinia = createPinia();
const app = createApp(App).use(createEngine()).use(pinia);

router.beforeEach((to) => resolvePlayerRoute(to, useSaveStore(pinia).hasPlayer));

app.use(router).use(i18n).mount('#app');
