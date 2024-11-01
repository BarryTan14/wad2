
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import '../assets/styles.css'

import WelcomeItem from './WelcomeItem.vue'
import ParticipationIcon from './icons/IconDocumentation.vue'
import SchedulerIcon from './icons/IconEcosystem.vue'
import ToDoIcon from './icons/IconCommunity.vue'
import ProgressIcon from './icons/IconSupport.vue'

// Mock Data for dashboard (to be replaced with real data or props)
const recentParticipation = "Last: 'Discussed project goals'";
const upcomingMeeting = "Next meeting: 12th Nov, 3 PM";
const nextDeadline = "Project Draft Due: 15th Nov";

const openScheduler = () => {
  window.open('https://www.when2meet.com/', '_blank');
};

</script>

<template>
  <div class="dashboard-container">
    <!-- Speech-to-Text for Class Participation -->
    <WelcomeItem>
      <template #heading>
        <ParticipationIcon />
        Class Participation
      </template>
      <div>
        <RouterLink to="/classPart" class="nav-link" :class="{ 'active': $route.path === '/classPart' }">
          🎤 Start Voice Recording
        </RouterLink>
      </div>
    </WelcomeItem>

    <!-- Meeting Scheduler -->
    <WelcomeItem>
      <template #heading>
        <SchedulerIcon />
        Schedule Meetings using When2Meet
      </template>
      <div>
        <button @click="openScheduler" class="schedule-button">
          📅 Schedule a Meeting
        </button>
      </div>
      
    </WelcomeItem>

    <!-- Project To-Do List -->
    <WelcomeItem>
      <template #heading>
        <ToDoIcon />
        Project To-Do List
      </template>
      <div>
        <ul>
          <li>Random Task Assigner: Click to assign tasks randomly</li>
          <li>Volunteer for tasks within the project</li>
          <li>Notifications for upcoming deadlines</li>
        </ul>
        <p>Next Deadline: {{ nextDeadline }}</p>
      </div>
    </WelcomeItem>

    <!-- Progress Dashboard -->
    <WelcomeItem>
      <template #heading>
        <ProgressIcon />
        Progress Dashboard
      </template>
      <div>
        <p>Track your progress on projects and participation.</p>
        <div class="progress-bar">
          <div class="progress" :style="{ width: '75%' }"></div>
        </div>
        <p>75% of tasks completed.</p>
      </div>
    </WelcomeItem>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}

.microphone-button, .schedule-button {
  background-color: #3a86ff;
  color: white;
  padding: 0.5em 1em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.progress-bar {
  background-color: #e0e0e0;
  border-radius: 4px;
  height: 1em;
  width: 100%;
}

.progress {
  background-color: #3a86ff;
  height: 100%;
  border-radius: 4px;
}

</style>
