import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      path: '/group/:groupId',
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
      meta: {
        requiresGuest:true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: {
        requiresGuest:true,
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: {
        requiresAuth:true,
      },
    },
    /*{
      path: '/logout',
      name: 'logout',
      component: () => import('../views/Logout.vue'),
      meta: {
        requiresAuth:true,
      },
    },*/
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

router.beforeEach(async (to, from, next) => {
  // Check if the route requires guest access
  if (to.meta.requiresGuest) {
    const isAuthenticated = await checkAuth()

    if (isAuthenticated) {
      // If user is authenticated, redirect to profile
      return next('/profile')
    } else {
      // If user is not authenticated, allow access
      return next()
    }
  } else
  if (to.meta.requiresAuth) {
    const isAuthenticated = await checkAuth()

    if (isAuthenticated) {
      // If user is authenticated, allow access
      return next()
    } else {
      // If user is not authenticated, redirect to login
      return next('/login')
    }
  } else {
    // For non-guest routes, proceed normally
    return next()
  }
})

export default router
