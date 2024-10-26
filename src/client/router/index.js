import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/group',
      name: 'group',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Group.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
    },
    {
      path: '/classPart',
      name: 'classPart',
      component: () => import('../views/ClassParticipation.vue'),
    },
    {
      path: '/transcribe',
      name: 'transcribe',
      component: () => import('../views/Transcribe.vue'),
    },
    {
      path: '/transcribeFromClaude',
      name: 'transcribeFromClaude',
      component: () => import('../views/TranscribeFromClaude.vue'),
    },
  ],
})

export default router
