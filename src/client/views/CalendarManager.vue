<template>
  <div>
    <div v-if="!email">
      <h2>Enter Your Email</h2>
      <div class="form-group">
        <label for="userEmail">Email:</label>
        <input type="email" id="userEmail" v-model="tempEmail" required>
      </div>
      <button @click="setEmail">Continue to Calendar</button>
    </div>

    <div v-else>
      <h2>Calendar Manager for: {{ email }}</h2>
      <button @click="logout">Logout</button>

      <div class="section">
        <h3>List Events</h3>
        <button @click="listEvents">List Events</button>
      </div>

      <div class="section">
        <h3>Event Details</h3>
        <div class="form-group">
          <label for="eventId">Event ID (for update/delete):</label>
          <input type="text" id="eventId" v-model="eventId">
        </div>
        <div class="form-group">
          <label for="eventSummary">Summary:</label>
          <input type="text" id="eventSummary" v-model="eventSummary" required>
        </div>
        <div class="form-group">
          <label for="eventLocation">Location:</label>
          <input type="text" id="eventLocation" v-model="eventLocation">
        </div>
        <div class="form-group">
          <label for="eventStart">Start Time:</label>
          <input type="datetime-local" id="eventStart" v-model="eventStart" required>
        </div>
        <div class="form-group">
          <label for="eventEnd">End Time:</label>
          <input type="datetime-local" id="eventEnd" v-model="eventEnd" required>
        </div>
        <div class="form-group">
          <label for="eventDescription">Description:</label>
          <textarea id="eventDescription" v-model="eventDescription" rows="3"></textarea>
        </div>
        <div class="form-group">
          <h4>Attendees</h4>
          <div>
            <label for="attendeeEmail">Add Attendee Email:</label>
            <input type="email" id="attendeeEmail" v-model="newAttendeeEmail">
            <button @click="getModules">Add Attendee</button>
          </div>
          <div id="attendeesList" class="attendee-list">
            <div v-for="(attendee, index) in attendees" :key="index" class="attendee-item">
              <span>{{ attendee.email }}</span>
              <button @click="removeAttendee(index)">Remove</button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <button @click="createCalendarEvent">Create Event</button>
          <button @click="updateCalendarEvent">Update Event</button>
          <button @click="deleteCalendarEvent">Delete Event</button>
        </div>
      </div>

      <div class="section">
        <h3>Response</h3>
        <pre>{{ response }}</pre>
      </div>
    </div>
  </div>
</template>

<script>


export default {
  name: 'CalendarManager',
  data() {
    return {
      groupOptions: [],
      email: '',
      tempEmail: '',
      eventId: '',
      eventSummary: '',
      eventLocation: '',
      eventStart: '',
      eventEnd: '',
      eventDescription: '',
      newAttendeeEmail: '',
      attendees: [],
      response: ''
    }
  },

  methods: {
    async getModules() {
      console.log("Hello")
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
    setEmail() {
      if (this.tempEmail && this.validateEmail(this.tempEmail)) {
        this.email = this.tempEmail;
        this.tempEmail = '';
      } else {
        this.response = 'Please enter a valid email address.';
      }
    },
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    logout() {
      this.email = '';
      this.response = 'Logged out successfully';
    },
    async listEvents() {
      try {
        const response = await axios.get(`/api/calendar/events?email=${this.email}`);
        this.response = JSON.stringify(response.data, null, 2);
      } catch (error) {
        this.response = `Error: ${error.response?.data?.error || error.message}`;
      }
    },
    addAttendee() {
      if (this.newAttendeeEmail && !this.attendees.some(a => a.email === this.newAttendeeEmail)) {
        this.attendees.push({ email: this.newAttendeeEmail });
        this.newAttendeeEmail = '';
      }
    },
    removeAttendee(index) {
      this.attendees.splice(index, 1);
    },
    async createCalendarEvent() {
      try {
        const eventData = this.getEventData();
        const response = await axios.post(`/api/calendar/events?email=${this.email}`, eventData);
        this.response = JSON.stringify(response.data, null, 2);
        this.clearEventForm();
      } catch (error) {
        this.response = `Error: ${error.response?.data?.error || error.message}`;
      }
    },
    async updateCalendarEvent() {
      try {
        const eventData = this.getEventData();
        const response = await axios.put(`/api/calendar/events/${this.eventId}?email=${this.email}`, eventData);
        this.response = JSON.stringify(response.data, null, 2);
      } catch (error) {
        this.response = `Error: ${error.response?.data?.error || error.message}`;
      }
    },
    async deleteCalendarEvent() {
      try {
        const response = await axios.delete(`/api/calendar/events/${this.eventId}?email=${this.email}`);
        this.response = JSON.stringify(response.data, null, 2);
        this.clearEventForm();
      } catch (error) {
        this.response = `Error: ${error.response?.data?.error || error.message}`;
      }
    },
    getEventData() {
      return {
        summary: this.eventSummary,
        location: this.eventLocation,
        description: this.eventDescription,
        start: { dateTime: new Date(this.eventStart).toISOString() },
        end: { dateTime: new Date(this.eventEnd).toISOString() },
        attendees: this.attendees
      };
    },
    clearEventForm() {
      this.eventId = '';
      this.eventSummary = '';
      this.eventLocation = '';
      this.eventStart = '';
      this.eventEnd = '';
      this.eventDescription = '';
      this.attendees = [];
    }
  }
}
</script>

<style scoped>
.form-group {
  margin: 10px 0;
}

.attendee-list {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.attendee-item {
  display: flex;
  align-items: center;
  margin: 5px 0;
}

.attendee-item button {
  margin-left: 10px;
}
</style>