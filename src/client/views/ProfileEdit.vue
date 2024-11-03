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
      <button @click="fetchUserProfile" class="btn btn-outline-danger btn-sm ms-3">
        Try Again
      </button>
    </div>

    <div v-else class="profile-content">
      <div class="row">
        <div class="col-12 col-md-4 mb-4 mb-md-0">
          <div class="position-relative">
            <img
                :src="profileImageUrl"
                class="rounded-3 img-fluid mb-3"
                :alt="userData.displayName + '\'s profile picture'"
                @error="handleImageError"
            >
            <button
                class="btn btn-primary btn-sm position-absolute bottom-0 end-0 m-2"
                @click="triggerImageUpload"
            >
              <i class="bi bi-camera-fill me-1"></i>
              Change Photo
            </button>
            <input
                type="file"
                ref="fileInput"
                class="d-none"
                accept="image/*"
                @change="handleImageUpload"
            >
          </div>
        </div>

        <div class="col-12 col-md-8">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">
              <span v-if="!isEditing">{{ userData.displayName }}</span>
              <input
                  v-else
                  type="text"
                  v-model="editForm.displayName"
                  class="form-control"
                  @keyup.enter="saveChanges"
              >
            </h1>
            <button
                class="btn btn-outline-primary"
                @click="toggleEditing"
            >
              {{ isEditing ? 'Cancel' : 'Edit Profile' }}
            </button>
          </div>

          <div class="card">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between align-items-center">
                Bio
                <small class="text-muted" v-if="isEditing">
                  {{ remainingBioChars }} characters remaining
                </small>
              </h5>

              <p v-if="!isEditing" class="card-text">
                {{ userData.bio || 'No bio added yet.' }}
              </p>

              <textarea
                  v-else
                  v-model="editForm.bio"
                  class="form-control"
                  rows="4"
                  :maxlength="maxBioLength"
                  placeholder="Tell us about yourself..."
              ></textarea>

              <div v-if="isEditing" class="mt-3">
                <button
                    class="btn btn-primary me-2"
                    @click="saveChanges"
                    :disabled="isSaving"
                >
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                  Save Changes
                </button>
                <button
                    class="btn btn-outline-secondary"
                    @click="cancelEditing"
                    :disabled="isSaving"
                >
                  Cancel
                </button>
              </div>
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
  name: 'Profile',

  data() {
    return {
      loading: true,
      error: null,
      userData: {
        profilePic: '',
        displayName: '',
        bio: ''
      },
      isEditing: false,
      isSaving: false,
      editForm: {
        displayName: '',
        bio: '',
        action: 'generalInfo',
      },
      maxBioLength: 500,
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
    },

    remainingBioChars() {
      return this.maxBioLength - this.editForm.bio.length
    }
  },

  methods: {
    async fetchUserProfile() {
      try {
        this.loading = true
        this.error = null

        const response = await axios.get('/user/api/profile')
        this.userData = response.data
        this.resetEditForm()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load profile'
        console.error('Error fetching profile:', err)
      } finally {
        this.loading = false
      }
    },

    resetEditForm() {
      this.editForm = {
        displayName: this.userData.displayName,
        bio: this.userData.bio,
        action: 'generalInfo'
      }
    },

    toggleEditing() {
      this.isEditing = !this.isEditing
      if (this.isEditing) {
        this.resetEditForm()
      }
    },

    cancelEditing() {
      this.isEditing = false
      this.resetEditForm()
    },

    async saveChanges() {
      try {
        this.isSaving = true

        const response = await axios.put('/user/api/profile/update', {
          displayName: this.editForm.displayName,
          bio: this.editForm.bio,
          action: this.editForm.action,
        })

        this.userData = response.data.user
        this.isEditing = false

        const toastStore = useToastStore()
        toastStore.success(response.data.message)
      } catch (err) {
        const toastStore = useToastStore()
        toastStore.error(err.response?.data?.message || 'Failed to update profile')
      } finally {
        this.isSaving = false
      }
    },

    triggerImageUpload() {
      this.$refs.fileInput.click()
    },

    async handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        const toastStore = useToastStore()
        toastStore.error('Image size should be less than 5MB')
        return
      }

      try {
        const formData = new FormData()
        formData.append('profilePic', file)

        const response = await axios.post('/user/api/profile/picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        this.userData.profilePic = response.data.profilePic

        const toastStore = useToastStore()
        this.authStore.updateProfileState();
        toastStore.success('Profile picture updated successfully!')
      } catch (err) {
        const toastStore = useToastStore()
        toastStore.error(err.response?.data?.message || 'Failed to upload image')
      }
    },

    handleImageError(event) {
      event.target.src = this.fallbackImage
    }
  },

  mounted() {
    this.router = useRouter()
    this.fetchUserProfile()
    this.authStore = useAuthStore()
    this.toastStore = useToastStore();
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

textarea {
  resize: vertical;
  min-height: 100px;
}
</style>