<template>
  <button
      @click="openModal"
      class="room-settings-btn btn btn-dark m-0 rounded-bottom-0"
  >
    <span class="icon-settings">⚙</span>
  </button>

  <!-- Bootstrap Modal -->
  <div
      v-if="isModalOpen"
      class="modal-overlay"
      @click.self="closeModal"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>Room Settings</h2>
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
          My rooms
        </button>
        <button
            @click="activeTab = 'create'"
            :class="['nav-link flex-grow-1', activeTab === 'create' ? 'active' : '']"
        >
          Create room
        </button>
        <button
            @click="activeTab = 'join'"
            :class="['nav-link flex-grow-1', activeTab === 'join' ? 'active' : '']"
        >
          Join room
        </button>
      </div>

      <!-- My rooms Tab -->
      <div v-if="activeTab === 'list'" class="room-list">
        <div
            v-for="room in userRooms"
            :key="room.id"
            class="room-item"
        >
          <span>{{ room.name }}</span>
          <div class="room-actions">
            <button
                @click="switchToroom(room)"
                class="switch-btn"
            >
              Switch
            </button>
            <button
                v-if="room.name !== 'general'"
                @click="leaveroom(room)"
                class="leave-btn"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      <!-- Create room Tab -->
      <div v-if="activeTab === 'create'" class="create-room">
        <form @submit.prevent="createRoom" class="d-flex flex-column gap-3">
          <input
              v-model="newRoomName"
              placeholder="room Name"
              required
              class="form-control"
          ><!--
          <select
              v-model="newroomType"
              class="form-select"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="group">Group</option>
          </select>-->
          <textarea
              v-model="newRoomDescription"
              placeholder="room Description (Optional)"
              class="form-control"
              rows="3"
          ></textarea>
          <div class="d-flex justify-content-end">
            <button type="submit" class="create-btn">
              Create room
            </button>
          </div>
        </form>
      </div>

      <!-- Join room Tab -->
      <div v-if="activeTab === 'join'" class="join-room">
        <form @submit.prevent="joinroom" class="d-flex gap-2 mb-4">
          <input
              v-model="roomToJoin"
              placeholder="Enter room Code or Name"
              required
              class="form-control"
          >
          <button type="submit" class="join-btn">
            Join room
          </button>
        </form>
        <div class="public-rooms">
          <h3>Public rooms</h3>
          <ul class="list-unstyled">
            <li
                v-for="publicroom in publicrooms"
                :key="publicroom.id"
                @click="joinPublicroom(publicroom)"
            >
              {{ publicroom.name }}
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
      userRooms: [
        { id: 1, name: 'general' },
        { id: 2, name: 'IS442' },
        { id: 3, name: 'IS442-G4' }
      ],
      /*publicRoomss: [
        { id: 4, name: 'Random' },
        { id: 5, name: 'Help Desk' }
      ],*/
      newRoomName: '',
      newRoomType: 'user',
      newRoomDescription: '',
      roomToJoin: ''
    }
  },
  methods: {
    openModal() {
      this.isModalOpen = true;

      this.$socket.emit('get-all-rooms', this.$authStore.currentUser._id);
    },
    closeModal() {
      this.isModalOpen = false;
      // Reset form states
      this.newroomName = '';
      this.newroomDescription = '';
      this.roomToJoin = '';
    },
    switchToroom(room) {
      // Emit an event to parent component to switch rooms
      this.$socket.emit('join-room', room.name);
      this.closeModal();
    },
    leaveroom(room) {
      // Remove room from user's rooms
      this.userRooms = this.userRooms.filter(c => c.id !== room.id);

      // Emit an event to backend to remove user from Room
      this.$emit('leave-room', room);
    },
    createRoom() {
      const newRoom = {
        name: this.newRoomName,
        type: 'user',
        description: this.newRoomDescription
      };

      console.log(newRoom);

      // Emit event to backend to create room
      this.$socket.emit('create-room', newRoom);

      // Add to user rooms and switch to it
      /*this.userRooms.push({
        id: this.userRooms.length + 1,
        name: newRoom.name
      });
      this.switchToRoom(newRoom);*/

      // Reset form
      this.newRoomName = '';
      this.newRoomDescription = '';
    },
    joinRoom() {
      // Emit event to backend to join room
      this.$emit('join-room', this.roomToJoin);

      // Reset input
      this.roomToJoin = '';
    },
    joinPublicRoom(room) {
      // Emit event to backend to join public room
      this.$emit('join-room', room.name);
      this.switchToRoom(room);
    },
    toggleTheme() {
      this.theme = this.theme === 'theme-dark' ? 'theme-light' : 'theme-dark';
    }
  }
}
</script>

<style scoped>
.room-settings-modal {
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

.room-list,
.create-room,
.join-room {
  padding: 20px;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background: #9e96dd;
  border-radius: 4px;
}

.room-actions button {
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

.create-room form,
.join-room form {
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

.public-rooms {
  margin-top: 20px;
}

.public-rooms ul {
  list-style-type: none;
  padding: 0;
}

.public-rooms li {
  padding: 10px;
  background: #9e96dd;
  margin-bottom: 5px;
  border-radius: 4px;
  cursor: pointer;
}

.public-rooms li:hover {
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