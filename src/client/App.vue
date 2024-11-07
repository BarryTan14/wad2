<script>
import { RouterLink, RouterView } from 'vue-router'
import { Moon, Sun, Menu } from 'lucide-vue-next'
// import './assets/styles.css'
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
      isModalOpen: false,
      suggestions: [], // Stores suggestions for each team member input
      showSuggestions: [], // Controls visibility of suggestions for each input
      newModule: {
        groupId: '',
        groupName: '',
        moduleTitle: '',
        teamMembers: [{ name: '' }],
        taskList: [],
        // Initial team member input
      },
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
        { name: 'Interactive Design & Prototyping', icon: '🎨', groupId: 101, path: '/group' },
        { name: 'Computational Thinking', icon: '🧮', groupId: 102, path: '/group' },
        { name: 'Web Application & Development', icon: '💻', groupId: 103, path: '/group' }
      ],
      teamMembers: [
        { id: 1, profilePic: '/profilepicture/avatar.png' },
        { id: 2, profilePic: '/profilepicture/avatar.png' },
        { id: 3, profilePic: '/profilepicture/avatar.png' }
      ],
      fallbackImage: 'avatar.png',
    }
  },

  computed: {
  },

  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme
      document.body.setAttribute('data-bs-theme', this.isDarkTheme ? 'dark' : 'light')
    },

    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
    },
    // Open the modal
    openModal() {
      this.isModalOpen = true;
    },
    // Close the modal and reset form
    closeModal() {
      this.isModalOpen = false;
      this.resetForm();
    },
    // Add a new team member input
    addTeamMember() {
      this.newModule.teamMembers.push({ name: "" });
      this.suggestions.push([]); // Initialize suggestions for new input
      this.showSuggestions.push(false); // Initialize visibility control for new input
    },
    // Remove a team member input
    removeTeamMember(index) {
      this.newModule.teamMembers.splice(index, 1);
      this.suggestions.splice(index, 1); // Remove corresponding suggestions
      this.showSuggestions.splice(index, 1); // Remove corresponding visibility control
    },
    // Reset form fields
    resetForm() {
      this.newModule = {
        groupName: "",
        moduleName: "",
        teamMembers: [{ name: "" }]
      };
      this.suggestions = [[]];
      this.showSuggestions = [false];
    },
    // Fetch suggestions based on user input
    async fetchSuggestions(query, index) {
      if (query.length < 2) {
        this.suggestions[index] = [];
        return;
      }

      try {
        const response = await axios.get(`/user/api/searchDisplayName/${query}`,);
        console.log(response.data)
        this.suggestions[index] = response.data; // Assuming response is an array of suggestions
        this.showSuggestions[index] = true; // Ensure suggestions are shown after fetch
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    },
    // Select a suggestion from the list
    selectSuggestion(index, suggestion) {
      this.newModule.teamMembers[index].name = suggestion.displayName;
      
      this.showSuggestions[index] = false; // Hide suggestions after selection
    },
    // Close suggestions with a delay to allow selection click to process
    closeSuggestions(index) {
      setTimeout(() => {
        this.showSuggestions[index] = false;
      }, 100);
    },
    // Submit the workspace data
    submitModule() {
      console.log("Submitting workspace:", this.newModule);


      try {
        const response = axios.post('/api/group/add', this.newModule, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Workspace added:', response.data);

        // Optionally, refresh the workspaces list or handle UI updates
      } catch (error) {
        console.error('Error adding workspace:', error);
      }
      // Here you would make a POST request to save the workspace
      // Example:
      // await axios.post('/api/workspaces', this.newWorkspace);

      this.closeModal(); // Close the modal after submission
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
    <ToastContainer />
    <div class="layout-wrapper">
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
            <li v-for="route in navigationRoutes" :key="route.path">
              <RouterLink :to="route.path" class="nav-link" :class="{ 'active': $route.path === route.path }">
                <span class="nav-icon">{{ route.icon }}</span>
                {{ route.name }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Workspaces -->
        <div class="workspaces">
          <h2 class="section-title">Groups <button @click="openModal">Add Group</button></h2>
          <ul class="nav-list">
            <!-- <li v-for="workspace in workspaces" :key="workspace.name">
              <a href="#" class="nav-link">
                <span class="nav-icon">{{ workspace.icon }}</span>
                {{ workspace.name }}
              </a>
            </li> -->
            <li v-for="workspace in workspaces" :key="workspace.groupId">
              <RouterLink :to="workspace.path + '/' + workspace.groupId" class="nav-link"
                :class="{ 'active': $route.path === workspace.path + '/' + workspace.groupId }">
                <span class="nav-icon">{{ workspace.icon }}</span>
                {{ workspace.name }}
              </RouterLink>
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
              <input type="text" v-model="searchQuery" placeholder="Search" class="search-input">
            </div>
          </div>
          <div class="top-nav-right">
            <div class="team-members">
              <img v-for="member in teamMembers" :key="member.id" :src="member.profilePic"
                :alt="'Team Member ' + member.id" class="team-member-avatar">
              <button class="more-members">+2</button>
            </div>
            <!--            <RouterLink to="/profile" class="user-profile">
              <img :src="`/profilepicture/`+userProfile.profilePic" :alt="userProfile.displayName" class="user-avatar">
              <div class="user-info">
                <div class="user-name">{{ userProfile.displayName }}</div>
                <div class="user-role">{{ userProfile.role }}</div>
              </div>
            </RouterLink>-->
            <AuthDropdown />
          </div>
        </nav>

        <!-- Main Content -->
        <main class="content">
          <RouterView />
        </main>
      </div>
    </div>
  </div>

  <div v-if="isModalOpen" class="modal-overlay">
    <div class="modal-content">
      <h2>Add New Workspace</h2>
      <form @submit.prevent="submitModule" class="workspace-form">
        <!-- Group Name -->
        <label>
          Group Name:
          <input type="text" v-model="newModule.groupName" required />
        </label>

        <!-- Module Title -->
        <label>
          Module Title:
          <input type="text" v-model="newModule.moduleName" required />
        </label>

        <!-- Team Members with Autocomplete -->
        <h3>Team Members</h3>
        <div v-for="(member, index) in newModule.teamMembers" :key="index" class="team-member-row">
          <!-- Team Member Name with Autocomplete -->
          <label>
            Team Member:
            <div class="input-wrapper">
              <input type="text" v-model="member.name" @input="fetchSuggestions(member.name, index)"
                @focus="showSuggestions[index] = true" @blur="closeSuggestions(index)"
                placeholder="Type to search team members" required />

              <!-- Suggestions Dropdown -->
              <ul v-if="showSuggestions[index]" class="suggestions-list">
                <li v-for="suggestion in suggestions[index]" :key="suggestion.displayName"
                  @click="selectSuggestion(index, suggestion)">
                  {{ suggestion.displayName }}
                </li>
              </ul>
            </div>
          </label>
          <button type="button" @click="removeTeamMember(index)" class="remove-member-button">
            Remove
          </button>
        </div>
        <button type="button" @click="addTeamMember" class="add-member-button">
          Add Team Member
        </button>

        <!-- Submit and Cancel Buttons -->
        <button type="submit">Submit</button>
        <button type="button" @click="closeModal">Cancel</button>
      </form>
    </div>
  </div>
</template>

<style>
/* Basic styling for modal overlay and content */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: grey;
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  max-height: 90vh;
}

/* Stacks all form elements vertically */
.workspace-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.team-member-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: grey;
  margin-bottom: 10px;
}

.input-wrapper {
  position: relative;
  /* Position relative for absolute positioning of suggestions */
  width: 100%;
  /* Ensures input wrapper matches input width */
}

input[type="text"] {
  width: 100%;
  /* Ensures input box takes full width */
  box-sizing: border-box;
  /* Ensures padding is included in width */
}

.suggestions-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ddd;
  max-height: 150px;
  overflow-y: auto;
  background: #fff;
  color: black;
  position: absolute;
  width: 100%;
  /* Matches the input width */
  top: 100%;
  /* Aligns the suggestions directly below the input */
  left: 0;
  /* Ensures suggestions align with the left of the input */
  z-index: 10;
  box-sizing: border-box;
  /* Ensures padding is included in width */
}

.suggestions-list li {
  padding: 8px;
  cursor: pointer;
}

.suggestions-list li:hover {
  background-color: #eee;
}

button {
  margin-top: 10px;
  padding: 5px 10px;
  cursor: pointer;
}

.add-member-button {
  display: block;
  margin: 10px auto;
}

.remove-member-button {
  margin-top: 10px;
}
</style>