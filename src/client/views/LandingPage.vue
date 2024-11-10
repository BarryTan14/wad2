<!-- LandingPage.vue -->
<template>
  <div class="landing-container">
    <!-- Video Background Container -->
    <div class="video-container">
      <video
          v-for="(video, index) in videos"
          :key="index"
          :ref="el => videoRefs[index] = el"
          class="background-video"
          :class="{ 'fade-in': currentVideoIndex === index }"
          muted
          playsinline
          loop
          :src="video"
      ></video>
    </div>

    <!-- Content Overlay -->
    <div class="content-overlay">
      <div class="content-card">
        <template v-if="$route.path === '/'">
          <img
              src="/circledlogo.svg"
              alt="SMU Buddy Logo"
              class="logo"
          >
          <h1 class="title">SMU Buddy</h1>
          <p class="subtitle">Your Ultimate Student Companion</p>
          <router-link
              to="/Register"
              class="cta-button"
          >
            Get Started
          </router-link>
          <router-link
              to="/Login"
              class="cta-button"
          >
            Login
          </router-link>
        </template>
        <router-view v-slot="{ Component }" v-if="$route.path !== '/'">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.path"/>
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script>
import {RouterView} from "vue-router";

export default {
  name: 'LandingPage',
  components: {RouterView},

  data() {
    return {
      videos: [
        '/landingvideo/mixkit-person-typing-on-a-computer-in-detail-4907-hd-ready.mp4',
        '/landingvideo/mixkit-reflection-of-a-screen-in-glasses-221-hd-ready.mp4',
        '/landingvideo/mixkit-young-man-sitting-scrolling-on-his-cell-phone-4801-hd-ready.mp4',
        '/landingvideo/mixkit-people-having-a-work-meeting-around-a-table-4547-hd-ready.mp4',
      ],
      currentVideoIndex: 0,
      videoRefs: [],
      transitionInterval: null
    }
  },

  methods: {
    async initializeVideos() {
      try {
        // Initialize first video
        const firstVideo = this.videoRefs[0];
        if (firstVideo) {
          await firstVideo.play();

          // Set up video rotation
          this.transitionInterval = setInterval(() => {
            this.rotateVideo();
          }, 8000); // Change video every 8 seconds
        }
      } catch (error) {
        console.error('Video playback failed:', error);
      }
    },

    async rotateVideo() {
      const nextIndex = (this.currentVideoIndex + 1) % this.videos.length;
      const nextVideo = this.videoRefs[nextIndex];

      try {
        if (nextVideo) {
          await nextVideo.play();
          this.currentVideoIndex = nextIndex;
        }
      } catch (error) {
        console.error('Video rotation failed:', error);
      }
    }
  },

  mounted() {
    this.initializeVideos();
  },

  beforeUnmount() {
    // Clean up interval when component is destroyed
    if (this.transitionInterval) {
      clearInterval(this.transitionInterval);
    }
  }
}
</script>

<style scoped>
.landing-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.background-video.fade-in {
  opacity: 1;
}

.content-overlay {
  position: relative;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(31, 41, 55, 0.7); /* Matches dark theme bg-primary with opacity */
  z-index: 1;
}

.content-card {
  text-align: center;
  padding: 2.5rem;
  border-radius: 1rem;
  background: rgba(124, 58, 237, 0.1); /* Using purple-primary with low opacity */
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.2);
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.logo {
  width: 120px;
  height: 120px;
  margin-bottom: 1.5rem;
}

.title {
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 1rem 0 2rem;
}

.cta-button {
  display: block;
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  background: var(--purple-primary);
  border-radius: 9999px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);
}

.cta-button:hover {
  background: var(--purple-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(124, 58, 237, 0.4);
}

.cta-button:active {
  background: var(--purple-dark);
  transform: translateY(0);
}

/* Dark theme specific adjustments */
[data-bs-theme="dark"] .content-card {
  background: rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.3);
}

[data-bs-theme="dark"] .subtitle {
  color: var(--text-secondary);
}
</style>