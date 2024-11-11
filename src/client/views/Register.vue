<template>
  <div class="register row">
    <div class="col col-12 col-lg-6">
      <h1>Register</h1>
      <form @submit.prevent="register">
        <div class="mb-3">
          <label for="exampleInputEmail1" class="form-label">Email</label>
          <input
              type="email"
              class="form-control form-input py-3 py-md-2"
              :class="{ 'is-invalid': errors.email, 'is-valid': formData.email && !errors.email }"
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              :disabled="registerDisabled"
              v-model="formData.email"
              @input="debouncedValidate('email')"
          >
          <div class="requirements-list" v-if="!formData.email && !errors.email">
<!--            <small class="text-muted">Requirements:</small>
            <ul class="text-muted">
              <li>Must be a valid email address (e.g., user@example.com)</li>
            </ul>-->
          </div>
          <div class="invalid-feedback" v-if="errors.email">
            {{ errors.email }}
          </div>
        </div>

        <div class="mb-3">
          <label for="exampleInputUsername1" class="form-label">Username</label>
          <input
              type="text"
              class="form-control form-input py-3 py-md-2"
              :class="{ 'is-invalid': errors.username, 'is-valid': formData.username && !errors.username }"
              id="exampleInputUsername1"
              :disabled="registerDisabled"
              v-model="formData.username"
              @input="debouncedValidate('username')"
          >
          <div class="requirements-list" v-if="!formData.username && !errors.username">
<!--            <small class="text-muted">Requirements:</small>
            <ul class="text-muted">
              <li>At least 3 characters long</li>
              <li>Can only contain letters, numbers, and underscores</li>
            </ul>-->
          </div>
          <div class="invalid-feedback" v-if="errors.username">
            {{ errors.username }}
          </div>
        </div>

        <div class="mb-3">
          <label for="exampleInputPassword1" class="form-label">Password</label>
          <input
              type="password"
              class="form-control form-input  py-3 py-md-2"
              :class="{ 'is-invalid': errors.password, 'is-valid': formData.password && !errors.password }"
              id="exampleInputPassword1"
              :disabled="registerDisabled"
              v-model="formData.password"
              @input="debouncedValidate('password')"
          >
          <div class="password-strength-indicator" v-if="formData.password">
            <div class="progress mb-2">
              <div
                  class="progress-bar"
                  role="progressbar"
                  :style="{ width: passwordStrength + '%' }"
                  :class="passwordStrengthClass"
              ></div>
            </div>
            <small :class="passwordStrengthTextClass">
              Password strength: {{ passwordStrengthText }}
            </small>
          </div>
          <div class="requirements-list" v-if="!formData.password && !errors.password">
<!--            <small class="text-muted">Requirements:</small>
            <ul class="text-muted">
              <li>At least 6 characters long</li>
              <li>Must contain at least one uppercase letter</li>
              <li>Must contain at least one lowercase letter</li>
              <li>Must contain at least one number</li>
            </ul>-->
          </div>
          <div class="invalid-feedback" v-if="errors.password">
            {{ errors.password }}
          </div>
        </div>

        <button
            class="btn btn-primary form-input py-3 py-md-2 w-100"
            type="submit"
            id="registerBtn"
            :disabled="registerDisabled || !isFormValid"
        >
          Register
          <span
              class="spinner-border spinner-border-sm ms-3"
              id="registerBtnSpn"
              :hidden="!registerDisabled"
          ></span>
        </button>
      </form>
    </div>
    <div class="col mt-5 align-items-center text-center justify-content-center mb-3 col-12 col-lg-6">
      <h2>𝓝𝓪𝓿𝓲𝓰𝓪𝓽𝓮 𝓨𝓸𝓾𝓻 𝓢𝓾𝓬𝓬𝓮𝓼𝓼</h2>
      <p class="lead">Already have an account?</p>
      <p class="lead"> Log in <a role="button" class="link-info pe-auto" @click="router.push('/login')">Here</a></p>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";

export default {
  name: "Register",
  data() {
    return {
      formData: {
        email: "",
        username: "",
        password: "",
      },
      errors: {
        email: "",
        username: "",
        password: "",
      },
      debounceTimers: {
        email: null,
        username: null,
        password: null,
      },
      validationRules: {
        email: [
          {
            validator: value => !!value,
            message: "Email is required"
          },
          {
            validator: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: "Please enter a valid email address"
          }
        ],
        username: [
          {
            validator: value => !!value,
            message: "Username is required"
          },
          {
            validator: value => value.length >= 3,
            message: "Username must be at least 3 characters long"
          },
          {
            validator: value => /^[a-zA-Z0-9_]+$/.test(value),
            message: "Username can only contain letters, numbers and underscores"
          }
        ],
        password: [
          {
            validator: value => !!value,
            message: "Password is required"
          },
          {
            validator: value => value.length >= 6,
            message: "Password must be at least 6 characters long"
          },
          {
            validator: value => /[A-Z]/.test(value),
            message: "Password must contain at least one uppercase letter"
          },
          {
            validator: value => /[a-z]/.test(value),
            message: "Password must contain at least one lowercase letter"
          },
          {
            validator: value => /[0-9]/.test(value),
            message: "Password must contain at least one number"
          }
        ]
      },
      registerDisabled: false,
      router: null,
    }
  },
  computed: {
    isFormValid() {
      return !Object.values(this.errors).some(error => error) &&
          Object.values(this.formData).every(value => value);
    },
    passwordStrength() {
      const password = this.formData.password;
      if (!password) return 0;

      let strength = 0;

      strength += Math.min(password.length * 5, 35);

      if (/[A-Z]/.test(password)) strength += 15;
      if (/[a-z]/.test(password)) strength += 15;
      if (/[0-9]/.test(password)) strength += 15;
      if (/[^A-Za-z0-9]/.test(password)) strength += 20;

      return Math.min(strength, 100);
    },
    passwordStrengthText() {
      const strength = this.passwordStrength;
      if (strength === 0) return 'None';
      if (strength < 30) return 'Weak';
      if (strength < 60) return 'Medium';
      if (strength < 80) return 'Strong';
      return 'Very Strong';
    },
    passwordStrengthClass() {
      const strength = this.passwordStrength;
      if (strength < 30) return 'bg-danger';
      if (strength < 60) return 'bg-warning';
      if (strength < 80) return 'bg-info';
      return 'bg-success';
    },
    passwordStrengthTextClass() {
      const strength = this.passwordStrength;
      if (strength < 30) return 'text-danger';
      if (strength < 60) return 'text-warning';
      if (strength < 80) return 'text-info';
      return 'text-success';
    }
  },
  methods: {
    validateField(fieldName) {
      const value = this.formData[fieldName];
      const rules = this.validationRules[fieldName];

      for (const rule of rules) {
        if (!rule.validator(value)) {
          this.errors[fieldName] = rule.message;
          return false;
        }
      }

      this.errors[fieldName] = "";
      return true;
    },

    debouncedValidate(fieldName) {
      // Clear any existing timer for this field
      if (this.debounceTimers[fieldName]) {
        clearTimeout(this.debounceTimers[fieldName]);
      }

      // Set a new timer
      this.debounceTimers[fieldName] = setTimeout(() => {
        this.validateField(fieldName);
        this.debounceTimers[fieldName] = null;
      }, 500); // 500ms delay
    },

    validateForm() {
      let isValid = true;
      for (const fieldName in this.formData) {
        if (!this.validateField(fieldName)) {
          isValid = false;
        }
      }
      return isValid;
    },

    async register() {
      if (!this.validateForm()) {
        return;
      }

      this.registerDisabled = true;

      try {
        const response = await this.$authStore.register(
            this.formData.email,
            this.formData.username,
            this.formData.password
        );

        console.log(response);

        // Reconnect socket with new auth state

        this.$socketManager.reconnect()

        await this.$swal.fire({
          icon:'success',
          title:'Registered!',
          showConfirmButton:false,
          timer: 1000,
        })
        window.location.href = '/profile'
      } catch (error) {
        this.handleToastError(error);
      } finally {
        this.registerDisabled = false;
      }
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
  },
  beforeMount() {
    this.router = useRouter();
  },
  beforeDestroy() {
    // Clean up any remaining timers
    Object.values(this.debounceTimers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
  },
}
</script>

<style scoped>
.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.is-valid {
  border-color: #198754;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}

.requirements-list {
  margin-top: 0.5rem;
  font-size: 0.875em;
}

.requirements-list ul {
  margin-top: 0.25rem;
  margin-bottom: 0;
  padding-left: 1.5rem;
}

.requirements-list li {
  margin-bottom: 0.25rem;
}

.password-strength-indicator {
  margin-top: 0.5rem;
}

.progress {
  height: 0.5rem;
}
</style>