<script setup>
import { defineProps } from 'vue';


const props = defineProps({
  group: {
    type: Array,
    required: true
  }
});
</script>

<template>
  <div v-if="loading">Loading...</div> <!-- Show loading message while fetching -->
  <div v-else-if="error">{{ error }}</div> <!-- Show error message if request fails -->
  <div v-else>
    <div class="card" style="width: 18rem; margin: 10px;">
      <div class="card-body">
        <h5 class="card-title">Group 3</h5>
        <h6 class="card-subtitle mb-2 text-muted">IS211</h6>
        <p class="card-text">Interaction design prototyping is useful!</p>
        <a href="#" class="card-link">Task List</a>
      </div>
      <ul class="list-group list-group-flush">
        <li v-if="groupData && groupData.length > 0" class="list-group-item">
          {{ groupData[0]._id }}
        </li>
        <li v-else class="list-group-item">No team members available</li>
      </ul>
    </div>
  </div>
</template>
