<!-- AuthDropdown.vue -->
<script>

export default {
  name: 'AuthDropdown',

  data() {
    return {
      fallbackImage: '/profilepicture/avatar.png',
    }
  },

  computed: {

    isLoggedIn() {
      return this.$authStore.currentUser !== null
    }
  },

  beforeMount() {

  },

  methods: {
    async handleLogout() {
      const result = await this.$swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      });

      if (result.isConfirmed) {
        await this.$authStore.logout()
        this.$socket.disconnect();
        this.eraseCookie('roomId')
        await this.$swal.fire({
          icon:'info',
          title:'Logout Successful',
          showConfirmButton:false,
          timer: 1000,
        })
        //this.$router.push('/')
        window.location.href = '/';
      }
    },
    eraseCookie(name) {
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }
}
</script>

<template>
  <div class="dropdown">
    <!-- Dropdown Toggle Button -->
    <div
        class="d-flex align-items-center dropdown-toggle"
        data-bs-toggle="dropdown"
        role="button"
        aria-expanded="false"
    >
      <img
          :src="isLoggedIn
          ? `/profilepicture/${$authStore.currentUser.profilePic}`
          : fallbackImage"
          :alt="isLoggedIn ? $authStore.currentUser.displayName : 'Guest'"
          class="rounded-circle me-2"
          style="width: 40px; height: 40px; object-fit: cover;"
      >
      <div class="d-none d-sm-block"> <!-- Hide text on mobile -->
        <div class="fw-bold">
          {{ isLoggedIn ? $authStore.currentUser.displayName : 'Guest' }}
        </div>
        <div class="text-muted small">
          {{ isLoggedIn ? $authStore.currentUser.role : 'Not logged in' }}
        </div>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <ul class="dropdown-menu dropdown-menu-end">
      <template v-if="isLoggedIn">
        <li>
          <RouterLink to="/profile" class="dropdown-item">
            <i class="bi bi-person me-2"></i>Profile
          </RouterLink>
        </li>
        <!--        <li>
                  <RouterLink to="/settings" class="dropdown-item">
                    <i class="bi bi-gear me-2"></i>Settings
                  </RouterLink>
                </li>-->
        <li>
          <hr class="dropdown-divider">
        </li>
        <li>
          <button
              @click="handleLogout"
              class="dropdown-item text-danger"
          >
            <i class="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </li>
      </template>
      <template v-else>
        <li>
          <RouterLink to="/login" class="dropdown-item">
            <i class="bi bi-box-arrow-in-right me-2"></i>Login
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/register" class="dropdown-item">
            <i class="bi bi-person-plus me-2"></i>Register
          </RouterLink>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
.dropdown-toggle::after {
  margin-left: 0.5rem;
}

.dropdown-toggle {
  cursor: pointer;
}

/* Optional: Add hover effect to dropdown items */
.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item i {
  width: 1rem;
  text-align: center;
}
</style>