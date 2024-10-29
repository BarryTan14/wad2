<script setup>
import groupComp from "../components/groupComponent.vue";
import { ref, onMounted } from 'vue';

// const group = {
//   name: "Teammate 1",
//   role: "Developer"
// };

// async function fetchGroupData() {
//   try {
//     const response = await fetch('/group', {
//       method: 'POST',
//       body: new FormData()
//     }).then(data=>{
//       return data.json()
//     })
//   } catch (error) {
//     console.error('Fetch error:', error);
//   }
// }

let isFetching = ref(true);

var group = getData()

function getData(){
  axios.post("/group")
  .then(response=>{
    console.log(response)
    return response.data.data
  })
  .catch(error=>{
    console.log(error)
  })
}
// Trigger the fetch request when the component mounts
onMounted(() => {
  getData()
  isFetching = false;
});
</script>

<template>
  <div class="about">
    <h1>Group Assignments</h1>
  </div>
  <div style="display: flex;" v-if="!isFetching">
    <groupComp view-prop="group" :group="{_id:'asdf'}" />
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
