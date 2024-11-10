<script>
import Main from "./Main.vue";
import LandingPage from "./views/LandingPage.vue";


export default {
  name: 'App',

  components: {
    LandingPage,
    Main,
  },

  data() {
    return {
      isDarkTheme: true,
      isSidebarOpen: false,
      searchQuery: '',
    }
  },

  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      document.documentElement.setAttribute('data-bs-theme', this.isDarkTheme ? 'dark' : 'light');
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
};

</script>

<template>
  <div class="app-container">
    <Main v-if="this.$authStore.isLoggedIn" />
    <LandingPage v-else/>
  </div>
</template>
<style>
/* Base theme variables */
:root {
  /* Brand colors */
  --purple-primary: #7C3AED;  /* Main purple */
  --purple-light: #8B5CF6;    /* Lighter purple for hover */
  --purple-dark: #6D28D9;     /* Darker purple for active */
  --success-color: #10B981;   /* Green for positive actions */
  --danger-color: #EF4444;    /* Red for dangerous actions */
  --warning-color: #F59E0B;   /* Amber for warnings */

  /* Light theme colors */
  --text-primary: #1a1a1a;
  --text-secondary: #4B5563;
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --border-color: #e5e7eb;
  --modal-bg: #ffffff;
  --input-bg: #ffffff;
  --input-text: #1a1a1a;
  --dropdown-bg: #ffffff;
  --hover-bg: #f3f4f6;
}

/* Dark theme colors */
[data-bs-theme="dark"] {
  --text-primary: #f3f4f6;
  --text-secondary: #9CA3AF;
  --bg-primary: #1f2937;
  --bg-secondary: #374151;
  --border-color: #4b5563;
  --modal-bg: #1f2937;
  --input-bg: #374151;
  --input-text: #f3f4f6;
  --dropdown-bg: #1f2937;
  --hover-bg: #374151;
}

/* Modal styles */
.custom-swal-popup {
  background-color: var(--modal-bg) !important;
  color: var(--text-primary) !important;
  border-radius: 12px !important;
}

.custom-swal-title {
  color: var(--text-primary) !important;
  font-weight: 600 !important;
}

.custom-swal-content {
  color: var(--text-secondary) !important;
}

/* Form inputs */
.custom-input {
  background-color: var(--input-bg) !important;
  color: var(--input-text) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
  transition: border-color 0.2s ease !important;
}

.custom-input:focus {
  border-color: var(--purple-primary) !important;
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2) !important;
}

.custom-input::placeholder {
  color: var(--text-secondary) !important;
  opacity: 0.7;
}

/* Suggestions dropdown */
.suggestions-dropdown {
  background-color: var(--dropdown-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

.suggestion-item {
  color: var(--text-primary) !important;
  transition: background-color 0.2s ease !important;
}

.suggestion-item:hover {
  background-color: var(--purple-primary) !important;
  color: white !important;
}

/* Action Buttons */
.action-button {
  background-color: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
}

.action-button:hover {
  background-color: var(--purple-light) !important;
  color: white !important;
  border-color: var(--purple-light) !important;
}

.add-button {
  background-color: var(--purple-primary) !important;
  color: white !important;
  border: none !important;
}

.add-button:hover {
  background-color: var(--purple-light) !important;
}

.remove-button {
  background-color: transparent !important;
  color: var(--danger-color) !important;
  border: 1px solid var(--danger-color) !important;
}

.remove-button:hover {
  background-color: var(--danger-color) !important;
  color: white !important;
}

/* SweetAlert2 specific overrides */
.swal2-popup {
  background-color: var(--modal-bg) !important;
  border-radius: 12px !important;
}

.swal2-title, .swal2-html-container {
  color: var(--text-primary) !important;
}

.swal2-input, .swal2-textarea {
  background-color: var(--input-bg) !important;
  color: var(--input-text) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
}

/* Confirm button - Primary action */
.swal2-confirm {
  background-color: var(--purple-primary) !important;
  color: white !important;
  border-radius: 6px !important;
  padding: 10px 24px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}

.swal2-confirm:hover {
  background-color: var(--purple-light) !important;
  transform: translateY(-1px) !important;
}

/* Cancel button - Secondary action */
.swal2-cancel {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 6px !important;
  padding: 10px 24px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}

.swal2-cancel:hover {
  background-color: var(--bg-secondary) !important;
  border-color: var(--text-secondary) !important;
}

/* Delete/Dangerous action button */
.swal2-deny {
  background-color: transparent !important;
  color: var(--danger-color) !important;
  border: 1px solid var(--danger-color) !important;
  border-radius: 6px !important;
  padding: 10px 24px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}

.swal2-deny:hover {
  background-color: var(--danger-color) !important;
  color: white !important;
}

/* Form section styling */
.form-section {
  margin-bottom: 1.5rem !important;
}

.form-label {
  color: var(--text-primary) !important;
  font-weight: 500 !important;
  margin-bottom: 0.5rem !important;
  display: inline-block !important;
}

.required {
  color: var(--danger-color) !important;
  margin-left: 0.25rem !important;
}
</style>