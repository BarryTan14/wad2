<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Calendar and Email Manager</h1>

    <!-- Email Input Section -->
    <div v-if="!email" class="mb-6">
      <h2 class="text-2xl font-semibold mb-4">Enter Your Email</h2>
      <div class="flex items-center">
        <input
          type="email"
          v-model="tempEmail"
          placeholder="your@email.com"
          class="flex-grow mr-2 p-2 border rounded"
          required
        />
        <button
          @click="setEmail"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Continue
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold">Welcome, {{ email }}</h2>
        <button
          @click="logout"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <!-- Event List -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-2">Your Events</h3>
        <button
          @click="listEvents"
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
        >
          Refresh Events
        </button>
        <div v-if="events.length" class="space-y-4">
          <div v-for="event in events" :key="event.id" class="border p-4 rounded">
            <h4 class="font-bold">{{ event.summary }}</h4>
            <p>ID: {{ event.id }}</p>
            <p>Start: {{ formatDateTime(event.start.dateTime || event.start.date) }}</p>
            <p>End: {{ formatDateTime(event.end.dateTime || event.end.date) }}</p>
            <p v-if="event.description">Description: {{ event.description }}</p>
            <button
              @click="selectEvent(event)"
              class="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Edit
            </button>
          </div>
        </div>
        <p v-else>No events found.</p>
      </div>

      <!-- Event Form -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-2">
          {{ selectedEvent ? 'Edit Event' : 'Create New Event' }}
        </h3>
        <form @submit.prevent="handleEventSubmit" class="space-y-4">
          <div>
            <label for="eventSummary" class="block mb-1">Summary:</label>
            <input
              type="text"
              id="eventSummary"
              v-model="eventForm.summary"
              required
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label for="eventStart" class="block mb-1">Start Time:</label>
            <input
              type="datetime-local"
              id="eventStart"
              v-model="eventForm.start"
              required
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label for="eventEnd" class="block mb-1">End Time:</label>
            <input
              type="datetime-local"
              id="eventEnd"
              v-model="eventForm.end"
              required
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label for="eventDescription" class="block mb-1">Description:</label>
            <textarea
              id="eventDescription"
              v-model="eventForm.description"
              rows="3"
              class="w-full p-2 border rounded"
            ></textarea>
          </div>
          <div class="flex justify-between">
            <button
              type="submit"
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              {{ selectedEvent ? 'Update Event' : 'Create Event' }}
            </button>
            <button
              v-if="selectedEvent"
              type="button"
              @click="deleteEvent"
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete Event
            </button>
          </div>
        </form>
      </div>

      <!-- Response Section -->
      <div v-if="response" class="mt-6">
        <h3 class="text-xl font-semibold mb-2">Response:</h3>
        <pre class="bg-gray-100 p-4 rounded overflow-x-auto">{{ response }}</pre>
      </div>
    </div>

    <!-- Email Invitation Modal -->
    <div v-if="showEmailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4">Send Email Invitations</h2>
        <div class="mb-4">
          <label for="emailList" class="block mb-1">Enter email addresses (comma-separated):</label>
          <textarea
            id="emailList"
            v-model="emailAddresses"
            rows="3"
            class="w-full p-2 border rounded"
            placeholder="example1@email.com, example2@email.com"
          ></textarea>
        </div>
        <div class="flex justify-end space-x-2">
          <button
            @click="sendInvitations"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send Invitations
          </button>
          <button
            @click="closeEmailModal"
            class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import axios from 'axios'

export default {
  name: 'CalendarEmailView',
  setup() {
    const email = ref('')
    const tempEmail = ref('')
    const events = ref([])
    const selectedEvent = ref(null)
    const response = ref('')
    const showEmailModal = ref(false)
    const emailAddresses = ref('')
    const createdEvent = ref(null)

    const eventForm = reactive({
      summary: '',
      start: '',
      end: '',
      description: ''
    })

    const setEmail = () => {
      if (tempEmail.value && validateEmail(tempEmail.value)) {
        email.value = tempEmail.value
        tempEmail.value = ''
        listEvents()
      } else {
        response.value = 'Please enter a valid email address.'
      }
    }

    const validateEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    }

    const logout = () => {
      email.value = ''
      events.value = []
      selectedEvent.value = null
      response.value = 'Logged out successfully'
    }

    const listEvents = async () => {
      try {
        const res = await axios.get(`/api/calendar-email/events?email=${email.value}`)
        events.value = res.data
        response.value = 'Events fetched successfully'
      } catch (error) {
        response.value = `Error: ${error.response?.data?.error || error.message}`
      }
    }

    const formatDateTime = (dateTimeString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      return new Date(dateTimeString).toLocaleString(undefined, options)
    }

    const selectEvent = (event) => {
      selectedEvent.value = event
      eventForm.summary = event.summary
      eventForm.start = event.start.dateTime || event.start.date
      eventForm.end = event.end.dateTime || event.end.date
      eventForm.description = event.description || ''
    }

    const handleEventSubmit = async () => {
      try {
        const eventData = {
          summary: eventForm.summary,
          description: eventForm.description,
          start: { dateTime: new Date(eventForm.start).toISOString() },
          end: { dateTime: new Date(eventForm.end).toISOString() }
        }

        let res
        if (selectedEvent.value) {
          res = await axios.put(`/api/calendar-email/events/${selectedEvent.value.id}?email=${email.value}`, eventData)
          response.value = 'Event updated successfully'
        } else {
          res = await axios.post(`/api/calendar-email/events?email=${email.value}`, eventData)
          response.value = 'Event created successfully'
          createdEvent.value = res.data
          showEmailModal.value = true
        }

        await listEvents()
        selectedEvent.value = null
        resetEventForm()
      } catch (error) {
        response.value = `Error: ${error.response?.data?.error || error.message}`
      }
    }

    const deleteEvent = async () => {
      if (!selectedEvent.value) return

      try {
        await axios.delete(`/api/calendar-email/events/${selectedEvent.value.id}?email=${email.value}`)
        response.value = 'Event deleted successfully'
        await listEvents()
        selectedEvent.value = null
        resetEventForm()
      } catch (error) {
        response.value = `Error: ${error.response?.data?.error || error.message}`
      }
    }

    const resetEventForm = () => {
      eventForm.summary = ''
      eventForm.start = ''
      eventForm.end = ''
      eventForm.description = ''
    }

    const closeEmailModal = () => {
      showEmailModal.value = false
      emailAddresses.value = ''
      createdEvent.value = null
    }

    const sendInvitations = async () => {
      if (!createdEvent.value) return

      const recipients = emailAddresses.value.split(',').map(e => e.trim()).filter(e => validateEmail(e))

      if (recipients.length === 0) {
        response.value = 'No valid email addresses provided'
        return
      }

      const event = createdEvent.value
      const startDateTime = formatDateTime(event.start.dateTime || event.start.date)
      const endDateTime = formatDateTime(event.end.dateTime || event.end.date)

      const invitationData = {
        to: recipients,
        subject: `Event Invitation: ${event.summary}`,
        text: `
          You are invited to the following event:

          Event: ${event.summary}
          Start: ${startDateTime}
          End: ${endDateTime}
          Description: ${event.description || 'No description provided'}

          You are invited by ${email.value}
        `,
        html: `
          <h1>Event Invitation</h1>
          <p>You are invited to the following event:</p>
          <p><strong>Event:</strong> ${event.summary}</p>
          <p><strong>Start:</strong> ${startDateTime}</p>
          <p><strong>End:</strong> ${endDateTime}</p>
          <p><strong>Description:</strong> ${event.description || 'No description provided'}</p>
          <p>You are invited by ${email.value}</p>
          <img src="https://example.com/company-logo.png" alt="Company Logo" style="max-width: 200px;">
        `
      }

      try {
        const res = await axios.post('/api/email/send', invitationData)
        response.value = 'Email invitations sent successfully'
        closeEmailModal()
      } catch (error) {
        response.value = `Error: ${error.response?.data?.error || error.message}`
      }
    }

    return {
      email,
      tempEmail,
      events,
      selectedEvent,
      response,
      eventForm,
      showEmailModal,
      emailAddresses,
      setEmail,
      logout,
      listEvents,
      formatDateTime,
      selectEvent,
      handleEventSubmit,
      deleteEvent,
      closeEmailModal,
      sendInvitations
    }
  }
}
</script>