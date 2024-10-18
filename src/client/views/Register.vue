<template>
  <div class="register">
    <h1 class="">Register</h1>
    <form onsubmit="return false;">
      <div class="mb-3">
        <label for="exampleInputEmail1" class="form-label">Username</label>
        <input type="text" class="form-control form-input" id="exampleInputEmail1" aria-describedby="emailHelp"
               v-model="username">
        <div id="emailHelp" class="form-text">We'll never share your username with anyone else.</div>
      </div>
      <div class="mb-3">
        <label for="exampleInputPassword1" class="form-label">Password</label>
        <input type="password" class="form-control form-input" id="exampleInputPassword1" v-model="password">
      </div>
      <button class="btn btn-primary form-input" @click="register" id="registerBtn">Register<span
          class="spinner-border spinner-border-sm ms-3" id="registerBtnSpn" hidden></span></button>
    </form>
  </div>
</template>
<script setup lang="js">
let username = null;
let password = null;
let registerDisabled = false;

function register() {
  toggleMultipleDisabled('form-input')
  toggleSingleHidden('registerBtnSpn')
  // simulate loading time to test out spinner
  setTimeout(() => {
    axios.post('user/register', {username, password}).then(response => {
      alert(response.data)
    }).catch(error => {
      alert(error.response)
    }).finally(()=>{
      toggleMultipleDisabled('form-input')
      toggleSingleHidden('registerBtnSpn')
    })
  }, 1000)
}

function toggleSingleHidden(idName) {
  registerDisabled ? document.getElementById(idName).removeAttribute('hidden') :
      document.getElementById(idName).setAttribute('hidden', '');
}

function toggleMultipleDisabled(className) {
  for (var thisDocument of document.getElementsByClassName(className)) {
    registerDisabled ? thisDocument.removeAttribute('disabled') :
        thisDocument.setAttribute('disabled', '');
  }
  registerDisabled = !registerDisabled;
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
