<!-- src/components/VoiceTranscription.vue -->
<template>
  <div class="py-4">
    <h2 class="mb-4">Class Participation Transcription</h2>

    <div v-if="!isSupported" class="alert alert-danger">
      <p>Your browser doesn't support audio recording and/or your browsers' privacy settings disallow us from accessing your microphone. Please use a modern browser like Chrome, Firefox, or Edge, or allow microphone permissions manually.</p>

      <template v-if="browserType === 'chrome'">
        <p>To enable microphone access in Chrome:</p>
        <ol>
          <li>Navigate to <a href="chrome://flags/#unsafely-treat-insecure-origin-as-secure">chrome://flags/#unsafely-treat-insecure-origin-as-secure</a></li>
          <li>Find "Insecure origins treated as secure"</li>
          <li>Add this site's URL (including port number if any)</li>
          <li>Click "Enable" and restart Chrome</li>
        </ol>
      </template>

      <template v-else-if="browserType === 'firefox'">
        <p>To enable microphone access in Firefox:</p>
        <ol>
          <li>Type <a href="about:config">about:config</a> in the address bar</li>
          <li>Accept the risk warning</li>
          <li>Search for "media.devices.insecure.enabled"</li>
          <li>Set it to true by clicking the toggle button</li>
          <li>Restart Firefox</li>
        </ol>
      </template>

      <template v-else-if="browserType === 'edge'">
        <p>To enable microphone access in Edge:</p>
        <ol>
          <li>Navigate to <a href="edge://flags/#unsafely-treat-insecure-origin-as-secure">edge://flags/#unsafely-treat-insecure-origin-as-secure</a></li>
          <li>Find "Insecure origins treated as secure"</li>
          <li>Add this site's URL (including port number if any)</li>
          <li>Click "Enable" and restart Edge</li>
        </ol>
      </template>

      <template v-else>
        <p>Please ensure you're using a modern browser and that you've granted microphone permissions to this site.</p>
      </template>
    </div>

    <div>
      <!-- No modules warning -->
      <div v-if="!groupOptions.length" class="alert alert-warning">
        <p class="mb-0">No modules found. Please create or be invited into a module.</p>
      </div>

      <div v-else>
        <div class="row g-3 mb-4">
          <div class="col-12">
            <label class="form-label">Record transcription for: </label>
            <select
                class="form-select py-4"
                v-model="selectedModuleId"
            >
              <option
                  v-for="(item, idx) in groupOptions"
                  :key="idx"
                  :value="item._id"
              >
                {{item.moduleName}}

              </option>
            </select>
          </div>
          <div class="col-12 col-md-6">
            <button
                @click="requestPermissionAndRecord"
                :disabled="isRecording || !isSupported || isProcessing"
                class="btn btn-success w-100 py-4 py-md-2">
              <span class="bi bi-mic-fill me-2">🎙️</span>
              Start Recording
            </button>
          </div>
          <div class="col-12 col-md-6">
            <button
                @click="stopRecording"
                :disabled="!isRecording || !isSupported || isProcessing"
                class="btn btn-danger w-100 py-4 py-md-2">
              <span class="bi bi-stop-fill me-2">🛑</span>
              Stop Recording
            </button>
          </div>
        </div>

        <div class="text-muted mb-3">
          <span class="bi" :class="statusIcon">💻</span>
          {{ status }}
          <span v-if="isRecording" class="ms-2">
            ({{ remainingTime }}s remaining)
          </span>
        </div>

        <div class="col-12">
          <AudioVisualizer
              :is-active="isRecording"
              :stream="mediaStream"
              :hidden="!isRecording"
          />
        </div>

        <div v-if="transcription" class="card mb-3">
          <div class="card-body">
            <h3 class="card-title h5">Latest Transcription:</h3>
            <p class="card-text mb-0">{{ transcription }}</p>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">
          {{ error }}
          <template v-if="error.includes('not allowed')">
            <p class="mb-2">This might be because:</p>
            <ul class="mb-0">
              <li>The site isn't running on HTTPS</li>
              <li>Microphone permission was denied</li>
              <li>Your browser's privacy settings are blocking the microphone</li>
            </ul>
          </template>
        </div>

        <!-- Module Filter -->
        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label">Filter by Module:</label>
            <select v-model="moduleFilter" class="form-select">
              <option value="">All Modules</option>
              <option
                  v-for="module in groupOptions"
                  :key="module._id"
                  :value="module._id"
              >
                {{ module.moduleName }}
              </option>
            </select>
          </div>
        </div>

        <!-- Transcriptions List -->
        <div class="transcriptions-container">
          <!-- Desktop View -->
          <div class="d-none d-md-block">
            <table class="table table-hover">
              <thead>
              <tr>
                <th scope="col" width="5%">#</th>
                <th scope="col" width="20%">Module</th>
                <th scope="col" width="40%">Transcription</th>
                <th scope="col" width="20%">Timestamp</th>
                <th scope="col" width="15%">Actions</th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="(item, idx) in filteredTranscriptions"
                  :key="item._id"
                  class="expand-animation"
              >
                <th scope="row">{{idx + 1}}</th>
                <td>
                  <template v-if="isEditing(item._id)">
                    <select
                        v-model="editForm[item._id].moduleId"
                        class="form-select form-select-sm"
                    >
                      <option
                          v-for="module in groupOptions"
                          :key="module._id"
                          :value="module._id"
                      >
                        {{ module.moduleName }}
                      </option>
                    </select>
                  </template>
                  <template v-else>
                    {{item.saidFor?.moduleName}}
                  </template>
                </td>
                <td>
                  <template v-if="isEditing(item._id)">
              <textarea
                  v-model="editForm[item._id].content"
                  class="form-control form-control-sm"
                  rows="2"
              ></textarea>
                  </template>
                  <template v-else>
                    {{item.content}}
                  </template>
                </td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>
                  <div class="btn-group">
                    <button
                        @click="toggleEdit(item._id)"
                        class="btn btn-sm"
                        :class="isEditing(item._id) ? 'btn-warning' : 'btn-primary'"
                        :title="isEditing(item._id) ? 'Cancel editing' : 'Edit transcription'"
                    >
                      <span class="bi" :class="isEditing(item._id) ? 'bi-x-lg' : 'bi-pencil'">✏️</span>
                    </button>
                    <button
                        v-if="isEditing(item._id)"
                        @click="saveTranscription(item._id)"
                        class="btn btn-success btn-sm"
                        title="Save changes"
                    >
                      <span class="bi bi-check-lg">✅</span>
                    </button>
                    <button
                        v-if="!isEditing(item._id)"
                        @click="deleteTranscription(item._id)"
                        class="btn btn-danger btn-sm"
                        title="Delete transcription"
                    >
                      <span class="bi bi-trash">🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredTranscriptions.length === 0">
                <td colspan="5" class="text-center py-4">
                  No transcriptions found
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile View -->
          <div class="d-md-none">
            <div
                v-for="(item, idx) in filteredTranscriptions"
                :key="item._id"
                class="card mb-3"
            >
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <h6 class="card-subtitle text-muted">
                    #{{idx + 1}} -
                    <template v-if="isEditing(item._id)">
                      <select
                          v-model="editForm[item._id].moduleId"
                          class="form-select form-select-sm d-inline-block w-auto"
                      >
                        <option
                            v-for="module in groupOptions"
                            :key="module._id"
                            :value="module._id"
                        >
                          {{ module.moduleName }}
                        </option>
                      </select>
                    </template>
                    <template v-else>
                      {{item.saidFor?.moduleName}}
                    </template>
                  </h6>
                  <div class="btn-group">
                    <button
                        @click="toggleEdit(item._id)"
                        class="btn"
                        :class="isEditing(item._id) ? 'btn-warning' : 'btn-primary'"
                        :title="isEditing(item._id) ? 'Cancel editing' : 'Edit transcription'"
                    >
                      <span class="bi" :class="isEditing(item._id) ? 'bi-x-lg' : 'bi-pencil'">✏️</span>
                    </button>
                    <button
                        v-if="isEditing(item._id)"
                        @click="saveTranscription(item._id)"
                        class="btn btn-success"
                        title="Save changes"
                    >
                      <span class="bi bi-check-lg">✅</span>
                    </button>
                    <button
                        v-if="!isEditing(item._id)"
                        @click="deleteTranscription(item._id)"
                        class="btn btn-danger"
                        title="Delete transcription"
                    >
                      <span class="bi bi-trash">🗑️</span>
                    </button>
                  </div>
                </div>

                <div class="mb-3">
                  <template v-if="isEditing(item._id)">
            <textarea
                v-model="editForm[item._id].content"
                class="form-control"
                rows="3"
                placeholder="Enter transcription text"
            ></textarea>
                  </template>
                  <template v-else>
                    <p class="card-text mb-2">{{item.content}}</p>
                  </template>
                </div>

                <small class="text-muted d-flex align-items-center">
                  <span class="bi bi-clock me-1">⏱️</span>
                  {{ formatDate(item.createdAt) }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { format } from 'date-fns';
import AudioVisualizer from "../components/AudioVisualizer.vue";

export default {
  name: 'VoiceTranscription',

  components: {
    AudioVisualizer
  },

  data() {
    return {
      isRecording: false,
      isProcessing: false,
      status: 'Ready to record',
      transcription: '',
      error: '',
      browserType: this.detectBrowser(),
      isSupported: false,
      mediaRecorder: null,
      audioChunks: [],
      selectedModuleId: '',
      groupOptions: [],
      transcriptions: [],
      moduleFilter: '',
      mediaStream: null,
      editForm: {},
      editingId: null,
      remainingTime: 15, // ??? seconds time limit
      MAX_RECORDING_TIME: 15, // constant for max recording time
    }
  },

  computed: {
    filteredTranscriptions() {
      if (!this.moduleFilter) return this.transcriptions;
      return this.transcriptions.filter(t => t.saidFor?._id === this.moduleFilter);
    },
    statusIcon() {
      const icons = {
        'Ready to record': 'bi-mic',
        'Recording...': 'bi-record-circle text-danger',
        'Processing...': 'bi-hourglass-split'
      };
      return icons[this.status] || 'bi-mic';
    }
  },

  async mounted() {
    // Check if the browser supports necessary APIs
    this.isSupported = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.MediaRecorder
    )
    if (this.$authStore.isLoggedIn) {
      await this.getModules();
      await this.getTranscriptions();
    }
  },

  methods: {
    startRecordingTimer() {
      this.remainingTime = this.MAX_RECORDING_TIME;
      this.recordingTimer = setInterval(() => {
        this.remainingTime--;
        if (this.remainingTime <= 0) {
          this.stopRecording();
          this.clearRecordingTimer();
        }
      }, 1000);
    },

    clearRecordingTimer() {
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
    },
    isEditing(transcriptionId) {
      return this.editingId === transcriptionId;
    },

    toggleEdit(transcriptionId) {
      if (this.editingId === transcriptionId) {
        // Cancel editing
        this.editingId = null;
        delete this.editForm[transcriptionId];
      } else {
        // Start editing
        const transcription = this.transcriptions.find(t => t._id === transcriptionId);
        this.editForm[transcriptionId] = {
          moduleId: transcription.saidFor?._id,
          content: transcription.content
        };
        this.editingId = transcriptionId;
      }
    },

    async saveTranscription(transcriptionId) {
      try {
        const formData = this.editForm[transcriptionId];

        await axios.post(`/api/transcribe/transcriptions/${transcriptionId}`, {
          moduleId: formData.moduleId,
          content: formData.content
        }).catch(error => {
          throw new Error(error);
        });

        // Update the local transcription data
        await this.getTranscriptions();

        // Clear editing state
        this.editingId = null;
        delete this.editForm[transcriptionId];

        this.$toast.fire({
          icon: 'success',
          title: 'Transcription updated successfully'
        });
      } catch (error) {
        this.$toast.fire({
          icon: 'error',
          title: 'Failed to update transcription'
        });
      }
    },
    detectBrowser() {
      const userAgent = navigator.userAgent.toLowerCase();

      // Check Edge first since its UA string contains 'chrome'
      if (userAgent.includes('edg')) {
        return 'edge';
      } else if (userAgent.includes('firefox')) {
        return 'firefox';
      } else if (userAgent.includes('chrome')) {
        return 'chrome';
      }
      return 'other';
    },
    formatDate(date) {
      return format(new Date(date), 'MMM d, yyyy HH:mm');
    },

    async getModules() {
      try {
        const response = await axios.get('/api/group/myGroups');
        this.groupOptions = response.data.groups;
        if (this.groupOptions.length > 0) {
          this.selectedModuleId = this.groupOptions[0]._id;
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
        this.$toast.fire({
          icon: 'error',
          message: 'Failed to fetch modules',
        })
      }
    },

    async getTranscriptions() {
      try {
        const response = await axios.get('/api/transcribe/transcriptions');
        this.transcriptions = response.data.transcriptions;
      } catch (error) {
        console.error('Error fetching transcriptions:', error);
        this.$toast.fire({
          icon: 'error',
          message: 'Failed to fetch transcriptions',
        })
      }
    },

    async deleteTranscription(id) {
      try {
        const result = await this.$swal.fire({
          title: 'Delete Transcription',
          text: 'Are you sure you want to delete this transcription? This action cannot be undone.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Yes, delete it',
          cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
          await axios.delete(`/api/transcribe/transcriptions/${id}`);
          this.transcriptions = this.transcriptions.filter(t => t._id !== id);
          this.$toast.fire({
            icon: 'success',
            title: 'Transcription deleted successfully'
          });
        }
      } catch (error) {
        console.error('Error deleting transcription:', error);
        this.$toast.fire({
          icon: 'error',
          title: 'Failed to delete transcription'
        });
      }
    },

    async checkPermission() {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        if (result.state === 'denied') {
          throw new Error('Microphone permission has been denied. Please reset permissions and try again.');
        }
      } catch (err) {
        console.warn('Permissions API not supported:', err);
      }
    },

    async requestPermissionAndRecord() {
      if (!this.selectedModuleId) {
        this.error = 'Please select a module first';
        return;
      }

      this.error = '';
      try {
        await this.checkPermission();
        await this.startRecording();
      } catch (err) {
        this.error = `Error: ${err.message}`;
        this.status = 'Ready to record';
      }
    },

    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        this.mediaStream = stream; // Store the stream

        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = async () => {
          this.status = 'Processing...';
          this.clearRecordingTimer(); // Clear the timer when recording stops

          const audioBlob = new Blob(this.audioChunks, {
            type: 'audio/webm;codecs=opus'
          });

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('moduleId', this.selectedModuleId);

          try {
            this.isProcessing = true;
            const response = await fetch('/api/transcribe/upload', {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();
            this.transcription = data.transcription;

            this.status = 'Ready to record';
            this.error = '';
            if(this.transcription.length > 0) {
              this.getTranscriptions();
              this.$toast.fire({
                icon: "success",
                title: 'Transcription recorded'
              });
            } else {
              this.$toast.fire({
                icon: "question",
                title: 'No words were heard.',
                text: 'Is your microphone working?',
                timer: 10000,
              })
            }
          } catch (err) {
            this.error = `Error transcribing audio: ${err.message}`;
            this.status = 'Ready to record';
          } finally {
            this.isProcessing = false;
          }
        };

        this.mediaRecorder.start(1000);
        this.isRecording = true;
        this.status = 'Recording...';
        this.audioChunks = [];
        this.error = '';
        // Start the recording timer
        this.startRecordingTimer();

        // Automatically stop recording after MAX_RECORDING_TIME seconds
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, this.MAX_RECORDING_TIME * 1000);
      } catch (err) {
        this.error = `Error accessing microphone: ${err.message}`;
        this.status = 'Ready to record';

        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      }
    },

    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.isRecording = false;
        this.status = 'Processing...';
        this.clearRecordingTimer();
      }
    },
  }
}
</script>

<style scoped>
.transcriptions-container {
  margin-top: 2rem;
}

/* Make the table text wrap nicely */
.table td {
  vertical-align: middle;
  max-width: 0;
  overflow: visible; /* Changed from hidden to allow dropdowns */
  text-overflow: ellipsis;
  white-space: normal;
  padding: 0.5rem;
}

/* Add some breathing room in the mobile cards */
.card-body {
  padding: 1.25rem;
}

/* Style the mobile timestamp */
.text-muted {
  font-size: 0.875rem;
}

/* Ensure icons align properly */
.bi {
  vertical-align: -0.125em;
}

/* Improve touch targets on mobile */
.btn {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.expand-animation {
  animation: expand 0.3s ease-out forwards;
  transform-origin: top;
}

@keyframes expand {
  0% {
    max-height: 0;
    transform: scaleY(0);
  }
  100% {
    max-height: 100px; /* Adjust based on your content */
    transform: scaleY(1);
  }
}

.expand-animation{
  animation: maintainScale 0.3s ease-out forwards;
}

@keyframes maintainScale {
  0% {
    transform: scaleY(0);
  }
  100% {
    transform: scaleY(1);
  }
}

@media (max-width: 767.98px) {
  .card {
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .btn-danger {
    padding: 0.5rem;
    border-radius: 0.375rem;
  }
}

.btn-group {
  display: flex;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

.form-select-sm {
  min-height: 31px;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

textarea.form-control-sm {
  min-height: 2.5rem;
  resize: vertical;
}
@media (max-width: 767.98px) {
  .card {
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .btn-group {
    gap: 0.5rem;
  }

  .btn-group .btn {
    border-radius: 0.5rem !important;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
  }

  .form-select-sm {
    font-size: 0.875rem;
    padding: 0.25rem 2rem 0.25rem 0.5rem;
    background-position: right 0.5rem center;
    max-width: 200px;
  }

  textarea.form-control {
    font-size: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-top: 0.5rem;
  }

  .card-body {
    padding: 1rem;
  }

  .card-subtitle {
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* Improve touch targets */
  .btn,
  .form-select,
  textarea {
    min-height: 44px;
  }

  /* Style select dropdown in edit mode */
  .form-select-sm {
    border-color: #dee2e6;
    background-color: #fff;
  }

  /* Animate editing state transitions */
  .card-text,
  textarea {
    transition: all 0.2s ease-in-out;
  }
}
</style>