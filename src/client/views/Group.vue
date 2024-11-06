<script setup>
import groupComp from "../components/groupComponent.vue";
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const groupId = ref(route.params.groupId); // Get the groupId parameter from the URL

watch(
  () => route.params.groupId,
  (newGroupId) => {
    groupId.value = newGroupId; // Update the reactive `groupId`
    fetchGroupData(); // Fetch new data for the updated groupId
  }
);

const group = ref(null);
const moduleName = ref("");
const moduleId = ref("");
const description = ref("");
const isPopupVisible = ref(false); // Control visibility of the modal

async function fetchGroupData() {
  try {
    console.log(groupId.value);
    const response = await axios.get(`/group/${groupId.value}`);
    group.value = response.data.data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Function to open the modal
function openPopup() {
  isPopupVisible.value = true;
}

// Function to close the modal
function closePopup() {
  isPopupVisible.value = false;
}

// Function to handle form submission
async function handleSubmit() {
  console.log("Module Name:", moduleName.value);

  try {
    const response = await fetch(`/group/${groupId.value}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        module_name: moduleName.value,
        module_id: moduleId.value,
        description: description.value
      })
    });

    if (!response.ok) throw new Error('Failed to add module');

    const data = await response.json();
    console.log("Response from server:", data);

    // Handle success: update UI, show message, etc.
    closePopup();

    // Reset form fields if needed
    moduleName.value = "";
    moduleId.value = "";
    description.value = "";

  } catch (error) {
    console.error("Error:", error);
    alert("Failed to add module. Please try again.");
  }
}

// Fetch the data when the component mounts
onMounted(() => {
  fetchGroupData();
});
</script>

<template>
  <div class="popup-form">
    <h2>{{ groupId }}</h2>
    <div>
      <h1>Group Assignments</h1>
      <button @click="openPopup">Add new module</button>
    </div>

    <!-- Modal for adding a new module -->
    <div v-if="isPopupVisible" class="modal-overlay">
      <div class="modal-content">
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

    <div style="display: flex;">
      <groupComp view-prop="group" :group="group" />
    </div>
  </div>
</template>

<style>
/* Modal overlay styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Modal content styling */
.modal-content {
  background: grey;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin-top: 0;
}

.modal-content label {
  display: block;
  margin-top: 10px;
}

.modal-content input,
.modal-content textarea {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}

.modal-content button {
  margin-top: 15px;
  padding: 8px 12px;
  cursor: pointer;
}

.modal-content button[type="button"] {
  margin-left: 10px;
}
</style>
