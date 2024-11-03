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
const moduleName = ref("");
const moduleId = ref("");
const description = ref("");

async function fetchGroupData() {
  try {
    const response = await axios.post('/group');
    group.value = response.data.data; // Assign the response data to group
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
const isPopupVisible = ref(false);

// Function to show the popup
function openPopup() {
  isPopupVisible.value = true;
}

// Function to close the popup
function closePopup() {
  isPopupVisible.value = false;
}

// Function to handle form submission
function handleSubmit() {
  console.log("Module Name:", moduleName.value);
  console.log("Module ID:", moduleId.value);
  console.log("Description:", description.value);

  // Example: Send data to the server (replace URL with your actual API endpoint)
  fetch("/group/add", { // Updated URL to match the route in the server
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      module_name: moduleName.value,
      module_id: moduleId.value,
      description: description.value
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to add module');
      }
      return response.json();
    })
    .then(data => {
      console.log("Response from server:", data);
      // Handle success response, such as updating UI or showing a success message
    })
    .catch(error => console.error("Error:", error));


  // Close the popup after submission
  closePopup();

  // Reset the form fields if needed
  moduleName.value = "";
  moduleId.value = "";
  description.value = "";
}



// Fetch the data when the component mounts
onMounted(() => {
  fetchGroupData();
});
</script>

<template>

  <div class="popup-form">
    <h2>Add New Module</h2>
    <div>
      <h1>Group Assignments</h1>
      <button @click="openPopup">Add new module</button>
    </div>
    <div v-if="isPopupVisible" class="popup-overlay">
      <div class="popup-form">
        <h2>Add New Module</h2>
        <form @submit.prevent="handleSubmit">
          <label>
            Module Name:
            <input type="text" v-model="moduleName" required />
          </label>
          <br />
          <label>
            Module ID:
            <input type="text" v-model="moduleId" required />
          </label>
          <br />
          <label>
            Description:
            <textarea v-model="description" required></textarea>
          </label>
          <br />
          <button type="submit">Submit</button>
          <button type="button" @click="closePopup">Cancel</button>
        </form>
      </div>



    </div>
    <div v-else style="display: flex;">
      <groupComp view-prop="group1" :group="group1" />
      <groupComp view-prop="group" :group="group" />
    </div>
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
