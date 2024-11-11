<template>
  <div class="daily-planner">
    <h1 class="planner-title">
      Daily Planner
      <span class="date-display">
        <i class="fas fa-calendar-alt calendar-icon"></i>
        {{ currentDate }}
      </span>
    </h1>
    <div class="planner-grid">

      <!-- Today's Schedule Section with Date beside the header -->
      <div class="schedule-section planner-section">
        <div class="section-header">
          <h2>Today's Schedule</h2>
        </div>
        <div v-for="(task, index) in scheduleTasks" :key="task.id" class="schedule-item">
          <span class="time">{{ task.time }}</span>
          <span class="description">{{ task.description }}</span>
          <div class="button-group">
            <button @click="editTask(index)" class="btn">Edit</button>
            <button @click="deleteTask(index)" class="btn">Delete</button>
          </div>
        </div>
        <div v-if="editingTaskIndex === null" class="new-task">
          <input v-model="newTaskTime" placeholder="Time (e.g., 09:00)" />
          <input v-model="newTaskDescription" placeholder="Description" />
          <button @click="addTask" class="btn">Add Task</button>
        </div>
        <div v-else class="edit-task">
          <input v-model="editTaskTime" />
          <input v-model="editTaskDescription" />
          <button @click="saveTask" class="btn">Save</button>
        </div>
      </div>

      <!-- Project Work Progress Section -->
      <div class="project-progress-section planner-section">
        <h2>Project Work Progress</h2>
        <div>
          <p>Track your project progress!</p>
          <div class="progress-bar">
            <div class="progress" :style="{ width: progressPercentage() + '%' }"></div>
          </div>
          <p>{{ progressPercentage().toFixed(0) }}% of tasks completed.</p>
        </div>
      </div>

      <!-- Top Priorities Section -->
      <div class="priorities-section planner-section">
        <h2>Top Priorities</h2>
        <div v-for="(priority, index) in topPriorities" :key="index" class="priority-item">
          <span>{{ priority }}</span>
          <div class="button-group">
            <button @click="editPriority(index)" class="btn">Edit</button>
            <button @click="deletePriority(index)" class="btn">Delete</button>
          </div>
        </div>
        <input v-model="newPriority" placeholder="New Priority" @keyup.enter="addPriority" />
        <button @click="addPriority" class="btn">Add Priority</button>
      </div>

      <!-- To-Do List Section -->
      <div class="todo-section planner-section">
        <h2>To Do List</h2>
        <div v-for="(todo, index) in toDoList" :key="todo.id" class="todo-item">
          <input type="checkbox" v-model="todo.completed" @change="updateProgress" />
          <label>{{ todo.text }}</label>
          <div class="button-group">
            <button @click="editTodoItem(index)" class="btn">Edit</button>
            <button @click="deleteTodoItem(index)" class="btn">Delete</button>
          </div>
        </div>
        <input v-model="newTodoText" placeholder="New To-Do" @keyup.enter="addTodoItem" />
        <button @click="addTodoItem" class="btn">Add To-Do</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "TheWelcome",
  data() {
    return {
      currentDate: this.getFormattedDate(),
      scheduleTasks: [
        { id: 1, time: "06:00", description: "Yoga Class" },
        { id: 2, time: "09:30", description: "Meeting with Em" },
        { id: 3, time: "12:00", description: "Lunch" },
        { id: 4, time: "13:00", description: "Meeting with John" },
      ],
      topPriorities: ["Drink lots of water!!", "Meditation", ""],
      toDoList: [
        { id: 1, text: "Groceries", completed: false },
        { id: 2, text: "Pay credit card", completed: false },
        { id: 3, text: "Call Tom", completed: false },
      ],
      newTaskTime: "",
      newTaskDescription: "",
      editingTaskIndex: null,
      editTaskTime: "",
      editTaskDescription: "",
      newPriority: "",
      newTodoText: "",
      userTask: [],
      events: [],
    };
  },
  async mounted() {
    this.listEvents()
    this.updateDate();
    await axios
      .get("/api/task/getByUser/" + this.$authStore.currentUser.displayName)
      .then((resp) => {
        this.userTask = resp.data.data;
      });
  },

  methods: {
    async listEvents() {
      try {
        await axios.get(`/api/calendar-email/events?email=${this.$authStore.currentUser.email}`).then(res => {
          this.events = res.data.map(event => ({
            id: event.id,
            summary: event.summary,
            description: event.description || 'No description',
            start: event.start,
            end: event.end
          })
          )
          console.log(this.events)
        }).catch(error => {
        })
      } catch (error) {
        this.$swal.fire({
          icon: 'error',
          title: 'Error Fetching Events',
          text: error.message,
        });
      }
    },
    getFormattedDate() {
      const today = new Date();
      return today.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },
    updateDate() {
      setInterval(() => {
        this.currentDate = this.getFormattedDate();
      }, 86400000); // Update every 24 hours
    },
    addTask() {
      if (this.newTaskTime && this.newTaskDescription) {
        this.scheduleTasks.push({
          id: Date.now(),
          time: this.newTaskTime,
          description: this.newTaskDescription,
        });
        this.newTaskTime = "";
        this.newTaskDescription = "";
      }
    },
    editTask(index) {
      this.editingTaskIndex = index;
      this.editTaskTime = this.scheduleTasks[index].time;
      this.editTaskDescription = this.scheduleTasks[index].description;
    },
    saveTask() {
      if (this.editTaskTime && this.editTaskDescription) {
        this.scheduleTasks[this.editingTaskIndex] = {
          ...this.scheduleTasks[this.editingTaskIndex],
          time: this.editTaskTime,
          description: this.editTaskDescription,
        };
        this.editingTaskIndex = null;
        this.editTaskTime = "";
        this.editTaskDescription = "";
      }
    },
    deleteTask(index) {
      this.scheduleTasks.splice(index, 1);
    },
    addPriority() {
      if (this.newPriority) {
        this.topPriorities.push(this.newPriority);
        this.newPriority = "";
      }
    },
    editPriority(index) {
      const updatedPriority = prompt("Edit Priority", this.topPriorities[index]);
      if (updatedPriority !== null) this.topPriorities[index] = updatedPriority;
    },
    deletePriority(index) {
      this.topPriorities.splice(index, 1);
    },
    addTodoItem() {
      if (this.newTodoText) {
        this.toDoList.push({
          id: Date.now(),
          text: this.newTodoText,
          completed: false,
        });
        this.newTodoText = "";
      }
    },
    editTodoItem(index) {
      const updatedTodo = prompt("Edit To-Do", this.toDoList[index].text);
      if (updatedTodo !== null) this.toDoList[index].text = updatedTodo;
    },
    deleteTodoItem(index) {
      this.toDoList.splice(index, 1);
    },
    updateProgress() {
      // Logic for progress update
    },
    progressPercentage() {
      let count = 0;
      for (let i = 0; i < this.userTask.length; i++) {
        if (this.userTask[i].status === true) {
          count++;
        }
      }
      return this.userTask.length ? (count / this.userTask.length) * 100 : 0;
    },
  },
};
</script>

<style scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");

.daily-planner {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 100%;
  margin: auto;
}

.planner-title,
h2 {
  text-align: center;
}

.planner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.planner-section {
  padding: 15px;
  border-radius: 10px;
  border: 4px solid var(--bs-purple);
  transition: transform 0.3s, box-shadow 0.3s;
}

.planner-section:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.date-display {
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-icon {
  font-size: 1.2rem;
  margin-right: 8px;
}

.schedule-item,
.priority-item,
.todo-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.new-task,
.edit-task {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.time {
  font-weight: bold;
}

.button-group {
  display: flex;
  gap: 5px;
}

.todo-item input[type="checkbox"] {
  margin-right: 10px;
}

.btn {
  display: flex;
  justify-content: space-between;
  align-items: end;
  cursor: pointer;
  border: none;
  background-color: var(--bs-purple);
  color: var(--bs-white);
  padding: 5px 8px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #5548cc;
}

@media (max-width: 768px) {
  .planner-grid {
    grid-template-columns: 1fr;
  }
}
</style>
