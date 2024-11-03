<template>
  <div class="chat-container col col-11 col-sm-6 col-md-5 col-lg-4" :class="{ 'chat-minimized': isMinimized }">
    <div class="chat-header">
      <h3>{{ currentRoom?.name || 'Chat' }}</h3>
      <button @click="toggleMinimize" class="minimize-btn">{{ isMinimized ? '+' : '-' }}</button>
    </div>

    <div v-if="!isMinimized" class="chat-content">
      <div class="messages mw-100" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg._id" class="message text-break">
          <span class="displayName">{{ msg.displayName }}:</span>
          <span class="text">{{ msg.message }}</span>
          <span class="timestamp text-break">{{ formatTime(msg.createdAt) }}</span>
        </div>
      </div>

      <div class="input-area" v-if="isAuthenticated">
        <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            @paste="handleLarge"
            placeholder="Type a message..."
            type="text"
            :maxlength="MAX_MESSAGE_LENGTH"
        >
        <button @click="sendMessage">Send</button>
      </div>
      <div v-else class="login-prompt">
        <p>Please log in to chat</p>
      </div>
    </div>
  </div>
</template>

<script>
import ChannelSettingsModal from './ChatSettingsModal.vue'

export default {
  name: 'ChatWindow',
  components: { ChannelSettingsModal },

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
      }
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
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
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
        displayName: "ERROR",
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

  mounted() {
    // Socket connection events
    this.$socket.on('connect', () => {
      this.connectionEstablished = true;
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
  }
}
</script>

<style scoped>
.chat-container {
  position: fixed;
  bottom: 0;
  right: 20px;
  background: #1a1d20;
  border: 1px solid #ddd;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  z-index: 1000;
}

.chat-header {
  padding: 10px;
  background: #007bff;
  color: white;
  /*cursor: pointer;*/
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px 8px 0 0;
}

.minimize-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

.chat-content {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background: #212529;
}

.message {
  margin-bottom: 8px;
  line-height: 1.4;
}

.displayName {
  font-weight: bold;
  margin-right: 5px;
  color: #007bff;
}

.timestamp {
  font-size: 0.8em;
  color: #6c757d;
  margin-left: 5px;
}

.input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
}

.input-area input {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
}

.input-area button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-minimized {
  height: auto;
  transform: translateY(25px);
  transition: transform 0.25s cubic-bezier(.05,.43,.13,1.01);
}
.chat-minimized:hover {
  transition: transform 0.25s cubic-bezier(.05,.43,.13,1.01);
  transform: translateY(0);
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}
</style>