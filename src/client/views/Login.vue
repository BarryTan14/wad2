<template>
  <div class="login row">
    <div class="col align-content-center align-items-center text-center justify-content-center mb-3">
      <h2>𝓨𝓸𝓾𝓻 𝓒𝓾𝓵𝓽𝓾𝓻𝓮, 𝓞𝓹𝓮𝓻𝓪𝓽𝓲𝓷𝓰 𝓪𝓽 𝓘𝓽𝓼 𝓟𝓮𝓪𝓴</h2>
      <p class="lead">Dont have an account?</p>
      <p class="lead">Register <a role="button" class="link-info pe-auto" @click="router.push('/register')">Here</a></p>
    </div>
    <div class="col">
      <h1 class="">Login</h1>
      <form @submit.prevent="login">
        <div class="mb-3">
          <label for="exampleInputUsername1" class="form-label">Username</label>
          <input
              type="text"
              class="form-control form-input"
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
              class="form-control form-input"
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
        <button class="btn btn-primary form-input"
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
      </form>
    </div>
  </div>
</template>
<script>
import { useAuthStore } from '../stores/auth.js'
import { useRouter } from 'vue-router'
import { getCurrentInstance } from 'vue'
import { useToastStore } from '../stores/toast';

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
      authStore: null,
      toastStore: null,
    }
  },
  methods: {
    async login() {
      this.loginDisabled = true

      try {
        const response = await this.authStore.login(
            this.formData.username,
            this.formData.password
        )

        // Reconnect socket with new auth state
        this.$socket.disconnect()
        this.$socket.connect()

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
      this.toastStore.success(message || 'Success');
    },
    handleToastError(error) {
      if (error.errors) {
        for (const err of error.errors) {
          this.toastStore.error(`The ${err.type} ${err.path} has an error of: ${err.msg}`);
        }
      } else {
        this.toastStore.error(error.message || error.msg || error);
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
    this.authStore = useAuthStore()
    this.toastStore = useToastStore();
  },
}
/*
const formData = reactive({
  username:'',
  password:'',
})
const loginDisabled = ref(false);

const router = useRouter();

function login() {
  loginDisabled.value = true;
  // simulate loading time to test out spinner
  setTimeout(() => {
    axios.post('user/api/auth/login', formData).then(response => {
      alert(response.data)
      router.push('/profile');
    }).catch(error => {
      alert(error.response)
    }).finally(()=>{
      loginDisabled.value = false;
    })
  }, 1000)
}*/
</script>
<style scoped>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
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
}
</style>
