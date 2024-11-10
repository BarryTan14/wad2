<!-- LandingPage.vue
<template>
  <div class="vh-100 position-fixed top-0 start-0 w-100 overflow-hidden">
    <div class="position-absolute top-0 start-0 w-100 h-100">
      <video
          v-for="(_, index) in 2"
          :key="index"
          :ref="el => videoRefs[index] = el"
          class="position-absolute top-50 start-50 translate-middle min-w-100 min-h-100 w-auto h-auto object-fit-cover"
          :class="{ 'opacity-0': currentVideoIndex !== index }"
          muted
          playsinline
          @timeupdate="handleTimeUpdate"
          @ended="handleVideoEnd"
      ></video>
    </div>

    <div class="position-relative vh-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50">
      <div class="text-center text-white p-4 rounded-3 glass-effect">
        <img src="../assets/logo.svg" alt="SMU Buddy Logo" class="mb-3" width="120" height="120">
        <h1 class="display-3 fw-bold mb-0 text-shadow">SMU Buddy</h1>
        <p class="fs-4 my-3 opacity-90">Your Ultimate Student Companion</p>
        <router-link
            to="/login"
            class="btn btn-success btn-lg px-4 rounded-pill shadow-sm gradient-button"
        >
          Get Started
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LandingPage',
  data() {
    return {
      videos: [
        '/landingvideo/mixkit-young-man-sitting-scrolling-on-his-cell-phone-4801-hd-ready.mp4',
        '/landingvideo/mixkit-person-typing-on-a-computer-in-detail-4907-hd-ready.mp4',
        '/landingvideo/mixkit-reflection-of-a-screen-in-glasses-221-hd-ready.mp4',
        '/landingvideo/mixkit-people-having-a-work-meeting-around-a-table-4547-hd-ready.mp4',
        '/landingvideo/100123-video-720.mp4',
      ],
      videoIndex: 0,
      currentVideoIndex: 0,
      videoRefs: [],
      isTransitioning: false,
      TRANSITION_THRESHOLD: 0.5 // Start transition 0.5 seconds before video ends
    }
  },
  methods: {
    handleTimeUpdate(event) {
      if (this.isTransitioning) return;

      const video = event.target;
      const timeRemaining = video.duration - video.currentTime;

      // Start transition when video is near the end
      if (timeRemaining <= this.TRANSITION_THRESHOLD) {
        this.isTransitioning = true;
        this.prepareNextVideo();
      }
    },
    async prepareNextVideo() {
      const nextVideoIndex = (this.videoIndex + 1) % this.videos.length;
      const nextPlayerIndex = (this.currentVideoIndex + 1) % 2;

      // Set up next video in the inactive player
      const nextPlayer = this.videoRefs[nextPlayerIndex];
      nextPlayer.src = this.videos[nextVideoIndex];
      await nextPlayer.load();

      try {
        // Start playing the next video
        await nextPlayer.play();

        // Switch to the next video with crossfade
        this.currentVideoIndex = nextPlayerIndex;
        this.videoIndex = nextVideoIndex;

        // Reset transition flag after transition duration
        setTimeout(() => {
          this.isTransitioning = false;
        }, 1000); // Match this with the CSS transition duration
      } catch (e) {
        console.warn('Autoplay prevented:', e);
        this.isTransitioning = false;
      }
    },
    handleVideoEnd() {
      // This is now just a backup in case timeupdate somehow misses
      if (!this.isTransitioning) {
        this.isTransitioning = true;
        this.prepareNextVideo();
      }
    },
    async initializeVideos() {
      // Set up initial video
      const firstPlayer = this.videoRefs[0];
      firstPlayer.src = this.videos[0];
      await firstPlayer.load();

      try {
        await firstPlayer.play();
        this.currentVideoIndex = 0;
      } catch (e) {
        console.warn('Autoplay prevented:', e);
      }
    }
  },
  mounted() {
    this.initializeVideos();
  }
}
</script>

<style scoped>
/* Custom styles that aren't available in Bootstrap */
.glass-effect {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.1);
}

.text-shadow {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.gradient-button {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.gradient-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2) !important;
}

/* Video transition effects */
video {
  transition: opacity 1s ease;
}

/* Bootstrap utility classes that might not be available */
.min-w-100 {
  min-width: 100%;
}

.min-h-100 {
  min-height: 100%;
}

.opacity-90 {
  opacity: 0.9;
}
</style> -->

<template>
  <div>
<!--    <Hero />
    <About />
    <Services />
    <Contact />-->
  </div>
</template>

<script>
/*import Hero from '../components/Hero.vue';
import About from '../components/About.vue';
import Services from '../components/Services.vue';
import Contact from '../components/Contact.vue';*/

export default {
  components: {
    /*Hero,
    About,
    Services,
    Contact*/
  }
};
</script>
