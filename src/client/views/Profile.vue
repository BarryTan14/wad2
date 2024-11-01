<template>
  <div class="profile">
    <div v-if="loading" class="loading">
      Loading profile...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <h1>{{ userData.displayName }}</h1>
      <p>{{ userData.bio }}</p>
    </div>
  </div>
</template>

<script setup lang="js">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(true)
const error = ref(null)
const userData = reactive({
  displayName: '',
  bio: ''
})

async function fetchUserProfile() {
  try {
    loading.value = true
    error.value = null

    const response = await axios.get('/user/api/profile')

    // Update reactive userData object with response data
    userData.displayName = response.data.displayName
    userData.bio = response.data.bio
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load profile'
    console.error('Error fetching profile:', err)
  } finally {
    loading.value = false
  }
}

// Fetch data when component mounts
onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.profile {
  padding: 1rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: red;
}

@media (min-width: 1024px) {
  .profile {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>