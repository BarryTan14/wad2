<template>
  <div class="styled-dropdown-container">

    <ChatRoomModal
        v-model:show="showModal"
        :modal-type="modalType"
        :room-to-leave="selectedRoomToLeave"
        @create="handleCreateRoom"
        @join="handleJoinRoom"
        @leave="handleLeaveRoom"
    />

    <div class="input-wrapper">
      <span class="chevron">▼</span>
      <input
          ref="inputField"
          :value="modelValue"
          @input="handleInput"
          class="chosen-value"
          type="text"
          :placeholder="isOpen ? 'Type to filter' : placeholder"
          @focus="handleFocus"
          @blur="handleBlur"
      />
    </div>
    <ul :class="['value-list', { open: isOpen }]">
      <!-- Management options -->
      <div class="management-options">
        <li class="management-option" @click="openModal('create')">
          <span class="plus-icon">📝</span> Create New Room
        </li>
        <li class="management-option" @click="openModal('join')">
          <span class="join-icon">🚪</span> Join Existing Room
        </li>
      </div>

      <!-- Divider -->
      <div class="divider">
        <span class="divider-text">Your Rooms</span>
      </div>

      <!-- Room list -->
      <li
          v-for="(option, index) in displayedOptions"
          :key="index"
          class="room-option"
          @click="selectOption(option)"
      >
        <span class="room-name">{{ option.name }}</span>
        <button
            class="leave-button"
            @click.stop="leaveRoom(option)"
            v-if="option.name !== 'General'"
        >
          Leave
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import ChatRoomModal from "./ChatRoomModal.vue";

export default {
  name: 'StyledDropdown',
  components: {
    ChatRoomModal,
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      required: true
    },
    placeholder: {
      type: String,
      default: 'Select option'
    }
  },
  emits: ['update:modelValue', 'option-selected', 'create-room', 'join-room', 'leave-room'],
  data() {
    return {
      isOpen: false,
      selectedOption: null,
      isFiltering: false,
      showModal: false,
      modalType: 'create',
      selectedRoomToLeave: null,
      isMobile: false
    }
  },
  created() {
    // Check if device is mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  computed: {
    displayedOptions() {
      if (!this.isFiltering) {
        return this.options;
      }
      return this.options.filter(option =>
          option.name.toLowerCase().includes(this.modelValue.toLowerCase())
      );
    }
  },
  methods: {
    handleFocus(event) {
      if (this.isMobile) {
        event.target.blur(); // Immediately blur the input on mobile
        this.isOpen = !this.isOpen; // Just toggle the dropdown
      } else {
        this.openDropdown();
      }
    },
    openDropdown() {
      this.isOpen = true;
      this.isFiltering = false;
    },
    leaveRoom(option) {
      this.$socket.emit('leave-room', option._id);
    },
    handleBlur() {
      if (!this.isMobile) {
        setTimeout(() => {
          this.isOpen = false;
          this.isFiltering = false;
        }, 200);
      }
    },
    handleInput(event) {
      const value = event.target.value;
      this.$emit('update:modelValue', value);
      this.isFiltering = value.length > 0;
    },
    selectOption(option) {
      this.selectedOption = option;
      this.$emit('update:modelValue', option.name);
      this.$emit('option-selected', option);
      this.isOpen = false;
      this.isFiltering = false;
    },
    openModal(type, room = null) {
      this.modalType = type;
      this.selectedRoomToLeave = room;
      this.showModal = true;
    },
    handleLeaveClick(room) {
      this.openModal('leave', room);
    },
    handleCreateRoom(roomData) {
      this.$emit('create-room', roomData);
    },
    handleJoinRoom(roomId) {
      this.$emit('join-room', roomId);
    },
    handleLeaveRoom(room) {
      this.$emit('leave-room', room);
    }
  }
}
</script>

<style scoped>
.styled-dropdown-container {
  position: relative;
  width: 300px;
  height: 100%;
  display: flex;
  align-items: center;
}

.input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.chevron {
  position: absolute;
  left: 1rem;
  color: white;
  font-size: 0.8rem;
  pointer-events: none;
  transition: transform 0.3s ease;
  z-index: 1;
}

.open .chevron {
  transform: rotate(180deg);
}

.chosen-value {
  position: relative;
  width: 100%;
  height: 40px;
  font-size: 0.9rem;
  padding: 0 1rem 0 2.5rem;
  background-color: var(--bs-purple);
  border: none;
  color: white;
  transition: .3s ease-in-out;
  cursor: pointer;
}

.chosen-value::placeholder {
  color: rgba(255, 255, 255, 0.8);
}

.chosen-value:focus {
  outline: 0;
  background-color: var(--bs-purple);
}

.value-list {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  list-style: none;
  margin: 0;
  padding: 0;
  box-shadow: 0px 5px 8px 0px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-height: 0;
  transition: .3s ease-in-out;
  z-index: 1001;
  background-color: white;
}

.value-list.open {
  max-height: 320px;
  overflow: auto;
}

/* Management options styling */
.management-options {
  background-color: #f8f9fa;
}

.management-option {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
  color: var(--bs-purple);
  height: 40px;
}

.management-option:hover {
  background-color: #e9ecef;
}

.plus-icon, .join-icon, .leave-icon {
  margin-right: 0.5rem;
  font-weight: bold;
}

/* Divider styling */
.divider {
  position: relative;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.divider-text {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

/* Room option styling */
.room-option {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.3s;
  color: var(--bs-purple);
  height: 40px;
  position: relative;
  overflow: hidden;
}

.room-name {
  transition: transform 0.3s ease;
}

.leave-button {
  position: absolute;
  right: -100px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: right 0.3s ease;
  cursor: pointer;
}

.leave-button:hover {
  background-color: #c82333;
}

.room-option:hover {
  background-color: #f8f9fa;
}

.room-option:hover .leave-button {
  right: 1rem;
}

.room-option:hover .room-name {

}

.value-list::-webkit-scrollbar {
  width: 4px;
}

.value-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.value-list::-webkit-scrollbar-thumb {
  background: var(--bs-purple);
  border-radius: 2px;
}

/* Input wrapper hover effects */
.input-wrapper:hover .chosen-value {
  background-color: rgba(var(--bs-purple-rgb), 0.9);
}

.input-wrapper:hover .chevron {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}
/* Add new styles for mobile filter */
.filter-input-mobile {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.mobile-filter {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Make the dropdown scroll area larger on mobile */
@media (max-width: 768px) {
  .value-list.open {
    max-height: 70vh;
  }
}
</style>