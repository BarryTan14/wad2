<!-- src/components/VoiceTranscription.vue -->
<template>
  <div class="voice-transcription">
    <h2>Voice Transcription</h2>
    <div class="controls">
      <button
          @click="startRecording"
          :disabled="isRecording"
          class="button">
        Start Recording
      </button>
      <button
          @click="stopRecording"
          :disabled="!isRecording"
          class="button">
        Stop Recording
      </button>
    </div>
    <div class="status">{{ status }}</div>
    <div v-if="transcription" class="transcription">
      <h3>Transcription:</h3>
      <p>{{ transcription }}</p>
    </div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isRecording = ref(false)
const status = ref('Ready to record')
const transcription = ref('')
const error = ref('')
let mediaRecorder = null
let audioChunks = []

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000
      }
    })

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = async () => {
      status.value = 'Processing...'

      const audioBlob = new Blob(audioChunks, {
        type: 'audio/webm;codecs=opus'
      })

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      try {
        const response = await fetch('/transcribe/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data = await response.json()
        transcription.value = data.transcription
        status.value = 'Ready to record'
        error.value = ''
      } catch (err) {
        error.value = `Error transcribing audio: ${err.message}`
        status.value = 'Ready to record'
      }
    }

    mediaRecorder.start(1000) // Collect data every second
    isRecording.value = true
    status.value = 'Recording...'
    audioChunks = []
    error.value = ''
  } catch (err) {
    error.value = `Error accessing microphone: ${err.message}`
    status.value = 'Ready to record'
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    status.value = 'Processing...'
  }
}
</script>

<style scoped>
.voice-transcription {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.controls {
  margin: 20px 0;
}

.button {
  padding: 10px 20px;
  margin: 5px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
}

.button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.status {
  margin: 10px 0;
  font-style: italic;
}

.transcription {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.error {
  margin-top: 10px;
  color: #ff0000;
}
</style>