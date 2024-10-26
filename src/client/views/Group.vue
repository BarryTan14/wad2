<script setup>
import groupComp from "../components/groupComponent.vue"

const group = {
  name: "Teammate 1",
  role: "Developer"
};

</script>
<template>
  <div class="about">
    <h1>Group Assignments</h1>
  </div>
  <div style="display: flex;">
    <groupComp :group="group"/>
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
