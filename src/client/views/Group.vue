<template>
  <div class="group-container">
    <!-- Left side: Group Assignments -->
    <div class="group-section">
      <h1 v-if="group && group.length > 0" style="text-align:center;text-decoration: underline">{{ group[0].moduleName +  "(Group "+ group[0].groupId + ")"
        || 'Module name not available' }}
        </h1>
      <h1 v-else>Loading module data...</h1>
      <div class="header">
        </div>
      
      </div>
      <div id="app">
        <div class="task-container">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <h4 style="margin: 0;">Task Lists</h4>
            <button style="margin-bottom: 10px;" @click="openAddTaskModal" class="add-task-button">
              <i class="pi pi-plus"></i> Add Task
            </button>
          </div>

          <table v-if="tasks && tasks.length > 0" class="table">
            <tbody>
              <tr>
                <th>S/N</th>
                <th>Name</th>
                <th>In-Charge</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Functions</th>
              </tr>
              <tr v-for="(task, indx) in tasks" :key="task._id">
                <td
                  :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status, 'completed': task.status }">
                  {{ indx + 1 }}
                </td>
                <td
                  :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status, 'completed': task.status }">
                  <span v-if="!task.isEditing">{{ task.taskName }}</span>
                  <input v-else type="text" v-model="task.taskName" />
                </td>
                <td
                  :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status, 'completed': task.status }">
                  <span v-if="!task.isEditing">{{ task.membersInCharge.join(', ') }}</span>
                  <input v-else type="text" v-model="task.membersInCharge"
                    @input="task.membersInCharge = task.membersInCharge.split(',')"
                    placeholder="Separate names with commas" />
                </td>
                <td
                  :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status, 'completed': task.status }">
                  <span v-if="!task.isEditing">{{ task.deadline }}</span>
                  <input v-else type="date" v-model="task.deadline" />
                </td>
                <td
                  :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status, 'completed': task.status }">
                  <input type="checkbox" v-model="task.status" :disabled="!task.isEditing" />
                </td>
                <td :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status }">
                  <span class="icon-btn edit-icon" v-if="!task.isEditing" @click="enableEditing(task)">
                    <i class="pi pi-pencil" style="color: green;"></i>
                  </span>
                  <span class="icon-btn save-icon" v-else @click="saveChanges(task)">
                    <i class="pi pi-check" style="color: green;"></i>
                  </span>
                  <span class="icon-btn delete-icon" @click="deleteTask(indx)">
                    <i class="pi pi-trash" style="color: red;"></i>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <h2 v-else>No tasks yet</h2>

        </div>
      </div>
    </div>
</template>

<script>
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import axios from 'axios';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';

export default {
  name: 'GroupView',
  data() {
    return {
      suggestions: [],
      showSuggestions: [],
      tasks: [],
      groupId: '',
      group: null,
      newTask: {
        taskName: '',
        membersInCharge: [{ name: '' }],
        deadline: '',
        status: false
      },
      messages: [],
      newMessage: '',
      isMinimized: false,
      MAX_MESSAGE_LENGTH: 500,
      connectionEstablished: false,
      isLoggedIn: true,
      router: null,
      groupSocket: io(),
      flatpickrInstance: null,
      room: null,
    };
  },
  created() {
    this.isLoggedIn = this.$authStore.checkAuth();
    const route = useRoute();
    this.groupId = route.params.groupId;
    this.router = useRouter();
  },
  mounted() {
    this.fetchGroupData();
    this.fetchTaskData();
    this.setupSocketListeners();
  },
  beforeUnmount() {
    this.cleanupSocketListeners();
    // this.destroyFlatpickr();
  },
  watch: {
    '$route.params.groupId': {
      handler(newGroupId) {
        this.groupId = newGroupId;
        this.fetchGroupData();
      },
      immediate: true
    },

    isLoggedIn: {
      handler(isLoggedIn) {
        if (isLoggedIn) {
        } else {
          this.tasks = []
          this.gorups = null
          this.$router.push('/login');
        }
      },
      immediate: true,
    }
  },
  methods: {
    async showLeaveGroupModal() {
      const result = await this.$swal.fire({
        title: 'Leave Group',
        text: `Are you sure you want to leave "${this.group[0].moduleName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Leave'
      });

      if (result.isConfirmed) {
        axios.delete(`/api/group/leavegroup/${this.group[0].groupId}`).then((response) => {
          this.$toast.fire({
            icon: 'info',
            title: 'You left the group',
          });
          this.router.push('/dashboard');
        }).catch(error => {
          console.log(error)
          this.$toast.fire({
            icon: 'error',
            title: 'Error leaving group',
          });
        })
      }
    },
    isDeadlineApproaching(deadline) {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(today.getDate() + 7);
      oneWeekFromNow.setHours(0, 0, 0, 0);
      // Debugging output to check the difference in days
      const daysUntilDeadline = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
      // Check if the deadline is within the next week
      return daysUntilDeadline < 7;
    },

    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.room._id);
        this.$swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'ID Copied!',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (err) {
        if (err.message === "navigator.clipboard is undefined") {
          this.$swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Unable to copy',
            text: 'We do not have enough permissions for "click to copy", please copy manually.',
            showConfirmButton: false,
            timer: 3000
          });
        }
      }
    },

    async openAddTaskModal() {
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
        title: 'Add New Task',
        html: `
      <form id="task-form" class="task-form">
        <div class="form-section">
          <label class="form-label" for="task-name">
            Task Name
            <span class="required">*</span>
          </label>
          <input
            id="task-name"
            class="swal2-input custom-input"
            placeholder="Enter task name"
            value="${this.newTask.taskName || ''}">
        </div>

        <div class="form-section">
              <div class="section-header">
                <label class="form-label">
                  Team Members
                  <span class="required">*</span>
                </label>
              </div>
        <div id="team-members-container" class="team-members-container">
                ${this.newTask.membersInCharge.map((member, index) => `
                  <div class="member-input-group" data-index="${index}">
                    <div class="input-wrapper">
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
        <div class="form-section text-center d-flex flex-column g-0">
          <label class="form-label d-flex text-center" for="deadline">
            Deadline
            <span class="required">*</span>
          </label>
          <input
            id="deadline"
            type="text"
            class="swal2-input custom-input d-flex text-center flatpickr-input"
            placeholder="Select deadline"
            value="${this.newTask.deadline || ''}"
            readonly
          >
        </div>
      </form>
    `,
        showCancelButton: true,
        confirmButtonText: 'Add Task',
        cancelButtonText: 'Cancel',
        customClass,

        didOpen: () => {
          // Initialize 
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
          const deadlineInput = document.getElementById('deadline');
          const fp = flatpickr(deadlineInput, {
            enableTime: false,
            dateFormat: "Y-m-d",
            minDate: "today",
            onChange: (selectedDates) => {
              if (selectedDates[0]) {
                deadlineInput.value = selectedDates[0].toISOString().split('T')[0];
              }
            }
          });
          // Function to handle suggestions
          document.querySelectorAll('.team-member-input').forEach(input => {
            this.setupInputListeners(input);
          });
          // Display suggestions in dropdown
        },
        preConfirm: () => {
          const taskName = document.getElementById('task-name').value;
          const deadline = document.getElementById('deadline').value;
          const membersInCharge = Array.from(document.querySelectorAll('.team-member-input'))
            .map(input => ({ name: input.value }))
            .filter(member => member.name.trim() !== '');

          if (!taskName) {
            this.$swal.showValidationMessage('Please enter a task name');
            return false;
          }

          if (membersInCharge.length === 0) {
            this.$swal.showValidationMessage('Please add at least one team member');
            return false;
          }

          if (!deadline) {
            this.$swal.showValidationMessage('Please select a deadline');
            return false;
          }

          return { taskName, membersInCharge, deadline };
        }
      });

      if (result.isConfirmed) {
        this.newTask.taskName = result.value.taskName;
        this.newTask.membersInCharge = result.value.membersInCharge;
        this.newTask.deadline = result.value.deadline;
        await this.addTask();
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
    },
    generateUniqueTaskId(taskIdList) {
      let newTaskId;
      do {
        newTaskId = `t${Math.floor(Math.random() * 100)}`;
      } while (taskIdList.includes(newTaskId));
      return newTaskId;
    },
    async addTask() {
      const taskIdList = await axios.get('/api/task')
        .then(response => response.data.data.map(task => task.taskId))
        .catch(error => {
          console.error("Error fetching tasks:", error);
          return [];
        });
      this.newTask.taskId = this.generateUniqueTaskId(taskIdList)
      this.newTask.groupId = this.groupId
      this.tasks.push(this.newTask)
      this.newTask.membersInCharge = this.newTask.membersInCharge.map(member => member.name.trim())
      try {
        await axios.post('/api/task/add', this.newTask, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        this.$toast.fire({
          icon: 'success',
          title: 'Task Created!',
        })
      } catch (error) {
        console.error('Error adding workspace:', error);
      }
    },
    enableEditing(task) {
      task.isEditing = true;
    },
    async saveChanges(task) {
      task.isEditing = false;
      try {
        await axios.post(`/api/task/updateBy/${task._id}`, {
          taskName: task.taskName,
          membersInCharge: task.membersInCharge,
          deadline: task.deadline,
          status: task.status
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error updating task:', error);
      }
    },
    async deleteTask(index) {
      const taskId = this.tasks[index].taskId;
      try {
        const response = await axios.delete(`/api/task/delete/${taskId}`);
        if (response.status === 200) {
          this.tasks.splice(index, 1);

          this.$toast.fire({
            icon: 'success',
            title: 'Task Deleted!',
          })
        } else {

          this.$toast.fire({
            icon: 'error',
            title: 'Failed to delete task',
          })
        }
      } catch (error) {

        this.$toast.fire({
          icon: 'error',
          title: 'Failed to delete task',
        })
      }
    },
    async fetchGroupData() {
      try {
        const response = await axios.get(`/api/group/${this.groupId}`);
        this.group = response.data.data;
        this.room = response.data.room;
      } catch (error) {
        console.error('Failed to fetch group data:', error);
      }
    },
    async fetchTaskData() {
      try {
        const resp = await axios.get(`/api/task/getBy/${this.groupId}`);
        this.tasks = resp.data.data;
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.warn("No tasks found for this group."); // Gracefully handle 404
          this.tasks = []; // Set tasks to an empty array if no tasks are found
        } else if (err.response) {
          console.error(`Error ${err.response.status}: ${err.response.statusText}`);
        } else {
          console.error("An error occurred:", err.message); // Handle network or other errors
        }
      }
    },
    setupSocketListeners() {
      this.groupSocket.on('connect', () => {
        this.connectionEstablished = true;
        this.groupSocket.emit('join-room')
      });
      this.groupSocket.on('previous-messages', ({ messages }) => {
        this.messages = messages;
        this.$nextTick(this.scrollToBottom);
      });
      this.groupSocket.on('new-message', (message) => {
        this.messages.push(message);
        this.$nextTick(this.scrollToBottom);
      });
    },
    cleanupSocketListeners() {
      this.groupSocket.off('connect');
      this.groupSocket.off('previous-messages');
      this.groupSocket.off('new-message');
    },
    sendMessage() {
      if (!this.newMessage.trim() || !this.isLoggedIn) return;
      if (this.newMessage.length > this.MAX_MESSAGE_LENGTH) {
        this.showError(`Message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`);
        return;
      }
      this.groupSocket.emit('chat-message', {
        roomId: this.groupId,
        message: this.newMessage
      });
      this.newMessage = '';
    },
    handleLarge(event) {
      event.preventDefault();
      const pastedText = event.clipboardData.getData('text');
      const currentPosition = event.target.selectionStart;
      const currentValue = this.newMessage;
      const remainingSpace = this.MAX_MESSAGE_LENGTH - (currentValue.length - (event.target.selectionEnd - currentPosition));
      const trimmedText = pastedText.slice(0, remainingSpace);
      this.newMessage = currentValue.slice(0, currentPosition) +
        trimmedText +
        currentValue.slice(event.target.selectionEnd);
      if (pastedText.length > remainingSpace) {
        this.showError(`Pasted text was trimmed to fit ${this.MAX_MESSAGE_LENGTH} character limit`);
      }
    },
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
    },
    formatTime(timestamp) {
      const messageDate = new Date(timestamp);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const yesterdayMidnight = new Date(todayMidnight);
      yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
      const getTimeString = (date) => {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      if (messageDate >= todayMidnight) {
        return `Today at ${getTimeString(messageDate)}`;
      }
      if (messageDate >= yesterdayMidnight) {
        return `Yesterday at ${getTimeString(messageDate)}`;
      }
      return messageDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) + ` at ${getTimeString(messageDate)}`;
    },
    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
      }
    },
    showError(message) {
      console.error(message);
    },
  }
};
</script>

<style scoped>
/* Center the layout */
#app {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 0;
  margin: 0;
}

/* Container for task list header and button */
.task-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  /* Ensure the container takes full width */
  padding: 0;
}


/* Center and expand the table */
.table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  overflow: hidden;
  margin: 0;
  border: lightgrey 1px solid;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
}

/* Table cell styles for text wrapping and spacing */
.table th,
.table td {
  padding: 0.5rem;
  text-align: center;
  vertical-align: middle;
  word-wrap: break-word;
  white-space: normal;
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Remove any white space around table in container */
.table-container {
  width: 100%;
  padding: 0;
  margin: 0;
}


/* Button styling */
.table .btn {
  width: 80px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 7.5px;
  font-size: 0.9em;
  border-radius: 4px;
  margin-left: 10px;
  /* Remove any default margin */
}

/* Add Task button styling */
.add-task-button {
  margin-top: 15px;
  padding: 10px 20px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.add-task-button:hover {
  background-color: #5548cc;
}

/* Modal overlay styling */
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

/* Modal content styling */
.modal-content {
  background: grey;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
}

/* Responsive adjustments */
@media (max-width: 767.98px) {

  .table th,
  .table td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .add-task-button,
  .btn,
  .form-select,
  textarea {
    min-height: 44px;
  }

  /* Button styling adjustments */
  .btn-group {
    gap: 0.5rem;
  }

  .form-select-sm {
    padding: 0.25rem 2rem 0.25rem 0.5rem;
    background-position: right 0.5rem center;
    max-width: 200px;
    border-color: #dee2e6;
    background-color: #fff;
  }

  /* Card style for table container in mobile */
  /* .table-container {
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1rem;
  } */

  .card-subtitle,
  .card-text {
    font-size: 0.875rem;
    transition: all 0.2s ease-in-out;
  }
}

/* Expansion animation */
.expand-animation {
  animation: expand 0.3s ease-out forwards;
  transform-origin: top;
}

@keyframes expand {
  0% {
    max-height: 0;
    transform: scaleY(0);
  }

  100% {
    max-height: 100px;
    transform: scaleY(1);
  }
}

.expand-animation>* {
  animation: maintainScale 0.3s ease-out forwards;
}

@keyframes maintainScale {
  0% {
    transform: scaleY(0);
  }

  100% {
    transform: scaleY(1);
  }
}

.completed {
  color: grey;
}

.highlight-row {
  background-color: #ffe2e2;
  /* Light yellow background */
  color: black;
  transition: background-color 0.3s ease;
  font-weight: bold;
}

.icon-btn:hover {
  cursor: pointer;
  display: inline-block;
  /* Ensures the transform will apply properly */
  transform: scale(1.5);
  /* Scale 1.5 times its original size */
  transform-origin: center;
  /* Scale from the center */
}

.icon-btn.edit-icon {
  padding-right: 8px; /* Adjust padding as needed */
}

.icon-btn.save-icon {
  padding-right: 8px; /* Adjust padding as needed */
}
</style>
