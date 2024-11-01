<template>
  <div class="chat-container" :class="{ 'chat-minimized': isMinimized }">
    <div class="chat-header">
      <h3>Chat</h3>
      <ChannelSettingsModal
          @switch-channel="switchChannel"
          @create-channel="createChannel"
          @leave-channel="leaveChannel"
          @join-channel="joinChannel"
      />
      <button @click="toggleMinimize" class="minimize-btn">{{ isMinimized ? '+' : '-' }}</button>
    </div>

    <div v-if="!isMinimized" class="chat-content">
      <div class="messages" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg._id" class="message">
          <span class="displayName">{{ msg.displayName }}:</span>
          <span class="text">{{ msg.message }}</span>
          <span class="timestamp">{{ formatTime(msg.createdAt) }}</span>
        </div>
      </div>

      <div class="input-area">
        <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            placeholder="Type a message..."
            type="text"
        >
        <button @click="sendMessage">Send</button>
      </div>
    </div>
  </div>
</template>

<script>
import ChannelSettingsModal from './ChatSettingsModal.vue'
export default {
  name: 'ChatWindow',
  components: {ChannelSettingsModal},
  data() {
    return {
      chatDisabled:false,
      messages: [],
      newMessage: '',
      isMinimized: true,
      displayName: `test`
    }
  },
  methods: {
    sendMessage() {
      if (this.newMessage.trim()) {
        this.$socket.emit('chat-message', {
          message: this.newMessage,
          displayName: this.displayName,
        });
        this.newMessage = '';
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
    }
  },
  mounted() {
    // Listen for previous messages
    this.$socket.on('previous-messages', (messages) => {
      this.messages = messages;
      this.$nextTick(this.scrollToBottom);
    });

    // Listen for new messages
    this.$socket.on('new-message', (message) => {
      this.messages.push(message);
      this.$nextTick(this.scrollToBottom);
    });

    this.$socket.on('chat-noauth-error', (error) => {
      // Handle the error - show a toast, alert, etc.
/*
      this.chatDisabled = true;
*/
      this.messages.push({
        message:error.message,
        createdAt:Date.now(),
        displayName:"ERROR",
      })
      // Or use a more elegant notification method
      // this.$toast.error(error.message);
    });
  },
  beforeUnmount() {
    // Clean up socket listeners
    this.$socket.off('previous-messages');
    this.$socket.off('new-message');
  }
}
</script>

<style scoped>
.chat-container {
  position: fixed;
  bottom: 0;
  right: 20px;
  width: 50%;
  background: #1a1d20;
  border: 1px solid #ddd;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  z-index: 1000;
}

.chat-header {
  padding: 10px;
  background: #007bff;
  color: white;/*
  cursor: pointer;*/
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
  width: 20%;
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