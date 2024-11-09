<!-- src/components/VoiceTranscription.vue -->
<template>
  <div class="container py-4">
    <h2 class="mb-4">Class Participation Transcription</h2>

    <div v-if="!isSupported" class="alert alert-danger">
      <p>Your browser doesn't support audio recording and/or your browsers' privacy settings disallow us from accessing your microphone. Please use a modern browser like Chrome, Firefox, or Edge, or allow microphone permissions manually.</p>

      <p>To ignore Chrome's secure origin policy, follow these steps. Navigate to chrome://flags/#unsafely-treat-insecure-origin-as-secure in Chrome.</p>
      <p>Find and enable the Insecure origins treated as secure section. Add the url of this site to ignore the secure origin policy for. Remember to include the port number too (if required). Save and restart Chrome.</p>
      <a href="https://stackoverflow.com/a/58449078" class="alert-link">Read more about it here.</a>
    </div>

    <template v-else>
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
                :disabled="isRecording"
                class="btn btn-success w-100 py-4 py-md-2">
              <i class="bi bi-mic-fill me-2"></i>
              Start Recording
            </button>
          </div>
          <div class="col-12 col-md-6">
            <button
                @click="stopRecording"
                :disabled="!isRecording"
                class="btn btn-danger w-100 py-4 py-md-2">
              <i class="bi bi-stop-fill me-2"></i>
              Stop Recording
            </button>
          </div>
        </div>

        <div class="text-muted fst-italic mb-3">
          <i class="bi" :class="statusIcon"></i>
          {{ status }}
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
                <th scope="col" width="45%">Transcription</th>
                <th scope="col" width="20%">Timestamp</th>
                <th scope="col" width="10%">Actions</th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="(item, idx) in filteredTranscriptions"
                  :key="item._id"
              >
                <th scope="row">{{idx + 1}}</th>
                <td>{{item.saidFor?.moduleName}}</td>
                <td>{{item.content}}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>
                  <button
                      @click="deleteTranscription(item._id)"
                      class="btn btn-danger w-100"
                      title="Delete transcription"
                  >
                    <i class="bi bi-trash me-2"></i>
                    Delete
                  </button>
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
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="card-subtitle text-muted">
                    #{{idx + 1}} - {{item.saidFor?.moduleName}}
                  </h6>
                  <button
                      @click="deleteTranscription(item._id)"
                      class="btn btn-danger"
                      title="Delete transcription"
                  >
                    <span class="bi bi-trash">🗑️</span>
                  </button>
                </div>
                <p class="card-text mb-2">{{item.content}}</p>
                <small class="text-muted">
                  <i class="bi bi-clock me-1"></i>
                  {{ formatDate(item.createdAt) }}
                </small>
              </div>
            </div>

            <div
                v-if="filteredTranscriptions.length === 0"
                class="alert alert-info text-center"
            >
              No transcriptions found
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import { format } from 'date-fns';

export default {
  name: 'VoiceTranscription',

  data() {
    return {
      isRecording: false,
      status: 'Ready to record',
      transcription: '',
      error: '',
      isSupported: false,
      mediaRecorder: null,
      audioChunks: [],
      selectedModuleId: '',
      groupOptions: [],
      transcriptions: [],
      moduleFilter: '', // New filter state
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
    if (this.$authStore.isLoggedIn) {
      await this.getModules();
      await this.getTranscriptions();
    }

    // Check if the browser supports necessary APIs
    this.isSupported = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.MediaRecorder
    )
  },

  methods: {
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
        this.$toastStore.error('Failed to fetch modules');
      }
    },

    async getTranscriptions() {
      try {
        const response = await axios.get('/api/transcribe/transcriptions');
        this.transcriptions = response.data.transcriptions;
      } catch (error) {
        console.error('Error fetching transcriptions:', error);
        this.$toastStore.error('Failed to fetch transcriptions');
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
          cancelButtonText: 'Cancel'
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

        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = async () => {
          this.status = 'Processing...';

          const audioBlob = new Blob(this.audioChunks, {
            type: 'audio/webm;codecs=opus'
          });

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('moduleId', this.selectedModuleId);

          try {
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
            await this.getTranscriptions();
            this.$toast.fire({
              icon: "success",
              title: 'Transcription recorded'
            });
          } catch (err) {
            this.error = `Error transcribing audio: ${err.message}`;
            this.status = 'Ready to record';
          }
        };

        this.mediaRecorder.start(1000);
        this.isRecording = true;
        this.status = 'Recording...';
        this.audioChunks = [];
        this.error = '';
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
      }
    }
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
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
</style>