<template>
  <div class="logout">
    <h1 class="">Logout</h1>
    <form onsubmit="return false;">
      <div class="mb-3">
        <label class="form-label">Are you sure you want to log out?</label>
      </div>
      <button class="btn btn-primary form-input" @click="logout" id="logoutBtn" :disabled="logoutDisabled">Logout<span
          class="spinner-border spinner-border-sm ms-3" id="logoutBtnSpn" :hidden="!logoutDisabled"></span></button>
    </form>
  </div>
</template>
<script>
import { useAuthStore } from '../stores/auth.js'
import { useRouter } from 'vue-router'
import { getCurrentInstance } from 'vue'

export default {
  name: "Logout",
  data() {
    return {
      logoutDisabled: false,
      router: null,
      authStore: null,
    }
  },
  methods: {
    async logout() {
      this.logoutDisabled = true

      try {
        const response = await this.authStore.logout()

        // Reconnect socket with new auth state
        this.$socket.disconnect()
        this.$socket.connect()

        alert(response.message)
        this.router.push('/login')
      } catch (error) {
        alert(error.message)
      } finally {
        this.logoutDisabled = false
      }
    },
  },
  mounted() {

  },
  beforeMount() {
    this.router = useRouter()
    this.authStore = useAuthStore()
  },
}
</script>
<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
