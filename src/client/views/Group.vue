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
    
    </div>

    <!-- Right side: Chat Window -->
    <div class="chat-section">
      <div
          v-if="isLoggedIn"
          class="chat-container"
      >
        <div class="chat-header">
          <h3 class="chat-title">Group Chat</h3>
        </div>

        <div v-if="!isMinimized" class="chat-content">
          <div class="messages-container" ref="messagesContainer">
            <div v-for="msg in messages" :key="msg._id" class="message-item">
              <div class="avatar">
                <img
                    :src="'/profilepicture/' + msg.saidBy.profilePic"
                    class="profile-pic"
                    alt="avatar"
                >
              </div>

              <div class="message-content">
                <div class="message-header">
                  <span class="display-name">{{ msg.saidBy.displayName }}</span>
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
      groupId: '',
      group: null,
      messages: [],
      newMessage: '',
      isMinimized: false,
      MAX_MESSAGE_LENGTH: 500,
      connectionEstablished: false,
      isLoggedIn: true, // You should tie this to your auth store
      router: null
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
    async fetchGroupData() {
      try {
        const response = await axios.get(`/group/${this.groupId}`);
        console.log(response.data.data)
        this.group = response.data.data;
      } catch (error) {
        console.error('Failed to fetch group data:', error);
      }
    },

    setupSocketListeners() {
      this.$socket.on('connect', () => {
        this.connectionEstablished = true;
        console.log(this.groupId);
        this.$socket.emit('join-room-group',
            this.groupId
        )
      });

      this.$socket.on('previous-messages', ({ messages }) => {
        this.messages = messages;
        this.$nextTick(this.scrollToBottom);
      });

      this.$socket.on('new-message', (message) => {
        this.messages.push(message);
        this.$nextTick(this.scrollToBottom);
      });
    },

    cleanupSocketListeners() {
      this.$socket.off('connect');
      this.$socket.off('previous-messages');
      this.$socket.off('new-message');
    },

    sendMessage() {
      if (!this.newMessage.trim() || !this.isLoggedIn) return;

      if (this.newMessage.length > this.MAX_MESSAGE_LENGTH) {
        this.showError(`Message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`);
        return;
      }

      this.$socket.emit('chat-message', {
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
  height: calc(75vh); /* Adjust based on your layout */
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
  background: #1a1d20;
  border: 1px solid #2d3238;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.chat-header {
  background: var(--bs-purple);
  padding: 10px 20px;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* Prevent header from shrinking */
}

.chat-title {
  color: white;
  margin: 0;
  font-size: 1.2rem;
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
}

.timestamp {
  color: #6c757d;
}

.message-text {
  color: #e1e1e1;
  word-break: break-word;
}

.input-container {
  padding: 16px;
  border-top: 1px solid #2d3238;
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #2d3238;
  border-radius: 4px;
  background: #2d3238;
  color: white;
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

.header {
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
}
</style>