<template>
  <div class="profile bg-body-tertiary shadow-sm rounded-4 p-4 p-md-5">
    <!-- Loading State -->
    <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center min-vh-50">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-body-secondary">Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger d-flex align-items-center shadow-sm">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <div class="flex-grow-1">{{ error }}</div>
      <button @click="fetchProfile" class="btn btn-outline-danger btn-sm">
        Try Again
      </button>
    </div>

    <!-- Profile Content -->
    <div v-else class="profile-content">
      <div class="row g-4">
        <!-- Profile Image Section -->
        <div class="col-12 col-md-4">
          <div class="profile-image-container shadow-sm bg-body-secondary">
            <img
                :src="profileImageUrl"
                class="rounded-3 img-fluid w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                :alt="userData.displayName + '\'s profile picture'"
                @error="handleImageError"
            >
          </div>
        </div>

        <!-- Profile Details Section -->
        <div class="col-12 col-md-8">
          <!-- Header Section -->
          <div class="d-flex flex-wrap align-items-start mb-4 gap-3">
            <div class="flex-grow-1">
              <div class="mb-3">
                <div class="h2 mb-1 text-body">{{ userData.displayName }}</div>
              </div>

              <div class="mb-3">
                <div class="badge bg-primary fs-6">{{ userData.role }}</div>
              </div>
            </div>
          </div>

          <!-- Bio Card -->
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-3">Bio</h5>
              <p class="card-text text-body-secondary">
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
        const response = await axios.get(`/api/user/profile/${this.userId}`)
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