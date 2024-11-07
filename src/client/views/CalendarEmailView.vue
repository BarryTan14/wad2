<template>
  <div class="calendar-app">
    <div class="calendar-container">
      <header class="app-header">
        <h1 class="app-title">Calendar & Event Manager</h1>
        <div v-if="email" class="user-info">
          <span class="welcome-message">
            Welcome, <strong>{{ email }}</strong>
          </span>
          <button @click="logout" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div v-if="email" class="main-content">
        <section class="events-section">
          <div class="section-header">
            <h2 class="section-title">Your Events</h2>
            <button @click="listEvents" class="refresh-btn">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>

          <div v-if="events.length" class="events-list">
            <div v-for="event in events" :key="event.id" class="event-card" :class="{ 'selected': selectedEvent?.id === event.id }">
              <div class="event-header">
                <h3 class="event-title">{{ event.summary }}</h3>
                <span class="event-id">ID: {{ event.id }}</span>
              </div>
              <div class="event-details">
                <p class="event-time">
                  <i class="far fa-clock"></i> Start: {{ formatDateTime(event.start.dateTime || event.start.date) }}
                </p>
                <p class="event-time">
                  <i class="far fa-clock"></i> End: {{ formatDateTime(event.end.dateTime || event.end.date) }}
                </p>
                <p v-if="event.description" class="event-description">
                  <i class="far fa-file-alt"></i> {{ event.description }}
                </p>
              </div>
              <button @click="selectEvent(event)" class="edit-btn">
                <i class="fas fa-edit"></i> Edit
              </button>
            </div>
          </div>
          <div v-else class="no-events">
            <i class="far fa-calendar-times"></i>
            <p>No events found</p>
            <span>Create your first event to get started!</span>
          </div>
        </section>

        <section class="event-form-section">
          <div class="form-card">
            <h2 class="form-title">{{ selectedEvent ? 'Edit Event' : 'Create New Event' }}</h2>
            <form @submit.prevent="handleEventSubmit" class="event-form">
              <div class="form-group">
                <label for="eventSummary">Summary</label>
                <input
                  type="text"
                  id="eventSummary"
                  v-model="eventForm.summary"
                  required
                  placeholder="Enter event title"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label for="eventStart">Start Time</label>
                <div class="input-group">
                  <input
                    type="text"
                    id="eventStart"
                    class="form-control flatpickr-input"
                    v-model="eventForm.start"
                    data-input
                    required
                  />
                  <div class="input-group-append">
                    <button class="btn btn-primary" type="button" data-toggle>
                      <i class="fas fa-calendar"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="eventEnd">End Time</label>
                <div class="input-group">
                  <input
                    type="text"
                    id="eventEnd"
                    class="form-control flatpickr-input"
                    v-model="eventForm.end"
                    data-input
                    required
                  />
                  <div class="input-group-append">
                    <button class="btn btn-primary" type="button" data-toggle>
                      <i class="fas fa-calendar"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="eventDescription">Description</label>
                <textarea
                  id="eventDescription"
                  v-model="eventForm.description"
                  rows="3"
                  placeholder="Enter event description"
                  class="form-control"
                ></textarea>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary submit-btn">
                  <i class="fas fa-save"></i> {{ selectedEvent ? 'Update Event' : 'Create Event' }}
                </button>
                <button
                  v-if="selectedEvent"
                  type="button"
                  @click="deleteEvent"
                  class="btn btn-danger delete-btn"
                >
                  <i class="fas fa-trash-alt"></i> Delete Event
                </button>
              </div>
            </form>
            <button
              v-if="selectedEvent"
              @click="backToCreate"
              class="btn btn-link back-btn"
            >
              <i class="fas fa-arrow-left"></i> Back to Create
            </button>
          </div>
        </section>
      </div>
      
      <div v-else class="login-prompt">
        <i class="fas fa-lock"></i>
        <p>Please log in to access the Calendar Manager</p>
      </div>
    </div>

    <!-- Event Action Modal -->
    <div class="modal fade custom-modal" id="eventActionModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ modalTitle }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="modalAction" class="status-badge" :class="modalAction.toLowerCase()">
              {{ modalAction }}
            </div>
            <div class="event-details">
              <p><strong>Event:</strong> {{ modalEvent.summary }}</p>
              <p><strong>Start:</strong> {{ formatDateTime(modalEvent.start?.dateTime || modalEvent.start?.date) }}</p>
              <p><strong>End:</strong> {{ formatDateTime(modalEvent.end?.dateTime || modalEvent.end?.date) }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" data-bs-dismiss="modal">Close</button>
            <button 
              v-if="modalAction === 'Success' && !selectedEvent" 
              type="button" 
              class="btn-primary"
              @click="showEmailModal"
            >
              Send Invitations
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Invitation Modal -->
    <div class="modal fade custom-modal" id="emailModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Send Email Invitations</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="emailList">Enter email addresses (comma-separated)</label>
              <textarea
                id="emailList"
                v-model="emailAddresses"
                rows="3"
                placeholder="example1@email.com, example2@email.com"
                class="form-control"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn-primary" @click="sendInvitations">
              Send Invitations
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { Modal } from 'bootstrap'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'

export default {
  name: 'CalendarEmailView',
  data() {
    return {
      events: [],
      selectedEvent: null,
      emailAddresses: '',
      createdEvent: null,
      eventForm: {
        summary: '',
        start: '',
        end: '',
        description: ''
      },
      modalTitle: '',
      modalAction: '',
      modalEvent: {},
      eventActionModal: null,
      emailModal: null,
      startPicker: null,
      endPicker: null
    }
  },
  computed: {
    email() {
      return this.$authStore.currentUser.email
    }
  },
  mounted() {
    if (this.email) {
      this.listEvents()
    }
    this.eventActionModal = new Modal(document.getElementById('eventActionModal'))
    this.emailModal = new Modal(document.getElementById('emailModal'))
    this.initDateTimePickers()
  },
  methods: {
    initDateTimePickers() {
      this.startPicker = flatpickr('#eventStart', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        onChange: (selectedDates, dateStr, instance) => {
          this.eventForm.start = dateStr
          this.endPicker.set('minDate', selectedDates[0])
        }
      })

      this.endPicker = flatpickr('#eventEnd', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        onChange: (selectedDates, dateStr, instance) => {
          this.eventForm.end = dateStr
        }
      })
    },
    showEventActionModal(action, event) {
      this.modalTitle = action === 'Success' ? 'Event Action Successful' : 'Event Action Failed'
      this.modalAction = action
      this.modalEvent = event
      this.eventActionModal.show()
    },
    showEmailModal() {
      this.eventActionModal.hide()
      this.emailModal.show()
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    logout() {
      this.$authStore.logout()
      this.$router.push('/login')
    },
    async listEvents() {
      try {
        const res = await axios.get(`/api/calendar-email/events?email=${this.email}`)
        this.events = res.data
      } catch (error) {
        console.error('Error fetching events:', error)
        this.showEventActionModal('Failure', { summary: 'Error fetching events' })
      }
    },
    formatDateTime(dateTimeString) {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      return new Date(dateTimeString).toLocaleString(undefined, options)
    },
    selectEvent(event) {
      this.selectedEvent = event
      this.eventForm.summary = event.summary
      this.eventForm.start = event.start.dateTime || event.start.date
      this.eventForm.end = event.end.dateTime || event.end.date
      this.eventForm.description = event.description || ''
      this.startPicker.setDate(this.eventForm.start)
      this.endPicker.setDate(this.eventForm.end)
    },
    async handleEventSubmit() {
      try {
        const eventData = {
          summary: this.eventForm.summary,
          description: this.eventForm.description,
          start: { dateTime: new Date(this.eventForm.start).toISOString() },
          end: { dateTime: new Date(this.eventForm.end).toISOString() }
        }

        let res
        if (this.selectedEvent) {
          res = await axios.put(`/api/calendar-email/events/${this.selectedEvent.id}?email=${this.email}`, eventData)
          this.showEventActionModal('Success', res.data)
        } else {
          res = await axios.post(`/api/calendar-email/events?email=${this.email}`, eventData)
          this.createdEvent = res.data
          this.showEventActionModal('Success', res.data)
        }

        await this.listEvents()
        this.selectedEvent = null
        this.resetEventForm()
        this.scrollToTop()
      } catch (error) {
        console.error('Error submitting event:', error)
        this.showEventActionModal('Failure', this.eventForm)
      }
    },
    async deleteEvent() {
      if (!this.selectedEvent) return

      try {
        await axios.delete(`/api/calendar-email/events/${this.selectedEvent.id}?email=${this.email}`)
        this.showEventActionModal('Success', this.selectedEvent)
        await this.listEvents()
        this.selectedEvent = null
        this.resetEventForm()
        this.scrollToTop()
      } catch (error) {
        console.error('Error deleting event:', error)
        this.showEventActionModal('Failure', this.selectedEvent)
      }
    },
    resetEventForm() {
      this.eventForm.summary = ''
      this.eventForm.start = ''
      this.eventForm.end = ''
      this.eventForm.description = ''
      this.startPicker.clear()
      this.endPicker.clear()
    },
    async sendInvitations() {
      if (!this.createdEvent) return

      const recipients = this.emailAddresses.split(',').map(e => e.trim()).filter(e => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(e)
      })

      if (recipients.length === 0) {
        alert('No valid email addresses provided')
        return
      }

      const event = this.createdEvent
      const startDateTime = this.formatDateTime(event.start.dateTime || event.start.date)
      const endDateTime = this.formatDateTime(event.end.dateTime || event.end.date)

      const invitationData = {
        to: recipients.join(', '),
        subject: `Event Invitation: ${event.summary}`,
        text: `
          You are invited to the following event:

          Event: ${event.summary}
          Start: ${startDateTime}
          End: ${endDateTime}
          Description: ${event.description || 'No description provided'}

          You are invited by ${this.email}
        `,
        html: `
          <h1>Event Invitation</h1>
          <p>You are invited to the following event:</p>
          <p><strong>Event:</strong> ${event.summary}</p>
          <p><strong>Start:</strong> ${startDateTime}</p>
          <p><strong>End:</strong> ${endDateTime}</p>
          <p><strong>Description:</strong> ${event.description || 'No description provided'}</p>
          <p>You are invited by ${this.email}</p>
          <img src="https://example.com/company-logo.png" alt="Company Logo" style="max-width: 200px;">
        `
      }

      try {
        await axios.post('/api/email/send', invitationData)
        alert('Email invitations sent successfully')
        this.emailModal.hide()
        this.emailAddresses = ''
        this.createdEvent = null
      } catch (error) {
        console.error('Error sending invitations:', error)
        alert('Failed to send email invitations')
      }
    },
    backToCreate() {
      this.selectedEvent = null
      this.resetEventForm()
    }
  }
}
</script>

<style scoped>
.calendar-app {
  font-family: 'Roboto', sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 2rem;
}

.calendar-container {
  max-width: 1200px;
  margin: 0 auto;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.welcome-message {
  font-size: 1.1rem;
  color: #34495e;
}

.logout-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.events-section, .event-form-section {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  color: #2c3e50;
}

.refresh-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.refresh-btn:hover {
  background-color: #2980b9;
}

.events-list {
  display: grid;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
}

.event-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  border-left: 4px solid #3498db;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.event-card.selected {
  background-color: #e8f4fd;
  border-left-color: #2980b9;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.event-title {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0;
}

.event-id {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.event-details p {
  margin: 0.25rem 0;
  color: #34495e;
}

.event-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-description {
  font-style: italic;
  color: #7f8c8d;
}

.edit-btn {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 0.5rem;
}

.edit-btn:hover {
  background-color: #27ae60;
}

.no-events {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}

.no-events i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.form-card {
  background-color: white;
  border-radius: 10px;
  padding: 2rem;
}

.form-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.event-form {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  color: #34495e;
}

.form-group input,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #bdc3c7;
  border-radius: 5px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.submit-btn, .delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn {
  background-color: #2ecc71;
  color: white;
}

.submit-btn:hover {
  background-color: #27ae60;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background-color: #c0392b;
}

.back-btn {
  background-color: transparent;
  color: #3498db;
  border: none;
  cursor: pointer;
  margin-top: 1rem;
  padding: 0;
}

.back-btn:hover {
  text-decoration: underline;
}

.custom-modal .modal-content {
  border-radius: 10px;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.failure {
  background-color: #f8d7da;
  color: #721c24;
}

/* Date and Time Picker Styles */
.input-group-text {
  background-color: #3498db;
  border-color: #3498db;
  color: white;
}

.input-group-text:hover {
  background-color: #2980b9;
}

.datetimepicker-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

/* Custom styles for Tempus Dominus Bootstrap 4 */
.bootstrap-datetimepicker-widget {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.bootstrap-datetimepicker-widget table td.active,
.bootstrap-datetimepicker-widget table td.active:hover {
  background-color: #3498db;
  color: #fff;
}

.bootstrap-datetimepicker-widget table td span.active {
  background-color: #3498db;
}

.bootstrap-datetimepicker-widget .btn-primary {
  background-color: #3498db;
  border-color: #3498db;
}

.bootstrap-datetimepicker-widget .btn-primary:hover {
  background-color: #2980b9;
  border-color: #2980b9;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .calendar-app {
    padding: 1rem;
  }

  .user-info {
    flex-direction: column;
  }

  .input-group {
    flex-direction: column;
  }

  .input-group > .form-control {
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .input-group-append {
    width: 100%;
  }

  .input-group-text {
    border-radius: 4px;
    justify-content: center;
  }
}
</style>