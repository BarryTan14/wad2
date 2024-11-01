<script setup>
import groupComp from "../components/groupComponent.vue";
import { ref, onMounted } from 'vue';
import axios from 'axios';

const group1 = {
  name: "Teammate 1",
  role: "Developer"
};

// Create a reactive variable for the group data
const group = ref(null);

async function fetchGroupData() {
  try {
    const response = await axios.post('/group');
    group.value = response.data.data; // Assign the response data to group
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Fetch the data when the component mounts
onMounted(() => {
  fetchGroupData();
});
</script>

<template>
  <div class="about">
    <h1>Group Assignments</h1>
  </div>
  <div style="display: flex;">
    <groupComp view-prop="group1" :group="group1" />
    <groupComp view-prop="group" :group="group" />
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
