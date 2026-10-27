import '@fontsource/press-start-2p/latin-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './styles/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { i18n } from './i18n';
import { router } from './router';

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app');
