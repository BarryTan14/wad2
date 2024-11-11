<template>
  <div class="calendar-app bg-light min-vh-100 py-4">
    <div class="container">
      <!-- Header Section -->
      <header class="row mb-5">
        <div class="col-12 text-center">
          <h1 class="display-4 text-primary fw-bold"><span style="color:#6f42c1">Calendar & Event Manager</span></h1>
        </div>
      </header>

      <!-- Main Content -->
      <div v-if="email" class="row g-4">
        <!-- Create/Edit Event Form -->
        <div class="col-12 col-lg-5">
          <section class="card border-0 shadow-sm h-100" style="background-color: white;">
            <div class="card-body p-4">
              <h2 class="card-title h4 mb-4 text-primary">
                <span style="color:#6f42c1">{{ selectedEvent ? 'Edit Event' : 'Create New Event' }} </span>
              </h2>

              <form @submit.prevent="handleEventSubmit">
                <div class="mb-4">
                  <label for="eventSummary" class="form-label">Event Name</label>
                  <input type="text" style="background-color: white; color: black;" id="eventSummary" v-model="eventForm.summary"
                    class="form-control form-control-lg" placeholder="Enter event title" required />
                </div>

                <div class="mb-4">
                  <label for="eventStart" class="form-label"  >Start Date & Time</label>
                 
                    <input type="text" id="eventStart" class="form-control" v-model="eventForm.start"
                      placeholder="YYYY-MM-DD HH:MM" style="color: black;"  required readonly />
                    
                </div>

                <div class="mb-4">
                  <label for="eventEnd" class="form-label">End Date & Time</label>
                  
                    <input type="text" id="eventEnd" class="form-control" v-model="eventForm.end"
                      placeholder="YYYY-MM-DD HH:MM" style="color: black;" required readonly />
                    
                </div>

                <div class="mb-4">
                  <label for="eventDescription" class="form-label">Description</label>
                  <textarea style="background-color: white; color: black;" id="eventDescription" v-model="eventForm.description"
                    class="form-control" rows="4" placeholder="Enter event description"></textarea>
                </div>

                <div class="d-flex gap-3 justify-content-between align-items-center">
                  <button type="submit" class="btn btn-lg" style="background-color: var(--bs-purple); color: white;">
                    <i class="fas fa-plus me-2"></i>
                    {{ selectedEvent ? 'Update Event' : 'Create Event' }}
                  </button>
                  <button v-if="selectedEvent" type="button" @click="deleteEvent" class="btn btn-danger btn-lg">
                    <i class="fas fa-trash-alt me-2"></i>Delete Event
                  </button>
                </div>
              </form>

              <button v-if="selectedEvent" @click="backToCreate" class="btn btn-link text-decoration-none mt-4">
                <i class="fas fa-arrow-left me-2"></i>Back to Create
              </button>
            </div>
          </section>
        </div>

        <!-- Events List -->
        <div class="col-12 col-lg-7">
          <section class="card border-0 shadow-sm h-100" style="background-color: white;">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="h4 text-primary mb-0"><span style="color:#6f42c1">Your Events</span></h2>
                <button @click="listEvents" class="btn btn-outline"  style="background-color:#6f42c1" >
                  <i class="fas fa-sync-alt me-2" style="color: white;"></i> <span style="color: white;">Refresh</span>
                </button>
              </div>

              <!-- Loading State -->
              <div v-if="isLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mt-3">Loading your events...</p>
              </div>

              <!-- Events Grid -->
              <div v-else-if="events.length" class="events-grid">
                <div v-for="event in events" :key="event.id"
                  :class="['event-item', { 'full-width': event.description?.length > 150 }]">
                  <FlipCard :frontTitle="event.summary" :frontDescription="event.description || 'No description'"
                    :backTitle="'Event Details'" :eventId="event.id"
                    :startDate="formatDateTime(event.start.dateTime || event.start.date)"
                    :endDate="formatDateTime(event.end.dateTime || event.end.date)">
                    <template #backActions>
                      <button @click.stop="selectEvent(event)" class="btn"
                        style="background-color: var(--bs-purple);  margin-bottom: 20px;"> 
                        <i class="fas fa-edit me-2" style="color: white;"></i><span style="color: white;">Edit</span>
                      </button>
                    </template>
                  </FlipCard>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-5">
                <i class="far fa-calendar-times fs-1 text-muted mb-3"></i>
                <p class="h5 mb-3">No events found</p>
                <div class="text-muted">
                  <p class="mb-2">Link your google calendar here
                    <a href="https://calendar.google.com/" class="text-decoration-none">
                      https://calendar.google.com/
                    </a>
                  </p>
                  <p class="small">
                    Start viewing by adding the service account:<br>
                    <span class="fw-bold">gabriel-neo@rock-fountain-439607-n0.iam.gserviceaccount.com</span>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Login Required State -->
      <div v-else class="row">
        <div class="col-12 text-center py-5">
          <i class="fas fa-lock fs-1 text-muted mb-3"></i>
          <p class="lead">Please log in to access the Calendar Manager</p>
        </div>
      </div>
    </div>

    <!-- Event Action Modal -->
    <div class="modal fade" id="eventActionModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-bottom-0">
            <h5 class="modal-title">{{ modalTitle }}</h5>
            <button type="button" class="btn-close" @click="closeEventActionModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="modalAction" class="alert" :class="modalAction === 'Success' ? 'alert-success' : 'alert-danger'">
              {{ modalAction }}
            </div>
            <div class="event-details">
              <p class="mb-2"><strong>Event:</strong> {{ modalEvent.summary }}</p>
              <p class="mb-2">
                <strong>Start:</strong>
                {{ formatDateTime(modalEvent.start?.dateTime || modalEvent.start?.date) }}
              </p>
              <p class="mb-0">
                <strong>End:</strong>
                {{ formatDateTime(modalEvent.end?.dateTime || modalEvent.end?.date) }}
              </p>
            </div>
          </div>
          <div class="modal-footer border-top-0">
            <button type="button" class="btn btn-secondary" @click="closeEventActionModal">
              Close
            </button>
            <button v-if="modalAction === 'Success' && isNewEvent && !invitationsSent" type="button"
              class="btn btn-primary" @click="showEmailModal">
              Send Invitations
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Invitation Modal -->
    <div class="modal fade" id="emailModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-bottom-0">
            <h5 class="modal-title">Send Email Invitations</h5>
            <button type="button" class="btn-close" @click="closeEmailModal" :disabled="isLoading"></button>
          </div>
          <div class="modal-body">
            <div class="mb-4">
              <label class="form-label">Select Group</label>
              <select v-model="selectedGroup" class="form-select" :disabled="isLoading">
                <option value="">Choose a group</option>
                <option v-for="group in groups" :key="group.id" :value="group">
                  {{ group.name }} ({{ group.membersInCharge.length }} members)
                </option>
              </select>
            </div>

            <div v-if="selectedGroup" class="mt-4">
              <h6 class="mb-3">Group Members:</h6>
              <div class="list-group">
                <div v-for="member in selectedGroup.membersInCharge" :key="member" class="list-group-item">
                  {{ member }}
                </div>
              </div>
            </div>

            <div v-if="emailError" class="alert alert-danger mt-4">
              {{ emailError }}
            </div>
          </div>
          <div class="modal-footer border-top-0">
            <button type="button" class="btn btn-secondary" @click="closeEmailModal" :disabled="isLoading">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="sendInvitations"
              :disabled="!selectedGroup || isLoading">
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
// import 'flatpickr/dist/flatpickr.min.css'
import FlipCard from '../components/FlipCard.vue'
// import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

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
      this.isLoading = true
      try {
        const response = await axios.get('/api/group/myGroups')
        if (response.data?.success && response.data?.groups) {
          this.groups = response.data.groups.map(group => ({
            id: group.groupId,
            name: group.moduleName,
            membersInCharge: group.teamMembers || []
          }))
        } else {
          throw new Error('No groups data received')
        }
      } catch (error) {
        console.error('Error fetching groups:', error)
        this.emailError = error.message || 'Failed to fetch groups'
        this.groups = []
      } finally {
        this.isLoading = false
      }
    },

    initDateTimePickers() {
      const commonConfig = {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        static: true
      }

      this.startPicker = flatpickr('#eventStart', {
        ...commonConfig,
        onChange: (selectedDates, dateStr) => {
          this.eventForm.start = dateStr
          if (this.endPicker) {
            this.endPicker.set('minDate', selectedDates[0])
          }
        }
      })

      this.endPicker = flatpickr('#eventEnd', {
        ...commonConfig,
        onChange: (selectedDates, dateStr) => {
          this.eventForm.end = dateStr
        }
      })
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
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    async listEvents() {
      try {
        await axios.get(`/api/calendar-email/events?email=${this.email}`)
          .then(res => {
            this.events = res.data.map(event => ({
              id: event.id,
              summary: event.summary,
              description: event.description || 'No description',
              start: event.start,
              end: event.end
            })
            )
            // console.log(this.events)
          }).catch(error => {
          })
      } catch (error) {
        this.$swal.fire({
          icon: 'error',
          title: 'Error Fetching Events',
          text: error.message,
        });
        //this.showEventActionModal('Failure', { summary: 'Error fetching events' })
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
        this.$swal.fire({
          icon: 'error',
          title: 'Error submitting event',
          text: "Please provide access to your google calendar with the service account!",
        });
        //this.showEventActionModal('Failure', this.eventForm)
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
        this.$swal.fire({
          icon: 'error',
          title: 'Error deleting event',
          text: error.message,
        });
        //this.showEventActionModal('Failure', this.selectedEvent)
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
        this.emailError = 'Please select a group'
        return
      }

      this.isLoading = true
      this.emailError = ''

      try {
        // Get emails for all group members in parallel
        const emailPromises = this.selectedGroup.membersInCharge.map(member =>
          axios.get(`/api/group/names/${member.name}`)
        );

        const responses = await Promise.allSettled(emailPromises)

        // Filter successful responses and extract emails
        const validEmails = responses
          .filter(response => response.status === 'fulfilled' &&
            response.value.data?.success &&
            response.value.data?.data?.[0]?.email)
          .map(response => response.value.data.data[0].email)

        if (validEmails.length === 0) {
          throw new Error('No valid email addresses found for group members')
        }

        const event = this.createdEvent
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
        }

        const response = await axios.post('/api/email/send', eventData)

        if (response.data?.success) {
          this.invitationsSent = true
          this.emailModal.hide()
          this.selectedGroup = null
          this.emailError = ''
          this.createdEvent = null
          // Use a toast notification if available in your app
          this.$toast.fire({
            icon: 'success',
            title: 'Invitations sent successfully',
            text: `Invitations sent successfully to ${validEmails.length} recipients`,
            timer: 10000,
          })
          //this.toast?.success(`Invitations sent successfully to ${validEmails.length} recipients`)
        } else {
          throw new Error(response.data?.message || 'Failed to send invitations')
        }
      } catch (error) {
        console.error('Error sending invitations:', error)
        this.emailError = error.message || 'Failed to send email invitations. Please try again.'
        this.toast?.error(this.emailError)
        this.$toast.fire({
          icon: 'error',
          title: this.emailError,
          timer: 5000,
        })
      } finally {
        this.isLoading = false
      }
    },
    showEventActionModal(action, event) {
      /*this.$swal.fire({
        icon: action === 'Success' ? 'success' : 'warning',
        title: action === 'Success' ? 'Event Action Successful' : 'Event Action Failed',
        html:`
                <p><strong>Event:</strong>${event.summary}</p>
              <p><strong>Start:</strong>${this.formatDateTime(event.start?.dateTime || event.start?.date)}</p>
              <p><strong>End:</strong>${this.formatDateTime(event.end?.dateTime || event.end?.date)}</p>
            `,
        text: event?.message,
      });*/
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

    async showEventActionModalSwal(event, action, isNewEvent = false, invitationsSent = false) {
      // Helper function to format date/time (implement your actual formatting logic)
      const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString(); // Replace with your actual formatting
      };

      // Create the status badge HTML
      const statusBadgeHtml = action ?
        `<div class="status-badge ${action.toLowerCase()}">${action}</div>` : '';

      this.$swal.fire({
        title: action || 'Event Details', // Or whatever your modalTitle would be
        html: `
      ${statusBadgeHtml}
      <div class="event-details">
        <p><strong>Event:</strong> ${event.summary}</p>
        <p><strong>Start:</strong> ${formatDateTime(event.start?.dateTime || event.start?.date)}</p>
        <p><strong>End:</strong> ${formatDateTime(event.end?.dateTime || event.end?.date)}</p>
      </div>
    `,
        showCloseButton: true,
        showConfirmButton: action === 'Success' && isNewEvent && !invitationsSent,
        showCancelButton: true,
        confirmButtonText: 'Send Invitations',
        cancelButtonText: 'Close',
        cancelButtonColor: '#6c757d', // Bootstrap secondary color
        customClass: {
          container: 'event-action-modal',
          popup: 'custom-modal',
          header: 'modal-header',
          content: 'modal-content',
          closeButton: 'btn-close',
          actions: 'modal-footer'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Handle "Send Invitations" button click
          this.showEmailInvitationModalSwal(); // Your email modal function
        }
      });
    },

    async showEmailInvitationModalSwal() {
      // Create the group selection HTML
      const groupOptionsHtml = this.groups.map(group =>
        `<option value="${group.id}">${group.name} (${group.membersInCharge.length} members)</option>`
      ).join('');

      const result = await this.$swal.fire({
        title: 'Send Email Invitations',
        html: `
      <div class="form-group">
        <label>Select Group</label>
        <select id="groupSelect" class="form-control">
          <option value="">Choose a group</option>
          ${groupOptionsHtml}
        </select>
      </div>
      <div id="membersList" class="mt-3" style="display: none;">
        <h6>Group Members:</h6>
        <div class="member-list"></div>
      </div>
    `,
        showCancelButton: true,
        confirmButtonText: 'Send Invitations',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        didOpen: () => {
          // Add event listener to group select
          const groupSelect = document.getElementById('groupSelect');
          groupSelect.addEventListener('change', (e) => {
            const selectedGroup = this.groups.find(g => g.id === e.target.value);
            const membersListDiv = document.getElementById('membersList');
            const memberListContainer = membersListDiv.querySelector('.member-list');

            if (selectedGroup) {
              memberListContainer.innerHTML = selectedGroup.membersInCharge
                .map(member => `<div class="member-item">${member}</div>`)
                .join('');
              membersListDiv.style.display = 'block';
            } else {
              membersListDiv.style.display = 'none';
            }
          });
        },
        preConfirm: async () => {
          const selectedGroupId = document.getElementById('groupSelect').value;
          if (!selectedGroupId) {
            this.$swal.showValidationMessage('Please select a group');
            return false;
          }

          try {
            // Replace this with your actual invitation sending logic
            await this.sendInvitations(selectedGroupId);
            return true;
          } catch (error) {
            this.$swal.showValidationMessage(error.message || 'Failed to send invitations as your email is not valid :(');
            return false;
          }
        }
      });

      if (result.isConfirmed) {
        this.$swal.fire({
          title: 'Success!',
          text: 'Invitations have been sent successfully',
          icon: 'success'
        });
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
/* Existing styles */
.calendar-app {
  background-color: #ffffff;
  min-height: 100vh;
  padding: 2rem 1rem;
}

.app-title {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
}

.event-form-section,
.events-section {
  height: 100%;
  transition: all 0.3s ease;
}

.event-form-section:hover,
.events-section:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* Ensure modals appear above everything else */
.modal {
  z-index: 1050;
}

/* Override flatpickr styling to match Bootstrap */
.flatpickr-input {
  background-color: white !important;
}

/* Responsive adjustments */
@media (max-width: 991.98px) {
  .calendar-app {
    padding: 1rem 0.5rem;
  }

  .app-title {
    font-size: 2rem;
  }

  .event-form-section,
  .events-section {
    margin-bottom: 1rem;
  }
}

@media (max-width: 575.98px) {
  .app-title {
    font-size: 1.75rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .btn {
    width: 100%;
  }
}

.member-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem;
  margin-top: 0.5rem;
}

.member-item {
  padding: 0.25rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.member-item:last-child {
  border-bottom: none;
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

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
  background-color: #6f42c1;
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
  background-color: #6f42c1;
  border-color: #6f42c1;
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

/* New and modified styles */
.h2 {
  font-size: 1.75rem;
  color: #333;
  font-weight: 600;
}

.card {
  border: none;
  background: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.form-control {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.625rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.input-group .form-control {
  border-right: none;
}

.input-group .btn {
  border-left: none;
  background-color: #ffffff;
}

.input-group .btn:hover {
  background-color: #f8f9fa;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover {
  background-color: #6f42c1;
  border-color: #6f42c1;
}

.btn-outline-primary {
  color: #007bff;
  border-color: #007bff;
}

.btn-outline-primary:hover {
  background-color: #6f42c1;
  color: #ffffff;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: #ffffff;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
}
.event-item {
  min-width: 0; /* Ensures proper flex behavior */
}

.event-item.full-width {
  grid-column: 1 / -1;
}
@media (max-width: 768px) {
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .event-item {
    grid-column: 1 / -1;
  }
}

.event-card-wrapper {
  height: 200px;
}

@media (max-width: 768px) {
  .calendar-app {
    padding: 1rem 0.5rem;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}

/* Ensure all inputs have the same width */
.form-control,
.input-group {
  width: 100%;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  body {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #e1e1e1;
  }

  .card {
    background: #2a2a2a;
    color: #e1e1e1;
  }

  .form-control {
    background-color: #333333;
    border-color: #444444;
    color: #e1e1e1;
  }

  .form-control:focus {
    border-color: #0d6efd;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
  }

  .input-group .btn {
    background-color: #333333;
    color: #e1e1e1;
  }

  .input-group .btn:hover {
    background-color: #444444;
  }

  .btn-outline-secondary {
    color: #e1e1e1;
    border-color: #444444;
  }

  .btn-outline-secondary:hover {
    background-color: #444444;
    color: #ffffff;
  }

  .text-muted {
    color: #adb5bd !important;
  }

  .h2 {
    background: linear-gradient(45deg, #64b5f6, #2196f3);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
</style>