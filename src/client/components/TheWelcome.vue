<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import '../assets/styles.css';

import WelcomeItem from './WelcomeItem.vue';
import ParticipationIcon from './icons/IconDocumentation.vue';
import SchedulerIcon from './icons/IconEcosystem.vue';
import ToDoIcon from './icons/IconCommunity.vue';
import ProgressIcon from './icons/IconSupport.vue';

const todoItems = ref([
  { id: 1, text: 'IDP Iteration 2', completed: false },
  { id: 2, text: 'CT Project', completed: false },
  { id: 3, text: 'WAD2 Project', completed: false },
]);

const addTodo = () => {
  const newItem = { id: Date.now(), text: "New Task", completed: false };
  todoItems.value.push(newItem);
};

const editTodo = (index) => {
  const newText = prompt("Edit task:", todoItems.value[index].text);
  if (newText !== null) {
    todoItems.value[index].text = newText;
  }
};

const deleteTodo = (index) => {
  todoItems.value.splice(index, 1);
};

const toggleComplete = (index) => {
  todoItems.value[index].completed = !todoItems.value[index].completed;
};

const progressPercentage = () => {
  const completedCount = todoItems.value.filter(todo => todo.completed).length;
  return (completedCount / todoItems.value.length) * 100;
};

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
        <input type="text" v-model="newTodoText" placeholder="Add a new task" @keyup.enter="addTodo()" />
        <ul>
          <li v-for="(item, index) in todoItems" :key="item.id" class="todo-item">
            <span class="task-text" :class="{ 'completed': item.completed }">{{ item.text }}</span>
            <div class="action-buttons">
              <button class="action-button" @click="editTodo(index)">Edit</button>
              <button class="action-button" @click="deleteTodo(index)">Delete</button>
            </div>
          </li>
        </ul>
      </div>
    </WelcomeItem>

    <!-- Progress Dashboard -->
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
