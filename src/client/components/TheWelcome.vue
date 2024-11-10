<script>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import '../assets/styles.css';

import WelcomeItem from './WelcomeItem.vue';
import ParticipationIcon from './icons/IconDocumentation.vue';
import SchedulerIcon from './icons/IconEcosystem.vue';
import ToDoIcon from './icons/IconCommunity.vue';
import ProgressIcon from './icons/IconSupport.vue';


export default {
  name: 'TheWelcome',
  data() {
    return {
      userTask: []
    };

  },
  async mounted() {
    console.log(this.$authStore.currentUser.displayName)
    //get Tasks for this user.
    await axios.get("/api/task/getByUser/" + this.$authStore.currentUser.displayName)
      .then(resp => {
        console.log(resp.data.data)
        this.userTask = resp.data.data
      })
  },
  methods: {
    progressPercentage() {
      
        let count = 0;
        for (let i = 0; i < this.userTask.length; i++) {
          if (this.userTask[i].status === true) {
            count++;
          }
        }
        
        return (count / this.userTask.length) * 100
    },
  }
}
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
        <RouterLink to="/transcribe" class="nav-link" :class="{ 'active': $route.path === '/transcribe' }">
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
        Task-to-Do List
      </template>
      <div>
        <ul>
          <li v-for="(item, index) in todoItems" :key="item.id" class="todo-item">
            <input type="checkbox" v-model="item.completed" class="task-checkbox" />
            <span class="task-text" :class="{ 'completed': item.completed }">{{ item.text }}</span>
            <div class="action-buttons">
              <button class="action-button" @click="editTodo(index)">Edit</button>
              <button class="action-button" @click="deleteTodo(index)">Delete</button>
            </div>
          </li>
        </ul>
      </div>
    </WelcomeItem>

    Progress Dashboard
    <WelcomeItem>
      <template #heading>
        <ProgressIcon />
        Progress Dashboard
      </template>
      <div>
        <p>Track your progress!</p>
        <div class="progress-bar">
          <div class="progress" :style="{ width: progressPercentage() + '%' }"></div>
        </div>
        <p>{{ progressPercentage().toFixed(0) }}% of tasks completed.</p>
      </div>
    </WelcomeItem>
  </div>
</template>
