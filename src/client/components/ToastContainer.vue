<template>
  <div
      class="toast-container position-fixed top-0 end-0 p-3"
      style="z-index: 1050"
      role="region"
      aria-label="Notifications"
  >
    <TransitionGroup
        name="toast"
        tag="div"
        @before-leave="beforeLeave"
    >
      <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="toast show"
          :class="[
          'rounded shadow p-3 mb-2',
          'fade-transition',
          toastTypeClasses[toast.type],
          { 'pe-none': !toast.dismissible }
        ]"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
      >
        <div class="d-flex align-items-center">
          <div class="toast-icon me-2">
            <component :is="toastIcons[toast.type]" />
          </div>
          <div class="toast-body flex-grow-1">
            {{ toast.message }}
          </div>
          <button
              v-if="toast.dismissible"
              type="button"
              class="btn-close btn-close-white ms-2"
              @click="toastStore.removeToast(toast.id)"
              aria-label="Close notification"
          />
        </div>

        <div
            v-if="toast.timeout > 0"
            class="progress position-absolute bottom-0 start-0 w-100 rounded-bottom"
            style="height: 3px"
        >
          <div
              class="progress-bar"
              :class="progressBarClasses[toast.type]"
              :style="{ width: `${toast.progress}%` }"
          />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'
import { TransitionGroup } from 'vue'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-vue-next'

const toastStore = useToastStore()

const toastTypeClasses = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  warning: 'bg-warning text-dark',
  info: 'bg-info text-white'
}

const progressBarClasses = {
  success: 'bg-white bg-opacity-25',
  error: 'bg-white bg-opacity-25',
  warning: 'bg-dark bg-opacity-25',
  info: 'bg-white bg-opacity-25'
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
}

// Ensure smooth animation when removing toasts
const beforeLeave = (el) => {
  const height = el.getBoundingClientRect().height
  el.style.height = height + 'px'
  el.style.marginBottom = '0'
  el.style.opacity = '0'
}
</script>

<style scoped>
.toast-container {
  max-width: 400px;
}

.toast {
  border: none;
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
  min-width: 250px;
  max-width: 100%;
}

.fade-transition {
  transition: all 0.3s ease-in-out;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease-in-out;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-active {
  position: absolute;
}

.progress {
  background: transparent;
  overflow: hidden;
}

.progress-bar {
  transition: width 10ms linear;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Improve accessibility focus styles */
.btn-close:focus {
  box-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.25);
}
</style>