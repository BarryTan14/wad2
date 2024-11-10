<template>
  <div
      v-if="isLoggedIn"
      :class="[
      'position-fixed bg-dark border rounded-top shadow',
      isMinimized ? 'col-12 col-sm-6 col-md-5 col-lg-3 translate-up' : 'col-12 col-sm-6 col-md-5 col-lg-4'
    ]"
      style="z-index: 1000;"
  >
    <div class="chat-header p-0 bg-primary rounded-top d-flex align-items-center justify-content-between">
      <StyledDropdown
          v-model="selectedRoom"
          :options="userRooms"
          placeholder="Select Chat Room"
          @option-selected="handleRoomChange"
      />

      <div v-if="!isMinimized"
           @click="roomDetailModal"
          class="d-flex m-0 px-0 room-details-btn"
      >
        Room Details
      </div>
      <div>
        <button
            @click="toggleMinimize"
            :class="[ 'minimize-btn',
            isMinimized ? 'px-5' : 'px-3',
            'rounded-start-0 rounded-end-3 rounded-bottom-0 m-0'
          ]"
        >
          {{ isMinimized ? '^' : 'v' }}
        </button>
      </div>
    </div>

    <div v-if="!isMinimized" class="d-flex flex-column messages-content" style="height: 400px;">
      <div class="p-3 d-flex flex-column overflow-auto flex-grow-1" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg._id" class="d-flex mb-3 gap-3">
          <!-- Profile picture column -->
          <div class="flex-shrink-0">
            <img
                @click="router.push('/profile/'+msg.saidBy._id)"
                :src="'/profilepicture/' + msg.saidBy.profilePic"
                class="rounded-circle cursor-pointer profile-pic"
                alt="avatar"
                style="width: 40px; height: 40px;"
            >
          </div>

          <!-- Message content column -->
          <div class="flex-grow-1 d-flex flex-column">
            <div class="d-flex align-items-center gap-2">
              <a
                  @click="router.push('/profile/'+msg.saidBy._id)"
                  class="fw-bold text-purple text-decoration-none link-light cursor-pointer"
              >
                {{ msg.saidBy.displayName }}
              </a>
              <small class="text-secondary">{{ formatTime(msg.createdAt) }}</small>
            </div>
            <div class="text-purple text-break">{{ msg.message }}</div>
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
          <button @click="sendMessage" class="btn btn-primary m-0">Send</button>
        </div>
      </div>
      <div v-else class="p-3 text-center">
        <p class="mb-0">Please log in to chat</p>
      </div>
    </div>
  </div>
</template>

<script>
import StyledDropdown from './StyledDropdown.vue'
import ChatSettingsModal from './ChatSettingsModal.vue'
import {useRouter} from 'vue-router'

export default {
  name: 'ChatWindow',
  components: {
    ChatSettingsModal,
    StyledDropdown,
  },

  data() {
    return {
      user: this.$authStore.currentUser,
      selectedRoom:'',
      selectedRoomID:'',
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
      router: useRouter(),
      timestampRefreshInterval: null, // Store interval reference
      midnightCheckTimeout: null, // Store timeout reference for next midnight
      userRooms:[],
    }
  },

  methods: {
    roomDetailModal() {
      const copyToClipboard = async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          this.$swal.fire({
            toast:true,
            position: 'top-end',
            icon: 'success',
            title: 'ID Copied!',
            showConfirmButton: false,
            timer: 1500
          });
        } catch (err) {
          if(err.message === "navigator.clipboard is undefined")
          {
            this.$swal.fire({
              toast:true,
              position: 'top-end',
              icon: 'error',
              title: 'Unable to copy',
              text: 'We do not have enough permissions for "click to copy", please copy manually.',
              showConfirmButton: false,
              timer: 3000
            });
          }
        }
      };

      this.$swal.fire({
        title: this.currentRoom.name,
        html: `
      <div>
        <p>
          <strong>ID:</strong>
          <span
          >${this.currentRoom._id}
          </span>
          <svg
                style="cursor: pointer;"
                id="room-id"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="copy-icon"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        </p>
        <p><strong>Description:</strong> ${this.currentRoom.description}</p>
      </div>
    `,
        icon: 'info',
        showCloseButton: true,
        didOpen: () => {
          document.getElementById('room-id').addEventListener('click', () => {
            copyToClipboard(this.currentRoom._id);
          });
        }
      });
    },
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

    handleRoomChange(room) {
      this.$socket.emit('join-room', room._id);
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

    setCookie(name, value, days) {
      var expires = "";
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "") + expires + "; path=/";
    },

    handleSocketError(errorType, error) {
      const errorMessage = this.errorMessages[errorType] || error.message;
      this.showCustomError(errorMessage);

      if (errorType === 'chat-noauth-error') {
        this.isAuthenticated = false;
        return;
      }
      // try to return to default room
      if (errorType === 'chat-invalid-room-error') {
        this.$socket.emit('join-room', 'general');
      }
    }
  },

  computed: {
    isLoggedIn() {
      return this.$authStore.currentUser !== null
    }
  },

  mounted() {
    // Socket connection events
    if (this.$socket.connected) {
      this.connectionEstablished = true;
      this.$socket.emit('join-room')
      this.$socket.emit('get-all-rooms', this.user._id)
    } else {
      this.$socket.on('connect', () => {
        this.user = this.$authStore.currentUser;
        if(this.user)
        {
          this.connectionEstablished = true;
          this.$socket.emit('join-room')
          this.$socket.emit('get-all-rooms', this.user._id)
        }
      });
    }

    this.$socket.on('get-all-rooms', rooms => {
      this.userRooms = rooms;
    })

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

    this.$socket.on('previous-messages', ({roomId, messages}) => {
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
      this.selectedRoom = room.name;
      this.selectedRoomID = room._id;
      this.$socket.emit('get-all-rooms', this.user._id)
    });

    this.$socket.on('set-roomid-cookie', (roomId) => {
      this.setCookie('roomId', roomId._id ? roomId._id : roomId, 30)
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
    this.$socket.off('set-roomid-cookie');
    if (this.timestampRefreshInterval) clearInterval(this.timestampRefreshInterval);
    if (this.midnightCheckTimeout) clearTimeout(this.midnightCheckTimeout);
  }
}
</script>

<style scoped>

.chatwindow {
  backdrop-filter: blur(6px);
}

.position-fixed {
  position: fixed;
  bottom: 0;
  right: 20px;
  z-index: 1000;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  transition: width 0.3s;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.bg-dark {
  background-color: rgba(243, 241, 255, 100%) !important;
  /*backdrop-filter: blur(6px);*/
}

.modal-overlay {
  background: rgba(158, 150, 221, 0.5);
}

.modal-content {
  background: #ffffff;
}

.modal-tabs button {
  background: #f3f1ff;
  color: #6c63ff;
}

.modal-tabs button.active {
  background: #9e96dd;
  color: white;
}

.btn-info {
  background-color: #9e96dd !important;
  border-color: #9e96dd !important;
  color: white !important;
}

.btn-info:hover {
  background-color: #8b84d8 !important;
  border-color: #8b84d8 !important;
}

.bg-primary {
  background-color: var(--bs-purple) !important;
  color: white;
  padding: 10px;
}

.rounded-top {
  border-radius: 8px 8px 0 0 !important;
}

.translate-up {
  transform: translateY(25px);
  transition: transform 0.25s cubic-bezier(.05, .43, .13, 1.01);
}

.translate-up:hover {
  transform: translateY(0);
}

.cursor-pointer {
  cursor: pointer;
}

.d-flex {
  display: flex;
}

.flex-column {
  flex-direction: column;
}

.flex-grow-1 {
  flex-grow: 1;
}

.overflow-auto {
  overflow-y: auto;
}

.profile-pic {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
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

.messages {
  flex-grow: 1;
  padding: 10px;
  background: #8b84d8;
}

.message {
  margin-bottom: 8px;
  line-height: 1.4;
}

.displayName {
  font-weight: bold;
  color: var(--bs-purple);
}

.timestamp {
  font-size: 0.8em;
  color: #6c757d;
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #ddd;
}

.form-control {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-primary {
  background: var(--bs-purple);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}

.modal-tabs button {
  background: #f3f1ff;
  color: var(--bs-purple);
}

.modal-tabs button.active {
  background: #9e96dd;
  color: white;
}

.text-purple {
  color: var(--bs-purple) !important;
}

@media (max-width: 768px) {
  .position-fixed {
    width: 90%;
    right: 5%;
  }

  .input-area {
    flex-direction: column;
  }

  .btn {
    font-size: 1.2em;
  }
}

@media (max-width: 480px) {
  .btn {
    padding: 8px 12px;
  }

  .chat-header h3 {
    font-size: 1.2em;
  }
}

.room-details-btn {
  font-size: 0.9rem;
  cursor: pointer;
}
.room-details-btn:hover {
  text-decoration: underline;
}
</style>

