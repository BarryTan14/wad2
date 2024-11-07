<template>
  <div class="group-container">
    <!-- Left side: Group Assignments -->
    <div class="group-section">
        <h1 v-if="group && group.length > 0"class="card-title">{{ group[0].moduleName|| 'Module name not available' }}</h1>
        <h1 v-else>Loading module data...</h1> <!-- Fallback if data is not yet available -->
      <div class="header">
        <h3 v-if="group && group.length > 0"class="card-title">{{ group[0].groupId|| 'Module name not available' }}</h3>
        <h3 v-else>Loading module data...</h3> <!-- Fallback if data is not yet available -->
      </div>
      <div id="app">    
        <h2>Task Lists</h2>
      <table class="table m-2">
          <tr>
              <th>S/N</th>
              <th>Name</th>
              <th>Members in Charge</th>
              <th>Deadline</th>
              <th>Done</th>
              <th>Functions</th>
          </tr>
          <tr v-for="(task, indx) in tasks" :key="task.id">
              <td>{{ indx + 1 }}</td>

              <!-- Name Field: Editable if isEditing is true -->
              <td>
                  <input type="text" v-model="task.Name" :readonly="!task.isEditing" />
              </td>

              <!-- Members in Charge Field: Editable if isEditing is true -->
              <td>
                  <input 
                      type="text" 
                      v-model="task['Members in charge']" 
                      :readonly="!task.isEditing" 
                      @input="task['Members in charge'] = task['Members in charge'].split(',')" 
                      placeholder="Separate names with commas" 
                  />
              </td>

              <!-- Deadline Field: Editable if isEditing is true -->
              <td>
                  <input type="date" v-model="task.Deadline" :readonly="!task.isEditing" />
              </td>

              <!-- Checkbox for Completion Status: Always Editable -->
              <td><input type="checkbox" v-model="task.isCompleted" :disabled="!task.isEditing" /></td>

              <!-- Update/Save and Delete Buttons -->
              <td>
                  <button v-if="!task.isEditing" @click="enableEditing(task)" class="btn btn-sm btn-primary">Update</button>
                  <button v-else @click="saveChanges(task)" class="btn btn-sm btn-success">Save</button>
                  <button @click="deletePost(indx)" class="btn btn-sm btn-danger">Delete</button>
              </td>
          </tr>
      </table>
    </div>

    </div>

    <!-- Right side: Chat Window -->
    <div class="chat-section">
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
              <!-- Profile picture column -->
              <div class="avatar">
                <img
                    :src="'/profilepicture/' + msg.saidBy.profilePic"
                    class="profile-pic cursor-pointer"
                    alt="avatar"
                    @click="router.push('/profile/'+msg.saidBy._id)"
                >
              </div>

              <!-- Message content column -->
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
    </div>
  </div>
</template>

<script>
import groupComp from "../components/groupComponent.vue";
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'GroupView',

  components: {
    groupComp
  },

  data() {
    return {
      tasks: null, // array of post objects
      groupId: '',
      group: null,
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
    // Enable edit mode for the selected post
    enableEditing(task) {
        task.isEditing = true;
    },

    // Save changes and disable edit mode for the selected post
    saveChanges(task) {
        task.isEditing = false;
        console.log("Post updated:", task); // Optional: Log the updated post
    },

    // Delete the selected post
    deletePost(index) {
        this.tasks.splice(index, 1);
        console.log("Deleted Post at index:", index);
    },
    async fetchGroupData() {
      try {
        const response = await axios.get(`/group/${this.groupId}`);
        this.group = response.data.data;
      } catch (error) {
        console.error('Failed to fetch group data:', error);
      }
    },
    async fetchTaskData() {
      try {
        const response = await axios.get(`/task`);
        console.log(response.data.data)
        this.tasks = response.data.data;
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

    openPopup() {
      const popup = window.open(
          "",
          "Add New Module",
          "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      const popupContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Add New Module</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 500px;
                margin: 0 auto;
              }
              label {
                display: block;
                margin-top: 10px;
                font-weight: bold;
              }
              input, textarea {
                width: 100%;
                padding: 8px;
                margin-top: 5px;
                border: 1px solid #ddd;
                border-radius: 4px;
              }
              textarea {
                min-height: 100px;
                resize: vertical;
              }
              .button-group {
                margin-top: 20px;
                display: flex;
                gap: 10px;
              }
              button {
                padding: 8px 16px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
              }
              button[type="submit"] {
                background-color: #4CAF50;
                color: white;
              }
              button[type="button"] {
                background-color: #f44336;
                color: white;
              }
            </style>
          </head>
          <body>
            <h2>Add New Module</h2>
            <form id="popupForm">
              <label>Module Name:
                <input type="text" id="moduleName" required />
              </label>
              <label>Module ID:
                <input type="text" id="moduleId" required />
              </label>
              <label>Description:
                <textarea id="description" required></textarea>
              </label>
              <div class="button-group">
                <button type="submit">Submit</button>
                <button type="button" onclick="window.close()">Cancel</button>
              </div>
            </form>
            <script>
              document.getElementById("popupForm").onsubmit = async function(event) {
                event.preventDefault();
                const formData = {
                  module_name: document.getElementById("moduleName").value,
                  module_id: document.getElementById("moduleId").value,
                  description: document.getElementById("description").value
                };

                try {
                  const response = await fetch('/group/${this.groupId}/add', {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                  });

                  if (!response.ok) {
                    throw new Error(await response.text() || 'Failed to add module');
                  }

                  alert("Module added successfully!");
                  window.opener.location.reload();
                  window.close();
                } catch (error) {
                  alert("Error: " + error.message);
                }
              };
            <\/script>
          </body>
        </html>
      `;

      popup.document.write(popupContent);
      popup.document.close();
    }
  }
};
</script>

<style scoped>
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
  flex: 1;
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
  background: #f1f1f1;
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
  background: white;
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
</style>