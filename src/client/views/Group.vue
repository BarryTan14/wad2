<script setup>
import groupComp from "../components/groupComponent.vue";
import { onMounted } from 'vue';

const group = {
  name: "Teammate 1",
  role: "Developer"
};

async function fetchGroupData() {
  try {
    const response = await fetch('/group', {
      method: 'POST',
      body: new FormData()
    });
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Trigger the fetch request when the component mounts
onMounted(() => {
  fetchGroupData();
});
</script>

<template>
  <div class="about">
    <h1>Group Assignments</h1>
  </div>
  <div style="display: flex;">
    <groupComp :group="group" />
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
