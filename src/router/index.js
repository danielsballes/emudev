import { createRouter, createWebHistory } from 'vue-router';

import { ROUTE } from './player-guard.js';

export const routes = [
  {
    path: '/',
    name: ROUTE.HOME,
    component: () => import('@/views/WorldMapView.vue'),
    meta: { requiresPlayer: true },
  },
  {
    path: '/modulo/:moduleId',
    name: ROUTE.MODULE,
    component: () => import('@/views/ModuleMapView.vue'),
    meta: { requiresPlayer: true },
  },
  {
    path: '/crear-personaje',
    name: ROUTE.CREATE_CHARACTER,
    component: () => import('@/views/CharacterCreateView.vue'),
    meta: { guestOnly: true, hideHud: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: ROUTE.HOME },
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
