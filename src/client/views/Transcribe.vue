<template>
  <div class="transcribe">
    <h1>Voice Transcription</h1>
    <div class="controls">
      <button id="startRecording">Start Recording</button>
      <button id="stopRecording" disabled>Stop Recording</button>
    </div>
    <div id="status">Ready to record...</div>
    <div id="debug"></div>
  </div>
</template>
<script setup>
import {transcriber} from "../assets/transcriber.js";
import {onMounted} from "vue";
onMounted()
</script>
<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
