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
      <button @click="fetchUserProfile" class="btn btn-outline-danger btn-sm">
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
            <div class="position-absolute bottom-0 start-0 end-0 p-3 overlay-gradient">
              <button
                  class="btn btn-light btn-sm w-100"
                  @click="triggerImageUpload"
              >
                <span class="bi bi-camera-fill me-2">📷</span>
                Change Photo
              </button>
            </div>
            <input
                type="file"
                ref="fileInput"
                class="d-none"
                accept="image/*"
                @change="handleImageUpload"
            >
          </div>
        </div>

        <!-- Profile Details Section -->
        <div class="col-12 col-md-8">
          <!-- Header Section -->
          <div class="d-flex flex-wrap align-items-start mb-4 gap-3">
            <div class="flex-grow-1">
              <div class="mb-3">
                <div v-if="!isEditing" class="h2 mb-1 text-body">{{ userData.displayName }}</div>
                <div v-else class="input-group">
                  <input
                      type="text"
                      v-model="editForm.displayName"
                      class="form-control form-control-lg"
                      @keyup.enter="saveChanges"
                      :maxlength="maxDisplayNameLength"
                      placeholder="Display Name"
                  >
                  <span class="input-group-text text-body-secondary small">
                    {{ remainingDisplayNameChars }}
                  </span>
                </div>
              </div>

              <div class="mb-3">
                <div v-if="!isEditing" class="badge bg-primary fs-6">{{ userData.role }}</div>
                <select
                    v-else
                    v-model="editForm.role"
                    class="form-select"
                >
                  <option v-for="role in roles" :key="role" :value="role">{{role}}</option>
                </select>
              </div>
            </div>

            <div class="d-flex gap-2">
              <button
                  class="btn btn-outline-primary"
                  @click="toggleEditing"
              >
                {{ isEditing ? 'Cancel' : 'Edit Profile' }}
              </button>
            </div>
          </div>

          <!-- Bio Card -->
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">Bio</h5>
                <small class="text-body-secondary" v-if="isEditing">
                  {{ remainingBioChars }} characters remaining
                </small>
              </div>

              <p v-if="!isEditing" class="card-text text-body-secondary">
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

              <div v-if="isEditing" class="d-flex gap-2 mt-4">
                <button
                    class="btn btn-primary"
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
import {useRouter} from "vue-router";

export default {
  name: 'Profile',

  data() {
    return {
      loading: true,
      error: null,
      roles: ['User', 'Student'],
      userData: {
        profilePic: '',
        displayName: '',
        bio: '',
        role: '',
      },
      isEditing: false,
      isSaving: false,
      editForm: {
        displayName: '',
        bio: '',
        action: 'generalInfo',
        role: '',
      },
      maxBioLength: 500,
      maxDisplayNameLength: 50,
      fallbackImage: '/profilepicture/avatar.png',
      router:null,
    }
  },

  computed: {
    profileImageUrl() {
      return this.userData.profilePic
          ? `/profilepicture/${this.userData.profilePic}`
          : this.fallbackImage
    },

    remainingBioChars() {
      return this.maxBioLength - this.editForm.bio.length
    },

    remainingDisplayNameChars() {
      return this.maxDisplayNameLength - (this.editForm.displayName?.length || 0)
    }
  },

  methods: {
    async fetchUserProfile() {
      try {
        this.loading = true
        this.error = null

        const response = await axios.get('/api/user/profile')
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
        action: 'generalInfo',
        role: this.userData.role,
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
        this.isSaving = true;

        const response = await axios.put('/api/user/profile/update', {
          displayName: this.editForm.displayName,
          bio: this.editForm.bio,
          action: this.editForm.action,
          role: this.editForm.role,
        });

        this.userData = response.data.user;

        this.isEditing = false;

        this.$authStore.updateProfileState();

        // Emit socket event for profile update
        this.$socket.emit('profile-updated', this.userData._id);

        this.handleToastSuccess(response.data.message);
      } catch (err) {
        this.handleToastError(err.response?.data?.message || 'Failed to update profile');
      } finally {
        this.isSaving = false;
      }
    },

    triggerImageUpload() {
      this.$refs.fileInput.click()
    },

    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.handleToastError('Image size should be less than 5MB');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('profilePic', file);

        const response = await axios.post('/api/user/profile/picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.userData = response.data.user;

        this.$authStore.updateProfileState();

        // Emit socket event for profile update
        this.$socket.emit('profile-updated', this.userData._id);

        this.handleToastSuccess('Profile picture updated successfully!');
      } catch (err) {
        this.handleToastError(err.response?.data?.message || 'Failed to upload image');
      }
    },

    handleToastSuccess(message) {
      this.$toast.fire({
        icon: 'success',
        title: message
      });
    },
    handleToastError(error) {
      if (error.errors) {
        for (const err of error.errors) {
          this.$toast.fire({
            icon: 'error',
            title: `The ${err.type} ${err.path} has an error of: ${err.msg}`,
          })
        }
      } else {
        this.$toast.fire({
          icon: 'error',
          title:error.message || error.msg || error,
        })
      }
    },

    handleImageError(event) {
      event.target.src = this.fallbackImage
    }
  },

  mounted() {
    this.router = useRouter()
    this.fetchUserProfile()
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

textarea {
  resize: vertical;
  min-height: 100px;
}
</style>