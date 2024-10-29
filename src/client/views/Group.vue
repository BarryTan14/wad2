<script setup>
import groupComp from "../components/groupComponent.vue";
import { ref, onMounted } from 'vue';
import axios from 'axios';

const groupData = ref([]); // Initialize as an empty array to prevent null issues
const loading = ref(true);
const error = ref(null);

function getData() {
  loading.value = true;
  fetch("/group", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      groupData.value = data.data || []; // Set groupData with the fetched data
      console.log("Received group data:", groupData.value);
      loading.value = false;
    })
    .catch(err => {
      error.value = 'Failed to load data. Please try again.';
      console.error(err);
      loading.value = false;
    });

}

// Trigger the fetch request when the component mounts
onMounted(() => {
  getData();
});
</script>

<template>
  <div class="about">
    <h1>Group Assignments</h1>
  </div>
  <div style="display: flex;">
    <groupComp :group="groupData" />
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
