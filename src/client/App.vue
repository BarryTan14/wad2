<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import { Moon, Sun, Menu } from 'lucide-vue-next'
// import './assets/styles.css'
import ChatWindow from './components/ChatWindow.vue'

const isDarkTheme = ref(true)
const isSidebarOpen = ref(false)

const userProfile = {
  name: 'Prof Shar',
  role: 'WAD2 Professor!',
  avatar: './assets/SVG%20Logo.svg'
}

const teamMembers = ref([
  { id: 1, avatar: './assets/SVG%20Logo.svg' },
  { id: 2, avatar: './assets/SVG%20Logo.svg' },
  { id: 3, avatar: './assets/SVG%20Logo.svg' }
])

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  document.body.setAttribute('data-bs-theme', isDarkTheme.value ? 'dark' : 'light')
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="app-container" :class="{ 'theme-light': !isDarkTheme }">
    <div class="layout-wrapper">
      <ChatWindow />
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
        <div class="close-button" v-if="isSidebarOpen" @click="toggleSidebar">&times;</div>
  <div class="brand">
    <img src="./assets/logo.svg" alt="CultureOS" class="logo">
    <h1 class="brand-title">CultureOS</h1>
  </div>

        <!-- Main Navigation -->
        <nav class="main-nav">
          <ul class="nav-list">
            <li>
              <RouterLink to="/" class="nav-link" :class="{ 'active': $route.path === '/' }">
                <span class="nav-icon">📊</span>
                Dashboard
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/transcribefromclaude" class="nav-link" :class="{ 'active': $route.path === '/transcribefromclaude' }">
                <span class="nav-icon">👥</span>
                Class Participation
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/progress" class="nav-link" :class="{ 'active': $route.path === '/progress' }">
                <span class="nav-icon">📈</span>
                Progress
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/team" class="nav-link" :class="{ 'active': $route.path === '/team' }">
                <span class="nav-icon">👥</span>
                Team Members
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/messages" class="nav-link" :class="{ 'active': $route.path === '/messages' }">
                <span class="nav-icon">💬</span>
                Messages
              </RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Workspaces -->
        <div class="workspaces">
          <h2 class="section-title">Workspaces</h2>
          <ul class="nav-list">
            <li>
              <RouterLink :to="{ name: 'group', params: { groupId: 101 }}" class="nav-link" :class="{ 'active':$route.params.groupId === '101'}" >
                <span class="nav-icon">🎨</span>
                Interactive Design & Prototyping
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="{ name: 'group', params: { groupId: 102 }}" class="nav-link" :class="{ 'active': $route.params.groupId === '102'}" >
                <span class="nav-icon">🧮</span>
                Computational Thinking
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="{ name: 'group', params: { groupId: 103 }}" class="nav-link" :class="{ 'active': $route.params.groupId === '103'}" >
                <span class="nav-icon">💻</span>
                Web Application & Development
              </RouterLink>
            
            </li>
          </ul>
        </div>

        <!-- Theme Toggle -->
        <div class="theme-toggle-wrapper">
    <button @click="toggleTheme" class="theme-toggle">
      <Sun v-if="isDarkTheme" class="icon" />
      <Moon v-else class="icon" />
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
              <input type="text" placeholder="Search" class="search-input">
            </div>
          </div>
          <div class="top-nav-right">
            <div class="team-members">
              <img 
                v-for="member in teamMembers" 
                :key="member.id"
                :src="member.avatar" 
                :alt="'Team Member ' + member.id" 
                class="team-member-avatar"
              >
              <button class="more-members">+2</button>
            </div>
            <div class="user-profile">
              <RouterLink to="/profile">
              <img :src="userProfile.avatar" :alt="userProfile.name" class="user-avatar">
              <div class="user-info">
                <div class="user-name">{{ userProfile.name }}</div>
                <div class="user-role">{{ userProfile.role }}</div>
              </div>
              </RouterLink>
            </div>
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
