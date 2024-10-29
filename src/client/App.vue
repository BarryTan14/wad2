<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import { Moon, Sun, Menu } from 'lucide-vue-next'

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
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
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
              <RouterLink to="/classPart" class="nav-link" :class="{ 'active': $route.path === '/classPart' }">
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
              <a href="#" class="nav-link">
                <span class="nav-icon">🎨</span>
                User Interface Design
              </a>
            </li>
            <li>
              <a href="#" class="nav-link">
                <span class="nav-icon">📱</span>
                Mobile App Design
              </a>
            </li>
            <li>
              <a href="#" class="nav-link">
                <span class="nav-icon">💻</span>
                Web App Design
              </a>
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
              <img :src="userProfile.avatar" :alt="userProfile.name" class="user-avatar">
              <div class="user-info">
                <div class="user-name">{{ userProfile.name }}</div>
                <div class="user-role">{{ userProfile.role }}</div>
              </div>
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


<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--bs-dark);
  color: var(--bs-light);
  transition: all 0.3s ease;
}

.layout-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.sidebar {
  width: 280px;
  background-color: var(--bs-gray-900);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.logo {
  width: 32px;
  height: 32px;
}

.brand-title {
  color: var(--bs-purple);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  color: var(--bs-gray-400);
  text-decoration: none;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
  background-color: var(--bs-purple);
  color: var(--bs-white);
}

.nav-icon {
  font-size: 1.25rem;
}

.section-title {
  color: var(--bs-gray-500);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 1rem 0 0.5rem;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bs-gray-900);
  border-bottom: 1px solid var(--bs-gray-700);
}

.top-nav-left,
.top-nav-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.search-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--bs-gray-700);
  border-radius: 0.5rem;
  background-color: var(--bs-gray-800);
  color: var(--bs-light);
  width: 300px;
  font-size: 0.95rem;
}

.team-members {
  display: flex;
  align-items: center;
  margin-right: 1rem;
}

.team-member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--bs-gray-900);
  margin-left: -0.5rem;
}

.team-member-avatar:first-child {
  margin-left: 0;
}

.more-members {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--bs-gray-700);
  border: none;
  color: var(--bs-light);
  margin-left: -0.5rem;
  cursor: pointer;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 1rem;
  border-left: 1px solid var(--bs-gray-700);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.user-info {
  display: none;
}

.content {
  padding: 2rem;
  background-color: var(--bs-gray-800);
  flex: 1;
}

.theme-toggle-wrapper {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--bs-gray-700);
}

.theme-toggle {
  width: 100%;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  color: var(--bs-gray-400);
  cursor: pointer;
  border-radius: 0.5rem;
}

.theme-toggle:hover {
  background-color: var(--bs-gray-800);
}

.menu-button {
  display: none;
}

@media (min-width: 1024px) {
  .user-info {
    display: block;
  }
  
  .user-name {
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  .user-role {
    color: var(--bs-gray-500);
    font-size: 0.85rem;
  }
}

@media (max-width: 1024px) {
  .search-input {
    width: 500px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    z-index: 1000;
    transition: left 0.3s ease;
  }
  
  .sidebar-open {
    left: 0;
  }
  
  .menu-button {
    display: block;
    background: none;
    border: none;
    color: var(--bs-light);
    padding: 0.5rem;
    cursor: pointer;
  }
  
  .top-nav {
    padding: 1rem;
  }
  
  .search-input {
    width: 160px;
  }
  
  .team-members {
    display: none;
  }
}

@media (max-width: 480px) {
  .search-input {
    width: 120px;
  }
  
  .content {
    padding: 1rem;
  }
}

.theme-light {
  background-color: var(--bs-light);
  color: var(--bs-dark);
}

.theme-light .sidebar {
  background-color: var(--bs-white);
  border-right: 1px solid var(--bs-gray-200);
}

.theme-light .top-nav {
  background-color: var(--bs-white);
  border-bottom-color: var(--bs-gray-200);
}

.theme-light .search-input {
  background-color: var(--bs-gray-100);
  border-color: var(--bs-gray-200);
  color: var(--bs-dark);
}

.theme-light .nav-link {
  color: var(--bs-gray-600);
}

.theme-light .nav-link:hover,
.theme-light .nav-link.active {
  background-color: var(--bs-purple);
  color: var(--bs-white);
}

.theme-light .content {
  background-color: var(--bs-gray-100);
}

.theme-light .theme-toggle-wrapper {
  border-top-color: var(--bs-gray-200);
}

.theme-light .user-profile {
  border-left-color: var(--bs-gray-200);
}

.theme-light .menu-button {
  color: var(--bs-dark);
}

</style>
