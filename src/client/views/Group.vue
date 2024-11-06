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

async function fetchGroupData() {
  try {
    console.log(groupId.value);
    // Use groupId in the API request URL if needed
    const response = await axios.post(`/group/${groupId.value}`);
    group.value = response.data.data; // Assign the response data to group
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Function to open a new window popup
function openPopup() {
  const popup = window.open(
    "",
    "Add New Module",
    "width=400,height=400,scrollbars=yes,resizable=yes"
  );
  
  popup.document.write(`
    <html>
      <head>
        <title>Add New Module</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          label { display: block; margin-top: 10px; }
          input, textarea { width: 100%; padding: 5px; margin-top: 5px; }
          button { margin-top: 15px; padding: 5px 10px; }
        </style>
      </head>
      <body>
        <h2>Add New Module</h2>
        <form id="popupForm">
          <label>Module Name:
            <input type="text" id="moduleName" required />
          </label>
          <label>Module ID:
            <input type="text" id="moduleId" required />
          </label>
          <label>Description:
            <textarea id="description" required></textarea>
          </label>
          <button type="submit">Submit</button>
          <button type="button" onclick="window.close()">Cancel</button>
        </form>
        <script>
          document.getElementById("popupForm").onsubmit = async function(event) {
            event.preventDefault();
            const moduleName = document.getElementById("moduleName").value;
            const moduleId = document.getElementById("moduleId").value;
            const description = document.getElementById("description").value;

            try {
              const response = await fetch('/group/${groupId.value}/add', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  module_name: moduleName,
                  module_id: moduleId,
                  description: description
                })
              });

              if (!response.ok) throw new Error('Failed to add module');
              
              alert("Module added successfully!");
              window.close();
            } catch (error) {
              alert("Error: " + error.message);
            }
          };
      </body>
    </html>
  `);
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
    <div style="display: flex;">
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
