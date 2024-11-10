<template>
  <div class="calendar-app">
    <div class="calendar-container">
      <header class="app-header">
        <h1 class="app-title">Calendar & Event Manager</h1>
        <div v-if="email" class="user-info">
          <span class="welcome-message">
            Welcome, <strong>{{ email }}</strong>
          </span>
        </div>
      </header>

      <div v-if="email" class="main-content">
        <section class="event-form-section">
          <div class="form-card">
            <h2 class="form-title">{{ selectedEvent ? 'Edit Event' : 'Create New Event' }}</h2>
            <form @submit.prevent="handleEventSubmit" class="event-form">
              <div class="form-group">
                <label for="eventSummary">Summary</label>
                <input type="text" id="eventSummary" v-model="eventForm.summary" required
                  placeholder="Enter event title" class="form-control" />
              </div>
              <div class="form-group">
                <label for="eventStart">Start Time</label>
                <div class="input-group">
                  <input type="text" id="eventStart" class="form-control flatpickr-input" v-model="eventForm.start"
                    data-input required readonly />
                  <div class="input-group-append">
                    <button class="btn btn-primary" type="button" @click="openStartPicker">
                      <i class="fas fa-calendar"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="eventEnd">End Time</label>
                <div class="input-group">
                  <input type="text" id="eventEnd" class="form-control flatpickr-input" v-model="eventForm.end"
                    data-input required readonly />
                  <div class="input-group-append">
                    <button class="btn btn-primary" type="button" @click="openEndPicker">
                      <i class="fas fa-calendar"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="eventDescription">Description</label>
                <textarea id="eventDescription" v-model="eventForm.description" rows="3"
                  placeholder="Enter event description" class="form-control"></textarea>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary submit-btn">
                  <i class="fas fa-save"></i> {{ selectedEvent ? 'Update Event' : 'Create Event' }}
                </button>
                <button v-if="selectedEvent" type="button" @click="deleteEvent" class="btn btn-danger delete-btn">
                  <i class="fas fa-trash-alt"></i> Delete Event
                </button>
              </div>
            </form>
            <button v-if="selectedEvent" @click="backToCreate" class="btn btn-link back-btn">
              <i class="fas fa-arrow-left"></i> Back to Create
            </button>
          </div>
        </section>

        <section class="events-section">
          <div class="section-header">
            <h2 class="section-title">Your Events</h2>
            <button @click="listEvents" class="refresh-btn">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>

          <div v-if="isLoading" class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading...</p>
          </div>

          <div v-else-if="events.length" class="events-list">
            <div v-for="event in events" :key="event.id" class="event-card">
              <FlipCard
                :frontTitle="event.summary"
                :frontDescription="event.description || 'No description'"
                :backTitle="'Event Details'"
                :eventId="event.id"
                :startDate="formatDateTime(event.start.dateTime || event.start.date)"
                :endDate="formatDateTime(event.end.dateTime || event.end.date)"
              >
                <template #backActions>
                  <button @click.stop="selectEvent(event)" class="edit-btn">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                </template>
              </FlipCard>
            </div>
          </div>
          <div v-else class="no-events">
            <i class="far fa-calendar-times"></i>
            <p>No events found</p>
            <span>Create your first event to get started!</span>
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
            <button type="button" class="btn-close" @click="closeEventActionModal" aria-label="Close"></button>
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
            <button type="button" class="btn-secondary" @click="closeEventActionModal">
              Close
            </button>
            <button v-if="modalAction === 'Success' && isNewEvent && !invitationsSent" type="button" class="btn-primary"
              @click="showEmailModal">
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
            <button type="button" class="btn-close" @click="closeEmailModal" :disabled="isLoading"></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Group</label>
              <select v-model="selectedGroup" class="form-control" :disabled="isLoading">
                <option value="">Choose a group</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </div>
            <div v-if="emailError" class="text-danger mt-2">
              {{ emailError }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeEmailModal" :disabled="isLoading">
              Cancel
            </button>
            <button type="button" class="btn-primary" @click="sendInvitations" :disabled="!selectedGroup || isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              {{ isLoading ? 'Sending...' : 'Send Invitations' }}
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
import FlipCard from '../components/FlipCard.vue'

export default {
  name: 'CalendarEmailView',
  components: {
    FlipCard
  },
  data() {
    return {
      events: [],
      selectedEvent: null,
      createdEvent: null,
      eventForm: {
        summary: '',
        start: '',
        end: '',
        description: ''
      },
      isLoading: false,
      emailError: '',
      modalTitle: '',
      modalAction: '',
      modalEvent: {},
      eventActionModal: null,
      emailModal: null,
      startPicker: null,
      endPicker: null,
      isNewEvent: true,
      invitationsSent: false,
      selectedGroup: null,
      groups: [{ id: '', name: '', membersInCharge: [] }],
    }
  },
  computed: {
    email() {
      return this.$authStore.currentUser.email
    }
  },
  mounted() {
    this.getGroup();
    if (this.email) {
      this.listEvents()
    }
    this.eventActionModal = new Modal(document.getElementById('eventActionModal'))
    this.emailModal = new Modal(document.getElementById('emailModal'))
    this.initDateTimePickers()
  },
  methods: {
    async getGroup() {
      this.isLoading = true;
      try {
        const response = await axios.get('/api/group/myGroups');
        if (response.data && response.data.groups) {
          this.groups = response.data.groups.map(group => ({
            id: group.groupId,
            name: group.moduleName,
            membersInCharge: group.teamMembers || []
          }));
        } else {
          this.groups = [];
        }
        console.log('Fetched groups:', this.groups);
        this.$toast.success('Successfully fetched groups');
      } catch (error) {
        console.error('Error fetching groups:', error);
        this.$toast.error('Failed to fetch groups');
        this.groups = [];
      } finally {
        this.isLoading = false;
      }
    },

    initDateTimePickers() {
      this.startPicker = flatpickr('#eventStart', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        onChange: (selectedDates, dateStr) => {
          this.eventForm.start = dateStr
          if (this.endPicker) {
            this.endPicker.set('minDate', selectedDates[0])
          }
        }
      })

      this.endPicker = flatpickr('#eventEnd', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        onChange: (selectedDates, dateStr) => {
          this.eventForm.end = dateStr
        }
      })
    },
    closeEventActionModal() {
      this.eventActionModal.hide()
    },

    openStartPicker() {
      if (this.startPicker) {
        this.startPicker.open()
      }
    },

    openEndPicker() {
      if (this.endPicker) {
        this.endPicker.open()
      }
    },
    showEventActionModal(action, event) {
      this.modalTitle = action === 'Success' ? 'Event Action Successful' : 'Event Action Failed'
      this.modalAction = action
      this.modalEvent = event
      this.eventActionModal.show()
    },
    showEmailModal() {
      if (this.isNewEvent) {
        this.eventActionModal.hide()
        this.emailModal.show()
      }
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    async listEvents() {
      try {
        const res = await axios.get(`/api/calendar-email/events?email=${this.email}`)
        this.events = res.data.map(event => ({
          id: event.id,
          summary: event.summary,
          description: event.description || 'No description',
          start: event.start,
          end: event.end
        }))
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
      this.isNewEvent = false
      this.eventForm.summary = event.summary
      this.eventForm.start = event.start.dateTime || event.start.date
      this.eventForm.end = event.end.dateTime || event.end.date
      this.eventForm.description = event.description || ''
      this.startPicker.setDate(this.eventForm.start)
      this.endPicker.setDate(this.eventForm.end)
      this.scrollToTop()
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
          this.isNewEvent = false
          res = await axios.put(`/api/calendar-email/events/${this.selectedEvent.id}?email=${this.email}`, eventData)
          this.showEventActionModal('Success', res.data)
        } else {
          this.isNewEvent = true
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

      this.isNewEvent = false

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
    if (!this.selectedGroup) {
        this.emailError = 'Please select a group';
        return;
    }

    this.isLoading = true;
    try {
        const selectedGroupData = this.groups.find(group => group.id === this.selectedGroup);
        if (!selectedGroupData || !selectedGroupData.membersInCharge || selectedGroupData.membersInCharge.length === 0) {
            throw new Error('No members found for the selected group');
        }

        // Batch fetch all member emails in parallel
        const emailPromises = selectedGroupData.membersInCharge.map(async (member) => {
            try {
                // Extract displayName properly regardless of member format
                const displayName = typeof member === 'object' ? member.displayName : member;
                if (!displayName) {
                    console.error('Invalid member data:', member);
                    return null;
                }

                // Use the names endpoint to fetch user email
                const response = await axios.get(`/api/group/names/${encodeURIComponent(displayName)}`);
                
                if (response.data.success && response.data.data && response.data.data.length > 0) {
                    return response.data.data[0].email;
                }
                console.warn(`No email found for member: ${displayName}`);
                return null;
            } catch (error) {
                console.error('Error fetching email:', error);
                return null;
            }
        });

        // Wait for all email fetching to complete
        const emails = await Promise.all(emailPromises);
        const validEmails = emails.filter(email => email !== null);

        if (validEmails.length === 0) {
            throw new Error('No valid email addresses found for group members');
        }

        const event = this.createdEvent;
        const eventData = {
            to: validEmails,
            subject: `Event Invitation: ${event.summary}`,
            text: `
You are invited to the following event:

Event: ${event.summary}
Start: ${this.formatDateTime(event.start.dateTime || event.start.date)}
End: ${this.formatDateTime(event.end.dateTime || event.end.date)}
Description: ${event.description || 'No description provided'}

You are invited by ${this.email}
            `.trim(),
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2c3e50;">Event Invitation</h2>
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3 style="color: #3498db;">${event.summary}</h3>
        <p><strong>Start:</strong> ${this.formatDateTime(event.start.dateTime || event.start.date)}</p>
        <p><strong>End:</strong> ${this.formatDateTime(event.end.dateTime || event.end.date)}</p>
        <p><strong>Description:</strong> ${event.description || 'No description provided'}</p>
        <p><strong>Invited by:</strong> ${this.email}</p>
    </div>
</div>
            `.trim()
        };

        const response = await axios.post('/api/email/send', eventData);

        if (response.data.success) {
            this.invitationsSent = true;
            this.emailModal.hide();
            this.selectedGroup = null;
            this.emailError = '';
            this.createdEvent = null;
            
            // Show success message with invitation details
            this.showEventActionModal('Success', {
                summary: `Invitations sent successfully to ${validEmails.length} recipients`,
                start: { dateTime: event.start.dateTime },
                end: { dateTime: event.end.dateTime }
            });
        } else {
            throw new Error(response.data.message || 'Failed to send invitations');
        }
    } catch (error) {
        console.error('Error sending invitations:', error);
        this.emailError = error.response?.data?.message || 
                         error.message || 
                         'Failed to send email invitations. Please try again.';
    } finally {
        this.isLoading = false;
    }
},

    showEventActionModal(action, event) {
      this.modalTitle = action === 'Success' ? 'Event Action Successful' : 'Event Action Failed'
      this.modalAction = action
      this.modalEvent = event
      this.eventActionModal.show()
    },

    closeEventActionModal() {
      this.eventActionModal.hide()
      if (this.invitationsSent) {
        this.invitationsSent = false
        this.isNewEvent = false
      }
    },

    showEmailModal() {
      this.eventActionModal.hide()
      this.emailModal.show()
    },

    closeEmailModal() {
      this.emailModal.hide()
      if (!this.invitationsSent) {
        this.eventActionModal.show()
      }
    },

    backToCreate() {
      this.selectedEvent = null
      this.isNewEvent = true
      this.resetEventForm()
    },
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

.main-content {
  display: flex;
  flex-direction: row-reverse;
  gap: 2rem;
}

.events-section,
.event-form-section {
  flex: 1;
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.event-card {
  height: 200px;
  margin-bottom: 1rem;
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

.submit-btn,
.delete-btn {
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

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
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

  .input-group>.form-control {
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

.custom-modal .modal-content {
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.custom-modal .modal-header {
  border-bottom: none;
  padding-bottom: 0;
}

.custom-modal .modal-footer {
  border-top: none;
  padding-top: 0;
}

.custom-modal .btn-close:focus {
  box-shadow: none;
}

.custom-modal .form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
}

.custom-modal .form-control {
  resize: vertical;
  min-height: 100px;
}

.custom-modal .btn-primary {
  background-color: #3498db;
  border-color: #3498db;
  transition: all 0.3s ease;
}

.custom-modal .btn-primary:hover {
  background-color: #2980b9;
  border-color: #2980b9;
}

.custom-modal .btn-secondary {
  background-color: #95a5a6;
  border-color: #95a5a6;
  transition: all 0.3s ease;
}

.custom-modal .btn-secondary:hover {
  background-color: #7f8c8d;
  border-color: #7f8c8d;
}

.spinner-border {
  width: 1rem;
  height: 1rem;
  border-width: 0.2em;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.custom-modal {
  animation: fadeIn 0.3s ease-out;
}
</style>