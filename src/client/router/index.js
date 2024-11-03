import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserProfile from "../views/UserProfile.vue";

const checkAuth = async () => {
  try {
    await axios.get('/user/api/auth/test')  // Your existing profile endpoint
    return true // User is authenticated
  } catch (error) {
    return false // User is not authenticated
  }
}

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
      component: () => import('../views/Group.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: {
        requiresAuth:false,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: {
        requiresAuth:false,
      },
    },
    {
      path: '/profile',
      component: UserProfile,
      children: [
        {
          path: '',  // Own profile
          component: UserProfile
        },
        {
          path: ':id',  // Other user's profile
          component: UserProfile
        }
      ],
      meta: {
        requiresAuth:true,
      },
    },
    {
      path: '/logout',
      name: 'logout',
      component: () => import('../views/Logout.vue'),
      meta: {
        requiresAuth:true,
      },
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
