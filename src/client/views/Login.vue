<template>
  <div class="login">
    <h1 class="">Login</h1>
    <form onsubmit="return false;">
      <div class="mb-3">
        <label for="exampleInputEmail1" class="form-label">Username</label>
        <input type="text" class="form-control form-input" id="exampleInputEmail1" aria-describedby="emailHelp"
               v-model="formData.username" :disabled="loginDisabled">
      </div>
      <div class="mb-3">
        <label for="exampleInputPassword1" class="form-label">Password</label>
        <input type="password" class="form-control form-input" id="exampleInputPassword1" v-model="formData.password" :disabled="loginDisabled">
      </div>
      <button class="btn btn-primary form-input" @click="login" id="loginBtn" :disabled="loginDisabled">Login<span
          class="spinner-border spinner-border-sm ms-3" id="loginBtnSpn" :hidden="!loginDisabled"></span></button>
    </form>
  </div>
</template>
<script setup lang="js">
import {ref, reactive} from "vue";

const formData = reactive({
  username:'',
  password:'',
})
const loginDisabled = ref(false);

function login() {
  loginDisabled.value = true;
  // simulate loading time to test out spinner
  setTimeout(() => {
    axios.post('user/login', formData).then(response => {
      alert(response.data)
    }).catch(error => {
      alert(error.response)
    }).finally(()=>{
      loginDisabled.value = false;
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
