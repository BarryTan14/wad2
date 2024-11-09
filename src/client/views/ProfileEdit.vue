<template>
  <div class="profile bg-body-tertiary rounded-4 p-4">
    <!-- Previous loading and error states remain unchanged -->
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
        <!-- Profile image section remains unchanged -->
        <div class="col-12 col-md-4 mb-4 mb-md-0">
          <div class="profile-image-container position-relative">
            <img
                :src="profileImageUrl"
                class="rounded-3 img-fluid w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                :alt="userData.displayName + '\'s profile picture'"
                @error="handleImageError"
            >
            <button
                class="btn btn-primary btn-sm position-absolute bottom-0 end-0 m-2"
                @click="triggerImageUpload"
            >
              <span class="bi bi-camera-fill me-1">📷</span>
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
          <div class="row">
            <div class="m-0 col col-10">
              <h1 class="m-0 col col-12">
                <span v-if="!isEditing">{{ userData.displayName }}</span>
                <div v-else class="input-group">
                  <input
                      type="text"
                      v-model="editForm.displayName"
                      class="form-control"
                      @keyup.enter="saveChanges"
                      :maxlength="maxDisplayNameLength"
                  >
                  <span class="input-group-text text-muted">
                    {{ remainingDisplayNameChars }} remaining
                  </span>
                </div>
              </h1>
            </div>
            <div class="col col-12 col-md-2 order-first order-md-1">
              <button
                  class="btn btn-outline-primary d-inline-block col-12 col"
                  @click="toggleEditing"
              >
                {{ isEditing ? 'Cancel' : 'Edit Profile' }}
              </button>
            </div>
          </div>
          <div class="row">
            <h1 class="m-0 col col-12">
              <span v-if="!isEditing">{{ userData.role }}</span>
              <select
                  v-else
                  v-model="editForm.role"
                  class="form-control">
                <option v-for="role in roles" :key="role" :value="role">{{role}}</option>
              </select>
            </h1>
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