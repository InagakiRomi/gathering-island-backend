import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

export enum RouteName {
  HOME = 'home',
  LOGIN_VIEW = 'loginView',
  EVENTS_PAGE = 'eventsPage',
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: RouteName.HOME,
    component: () => import('@/views/homePage.vue'),
  },
  {
    path: '/loginView',
    name: RouteName.LOGIN_VIEW,
    component: () => import('@/views/loginView.vue'),
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