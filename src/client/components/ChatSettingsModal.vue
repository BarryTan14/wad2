<template>
  <button
      @click="openModal"
      class="channel-settings-btn btn btn-dark"
  >
    <i class="icon-settings">⚙</i>
  </button>

  <!-- Bootstrap Modal -->
  <div
      v-if="isModalOpen"
      class="modal-overlay"
      @click.self="closeModal"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>Channel Settings</h2>
        <button
            @click="closeModal"
            class="btn-close btn-dark"
            aria-label="Close"
        ></button>
      </div>

      <div class="modal-tabs">
        <button
            @click="activeTab = 'list'"
            :class="['nav-link flex-grow-1', activeTab === 'list' ? 'active' : '']"
        >
          My Channels
        </button>
        <button
            @click="activeTab = 'create'"
            :class="['nav-link flex-grow-1', activeTab === 'create' ? 'active' : '']"
        >
          Create Channel
        </button>
        <button
            @click="activeTab = 'join'"
            :class="['nav-link flex-grow-1', activeTab === 'join' ? 'active' : '']"
        >
          Join Channel
        </button>
      </div>

      <!-- My Channels Tab -->
      <div v-if="activeTab === 'list'" class="channel-list">
        <div
            v-for="channel in userChannels"
            :key="channel.id"
            class="channel-item"
        >
          <span>{{ channel.name }}</span>
          <div class="channel-actions">
            <button
                @click="switchToChannel(channel)"
                class="switch-btn"
            >
              Switch
            </button>
            <button
                v-if="channel.name !== 'general'"
                @click="leaveChannel(channel)"
                class="leave-btn"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      <!-- Create Channel Tab -->
      <div v-if="activeTab === 'create'" class="create-channel">
        <form @submit.prevent="createChannel" class="d-flex flex-column gap-3">
          <input
              v-model="newChannelName"
              placeholder="Channel Name"
              required
              class="form-control"
          >
          <select
              v-model="newChannelType"
              class="form-select"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="group">Group</option>
          </select>
          <textarea
              v-model="newChannelDescription"
              placeholder="Channel Description (Optional)"
              class="form-control"
              rows="3"
          ></textarea>
          <div class="d-flex justify-content-end">
            <button type="submit" class="create-btn">
              Create Channel
            </button>
          </div>
        </form>
      </div>

      <!-- Join Channel Tab -->
      <div v-if="activeTab === 'join'" class="join-channel">
        <form @submit.prevent="joinChannel" class="d-flex gap-2 mb-4">
          <input
              v-model="channelToJoin"
              placeholder="Enter Channel Code or Name"
              required
              class="form-control"
          >
          <button type="submit" class="join-btn">
            Join Channel
          </button>
        </form>
        <div class="public-channels">
          <h3>Public Channels</h3>
          <ul class="list-unstyled">
            <li
                v-for="publicChannel in publicChannels"
                :key="publicChannel.id"
                @click="joinPublicChannel(publicChannel)"
            >
              {{ publicChannel.name }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatSettingsModal',
  data() {
    return {
      isModalOpen: false,
      activeTab: 'list',
      userChannels: [
        { id: 1, name: 'general' },
        { id: 2, name: 'IS442' },
        { id: 3, name: 'IS442-G4' }
      ],
      publicChannels: [
        { id: 4, name: 'Random' },
        { id: 5, name: 'Help Desk' }
      ],
      newChannelName: '',
      newChannelType: 'public',
      newChannelDescription: '',
      channelToJoin: ''
    }
  },
  methods: {
    openModal() {
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
      // Reset form states
      this.newChannelName = '';
      this.newChannelType = 'public';
      this.newChannelDescription = '';
      this.channelToJoin = '';
    },
    switchToChannel(channel) {
      // Emit an event to parent component to switch channels
      this.$emit('switch-channel', channel);
      this.closeModal();
    },
    leaveChannel(channel) {
      // Remove channel from user's channels
      this.userChannels = this.userChannels.filter(c => c.id !== channel.id);

      // Emit an event to backend to remove user from channel
      this.$emit('leave-channel', channel);
    },
    createChannel() {
      const newChannel = {
        name: this.newChannelName,
        type: this.newChannelType,
        description: this.newChannelDescription
      };

      // Emit event to backend to create channel
      this.$emit('create-channel', newChannel);

      // Add to user channels and switch to it
      this.userChannels.push({
        id: this.userChannels.length + 1,
        name: newChannel.name
      });
      this.switchToChannel(newChannel);

      // Reset form
      this.newChannelName = '';
      this.newChannelType = 'public';
      this.newChannelDescription = '';
    },
    joinChannel() {
      // Emit event to backend to join channel
      this.$emit('join-channel', this.channelToJoin);

      // Reset input
      this.channelToJoin = '';
    },
    joinPublicChannel(channel) {
      // Emit event to backend to join public channel
      this.$emit('join-channel', channel.name);
      this.switchToChannel(channel);
    },
    toggleTheme() {
      this.theme = this.theme === 'theme-dark' ? 'theme-light' : 'theme-dark';
    }
  }
}
</script>

<style scoped>
.channel-settings-modal {
  position: relative;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bs-purple);
  border-radius: 8px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.modal-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
}

.modal-tabs button {
  flex-grow: 1;
  padding: 10px;
  background: #9e96dd;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.modal-tabs button.active {
  background: var(--bs-purple);
  color: white;
}

.channel-list,
.create-channel,
.join-channel {
  padding: 20px;
}

.channel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background: #9e96dd;
  border-radius: 4px;
}

.channel-actions button {
  margin-left: 10px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s, color 0.3s;
}

.switch-btn {
  background: #2fc07c;
  color: white;
}

.switch-btn:hover {
  background: #5548cc;
}

.leave-btn {
  background: #dc3545;
  color: white;
}

.leave-btn:hover {
  background: #d32f2f;
}

.create-channel form,
.join-channel form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input, select, textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 100%;
  font-size: 1rem;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #6c63ff;
  box-shadow: 0 0 5px rgba(108, 99, 255, 0.5);
}

.create-btn, .join-btn {
  padding: 10px;
  font-size: 1rem;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.create-btn:hover, .join-btn:hover {
  background: #5548cc;
}

.public-channels {
  margin-top: 20px;
}

.public-channels ul {
  list-style-type: none;
  padding: 0;
}

.public-channels li {
  padding: 10px;
  background: #9e96dd;
  margin-bottom: 5px;
  border-radius: 4px;
  cursor: pointer;
}

.public-channels li:hover {
  background: #2fc07c;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #dc3545;
  transform: scale(1.1); 
}

</style>