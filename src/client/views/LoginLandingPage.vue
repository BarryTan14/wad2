<template>
  <div class="vh-100 position-fixed top-0 start-0 w-100 overflow-hidden">
    <!-- Background Video Player (reused from Landing) -->
    <div class="position-absolute top-0 start-0 w-100 h-100">
      <video
          class="position-absolute top-50 start-50 translate-middle min-w-100 min-h-100 w-auto h-auto object-fit-cover"
          autoplay
          muted
          loop
          playsinline
      >
        <source src="/landingvideo/mixkit-person-typing-on-a-computer-in-detail-4907-hd-ready.mp4" type="video/mp4">
      </video>
    </div>

    <!-- Content -->
    <div class="position-relative vh-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-12 col-md-8 col-lg-6">
            <div class="p-4 rounded-3 glass-effect text-white">
              <!-- Your existing login form, styled to match landing -->
              <h1 class="text-center mb-4">Login</h1>
              <form @submit.prevent="login">
                <div class="mb-3">
                  <label for="exampleInputUsername1" class="form-label">Username</label>
                  <input
                      type="text"
                      class="form-control form-input py-3 py-md-2 bg-white bg-opacity-25 text-white"
                      :class="{ 'is-invalid': errors.username, 'is-valid': formData.username && !errors.username }"
                      id="exampleInputUsername1"
                      :disabled="loginDisabled"
                      v-model="formData.username"
                      @input="validateField('username')"
                  >
                  <div class="invalid-feedback" v-if="errors.username">
                    {{ errors.username }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="exampleInputPassword1" class="form-label">Password</label>
                  <input
                      type="password"
                      class="form-control form-input py-3 py-md-2 bg-white bg-opacity-25 text-white"
                      :class="{ 'is-invalid': errors.password, 'is-valid': formData.password && !errors.password }"
                      id="exampleInputPassword1"
                      :disabled="loginDisabled"
                      v-model="formData.password"
                      @input="validateField('password')"
                  >
                  <div class="invalid-feedback" v-if="errors.password">
                    {{ errors.password }}
                  </div>
                </div>

                <button class="btn btn-success w-100 py-3 gradient-button"
                        type="submit"
                        id="loginBtn"
                        :disabled="loginDisabled || !isFormValid">
                  Login
                  <span
                      class="spinner-border spinner-border-sm ms-3"
                      id="loginBtnSpn"
                      :hidden="!loginDisabled"
                  ></span>
                </button>

                <div class="text-center mt-4">
                  <p class="mb-0">Don't have an account?</p>
                  <router-link to="/register" class="text-success">Register Here</router-link>
                </div>
              </form>
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
  name: "Login",
  data() {
    return {
      formData: {
        username: "",
        password: "",
      },
      errors: {
        username: "",
        password: "",
      },
      validationRules: {
        username: [
          {
            validator: value => !!value,
            message: "Username is required"
          },
        ],
        password: [
          {
            validator: value => !!value,
            message: "Password is required"
          },
        ]
      },
      loginDisabled: false,
      router: null,
    }
  },
  methods: {
    async login() {
      this.loginDisabled = true

      try {
        const response = await this.$authStore.login(
            this.formData.username,
            this.formData.password
        )

        // Reconnect socket with new auth state
        this.$socketManager.reconnect()

        this.handleToastSuccess(response.message);

        this.router.push('/profile')
      } catch (error) {
        this.handleToastError(error);
      } finally {
        this.loginDisabled = false
      }
    },
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
  },
  computed : {
    isFormValid() {
      return !Object.values(this.errors).some(error => error) &&
          Object.values(this.formData).every(value => value);
    },
  },
  mounted() {

  },
  beforeMount() {
    this.router = useRouter()
  },
}
</script>
<style scoped>
.glass-effect {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.4);
}

.gradient-button {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.gradient-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2) !important;
}

/* Maintain your existing validation styles */
.is-invalid, .is-valid {
  background-position: right calc(0.375em + 0.1875rem) center !important;
}

input.form-control {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

input.form-control:focus {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

input.form-control::placeholder {
  color: rgba(255, 255, 255, 0.7);
}
</style>
