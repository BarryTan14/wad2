<script setup>


const props = defineProps({
  viewProp: String,
  group: {
    type: Object,
    required: true
  }
});

</script>

<template>
  <div>

    <div class="card" style="width: 18rem;">
      
      <div class="card-body" v-if="group && group.length > 0">
        <h5 class="card-title">{{ group[0].groupId || 'Module name not available' }}</h5>
      </div>
      <div class="card-body" v-else>
        <h5>Loading module data...</h5> <!-- Fallback if data is not yet available -->
      </div>
      <ul class="list-group list-group-flush">
        <li class="list-group-item">Cras justo odio</li>
        <li class="list-group-item">Dapibus ac facilisis in</li>
        <li class="list-group-item">Vestibulum at eros</li>
      </ul>
      <div class="card-body">
        <a href="#" class="card-link">Card link</a>
        <a href="#" class="card-link">Another link</a>
      </div>
    </div>



  </div>
</template>
