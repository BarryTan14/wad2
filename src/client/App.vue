<script>
import { RouterLink, RouterView } from 'vue-router'
import { Moon, Sun, Menu } from 'lucide-vue-next'
import './assets/styles.css'
import ChatWindow from './components/ChatWindow.vue'
import ToastContainer from "./components/ToastContainer.vue"
import { useAuthStore } from './stores/auth.js'
import AuthDropdown from './components/AuthDropdown.vue'

export default {
  name: 'App',

  components: {
    ChatWindow,
    ToastContainer,
    Moon,
    Sun,
    Menu,
    RouterLink,
    RouterView,
    AuthDropdown,
  },

  data() {
    return {
      isDarkTheme: true,
      isSidebarOpen: false,
      searchQuery: '',
      navigationRoutes: [
        { path: '/', name: 'Dashboard', icon: '📊' },
        { path: '/classPart', name: 'Class Participation', icon: '👥' },
        { path: '/progress', name: 'Progress', icon: '📈' },
        { path: '/team', name: 'Team Members', icon: '👥' },
        { path: '/messages', name: 'Messages', icon: '💬' }
      ],
      workspaces: [
        { name: 'Interactive Design & Prototyping', icon: '🎨' },
        { name: 'Computational Thinking', icon: '🧮' },
        { name: 'Web Application & Development', icon: '💻' }
      ],
      teamMembers: [
        { id: 1, profilePic: './assets/SVG%20Logo.svg' },
        { id: 2, profilePic: './assets/SVG%20Logo.svg' },
        { id: 3, profilePic: './assets/SVG%20Logo.svg' }
      ],
      fallbackImage: 'avatar.png',
    }
  },

  computed: {
    userProfile() {
      const authStore = useAuthStore()
      console.log(authStore.currentUser);
      return authStore.currentUser || {
        displayName: 'Anonymous',
        role: 'Guest',
        profilePic: this.fallbackImage
      }
    }
  },

  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme
      document.body.setAttribute('data-bs-theme', this.isDarkTheme ? 'dark' : 'light')
    },

    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
    }
  },

  // Save theme preference
  watch: {
    isDarkTheme: {
      handler(newValue) {
        localStorage.setItem('theme', newValue ? 'dark' : 'light')
      },
      immediate: true
    }
  },

  // Load saved theme preference
  created() {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark'
      document.body.setAttribute('data-bs-theme', savedTheme)
    }
  }
}
</script>

<template>
  <div class="app-container" :class="{ 'theme-light': !isDarkTheme }">
    <ChatWindow />
    <ToastContainer/>
    <div class="layout-wrapper">
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
        <div class="brand">
          <img src="./assets/logo.svg" alt="CultureOS" class="logo">
          <h1 class="brand-title">CultureOS</h1>
        </div>

        <!-- Main Navigation -->
        <nav class="main-nav">
          <ul class="nav-list">
            <li v-for="route in navigationRoutes" :key="route.path">
              <RouterLink
                  :to="route.path"
                  class="nav-link"
                  :class="{ 'active': $route.path === route.path }"
              >
                <span class="nav-icon">{{ route.icon }}</span>
                {{ route.name }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Workspaces -->
        <div class="workspaces">
          <h2 class="section-title">Workspaces</h2>
          <ul class="nav-list">
            <li v-for="workspace in workspaces" :key="workspace.name">
              <a href="#" class="nav-link">
                <span class="nav-icon">{{ workspace.icon }}</span>
                {{ workspace.name }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Theme Toggle -->
        <div class="theme-toggle-wrapper">
          <button @click="toggleTheme" class="theme-toggle">
            <component :is="isDarkTheme ? Sun : Moon" class="icon" />
            <span>{{ isDarkTheme ? 'Light' : 'Dark' }} Mode</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-area">
        <!-- Top Navigation -->
        <nav class="top-nav">
          <div class="top-nav-left">
            <button @click="toggleSidebar" class="menu-button">
              <Menu class="icon" />
            </button>
            <div class="search-container">
              <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Search"
                  class="search-input"
              >
            </div>
          </div>
          <div class="top-nav-right">
            <div class="team-members">
              <img
                  v-for="member in teamMembers"
                  :key="member.id"
                  :src="member.profilePic"
                  :alt="'Team Member ' + member.id"
                  class="team-member-avatar"
              >
              <button class="more-members">+2</button>
            </div>
<!--            <RouterLink to="/profile" class="user-profile">
              <img :src="`/src/client/assets/profilepicture/`+userProfile.profilePic" :alt="userProfile.displayName" class="user-avatar">
              <div class="user-info">
                <div class="user-name">{{ userProfile.displayName }}</div>
                <div class="user-role">{{ userProfile.role }}</div>
              </div>
            </RouterLink>-->
            <AuthDropdown/>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="content">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>