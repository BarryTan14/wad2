<template>
  <div class="profile bg-body-tertiary rounded-4 p-4">
    <div v-if="loading" class="loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading profile...</p>
    </div>

    <div v-else-if="error" class="error alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
      <button @click="fetchProfile" class="btn btn-outline-danger btn-sm ms-3">
        Try Again
      </button>
    </div>

    <div v-else class="profile-content">
      <div class="row">
        <div class="col-12 col-md-4 mb-4 mb-md-0">
          <div class="profile-image-container position-relative">
            <img
                :src="profileImageUrl"
                class="rounded-3 img-fluid w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                :alt="userData.displayName + '\'s profile picture'"
                @error="handleImageError"
            >
          </div>
        </div>

        <div class="col-12 col-md-8">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">{{ userData.displayName }}</h1>
            <h1 class="mb-0">{{ userData.role }}</h1>
          </div>

          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Bio</h5>
              <p class="card-text">
                {{ userData.bio || 'No bio added yet.' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import { useRouter } from "vue-router";

export default {
  name: 'ProfileView',

  props: {
    userId: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      loading: true,
      error: null,
      userData: {
        profilePic: '',
        displayName: '',
        bio: '',
        role: '',
      },
      fallbackImage: '/profilepicture/avatar.png',
      router: useRouter(),
    }
  },

  computed: {
    profileImageUrl() {
      return this.userData.profilePic
          ? `/profilepicture/${this.userData.profilePic}`
          : this.fallbackImage
    },
  },

  methods: {
    async fetchProfile() {
      if (this.$authStore.currentUser._id === this.userId) {
        this.router.push('/profile')
        return
      }

      try {
        this.loading = true
        this.error = null
        const response = await axios.get(`/user/api/profile/${this.userId}`)
        this.userData = response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load profile'
        console.error('Error fetching profile:', err)
      } finally {
        this.loading = false
      }
    },

    handleImageError(event) {
      event.target.src = this.fallbackImage
    }
  },

  mounted() {
    this.fetchProfile()
  },

  watch: {
    userId: {
      handler: 'fetchProfile',
      immediate: true
    }
  }
}
</script>

<style scoped>
.profile-image-container {
  aspect-ratio: 1;
  width: 100%;
  position: relative;
  margin-bottom: 1rem;
  border-radius: 0.3rem;
  overflow: hidden;
}

.profile-image-container img {
  border-radius: 0;
}

.profile {
  min-height: 50vh;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.error {
  text-align: center;
  padding: 1rem;
}
</style>