<template>
  <div class="group-container">
    <!-- Left side: Group Assignments -->
    <div class="group-section">
      <h1 v-if="group && group.length > 0">Module Name: {{ group[0].moduleName || 'Module name not available' }}</h1>
      <h1 v-else>Loading module data...</h1>
      <div class="header">
        <h2 v-if="group && group.length > 0">Group Number: {{ group[0].groupId || 'Module name not available' }}</h2>
        <h2 v-else>Loading module data...</h2>
      </div>
      <div id="app">
        <div class="task-container">
          <h2>Task Lists</h2>
          <table v-if="tasks && tasks.length > 0" class="table">
            <tbody>
              <tr>
                <th>S/N</th>
                <th>Name</th>
                <th>Members in Charge</th>
                <th>Deadline</th>
                <th>Done</th>
                <th>Functions</th>
              </tr>
              <tr v-for="(task, indx) in tasks" :key="task._id">
                <td :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status }">{{ indx + 1 }}</td>
                <td :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status }">
                  <span v-if="!task.isEditing">{{ task.taskName }}</span>
                  <input v-else type="text" v-model="task.taskName" />
                </td>
                <td :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status }">
                  <span v-if="!task.isEditing">{{ task.membersInCharge.join(', ') }}</span>
                  <input v-else type="text" v-model="task.membersInCharge"
                    @input="task.membersInCharge = task.membersInCharge.split(',')"
                    placeholder="Separate names with commas" />
                </td>
                <td :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status }">
                  <span v-if="!task.isEditing">{{ task.deadline }}</span>
                  <input v-else type="date" v-model="task.deadline" />
                </td>
                <td :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status }">
                  <input type="checkbox" v-model="task.status" :disabled="!task.isEditing" />
                </td>
                <td :class="{ 'highlight-row': isDeadlineApproaching(task.deadline) && !task.status }">
                  <button v-if="!task.isEditing" @click="enableEditing(task)" class="btn btn-sm btn-primary">
                    Update
                  </button>
                  <button v-else @click="saveChanges(task)" class="btn btn-sm btn-success">
                    Save
                  </button>
                  <button @click="deleteTask(indx)" class="btn btn-sm btn-danger">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <h2 v-else>No tasks yet</h2>
          <button @click="openAddTaskModal" class="add-task-button">Add New Task</button>
        </div>
      </div>
    </div>

<div v-if="showAddTaskModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Add New Task</h2>
        <form>
          <label>
            Task Name:
            <input type="text" v-model="newTask.taskName" required />
          </label>
          <h3>Team Members</h3>
          <div v-for="(member, index) in newTask.membersInCharge" :key="index" class="team-member-row">
            <label>
              Team Member:
              <div class="input-wrapper">
                <input type="text" v-model="member.name" @input="fetchMemberSuggestions(member.name, index)"
                  @focus="showSuggestions[index] = true" @blur="closeSuggestions(index)"
                  placeholder="Type to search team members" required />
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
          
          <div class="form-section">
            <label class="form-label">
              Deadline
              <span class="required">*</span>
            </label>
            <div class="input-group">
              <input 
                ref="flatpickrInput"
                type="text" 
                class="form-control flatpickr-input" 
                placeholder="Select deadline"
                :value="newTask.deadline"
                @input="updateDeadline"
              />
              <div class="input-group-append">
                <button class="btn btn-outline-secondary calendar-button" type="button" @click="openDatePicker">
                  <i class="fas fa-calendar"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="modal-buttons">
            <button type="submit" @click.prevent="addTask" class="btn btn-primary">Add Task</button>
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
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
      showAddTaskModal: false,
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
    this.destroyFlatpickr();
  },
  watch: {
    '$route.params.groupId': {
      handler(newGroupId) {
        this.groupId = newGroupId;
        this.fetchGroupData();
      },
      immediate: true
    },
    showAddTaskModal(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          this.initFlatpickr();
        });
      } else {
        this.destroyFlatpickr();
      }
    },
    isLoggedIn: {
      handler(isLoggedIn) {
        if (isLoggedIn) {
          this.fetchGroupData();
          this.fetchTaskData();
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
          <label class="form-label">Team members</label>
          <div id="team-members-container" class="team-members-container">
            ${this.newTask.membersInCharge.map((member, index) => `
              <div class="member-input-group">
                <div class="input-wrapper">
                  <input data-index="${index}"
                    type="text"
                    class="swal2-input custom-input team-member-input"
                    placeholder="Type to search team members"
                    style="width:300px; margin-right: 0"
                    value="${member.name || ''}"
                  >
                  <button type="button" class="action-button remove-button remove-member btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.6667 8L3.33333 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                  <ul class="suggestions-list dropdown" id="suggestions-${index}" style="display: none;"></ul>
                </div>
              </div>
            `).join('')}
          </div>
          <button type="button" id="add-member" class="action-button add-button" style="text-align: left;">
            Add Team Member
          </button>
        </div>

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
          // Initialize Flatpickr
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

          const removeMemberInput = (memberDiv) => {
            if (memberDiv) {
              memberDiv.remove();
            }
          };
          // Function to handle suggestions
          const fetchSuggestions = async (query, index) => {
            if (!query) return;
            try {
              const response = await axios.get(`/api/user/searchDisplayName/${query}`);
              const suggestions = response.data;
              displaySuggestions(suggestions, index);
            } catch (error) {
              console.error("Error fetching suggestions:", error);
            }
          };

          // Display suggestions in dropdown
          const displaySuggestions = (suggestions, index) => {
            const suggestionsList = document.getElementById(`suggestions-${index}`);
            if (!suggestionsList) {
              console.warn(`Suggestions list with id "suggestions-${index}" not found.`);
              return;
            }

            suggestionsList.innerHTML = '';
            if (suggestions.length) {
              suggestionsList.style.display = 'block';
              suggestions.forEach((suggestion) => {
                const listItem = document.createElement('li')
                listItem.classList.add('suggestion-item');
                listItem.style = "background: black;"
                listItem.textContent = suggestion.displayName;
                listItem.onclick = () => selectSuggestion(suggestion, index);
                suggestionsList.appendChild(listItem);
              });
            } else {
              suggestionsList.style.display = 'none';
            }
          };

          // Select suggestion and close dropdown
          const selectSuggestion = (suggestion, index) => {
            // Select the input field by data index
            const inputField = document.querySelector(`[data-index="${index}"]`);
            if (inputField) {
              // Set the input field value to the selected suggestion
              inputField.value = suggestion.displayName;

              // Trigger an input event to ensure Vue detects the change
              inputField.dispatchEvent(new Event('input', { bubbles: true }));

              // Hide the suggestions list for this input
              const suggestionsList = document.getElementById(`suggestions-${index}`);
              if (suggestionsList) {
                suggestionsList.style.display = 'none';
              }
            } else {
              console.error(`Input field with data-index "${index}" not found.`);
            }
          };

          // Event listener for each input to fetch suggestions
          document.querySelectorAll('.team-member-input').forEach((input) => {
            const index = input.getAttribute('data-index');
            input.addEventListener('keyup', () => fetchSuggestions(input.value, index));
          });

          // Add new team member input
          document.getElementById('add-member').addEventListener('click', () => {
            const container = document.getElementById('team-members-container');
            const index = container.children.length;
            const newMemberDiv = document.createElement('div');
            newMemberDiv.innerHTML = `
          <div class="input-wrapper">
            <input
              type="text"
              class="swal2-input custom-input team-member-input"
              placeholder="Type to search team members"
                        style="width:300px; margin-right: 0"
              data-index="${index}"
              style="text-align: left;"
            >
                <button type="button" class="action-button remove-button remove-member">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.6667 8L3.33333 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
            <ul class="suggestions-list" id="suggestions-${index}" style="display: none;"></ul>
          </div>
        `;
            container.appendChild(newMemberDiv);

            // Set up suggestion listener for new input
            const newInput = newMemberDiv.querySelector('.team-member-input');
            newInput.addEventListener('keyup', () => fetchSuggestions(newInput.value, index));

            const newRemoveButton = newMemberDiv.querySelector('.remove-member');
            newRemoveButton.addEventListener('click', () => removeMemberInput(newMemberDiv));
          });

          // Remove team member input
          document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-member')) {
              e.target.closest('.member-input-group').remove();
            }
          });
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
    addTeamMember() {
      this.newTask.membersInCharge.push({ name: "" });
      this.suggestions.push([]);
      this.showSuggestions.push(false);
    },
    removeTeamMember(index) {
      this.newTask.membersInCharge.splice(index, 1);
      this.suggestions.splice(index, 1);
      this.showSuggestions.splice(index, 1);
    },
    async fetchMemberSuggestions(query, index) {
      if (query.length < 1) {
        this.suggestions[index] = [];
        return;
      }
      try {
        const response = await axios.get(`/api/user/searchDisplayName/${query}`,);
        this.suggestions[index] = response.data;
        this.showSuggestions[index] = true;
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    },
    selectSuggestion(index, suggestion) {
      this.newTask.membersInCharge[index].name = suggestion.displayName;
      this.showSuggestions[index] = false;
    },
    closeSuggestions(index) {
      setTimeout(() => {
        this.showSuggestions[index] = false;
      }, 100);
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
      } catch (error) {
        console.error('Error adding workspace:', error);
      }
      this.closeModal()
    },
    openModal() {
      this.showAddTaskModal = true;
    },
    closeModal() {
      this.showAddTaskModal = false;
      this.resetNewTask();
      this.destroyFlatpickr();
      
    },
    resetNewTask() {
      this.newTask = {
        taskName: '',
        membersInCharge: [{ name: '' }],
        deadline: '',
        status: false
      };
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
        } else {
          console.error("Failed to delete task:", response.data.message);
        }
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    },
    async fetchGroupData() {
      try {
        const response = await axios.get(`/api/group/${this.groupId}`);
        this.group = response.data.data;
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
}

/* Table cell styles for text wrapping and spacing */
.table th,
.table td {
  padding: 0.5rem;
  text-align: left;
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
</style>
