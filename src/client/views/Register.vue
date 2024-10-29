<template>
  <div class="register">
    <h1 class="">Register</h1>
    <form onsubmit="return false;">
      <div class="mb-3">
        <label for="exampleInputEmail1" class="form-label">Email</label>
        <input type="text" class="form-control form-input" id="exampleInputEmail1" aria-describedby="emailHelp" :disabled="registerDisabled"
               v-model="formData.email">
        <div id="emailHelp" class="form-text">We'll never share your Email with anyone else.</div>
      </div>
      <div class="mb-3">
        <label for="exampleInputUsername1" class="form-label">Username</label>
        <input type="text" class="form-control form-input" id="exampleInputUsername1" aria-describedby="usernameHelp" :disabled="registerDisabled"
               v-model="formData.username">
      </div>
      <div class="mb-3">
        <label for="exampleInputPassword1" class="form-label">Password</label>
        <input type="password" class="form-control form-input" id="exampleInputPassword1" v-model="formData.password" :disabled="registerDisabled">
      </div>
      <button class="btn btn-primary form-input" @click="register" id="registerBtn" :disabled="registerDisabled">Register<span
          class="spinner-border spinner-border-sm ms-3" id="registerBtnSpn" :hidden="!registerDisabled"></span></button>
    </form>
  </div>
</template>
<script setup lang="js">
import {reactive, ref} from "vue";

const formData = reactive({
  email:'',
  username:'',
  password:'',
})
const registerDisabled = ref(false);

function register() {
  registerDisabled.value=true;
  // simulate loading time to test out spinner
  setTimeout(() => {
    axios.post('user/api/auth/register', formData).then(response => {
      alert(response.data)
    }).catch(error => {
      alert(error.response)
    }).finally(()=>{
      registerDisabled.value=false;
    })
  }, 1000)
}
</script>
<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
