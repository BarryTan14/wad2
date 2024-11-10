<script>
import { RouterLink, RouterView } from 'vue-router'
import { Moon, Sun, Menu } from 'lucide-vue-next'
// import './assets/styles.css'
import ChatWindow from './components/ChatWindow.vue'
import ToastContainer from "./components/ToastContainer.vue"
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
      userGroups: [],
      isModalOpen: false,
      suggestions: [], // Stores suggestions for each team member input
      showSuggestions: [], // Controls visibility of suggestions for each input
      newModule: {
        groupId: '',
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
        { path: '/transcribe', name: 'Class Participation', icon: '👥' },
        { path: '/calendaremailview', name: 'Event Planner', icon: '🗓️' },
        // { path: '/progress', name: 'Progress', icon: '📈' },
        // { path: '/team', name: 'Team Members', icon: '👥' },
        // { path: '/messages', name: 'Messages', icon: '💬' }
      ],
      // workspaces: [
      //   { name: 'Interactive Design & Prototyping', icon: '🎨', groupId: 101, path: '/group' },
      //   { name: 'Computational Thinking', icon: '🧮', groupId: 102, path: '/group' },
      //   { name: 'Web Application & Development', icon: '💻', groupId: 103, path: '/group' }
      // ],
      teamMembers: [
        { id: 1, profilePic: '/profilepicture/avatar.png' },
        { id: 2, profilePic: '/profilepicture/avatar.png' },
        { id: 3, profilePic: '/profilepicture/avatar.png' }
      ],
      fallbackImage: 'avatar.png',
      chatKey: 0,
      showChat: true
    }
  },

  methods: {
    reinitializeChat() {
      // Temporarily remove the component
      this.showChat = false

      // Increment key to force a fresh mount
      this.chatKey++

      // Use nextTick to ensure DOM updates before showing again
      this.$nextTick(() => {
        this.showChat = true
      })
    },
    async fetchUserGroups() {
      try {
        const response = await axios.get(`/api/user/searchDisplayName/${this.$authStore.currentUser.displayName}`,);
        this.userGroups = response.data[0].joinedGroups
        
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    },
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
        moduleName: "",
        teamMembers: [{ name: "" }]
      };
      this.suggestions = [[]];
      this.showSuggestions = [false];
    },
    // Fetch suggestions based on user input
    async fetchSuggestions(query, index) {
      if (query.length < 1) {
        this.suggestions[index] = [];
        return;
      }

      try {
        const response = await axios.get(`/api/user/searchDisplayName/${query}`,);
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
    async addGroup() {
      try {
        // Add group into database
        await axios.post('/api/group/add', this.newModule, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(resp => {

          const groupId = resp.data.data;
          const groupObj = { groupId: groupId, moduleTitle: this.newModule.moduleName }
          this.userGroups.push({ groupId: groupId, moduleTitle: this.newModule.moduleName })
          for (let i = 0; i < this.newModule.teamMembers.length; i++) {
            const member = this.newModule.teamMembers[i];
            // Post request to add the group ID to each team member
            axios.post(`/api/user/addToGroup/${member.name}`, groupObj,
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              });

            console.log(`Added group to member: ${member.name}`);
          }
          axios.post(`/api/user/addToGroup/${this.$authStore.currentUser.displayName}`,groupObj, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

        })
          ;

        //add the group id to all the users in the new module.

        // Proceed to the second request using the retrieved group ID

      }
      catch (err) {
        console.error("Error:", err);
      } finally {
        // Close modal whether requests succeed or fail
        this.closeModal();
      }
    },
    beforeEnter(el) {
      // Called before the entering element is inserted
      console.log('Before enter')
    },
    enter(el, done) {
      // Called when the entering element is inserted
      console.log('Enter')
      done()
    },
    afterEnter(el) {
      // Called when the enter transition finishes
      console.log('After enter')
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
    this.fetchUserGroups();
  }
};

</script>

<template>
  <div class="app-container" :class="{ 'theme-light': !isDarkTheme }">
    <ChatWindow v-if="showChat" :key="chatKey"
                @reinitialize="reinitializeChat" />
    <ToastContainer />
    <div class="layout-wrapper">
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
        <div class="close-button" v-if="isSidebarOpen" @click="toggleSidebar">&times;</div>
        <div class="brand">
          <img src="./assets/logo.svg" alt="CultureOS" class="logo">
          <h1 class="brand-title">SMU Buddy</h1>
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
            <li v-for="group in userGroups">
              <RouterLink :to="'/group/' + group.groupId" class="nav-link"
                :class="{ 'active': $route.path === '/group/' + group.groupId }">
                <!-- <span class="nav-icon">{{ workspace.icon }}</span> -->
                {{ group.moduleTitle }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Theme Toggle -->
        <div class="theme-toggle-wrapper">
          <button @click="toggleTheme" class="theme-toggle">
            <component :is="isDarkTheme ? 'Sun' : 'Moon'" class="icon" />
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
            <!-- <div class="search-container">
              <input type="text" v-model="searchQuery" placeholder="Search" class="search-input">
            </div> -->
          </div>
          <div class="top-nav-right">
            <!-- <div class="team-members">
              <img v-for="member in teamMembers" :key="member.id" :src="member.profilePic"
                :alt="'Team Member ' + member.id" class="team-member-avatar">
              <button class="more-members">+2</button>
            </div> -->
            <AuthDropdown />
          </div>
        </nav>

        <!-- Main Content -->
        <main class="content">
          <!--<RouterView />-->
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="$route.path" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </div>

  <div v-if="isModalOpen" class="modal-overlay">
    <div class="modal-content">
      <h2>Add New Workspace</h2>
      <form @submit.prevent="addGroup" class="workspace-form">

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
.input-wrapper {
  position: relative;
  width: 100%;
}

.input-wrapper input {
  width: 100%;
  padding: 8px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  color: black;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 4px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 10;
}

.suggestions-list li {
  padding: 8px 12px;
  cursor: pointer;
}

.suggestions-list li:hover {
  background-color: #f0f0f0;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transition (alternative) */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* Slide fade transition (combines both) */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>