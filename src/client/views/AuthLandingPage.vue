<!-- AuthLandingPage.vue -->
<template>
  <div class="min-h-screen">
    <!-- Video Background Container -->
    <div class="video-container fixed inset-0 z-0">
      <video
          v-for="(video, index) in videos"
          :key="index"
          :ref="el => videoRefs[index] = el"
          class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          :class="{ 'opacity-100': currentVideoIndex === index, 'opacity-0': currentVideoIndex !== index }"
          muted
          playsinline
          loop
          :src="video"
      ></video>
    </div>

    <!-- Content Overlay -->
    <div class="relative z-10 min-h-screen bg-gray-900/70">
      <div class="container mx-auto px-4 py-8 h-screen flex flex-col">
        <!-- Navigation -->
        <nav class="flex justify-between items-center mb-8">
          <div class="flex items-center">
            <img src="/circledlogo.svg" alt="Logo" class="h-10 w-10 mr-3">
            <span class="text-white text-xl font-bold">SMU Buddy</span>
          </div>
          <div class="flex gap-4">
            <button
                @click="currentView = 'login'"
                class="text-white hover:text-purple-400 transition-colors"
                :class="{ 'text-purple-400': currentView === 'login' }"
            >
              Login
            </button>
            <button
                @click="currentView = 'register'"
                class="text-white hover:text-purple-400 transition-colors"
                :class="{ 'text-purple-400': currentView === 'register' }"
            >
              Register
            </button>
          </div>
        </nav>

        <!-- Main Content -->
        <div class="flex-grow flex items-center justify-center">
          <div class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Left Side - Hero Content -->
            <div class="text-center md:text-left flex flex-col justify-center">
              <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
                Navigate Your Success
              </h1>
              <p class="text-lg text-gray-200 mb-8">
                Your ultimate student companion for managing courses, collaborating with peers, and staying organized.
              </p>
              <div class="flex flex-col md:flex-row gap-4">
                <button
                    @click="currentView = 'register'"
                    class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Get Started
                </button>
                <button
                    @click="scrollToFeatures"
                    class="px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Learn More
                </button>
              </div>
            </div>

            <!-- Right Side - Auth Forms -->
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
              <transition name="fade" mode="out-in">
                <component
                    :is="currentView === 'login' ? LoginForm : RegisterForm"
                    @success="handleAuthSuccess"
                    @switch-view="switchView"
                />
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AuthLandingPage',

  components: {
    LoginForm,
    RegisterForm
  },

  setup() {
    const router = useRouter()
    const currentView = ref('login')
    const currentVideoIndex = ref(0)
    const videoRefs = ref([])
    const transitionInterval = ref(null)

    const videos = [
      '/landingvideo/mixkit-person-typing-on-a-computer-in-detail-4907-hd-ready.mp4',
      '/landingvideo/mixkit-reflection-of-a-screen-in-glasses-221-hd-ready.mp4',
      '/landingvideo/mixkit-young-man-sitting-scrolling-on-his-cell-phone-4801-hd-ready.mp4',
      '/landingvideo/mixkit-people-having-a-work-meeting-around-a-table-4547-hd-ready.mp4',
      '/landingvideo/100123-video-720.mp4',
    ]

    const initializeVideos = async () => {
      try {
        const firstVideo = videoRefs.value[0]
        if (firstVideo) {
          await firstVideo.play()
          transitionInterval.value = setInterval(() => {
            currentVideoIndex.value = (currentVideoIndex.value + 1) % videos.length
          }, 8000)
        }
      } catch (error) {
        console.error('Video playback failed:', error)
      }
    }

    const handleAuthSuccess = () => {
      router.push('/profile')
    }

    const switchView = (view) => {
      currentView.value = view
    }

    const scrollToFeatures = () => {
      // Implement smooth scroll to features section
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    }

    onMounted(() => {
      initializeVideos()
    })

    onUnmounted(() => {
      if (transitionInterval.value) {
        clearInterval(transitionInterval.value)
      }
    })

    return {
      currentView,
      videos,
      videoRefs,
      currentVideoIndex,
      LoginForm,
      RegisterForm,
      handleAuthSuccess,
      switchView,
      scrollToFeatures
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>