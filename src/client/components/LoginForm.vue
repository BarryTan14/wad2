<!-- LoginForm.vue -->
<template>
  <div class="w-full">
    <h2 class="text-2xl font-bold text-white mb-6">Welcome Back</h2>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-white text-sm font-medium mb-2">Username</label>
        <input
            type="text"
            v-model="formData.username"
            class="w-full px-4 py-2 bg-white/10 border border-gray-300/30 rounded-lg text-white placeholder-gray-400"
            :class="{ 'border-red-500': errors.username }"
            placeholder="Enter your username"
            @input="validateField('username')"
        >
        <p v-if="errors.username" class="mt-1 text-sm text-red-400">{{ errors.username }}</p>
      </div>

      <div>
        <label class="block text-white text-sm font-medium mb-2">Password</label>
        <input
            type="password"
            v-model="formData.password"
            class="w-full px-4 py-2 bg-white/10 border border-gray-300/30 rounded-lg text-white placeholder-gray-400"
            :class="{ 'border-red-500': errors.password }"
            placeholder="Enter your password"
            @input="validateField('password')"
        >
        <p v-if="errors.password" class="mt-1 text-sm text-red-400">{{ errors.password }}</p>
      </div>

      <button
          type="submit"
          class="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          :disabled="isSubmitting"
      >
        <span v-if="!isSubmitting">Login</span>
        <span v-else class="flex items-center justify-center">
          <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Logging in...
        </span>
      </button>

      <p class="text-center text-white mt-4">
        Don't have an account?
        <button
            type="button"
            @click="$emit('switch-view', 'register')"
            class="text-purple-400 hover:text-purple-300 ml-1"
        >
          Register here
        </button>
      </p>
    </form>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'LoginForm',

  setup(props, { emit }) {
    const formData = reactive({
      username: '',
      password: ''
    })

    const errors = reactive({
      username: '',
      password: ''
    })

    const isSubmitting = ref(false)

    const validateField = (field) => {
      errors[field] = ''

      if (field === 'username' && !formData.username) {
        errors.username = 'Username is required'
      }

      if (field === 'password' && !formData.password) {
        errors.password = 'Password is required'
      }
    }

    const handleSubmit = async () => {
      // Validate all fields
      validateField('username')
      validateField('password')

      // Check if there are any errors
      if (Object.values(errors).some(error => error)) {
        return
      }

      isSubmitting.value = true

      try {
        // Use your auth store to handle login
        await this.$authStore.login(formData.username, formData.password)

        emit('success')
      } catch (error) {
        if (error.errors) {
          error.errors.forEach(err => {
            if (err.path in errors) {
              errors[err.path] = err.msg
            }
          })
        } else {
          // Handle general error
          console.error(error)
        }
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      formData,
      errors,
      isSubmitting,
      validateField,
      handleSubmit
    }
  }
}
</script>