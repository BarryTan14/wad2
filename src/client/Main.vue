<script>
import {RouterLink, RouterView} from 'vue-router'
import {Menu, Moon, Sun} from 'lucide-vue-next'
import './assets/styles.css'
import ChatWindow from './components/ChatWindow.vue'
import AuthDropdown from './components/AuthDropdown.vue'


export default {
  name: 'Main',

  components: {
    ChatWindow,
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
        teamMembers: [{name: ''}],
        // Initial team member input
      },
      isDarkTheme: false,
      isSidebarOpen: false,
      searchQuery: '',
      navigationRoutes: [
        {path: '/dashboard', name: 'Dashboard', icon: 'pi pi-chart-bar'},
        {path: '/transcribe', name: 'Class Participation', icon: 'pi pi-users'},
        {path: '/calendaremailview', name: 'Event Planner', icon: 'pi pi-calendar'}
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
        {id: 1, profilePic: '/profilepicture/avatar.png'},
        {id: 2, profilePic: '/profilepicture/avatar.png'},
        {id: 3, profilePic: '/profilepicture/avatar.png'}
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
      this.setCookie('darkTheme', this.isDarkTheme ? 'true' : 'false', 365);
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
      this.newModule.teamMembers.push({name: ""});
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
        teamMembers: [{name: ""}]
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
        }).then(async resp => {

          const groupId = resp.data.data;
          const groupObj = {groupId: groupId, moduleTitle: this.newModule.moduleName}
          this.userGroups.push({groupId: groupId, moduleTitle: this.newModule.moduleName})
          for (let i = 0; i < this.newModule.teamMembers.length; i++) {
            console.log(this.newModule.teamMembers[i])
            const member = this.newModule.teamMembers[i];
            // Post request to add the group ID to each team member
            await axios.post(`/api/user/addToGroup/${member.name}`, groupObj,
                {
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

            console.log(`Added group to member: ${member.name}`);
          }
          await axios.post(`/api/user/addToGroup/${this.$authStore.currentUser.displayName}`, groupObj, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          this.$socket.emit('create-room-group',
              {
                name: this.newModule.moduleName,
                description: this.newModule.moduleName + ' Chatroom',
              }, resp.data.uId)
        })

        this.$toast.fire({
          icon: 'success',
          title: 'Group Created!',
        })
      } catch (err) {
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
    },
    async openSwalModal() {
      const customClass = {
        container: 'custom-swal-container',
        popup: 'custom-swal-popup',
        header: 'custom-swal-header',
        title: 'custom-swal-title',
        closeButton: 'custom-swal-close',
        content: 'custom-swal-content',
        input: 'custom-swal-input',
        actions: 'custom-swal-actions',
        confirmButton: 'custom-swal-confirm',
        cancelButton: 'custom-swal-cancel',
      };

      const result = await this.$swal.fire({
        title: 'Create New Group',
        html: `
          <form id="workspace-form" class="workspace-form">
            <div class="form-section">
              <label class="form-label" for="module-title">
                Module Title
                <span class="required">*</span>
              </label>
              <input
                id="module-title"
                class="swal2-input custom-input"
                placeholder="Enter module title"
                value="${this.newModule.moduleName || ''}"
              >
            </div>

            <div class="form-section">
              <div class="section-header">
                <label class="form-label">
                  Team Members
                  <span class="required">*</span>
                </label>
              </div>

              <div id="team-members-container" class="team-members-container">
                ${this.newModule.teamMembers.map((member, index) => `
                  <div class="member-input-group" data-index="${index}">
                    <div class="input-wrapper">
                      <input
                        type="text"
                        class="swal2-input custom-input team-member-input"
                        placeholder="Search"
                        style="width:300px; margin-right: 0"
                        value="${member.name}"
                        data-index="${index}"
                      >
                        <button type="button" class="action-button remove-button remove-member">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.6667 8L3.33333 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </button>
                    </div>
                  </div>
                `).join('')}
              </div>

                <button type="button" id="add-member" class="action-button add-button">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.33334V12.6667" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M12.6667 8L3.33333 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Add Member
                </button>
            </div>
          </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Group',
        cancelButtonText: 'Cancel',
        customClass,
        didOpen: () => {
          // Add custom styles

          // Add member button handler
          document.getElementById('add-member').addEventListener('click', () => {
            const container = document.getElementById('team-members-container');
            const newIndex = container.children.length;
            const newMemberDiv = document.createElement('div');
            newMemberDiv.className = 'member-input-group';
            newMemberDiv.setAttribute('data-index', newIndex);
            newMemberDiv.innerHTML = `
              <div class="input-wrapper">
                <input
                  type="text"
                  class="swal2-input custom-input team-member-input"
                  placeholder="Search"
                        style="width:300px; margin-right: 0"
                  data-index="${newIndex}"
                >
                <button type="button" class="action-button remove-button remove-member">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.6667 8L3.33333 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            `;
            container.appendChild(newMemberDiv);
            this.setupInputListeners(newMemberDiv.querySelector('.team-member-input'));
          });

          // Remove member button handler
          document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-member')) {
              e.target.closest('.member-input-group').remove();
            }
          });

          // Setup input listeners for autocomplete
          document.querySelectorAll('.team-member-input').forEach(input => {
            this.setupInputListeners(input);
          });
        },
        preConfirm: () => {
          const moduleTitle = document.getElementById('module-title').value;
          const teamMembers = Array.from(document.querySelectorAll('.team-member-input'))
              .map(input => ({name: input.value}))
              .filter(member => member.name.trim() !== '');

          if (!moduleTitle) {
            this.$swal.showValidationMessage('Please enter a module title');
            return false;
          }

          if (teamMembers.length === 0) {
            this.$swal.showValidationMessage('Please add at least one team member');
            return false;
          }

          return {moduleTitle, teamMembers};
        }
      });

      if (result.isConfirmed) {
        this.newModule.moduleName = result.value.moduleTitle;
        this.newModule.teamMembers = result.value.teamMembers;
        await this.addGroup();
      }
    },
    setupInputListeners(input) {
      let suggestionsDiv;

      input.addEventListener('input', async () => {
        const query = input.value;

        if (query.length < 1) {
          if (suggestionsDiv) suggestionsDiv.remove();
          return;
        }

        try {
          const response = await axios.get(`/api/user/searchDisplayName/${query}`);

          // Remove existing suggestions
          if (suggestionsDiv) suggestionsDiv.remove();

          // Find the Swal modal container - using more reliable selectors
          const modalContainer = document.querySelector('.swal2-html-container');
          if (!modalContainer) return; // Exit if modal isn't available

          // Create new suggestions div
          suggestionsDiv = document.createElement('div');
          suggestionsDiv.className = 'suggestions-dropdown';

          // Calculate position relative to input
          const inputRect = input.getBoundingClientRect();

          // Position the suggestions div
          suggestionsDiv.style.cssText = `
          position: fixed;
          top: ${inputRect.bottom + window.scrollY}px;
          left: ${inputRect.left}px;
          width: ${inputRect.width}px;
          max-height: 200px;
          overflow-y: auto;
          background: var(--dropdown-bg, white);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 99999;
        `;

          // Append to body
          document.body.appendChild(suggestionsDiv);

          // Add suggestions
          response.data.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion.displayName;
            item.addEventListener('click', () => {
              input.value = suggestion.displayName;
              suggestionsDiv.remove();
            });
            suggestionsDiv.appendChild(item);
          });

          // Adjust dropdown position if it goes below viewport
          const dropdownRect = suggestionsDiv.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          if (dropdownRect.bottom > viewportHeight) {
            const topPosition = inputRect.top - dropdownRect.height + window.scrollY;
            suggestionsDiv.style.top = `${topPosition}px`;
          }

          // Handle window scroll and resize
          const updatePosition = () => {
            if (suggestionsDiv) {
              const newInputRect = input.getBoundingClientRect();
              suggestionsDiv.style.top = `${newInputRect.bottom + window.scrollY}px`;
              suggestionsDiv.style.left = `${newInputRect.left}px`;
            }
          };

          window.addEventListener('scroll', updatePosition, true);
          window.addEventListener('resize', updatePosition);

          // Cleanup event listeners when suggestions are removed
          const originalRemove = suggestionsDiv.remove.bind(suggestionsDiv);
          suggestionsDiv.remove = () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            originalRemove();
          };

        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      });

      // Close suggestions when clicking outside
      const handleOutsideClick = (e) => {
        if (suggestionsDiv && e.target !== input && !suggestionsDiv.contains(e.target)) {
          suggestionsDiv.remove();
        }
      };

      document.addEventListener('click', handleOutsideClick);

      // Handle Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape' && suggestionsDiv) {
          suggestionsDiv.remove();
        }
      };

      document.addEventListener('keydown', handleEscape);

      // Clean up on modal close
      const cleanupModal = () => {
        if (suggestionsDiv) suggestionsDiv.remove();
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };

      // Watch for modal close
      const modalElement = document.querySelector('.swal2-popup');
      if (modalElement) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              if (!modalElement.classList.contains('swal2-show')) {
                cleanupModal();
                observer.disconnect();
              }
            }
          });
        });

        observer.observe(modalElement, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
    },
    setCookie(name, value, days) {
      var expires = "";
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "") + expires + "; path=/";
    },
    getCookie(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    },
    eraseCookie(name) {
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },
  },

  // Save theme preference
  watch: {
    isDarkTheme: {
      handler(newValue) {
        localStorage.setItem('theme', newValue ? 'dark' : 'light')
      },
      immediate: true
    },
    $route(to, from) {
      this.fetchUserGroups();
    },
  },

  // Load saved theme preference
  created() {
    this.isDarkTheme = this.getCookie('darkTheme') !== null ? this.getCookie('darkTheme') === 'true' : false;
    const savedTheme = localStorage.getItem('theme')

    document.body.setAttribute('data-bs-theme', this.isDarkTheme ? 'dark' : 'light')
    /*if (this.isDarkTheme) {
      this.isDarkTheme = savedTheme === 'dark'
      document.body.setAttribute('data-bs-theme', savedTheme)
    }*/
    this.fetchUserGroups();
  }
};

</script>

<template>
  <ChatWindow v-if="showChat" :key="chatKey" @reinitialize="reinitializeChat"/>
  <div class="layout-wrapper" :class="{ 'theme-light': !isDarkTheme }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <div class="close-button" v-if="isSidebarOpen" @click="toggleSidebar">&times;</div>
      <div class="brand">
        <img src="/circledlogo.svg" alt="SMU Buddy" class="logo">
        <h1 class="brand-title">SMU Buddy</h1>
      </div>

      <!-- Main Navigation -->
      <nav class="main-nav">
        <ul class="nav-list">
          <li v-for="route in navigationRoutes" :key="route.path">
            <RouterLink :to="route.path" class="nav-link" :class="{ 'active': $route.path === route.path }">
              <i :class="route.icon"></i>
              {{ route.name }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- Workspaces -->
      <div class="workspaces">
        <h2 class="section-title"
            style="display: flex; align-items: center; justify-content: space-between; padding: 5px 0;">
          <span style="font-weight: bold; font-size: 1.5rem;">Groups</span>
          <button class="add-btn"
                  style="color: var(--bs-purple);background-color:transparent; padding: 8px 16px; font-size: 1rem; margin: 0; border-radius: 8px;  border: solid 1px var(--bs-purple);"
                  @click="openSwalModal">
            Add <i class="fa fa-plus"></i>
          </button>
        </h2>
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
        <!-- <button @click="toggleTheme" class="theme-toggle">
          <component :is="isDarkTheme ? 'Sun' : 'Moon'" class="icon"/>
          <span>{{ isDarkTheme ? 'Light' : 'Dark' }} Mode</span>
        </button> -->
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-area">
      <!-- Top Navigation -->
      <nav class="top-nav">
        <div class="top-nav-left">
          <button @click="toggleSidebar" class="menu-button">
            <Menu class="icon"/>
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
          <AuthDropdown/>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="content">
        <!--<RouterView />-->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.path"/>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
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

.add-btn:hover {
  background-color: var(--bs-purple) !important;
  color: white !important;
}

</style>