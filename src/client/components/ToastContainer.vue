<template>
  <div class="position-fixed top-0 end-0 p-3" style="z-index: 1050">
    <TransitionGroup name="toast">
      <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="toast show"
          :class="[
          'rounded shadow p-3 mb-2',
          'fade-transition',
          toast.type === 'success' ? 'bg-success' :
          toast.type === 'error' ? 'bg-danger' :
          toast.type === 'warning' ? 'bg-warning text-dark' : 'bg-info',
        ]"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
      >
        <div class="d-flex">
          <div class="toast-body">
            {{ toast.message }}
          </div>
          <button
              type="button"
              class="btn-close btn-close-white ms-auto"
              @click="toastStore.removeToast(toast.id)"
              aria-label="Close"
          ></button>
        </div>
        <!-- Progress bar -->
        <div
            v-if="toast.timeout > 0"
            class="progress position-absolute bottom-0 start-0 w-100"
            style="height: 4px"
        >
          <div
              class="progress-bar bg-white bg-opacity-25"
              :style="{ width: `${toast.progress}%` }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.fade-transition {
  transition: all 0.3s ease;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Custom styling for the progress bar */
.progress {
  background: transparent;
}

/* Toast shadows and roundness */
.toast {
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

/* Close button hover effect */
.btn-close-white:hover {
  opacity: 1;
}
</style>

<script setup>
import { useToastStore } from '../stores/toast'
import { TransitionGroup } from 'vue'

const toastStore = useToastStore()
</script>