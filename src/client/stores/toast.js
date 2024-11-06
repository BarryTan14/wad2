import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
    const toasts = ref([])
    let toastId = 0

    function addToast({ message, type = 'info', timeout = 5000 }) {
        const id = toastId++

        const toast = {
            id,
            message,
            type,
            timeout,
            progress: 100
        }

        toasts.value.push(toast)

        if (timeout > 0) {
            const startTime = Date.now()
            const intervalId = setInterval(() => {
                const elapsedTime = Date.now() - startTime
                const progress = 100 - (elapsedTime / timeout) * 100

                const toastIndex = toasts.value.findIndex(t => t.id === id)
                if (toastIndex !== -1) {
                    toasts.value[toastIndex].progress = Math.max(progress, 0)
                }
            }, 10)

            setTimeout(() => {
                clearInterval(intervalId)
                removeToast(id)
            }, timeout)
        }

        return id
    }

    function removeToast(id) {
        const index = toasts.value.findIndex(toast => toast.id === id)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    const success = (message, timeout) => addToast({ message, type: 'success', timeout })
    const error = (message, timeout) => addToast({ message, type: 'error', timeout })
    const info = (message, timeout) => addToast({ message, type: 'info', timeout })
    const warning = (message, timeout) => addToast({ message, type: 'warning', timeout })

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning
    }
})