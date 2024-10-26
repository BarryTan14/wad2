<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
});
</script>

<template>
    <div class="card" style="width: 18rem;margin: 10px;">
        <div class="card-body">
            <h5 class="card-title">Group 3</h5>
            <h6 class="card-subtitle mb-2 text-muted">IS211</h6>
            <p class="card-text">Interaction design prototyping is useful!</p>
            <a href="#" class="card-link">Task List</a>
            <!-- <a href="#" class="card-link">Another link</a> -->
        </div>
        <ul class="list-group list-group-flush">
            <li class="list-group-item">{{ group.name }}</li>
            <li class="list-group-item">Teammate 2</li>
            <li class="list-group-item">Teammate 3</li>
        </ul>
    </div>
</template>
