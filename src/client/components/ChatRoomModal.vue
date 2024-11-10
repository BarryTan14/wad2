<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content bg-dark" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title">{{ modalTitle }}</h5>
        <button class="btn-close" @click="closeModal"></button>
      </div>

      <div class="modal-body">
        <!-- Create Room Form -->
        <form v-if="modalType === 'create'" @submit.prevent="handleCreateRoom">
          <div class="mb-3">
            <label class="form-label">Room Name</label>
            <input
                v-model="roomName"
                type="text"
                class="form-control"
                placeholder="Enter room name"
                required
            >
          </div>
          <div class="mb-3">
            <label class="form-label">Room Description</label>
            <textarea
                v-model="roomDescription"
                class="form-control"
                placeholder="Enter room description"
                rows="3"
            ></textarea>
          </div>
        </form>

        <!-- Join Room Form -->
        <form v-if="modalType === 'join'" @submit.prevent="handleJoinRoom">
          <div class="mb-3">
            <label class="form-label">Room ID</label>
            <input
                v-model="roomId"
                type="text"
                class="form-control"
                placeholder="Enter room ID"
                required
            >
          </div>
        </form>

        <!-- Leave Room Confirmation -->
        <div v-if="modalType === 'leave'">
          <p>Are you sure you want to leave "{{ roomToLeave?.name }}"?</p>
          <p class="text-muted">You'll need a new invitation to rejoin this room.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button
            type="button"
            class="btn btn-secondary"
            @click="closeModal"
        >
          Cancel
        </button>
        <button
            type="button"
            class="btn btn-primary"
            @click="handleAction"
            :disabled="isActionDisabled"
        >
          {{ actionButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatRoomModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    modalType: {
      type: String,
      required: true,
      validator: value => ['create', 'join', 'leave'].includes(value)
    },
    roomToLeave: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      roomName: '',
      roomDescription: '',
      roomId: ''
    }
  },
  computed: {
    modalTitle() {
      const titles = {
        create: 'Create New Room',
        join: 'Join Room',
        leave: 'Leave Room'
      }
      return titles[this.modalType]
    },
    actionButtonText() {
      const texts = {
        create: 'Create',
        join: 'Join',
        leave: 'Leave'
      }
      return texts[this.modalType]
    },
    isActionDisabled() {
      if (this.modalType === 'create') {
        return !this.roomName.trim()
      }
      if (this.modalType === 'join') {
        return !this.roomId.trim()
      }
      return false
    }
  },
  methods: {
    closeModal() {
      this.$emit('update:show', false)
      this.resetForm()
    },
    handleAction() {
      switch (this.modalType) {
        case 'create':
          this.$socket.emit('create-room', {
            name: this.roomName,
            description: this.roomDescription
          })
          break
        case 'join':
          this.$socket.emit('join-room', this.roomId)
          break
        case 'leave':
          this.$emit('leave', this.roomToLeave)
          break
      }
      this.closeModal()
    },
    resetForm() {
      this.roomName = ''
      this.roomDescription = ''
      this.roomId = ''
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  margin: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>