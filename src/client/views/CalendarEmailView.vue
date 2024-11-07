<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-10 col-lg-8">
        <h1 class="display-4 text-center mb-5">Calendar and Email Manager</h1>

        <!-- Main Content -->
        <div v-if="email">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3">Welcome, {{ email }}</h2>
            <button
              @click="logout"
              class="btn btn-outline-danger"
            >
              Logout
            </button>
          </div>

          <!-- Event List -->
          <div class="card shadow-sm mb-5">
            <div class="card-body">
              <h3 class="card-title h5 mb-3">Your Events</h3>
              <button
                @click="listEvents"
                class="btn btn-success mb-4"
              >
                Refresh Events
              </button>
              <div v-if="events.length" class="list-group">
                <div v-for="event in events" :key="event.id" class="list-group-item">
                  <h4 class="h6 mb-1">{{ event.summary }}</h4>
                  <p class="mb-1"><small>ID: {{ event.id }}</small></p>
                  <p class="mb-1">Start: {{ formatDateTime(event.start.dateTime || event.start.date) }}</p>
                  <p class="mb-1">End: {{ formatDateTime(event.end.dateTime || event.end.date) }}</p>
                  <p v-if="event.description" class="mb-2">Description: {{ event.description }}</p>
                  <button
                    @click="selectEvent(event)"
                    class="btn btn-sm btn-outline-primary"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <p v-else>No events found.</p>
            </div>
          </div>

          <!-- Event Form -->
          <div class="card shadow-sm mb-5">
            <div class="card-body">
              <h3 class="card-title h5 mb-3">
                {{ selectedEvent ? 'Edit Event' : 'Create New Event' }}
              </h3>
              <form @submit.prevent="handleEventSubmit" class="mb-3">
                <div class="mb-3">
                  <label for="eventSummary" class="form-label">Summary:</label>
                  <input
                    type="text"
                    id="eventSummary"
                    v-model="eventForm.summary"
                    required
                    class="form-control"
                  />
                </div>
                <div class="mb-3">
                  <label for="eventStart" class="form-label">Start Time:</label>
                  <input
                    type="datetime-local"
                    id="eventStart"
                    v-model="eventForm.start"
                    required
                    class="form-control"
                  />
                </div>
                <div class="mb-3">
                  <label for="eventEnd" class="form-label">End Time:</label>
                  <input
                    type="datetime-local"
                    id="eventEnd"
                    v-model="eventForm.end"
                    required
                    class="form-control"
                  />
                </div>
                <div class="mb-3">
                  <label for="eventDescription" class="form-label">Description:</label>
                  <textarea
                    id="eventDescription"
                    v-model="eventForm.description"
                    rows="3"
                    class="form-control"
                  ></textarea>
                </div>
                <div class="d-flex justify-content-between">
                  <button
                    type="submit"
                    class="btn btn-primary"
                  >
                    {{ selectedEvent ? 'Update Event' : 'Create Event' }}
                  </button>
                  <button
                    v-if="selectedEvent"
                    type="button"
                    @click="deleteEvent"
                    class="btn btn-danger"
                  >
                    Delete Event
                  </button>
                </div>
              </form>
              <button
                v-if="selectedEvent"
                @click="backToCreate"
                class="btn btn-secondary"
              >
                Back to Create
              </button>
            </div>
          </div>
        </div>
        <div v-else>
          <p class="text-center">Please log in to access the Calendar Manager.</p>
        </div>
      </div>
    </div>

    <!-- Event Action Modal -->
    <div class="modal fade" id="eventActionModal" tabindex="-1" aria-labelledby="eventActionModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="eventActionModalLabel">{{ modalTitle }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p><strong>{{ modalAction }}</strong></p>
            <p><strong>Event Name:</strong> {{ modalEvent.summary }}</p>
            <p><strong>Start:</strong> {{ formatDateTime(modalEvent.start?.dateTime || modalEvent.start?.date) }}</p>
            <p><strong>End:</strong> {{ formatDateTime(modalEvent.end?.dateTime || modalEvent.end?.date) }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button v-if="modalAction === 'Success' && !selectedEvent" type="button" class="btn btn-primary" @click="showEmailModal">Send Invitations</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Invitation Modal -->
    <div class="modal fade" id="emailModal" tabindex="-1" aria-labelledby="emailModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="emailModalLabel">Send Email Invitations</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="emailList" class="form-label">Enter email addresses (comma-separated):</label>
              <textarea
                id="emailList"
                v-model="emailAddresses"
                rows="3"
                class="form-control"
                placeholder="example1@email.com, example2@email.com"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="sendInvitations">Send Invitations</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { Modal } from 'bootstrap'

export default {
  name: 'CalendarManagerView',
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
      emailModal: null
    }
  },
  computed: {
     email() 
     { 
      return this.$authStore.currentUser.email 
    }
  },
  mounted() {
    if (this.email) {
      this.listEvents()
    }
    this.eventActionModal = new Modal(document.getElementById('eventActionModal'))
    this.emailModal = new Modal(document.getElementById('emailModal'))
  },
  methods: {
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
      this.$store.dispatch('auth/logout')
      this.$router.push('/login')
    },
    async listEvents() {
      try {
        const res = await axios.get(`/api/calendar-email/events?email=${this.email}`)
        this.events = res.data
      } catch (error) {
        console.error('Error fetching events:', error)
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
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>