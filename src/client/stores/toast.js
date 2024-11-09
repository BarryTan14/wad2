import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Toast configuration constants
const TOAST_CONFIG = {
    DEFAULT_TIMEOUT: 5000,
    DEFAULT_TYPE: 'info',
    PROGRESS_UPDATE_INTERVAL: 10,
    TYPES: ['success', 'error', 'info', 'warning']
}

export const useToastStore = defineStore('toast', () => {
    const toasts = ref([])
    const activeTimers = new Map()
    let toastId = 0

    // Computed property for active toasts
    const activeToasts = computed(() => toasts.value)

    function addToast({
                          message,
                          type = TOAST_CONFIG.DEFAULT_TYPE,
                          timeout = TOAST_CONFIG.DEFAULT_TIMEOUT,
                          dismissible = true
                      }) {
        const id = toastId++
        const createdAt = Date.now()

        const toast = {
            id,
            message,
            type,
            timeout,
            dismissible,
            progress: 100,
            createdAt
        }

        toasts.value.push(toast)

        if (timeout > 0) {
            const intervalId = setInterval(() => {
                updateToastProgress(id, createdAt, timeout)
            }, TOAST_CONFIG.PROGRESS_UPDATE_INTERVAL)

            const timeoutId = setTimeout(() => {
                clearToastTimers(id)
                removeToast(id)
            }, timeout)

            activeTimers.set(id, {
                interval: intervalId,
                timeout: timeoutId
            })
        }

        return id
    }

    function updateToastProgress(id, startTime, timeout) {
        const elapsedTime = Date.now() - startTime
        const progress = 100 - (elapsedTime / timeout) * 100

        const toastIndex = toasts.value.findIndex(t => t.id === id)
        if (toastIndex !== -1) {
            toasts.value[toastIndex].progress = Math.max(progress, 0)
        }
    }

    function removeToast(id) {
        clearToastTimers(id)
        const index = toasts.value.findIndex(toast => toast.id === id)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    function clearToastTimers(id) {
        const timers = activeTimers.get(id)
        if (timers) {
            clearInterval(timers.interval)
            clearTimeout(timers.timeout)
            activeTimers.delete(id)
        }
    }

    function clearAllToasts() {
        toasts.value.forEach(toast => {
            clearToastTimers(toast.id)
        })
        toasts.value = []
    }

    // Convenience methods for different toast types
    const success = (message, options = {}) =>
        addToast({ message, type: 'success', ...options })
    const error = (message, options = {}) =>
        addToast({ message, type: 'error', ...options })
    const info = (message, options = {}) =>
        addToast({ message, type: 'info', ...options })
    const warning = (message, options = {}) =>
        addToast({ message, type: 'warning', ...options })

    return {
        toasts: activeToasts,
        addToast,
        removeToast,
        clearAllToasts,
        success,
        error,
        info,
        warning
    }
})