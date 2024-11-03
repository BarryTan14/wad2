<!-- ProfileView.vue (Read-only view of other users' profiles) -->
<template>
  <div class="profile bg-body-tertiary rounded-4 p-4">
    <!-- Loading/Error states -->
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
          <img
              :src="profileImageUrl"
              class="rounded-3 img-fluid mb-3"
              :alt="userData.displayName + '\'s profile picture'"
              @error="handleImageError"
          >
        </div>

        <div class="col-12 col-md-8">
          <h1 class="mb-4">{{ userData.displayName }}</h1>

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
import { useAuthStore } from '../stores/auth.js'
import { useToastStore } from '../stores/toast';
import {useRouter} from "vue-router";

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
        bio: ''
      },
      fallbackImage: '/src/client/assets/profilepicture/avatar.png',
      router:null,
      authStore:null,
    }
  },

  computed: {
    profileImageUrl() {
      return this.userData.profilePic
          ? `/src/client/assets/profilepicture/${this.userData.profilePic}`
          : this.fallbackImage
    }
  },

  methods: {
    async fetchProfile() {
      try {
        this.loading = true
        this.error = null
        if(this.authStore.currentUser._id === this.userId) {
          this.toastStore.warning('You have been redirected to your own profile');
          return this.router.push('/profile')
        }
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
    this.router = useRouter()
    this.authStore = useAuthStore()
    this.toastStore = useToastStore();
    this.fetchProfile()
  },

  beforeMount() {
  },

  // Reload when userId changes
  watch: {
    userId: {
      handler: 'fetchProfile',
      immediate: true
    }
  }
}
</script>

<style scoped>
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