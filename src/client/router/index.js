import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserProfile from "../views/UserProfile.vue";
import LandingPage from "../views/LandingPage.vue";

import Group from "../views/Group.vue"

const checkAuth = async () => {
  try {
    await axios.get('/api/user/auth/test')  // Your existing profile endpoint
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
      name: 'Home',
      component: LandingPage,
      meta: {
        requiresAuth: false,
      }
    },
    {
      path: "/pages/landing-pages/about-us",
      name: "about",
      component: AboutView,
      meta: {
        requiresAuth: false,
      }
    },
    {
      path: "/pages/landing-pages/contact-us",
      name: "contactus",
      component: ContactView,
      meta: {
        requiresAuth: false,
      }
    },
    {
      path: "/pages/landing-pages/author",
      name: "author",
      component: AuthorView,
      meta: {
        requiresAuth: false,
      }
    },
    {
      path: "/pages/landing-pages/basic",
      name: "signin-basic",
      component: SignInBasicView,
      meta: {
        requiresAuth: false,
      }
    },
    {
      path: '/dashboard',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
      }
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
      path: '/group',
      component: Group,
      children: [
        {
          path: '',  
          component: Group
        },
        {
          path: ':groupId',  
          component: Group
        }
      ],
      meta: {
        requiresAuth:true,
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
    path: '/emailsender',
    name: 'EmailSender',
    component: () => import('../views/EmailSender.vue')
  },
  {
    path: '/calendarManager',
    name: 'CalendarManager',
    component: () => import('../views/CalendarManager.vue')
  },
  {
    path: '/calendarEmailView',
    name: 'CalendarEmailView',
    component: () => import('../views/CalendarEmailView.vue')
  },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0 };
  }
})

export default router
