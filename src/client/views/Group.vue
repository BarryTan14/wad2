<template>
  <div class="group-container">
    <!-- Left side: Group Assignments -->
    <div class="group-section">
      <h1 v-if="group && group.length > 0" class="card-title">{{ group[0].moduleName || 'Module name not available' }}
      </h1>
      <h1 v-else>Loading module data...</h1> <!-- Fallback if data is not yet available -->
      <div class="header">
        <h3 v-if="group && group.length > 0" class="card-title">Group {{ group[0].groupId || 'Module name not available'
          }}</h3>
        <h3 v-else>Loading module data...</h3> <!-- Fallback if data is not yet available -->
      </div>
      <div id="app">
        <h2>Task Lists</h2>
        <button @click="openModal">Add New Task</button>
        <table v-if="tasks && tasks.length > 0" class="table m-2">
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
            <td>{{ indx + 1 }}</td>
            <td>
              <input type="text" v-model="task.taskName" :readonly="!task.isEditing" />
            </td>

            <!-- Members in Charge Field: Editable if isEditing is true -->
            <td>
              <input type="text" v-model="task.membersInCharge" :readonly="!task.isEditing"
                @input="task.membersInCharge = task.membersInCharge.split(',')"
                placeholder="Separate names with commas" />
            </td>

            <!-- Deadline Field: Editable if isEditing is true -->
            <td>
              <input type="date" v-model="task.deadline" :readonly="!task.isEditing" />
            </td>

            <!-- Checkbox for Completion Status: Always Editable -->
            <td><input type="checkbox" v-model="task.status" :disabled="!task.isEditing" /></td>

            <!-- Update/Save and Delete Buttons -->
            <td>
              <button v-if="!task.isEditing" @click="enableEditing(task)" class="btn btn-sm btn-primary">Update</button>
              <button v-else @click="saveChanges(task)" class="btn btn-sm btn-success">Save</button>
              <button @click="deleteTask(indx)" class="btn btn-sm btn-danger">Delete</button>
            </td>
          </tr>
          </tbody>
        </table>
        <h1 v-else>No tasks yet</h1>
      </div>

    </div>

    <!-- Right side: Chat Window -->
    <!-- <div class="chat-section">
      <div
          v-if="isLoggedIn"
          class="chat-container"
      >
        <div class="chat-header bg-primary d-flex justify-content-between align-items-center">
          <h3 class="chat-title mb-0">Group Chat</h3>
          <button
              @click="toggleMinimize"
              class="btn minimize-btn px-3 rounded-start-0 rounded-end-3 rounded-bottom-0"
          >
            {{ isMinimized ? '^' : 'v' }}
          </button>
        </div>

        <div v-if="!isMinimized" class="chat-content">
          <div class="messages-container" ref="messagesContainer">
            <div v-for="msg in messages" :key="msg._id" class="message-item">
               Profile picture column
              <div class="avatar">
                <img
                    :src="'/profilepicture/' + msg.saidBy.profilePic"
                    class="profile-pic cursor-pointer"
                    alt="avatar"
                    @click="router.push('/profile/'+msg.saidBy._id)"
                >
              </div>

              Message content column 
              <div class="message-content">
                <div class="message-header">
                  <a
                      @click="router.push('/profile/'+msg.saidBy._id)"
                      class="display-name cursor-pointer"
                  >
                    {{ msg.saidBy.displayName }}
                  </a>
                  <small class="timestamp">{{ formatTime(msg.createdAt) }}</small>
                </div>
                <div class="message-text">{{ msg.message }}</div>
              </div>
            </div>
          </div>

          <div class="input-container">
            <div class="input-wrapper">
              <input
                  v-model="newMessage"
                  @keyup.enter="sendMessage"
                  @paste="handleLarge"
                  placeholder="Type a message..."
                  type="text"
                  :maxlength="MAX_MESSAGE_LENGTH"
                  class="message-input"
              >
              <button @click="sendMessage" class="send-button">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div> -->

    <!-- Modal for adding a new task -->
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
          <label>
            Deadline:
            <input type="date" v-model="newTask.deadline" required />
          </label>
          <div class="modal-buttons">
            <button type="submit" @click="addTask" class="btn btn-primary">Add Task</button>
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

export default {
  name: 'GroupView',


  data() {
    return {
      suggestions: [], // Store fetched suggestions
      showSuggestions: [], // Control visibility of suggestions
      // Modal Data
      tasks: [], // array of task objects
      groupId: '',
      group: null,
      showAddTaskModal: false, // Controls modal visibility
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
      isLoggedIn: true, // You should tie this to your auth store
      router: null,
      groupSocket: io(),
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
  },

  watch: {
    '$route.params.groupId': {
      handler(newGroupId) {
        this.groupId = newGroupId;
        this.fetchGroupData();
      },
      immediate: true
    }
  },

  methods: {
    addTeamMember() {
      this.newTask.membersInCharge.push({ name: "" });
      this.suggestions.push([]); // Initialize suggestions for new input
      this.showSuggestions.push(false); // Initialize visibility control for new input
    },
    // Remove a team member input
    removeTeamMember(index) {
      this.newTask.membersInCharge.splice(index, 1);
      this.suggestions.splice(index, 1); // Remove corresponding suggestions
      this.showSuggestions.splice(index, 1); // Remove corresponding visibility control
    },
    async fetchMemberSuggestions(query, index) {
      if (query.length < 1) {
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
    // Select a suggestion
    selectSuggestion(index, suggestion) {
      this.newTask.membersInCharge[index].name = suggestion.displayName;
      this.showSuggestions[index] = false; // Hide suggestions after selection
    },
    closeSuggestions(index) {
      setTimeout(() => {
        this.showSuggestions[index] = false;
      }, 100);
    },
    async addTask() {
      this.newTask.taskId = 't100'
      this.newTask.groupId = this.groupId
      this.newTask.membersInCharge = this.newTask.membersInCharge.map(member => member.name.trim())
      try {
        const response = await axios.post('/api/task/add', this.newTask, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Workspace added:', response.data);

        // Optionally, refresh the workspaces list or handle UI updates
      } catch (error) {
        console.error('Error adding workspace:', error);
      }

      this.closeModal()
    },
    openModal() {
      this.showAddTaskModal = true;
    },

    // Method to close the modal
    closeModal() {
      this.showAddTaskModal = false;
      this.resetNewTask();
    },


    // Method to reset new task form data
    resetNewTask() {
      this.newTask = {
        taskName: '',
        membersInCharge: [{ name: '' }],
        deadline: '',
        status: false
      };
    },

    // Method to handle form submission
    // Enable edit mode for the selected post
    enableEditing(task) {
      task.isEditing = true;
    },

    // Save changes and disable edit mode for the selected post
    async saveChanges(task) {
      task.isEditing = false;
      try {
        console.log("Sending task data to server:", {
          taskName: task.taskName,
          membersInCharge: task.membersInCharge,
          deadline: task.deadline,
          status: task.status
        });

        // Make sure to await the axios.post call
        const response = await axios.post(`/api/task/updateBy/${task._id}`, {
          taskName: task.taskName,
          membersInCharge: task.membersInCharge,
          deadline: task.deadline,
          status: task.status
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Response:', response.data);
        // Optionally, refresh the tasks list or handle UI updates
      }
      catch (error) {
        console.error('Error updating task:', error);
      }
    },
    // Delete the selected post
    //ToDo: delete the task in the database
    async deleteTask(index) {
      const taskId = this.tasks[index]._id; // Get the task's _id

      try {
        // Send delete request to the backend
        const response = await axios.delete(`/api/task/delete/${taskId}`);

        if (response.status === 200) {
          // Remove the task from the local array if the delete was successful
          this.tasks.splice(index, 1);
          console.log("Deleted task at index:", index);
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
        //get data back based on group or group i
        const taskList = await axios.get(`/api/task/getBy/${this.groupId}`)
          .then(resp => {
            this.tasks = resp.data.data
          })
      } catch (error) {
        console.error('Failed to fetch group data:', error);
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
      // Reuse the same formatTime logic from ChatWindow.vue
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
      // Implement your error handling here
      console.error(message);
    },
  }
};
</script>

<style scoped>
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

.group-container {
  display: flex;
  width: 100%;
  max-width: 2400px;
  margin: 0 auto;
  gap: 20px;
  height: calc(75vh);
}

.group-section {
  flex: 1;
  overflow-y: auto;
}

.chat-section {
  flex: 0.6;
  position: relative;
}

.chat-container {
  height: 100%;
  background: #f3f1ff;
  border: 1px solid #ddd;
  border-radius: 8px 8px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background-color: var(--bs-purple) !important;
  padding: 10px 20px;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.chat-title {
  color: white;
  margin: 0;
  font-size: 1.2rem;
}

.minimize-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f3f1ff;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar {
  flex-shrink: 0;
}

.profile-pic {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.display-name {
  font-weight: bold;
  color: var(--bs-purple);
  text-decoration: none;
}

.cursor-pointer {
  cursor: pointer;
}

.timestamp {
  color: #6c757d;
}

.message-text {
  color: #212529;
  word-break: break-word;
}

.input-container {
  padding: 16px;
  border-top: 1px solid #ddd;
  background: #f3f1ff;
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #212529;
}

.send-button {
  padding: 8px 16px;
  background: var(--bs-purple);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.send-button:hover {
  background: #563d7c;
}

/* Group section styles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-button:hover {
  background-color: #45a049;
}

@media (max-width: 1024px) {
  .group-container {
    flex-direction: column;
    height: auto;
  }

  .chat-section {
    height: 500px;
  }

  .input-wrapper {
    flex-direction: column;
  }

  .send-button {
    padding: 12px;
    font-size: 1.1em;
  }
}

@media (max-width: 480px) {
  .chat-header h3 {
    font-size: 1.1em;
  }

  .messages-container {
    padding: 10px;
  }

  .message-item {
    gap: 8px;
  }

  .profile-pic {
    width: 32px;
    height: 32px;
  }
}

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
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
}
</style>