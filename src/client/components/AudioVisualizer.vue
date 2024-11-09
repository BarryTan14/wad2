<!-- src/components/AudioVisualizer.vue -->
<template>
  <div class="audio-visualizer">
    <!-- Status indicator -->
    <div class="status-indicator" :class="{ 'is-recording': isActive }">
      <span class="status-dot"></span>
      <span class="status-text">{{ isActive ? 'Recording' : 'Ready' }}</span>
      <span v-if="isActive" class="recording-time">{{ formattedDuration }}</span>
    </div>

    <!-- Main visualizer container with responsive sizing -->
    <div
        class="visualizer-container"
        :class="{ 'is-recording': isActive }"
        ref="container"
    >
      <canvas
          ref="visualizer"
          class="waveform-canvas"
          :class="{ 'is-recording': isActive }"
      ></canvas>

      <!-- Volume indicator -->
      <div class="volume-indicator">
        <div class="volume-bar" :style="{ height: `${volume}%` }"></div>
      </div>
    </div>

    <!-- Recording controls for mobile -->
    <div v-if="showMobileControls" class="mobile-controls d-md-none">
      <div class="volume-level">
        Volume: {{ Math.round(volume) }}%
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioVisualizer',

  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    stream: {
      type: MediaStream,
      default: null
    },
    showMobileControls: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      audioContext: null,
      analyser: null,
      dataArray: null,
      canvasCtx: null,
      animationId: null,
      bufferLength: 0,
      startTime: null,
      volume: 0,
      duration: 0,
      resizeObserver: null
    }
  },

  computed: {
    formattedDuration() {
      const minutes = Math.floor(this.duration / 60);
      const seconds = Math.floor(this.duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  },

  watch: {
    isActive: {
      immediate: true,
      handler(newVal) {
        this.$nextTick(() => {
          if (newVal && this.stream) {
            this.startTime = Date.now();
            this.initializeCanvas();
            this.setupAudioContext();
            this.startTimer();
          } else {
            this.stopVisualization();
            this.stopTimer();
          }
        });
      }
    },

    stream: {
      immediate: true,
      handler(newStream) {
        this.$nextTick(() => {
          if (newStream && this.isActive) {
            this.initializeCanvas();
            this.setupAudioContext();
          }
        });
      }
    }
  },

  methods: {
    initializeCanvas() {
      const canvas = this.$refs.visualizer;
      const container = this.$refs.container;

      if (!canvas || !container) return;

      // Set canvas size to match container
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      // Initialize canvas context with new dimensions
      this.canvasCtx = canvas.getContext('2d');
      this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    },

    setupAudioContext() {
      // Clean up existing context if it exists
      if (this.audioContext) {
        this.audioContext.close();
      }

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      // Set up volume detection
      this.setupVolumeDetection();

      // Start visualization
      this.draw();
    },

    setupVolumeDetection() {
      const volumeDataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(volumeDataArray);
        let values = 0;
        let length = volumeDataArray.length;

        for (let i = 0; i < length; i++) {
          values += volumeDataArray[i];
        }

        this.volume = Math.min(100, Math.round((values / length) * 100 / 256 * 2));

        if (this.isActive) {
          requestAnimationFrame(checkVolume);
        }
      };

      checkVolume();
    },

    startTimer() {
      this.stopTimer(); // Clear any existing timer
      this.duration = 0;
      this.timerInterval = setInterval(() => {
        this.duration = (Date.now() - this.startTime) / 1000;
      }, 1000);
    },

    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    draw() {
      if (!this.canvasCtx || !this.analyser || !this.isActive) return;

      this.animationId = requestAnimationFrame(this.draw);

      const canvas = this.$refs.visualizer;
      const width = canvas.width;
      const height = canvas.height;

      this.analyser.getByteTimeDomainData(this.dataArray);

      // Use a gradient background
      const gradient = this.canvasCtx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#f8f9fa');
      gradient.addColorStop(1, '#e9ecef');
      this.canvasCtx.fillStyle = gradient;
      this.canvasCtx.fillRect(0, 0, width, height);

      // Draw waveform with dynamic color based on volume
      const hue = Math.min(200, 120 + this.volume);
      this.canvasCtx.lineWidth = 2;
      this.canvasCtx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
      this.canvasCtx.beginPath();

      const sliceWidth = width / this.bufferLength;
      let x = 0;

      for (let i = 0; i < this.bufferLength; i++) {
        const v = this.dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          this.canvasCtx.moveTo(x, y);
        } else {
          this.canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.canvasCtx.lineTo(width, height / 2);
      this.canvasCtx.stroke();
    },

    stopVisualization() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      if (this.analyser) {
        this.analyser = null;
      }

      if (this.canvasCtx) {
        const canvas = this.$refs.visualizer;
        this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      }

      this.volume = 0;
    },

    handleResize() {
      if (!this.$refs.visualizer || !this.$refs.container) return;

      this.initializeCanvas();

      // If currently recording, ensure visualization continues
      if (this.isActive && this.stream && !this.audioContext) {
        this.setupAudioContext();
      }
    }
  },

  mounted() {
    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });

    if (this.$refs.container) {
      this.resizeObserver.observe(this.$refs.container);
    }

    // Initial setup
    this.initializeCanvas();

    // Handle window resize events
    window.addEventListener('resize', this.handleResize);
  },

  beforeDestroy() {
    this.stopVisualization();
    this.stopTimer();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    window.removeEventListener('resize', this.handleResize);
  }
}
</script>

<style scoped>
.audio-visualizer {
  width: 100%;
  margin: 1rem 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: #f8f9fa;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6c757d;
  margin-right: 0.5rem;
}

.status-indicator.is-recording .status-dot {
  background: #dc3545;
  animation: pulse 1s infinite;
}

.status-text {
  font-weight: 500;
  color: #495057;
}

.recording-time {
  margin-left: auto;
  font-family: monospace;
  color: #dc3545;
}

.visualizer-container {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 0.5rem;
  background: #f8f9fa;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.visualizer-container.is-recording {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.5);
}

.waveform-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.volume-indicator {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  width: 4px;
  height: 60px;
  background: rgba(0,0,0,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.volume-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: #0d6efd;
  transition: height 0.1s ease;
}

.mobile-controls {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 0.375rem;
  text-align: center;
}

.volume-level {
  font-size: 0.875rem;
  color: #6c757d;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 767.98px) {
  .visualizer-container {
    height: 100px;
  }

  .status-indicator {
    padding: 0.375rem;
  }

  .volume-indicator {
    height: 40px;
  }
}
</style>