import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

export enum RouteName {
  HOME = 'home',
  EVENTS_PAGE = 'eventsPage',
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: RouteName.HOME,
    component: () => import('@/views/homePage.vue'),
  },
  {
    path: '/eventsPage',
    name: RouteName.EVENTS_PAGE,
    component: () => import('@/views/eventsPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router