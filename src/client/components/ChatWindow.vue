<template>
  <div
      v-if="isLoggedIn"
      :class="[
      'position-fixed bottom-0 end-0 bg-dark border rounded-top shadow',
      isMinimized ? 'col-12 col-sm-6 col-md-5 col-lg-3 translate-up' : 'col-12 col-sm-6 col-md-5 col-lg-4'
    ]"
      style="z-index: 1000;"
  >
    <div class="bg-primary rounded-top d-flex justify-content-between align-items-center">
      <h3 class="ms-2 text-white mb-0">{{ currentRoom?.name || 'Chat' }}</h3>
      <div>
        <ChatSettingsModal v-if="!isMinimized"/>
        <button
            @click="toggleMinimize"
            :class="[
            'btn',
            isMinimized ? 'btn-info px-5' : 'btn-danger px-3',
            'rounded-start-0 rounded-end-3 rounded-bottom-0'
          ]"
        >
          {{ isMinimized ? '^' : 'v' }}
        </button>
      </div>
    </div>

    <div v-if="!isMinimized" class="d-flex flex-column" style="height: 400px;">
      <div class="p-3 d-flex flex-column overflow-auto flex-grow-1" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg._id" class="d-flex mb-3 gap-3">
          <!-- Profile picture column -->
          <div class="flex-shrink-0">
            <img
                @click="router.push('/profile/'+msg.saidBy._id)"
                :src="'/profilepicture/' + msg.saidBy.profilePic"
                class="rounded-circle cursor-pointer"
                alt="avatar"
                style="width: 40px; height: 40px;"
            >
          </div>

          <!-- Message content column -->
          <div class="flex-grow-1 d-flex flex-column">
            <div class="d-flex align-items-center gap-2">
              <a
                  @click="router.push('/profile/'+msg.saidBy._id)"
                  class="fw-bold text-decoration-none link-light cursor-pointer"
              >
                {{ msg.saidBy.displayName }}
              </a>
              <small class="text-secondary">{{ formatTime(msg.createdAt) }}</small>
            </div>
            <div class="text-light text-break">{{ msg.message }}</div>
          </div>
        </div>
      </div>

      <div class="p-2 border-top" v-if="isLoggedIn">
        <div class="d-flex gap-2">
          <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              @paste="handleLarge"
              placeholder="Type a message..."
              type="text"
              :maxlength="MAX_MESSAGE_LENGTH"
              class="form-control"
          >
          <button @click="sendMessage" class="btn btn-primary">Send</button>
        </div>
      </div>
      <div v-else class="p-3 text-center">
        <p class="mb-0">Please log in to chat</p>
      </div>
    </div>
  </div>
</template>

<script>
import ChatSettingsModal from './ChatSettingsModal.vue'
import { useRouter } from 'vue-router'
import {useAuthStore} from "../stores/auth.js";

export default {
  name: 'ChatWindow',
  components: { ChatSettingsModal },

  data() {
    return {
      messages: [],
      newMessage: '',
      isMinimized: true,
      currentRoom: null,
      MAX_MESSAGE_LENGTH: 500,
      connectionEstablished: false,
      errorMessages: {
        'chat-noauth-error': 'Please login to chat',
        'chat-nouser-error': 'User not found',
        'chat-maxlimit-error': 'Message is too long',
        'chat-room-notfound-error': 'Chat room not found',
        'chat-not-member-error': 'You are not a member of this room',
        'chat-cannot-leave-error': 'Cannot leave the default room',
        'chat-invalid-room-error': 'Invalid room ID'
      },
      router:null,
      timestampRefreshInterval: null, // Store interval reference
      midnightCheckTimeout: null, // Store timeout reference for next midnight
    }
  },

  methods: {
    async sendMessage() {
      if (!this.newMessage.trim() || !this.isAuthenticated) return;

      if (this.newMessage.length > this.MAX_MESSAGE_LENGTH) {
        this.showCustomError(`Message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`);
        return;
      }
      this.$socket.emit('chat-message', {
        roomId: this.currentRoom?._id,
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
        this.showCustomError(`Pasted text was trimmed to fit ${this.MAX_MESSAGE_LENGTH} character limit`);
      }
    },

    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
    },

    formatTime(timestamp) {
      const messageDate = new Date(timestamp);

      // Get today's midnight for comparison
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      // Get yesterday's midnight
      const yesterdayMidnight = new Date(todayMidnight);
      yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

      // Get time string helper
      const getTimeString = (date) => {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      // If message is after today's midnight
      if (messageDate >= todayMidnight) {
        return `Today at ${getTimeString(messageDate)}`;
      }

      // If message is after yesterday's midnight
      if (messageDate >= yesterdayMidnight) {
        return `Yesterday at ${getTimeString(messageDate)}`;
      }

      // If in current year
      const currentYear = new Date().getFullYear();
      if (messageDate.getFullYear() === currentYear) {
        return messageDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric'
        }) + ` at ${getTimeString(messageDate)}`;
      }

      // Different year
      return messageDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) + ` at ${getTimeString(messageDate)}`;
    },

    setupTimestampRefresh() {
      // Clear any existing intervals/timeouts
      if (this.timestampRefreshInterval) clearInterval(this.timestampRefreshInterval);
      if (this.midnightCheckTimeout) clearTimeout(this.midnightCheckTimeout);

      // Calculate time until next midnight
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow - now;

      // Set timeout for next midnight
      this.midnightCheckTimeout = setTimeout(() => {
        // Force a refresh of the component
        this.$forceUpdate();

        // Setup the next day's check
        this.setupTimestampRefresh();
      }, msUntilMidnight);
    },

    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop =
            this.$refs.messagesContainer.scrollHeight;
      }
    },

    showCustomError(error) {
      this.messages.push({
        _id: Date.now(),
        message: error,
        createdAt: Date.now(),
        saidBy: {
          displayName: "ERROR",
          profilePic: 'server.png'
        }
      });
      this.$nextTick(this.scrollToBottom);
    },

    handleSocketError(errorType, error) {
      const errorMessage = this.errorMessages[errorType] || error.message;
      this.showCustomError(errorMessage);

      if (errorType === 'chat-noauth-error') {
        this.isAuthenticated = false;
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    isLoggedIn() {
      return this.authStore.currentUser !== null
    }
  },

  mounted() {
    this.router = useRouter()
    // Socket connection events
    this.$socket.on('connect', () => {
      this.connectionEstablished = true;
    });

    this.$socket.on('user-profile-updated', (userData) => {
      // Update messages where the user appears
      this.messages = this.messages.map(msg => {
        if (msg.saidBy._id === userData.userId) {
          return {
            ...msg,
            saidBy: {
              ...msg.saidBy,
              displayName: userData.displayName,
              profilePic: userData.profilePic
            }
          };
        }
        return msg;
      });
    });

    this.$socket.on('disconnect', () => {
      this.connectionEstablished = false;
      this.isAuthenticated = false;
      this.showCustomError('Disconnected from chat server');
    });

    this.$socket.on('previous-messages', ({ roomId, messages }) => {
      this.messages = messages;
      this.isAuthenticated = true;  // If we get messages, we're authenticated
      this.$nextTick(this.scrollToBottom);
    });

    this.$socket.on('new-message', (message) => {
      this.messages.push(message);
      this.$nextTick(this.scrollToBottom);
    });

    // Error handlers
    Object.keys(this.errorMessages).forEach(errorType => {
      this.$socket.on(errorType, (error) => this.handleSocketError(errorType, error));
    });

    // Room management events
    this.$socket.on('room-info', (room) => {
      this.currentRoom = room;
    });
    this.setupTimestampRefresh();
  },

  beforeUnmount() {
    // Cleanup socket listeners
    this.$socket.off('connect');
    this.$socket.off('disconnect');
    this.$socket.off('previous-messages');
    this.$socket.off('new-message');
    Object.keys(this.errorMessages).forEach(errorType => {
      this.$socket.off(errorType);
    });
    this.$socket.off('room-info');
    if (this.timestampRefreshInterval) clearInterval(this.timestampRefreshInterval);
    if (this.midnightCheckTimeout) clearTimeout(this.midnightCheckTimeout);
  }
}
</script>

<style scoped>
.translate-up {
  transform: translateY(25px);
  transition: transform 0.25s cubic-bezier(.05,.43,.13,1.01);
}

.translate-up:hover {
  transform: translateY(0);
}

.cursor-pointer {
  cursor: pointer;
}

.overflow-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}
</style>