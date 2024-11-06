// script.js
const apiUrl = 'http://localhost:3000';
let attendees = [];

function displayResponse(data, isError = false) {
    const responseElement = document.getElementById('response');
    responseElement.style.color = isError ? 'red' : 'black';
    responseElement.innerText = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

async function checkAuthStatus() {
    try {
        const response = await fetch(`${apiUrl}/current-user`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('currentEmail').textContent = data.email;
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('calendarSection').classList.remove('hidden');
        } else {
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('calendarSection').classList.add('hidden');
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('calendarSection').classList.add('hidden');
    }
}

async function listEvents() {
    try {
        const response = await fetch(`${apiUrl}/events`, {
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch events');

        // Format the events for display
        const formattedEvents = data.map(event => ({
            id: event.id,
            summary: event.summary,
            start: new Date(event.start.dateTime || event.start.date).toLocaleString(),
            end: new Date(event.end.dateTime || event.end.date).toLocaleString(),
            attendees: event.attendees?.map(a => a.email).join(', ') || 'No attendees'
        }));

        displayResponse(formattedEvents);
    } catch (error) {
        displayResponse(`Error: ${error.message}`, true);
    }
}

function addAttendee() {
    const attendeeEmail = document.getElementById('attendeeEmail').value;
    if (!attendeeEmail) {
        displayResponse('Please enter an attendee email address', true);
        return;
    }

    if (attendees.some(a => a.email === attendeeEmail)) {
        displayResponse('This attendee is already added', true);
        return;
    }

    attendees.push({ email: attendeeEmail });
    updateAttendeesList();
    document.getElementById('attendeeEmail').value = '';
}

function removeAttendee(email) {
    attendees = attendees.filter(a => a.email !== email);
    updateAttendeesList();
}

function updateAttendeesList() {
    const list = document.getElementById('attendeesList');
    list.innerHTML = '';
    
    attendees.forEach(attendee => {
        const div = document.createElement('div');
        div.className = 'attendee-item';
        div.innerHTML = `
            <span>${attendee.email}</span>
            <button onclick="removeAttendee('${attendee.email}')">Remove</button>
        `;
        list.appendChild(div);
    });
}

async function login() {
    const email = document.getElementById('userEmail').value;
    
    if (!email) {
        displayResponse('Please enter your email address', true);
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        document.getElementById('currentEmail').textContent = email;
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('calendarSection').classList.remove('hidden');
        displayResponse('Login successful');
    } catch (error) {
        displayResponse(`Error: ${error.message}`, true);
    }
}

async function logout() {
    try {
        await fetch(`${apiUrl}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('calendarSection').classList.add('hidden');
        document.getElementById('currentEmail').textContent = '';
        attendees = [];
        updateAttendeesList();
        displayResponse('Logged out successfully');
    } catch (error) {
        displayResponse(`Error: ${error.message}`, true);
    }
}

function validateDateTime(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date/time format');
    }
    
    if (startDate >= endDate) {
        throw new Error('End time must be after start time');
    }
    
    // Ensure dates are in the future
    const now = new Date();
    if (startDate < now) {
        throw new Error('Start time must be in the future');
    }
    
    return { startDate, endDate };
}

async function createCalendarEvent() {
    try {
        const summary = document.getElementById('eventSummary').value;
        const location = document.getElementById('eventLocation').value;
        const start = document.getElementById('eventStart').value;
        const end = document.getElementById('eventEnd').value;
        const description = document.getElementById('eventDescription').value;

        if (!summary || !start || !end) {
            throw new Error('Please fill in all required fields (Summary, Start Time, End Time)');
        }

        // Validate dates and get formatted versions
        const { startDate, endDate } = validateDateTime(start, end);

        const event = {
            summary: summary,
            location: location,
            description: description,
            start: { 
                dateTime: startDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: { 
                dateTime: endDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            attendees: attendees,
            guestsCanSeeOtherGuests: true,
            sendUpdates: 'all'
        };

        const response = await fetch(`${apiUrl}/events`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });

        const data = await response.json();
        if (!response.ok) {
            if (data.error) {
                throw new Error(`${data.error}${data.details ? `: ${data.details}` : ''}`);
            }
            throw new Error('Failed to create event');
        }

        // Clear form and attendees after successful event creation
        document.getElementById('eventSummary').value = '';
        document.getElementById('eventLocation').value = '';
        document.getElementById('eventStart').value = '';
        document.getElementById('eventEnd').value = '';
        document.getElementById('eventDescription').value = '';
        attendees = [];
        updateAttendeesList();
        
        displayResponse('Event created successfully: ' + data.htmlLink);
    } catch (error) {
        displayResponse(`Error: ${error.message}`, true);
    }
}

async function updateCalendarEvent() {
    try {
        const eventId = document.getElementById('eventId').value;
        if (!eventId) throw new Error('Event ID is required');

        const summary = document.getElementById('eventSummary').value;
        const location = document.getElementById('eventLocation').value;
        const start = document.getElementById('eventStart').value;
        const end = document.getElementById('eventEnd').value;
        const description = document.getElementById('eventDescription').value;

        if (!summary || !start || !end) {
            throw new Error('Please fill in all required fields (Summary, Start Time, End Time)');
        }

        // Validate dates and get formatted versions
        const { startDate, endDate } = validateDateTime(start, end);

        const event = {
            summary: summary,
            location: location,
            description: description,
            start: { 
                dateTime: startDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: { 
                dateTime: endDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            attendees: attendees,
            guestsCanSeeOtherGuests: true,
            sendUpdates: 'all'
        };

        const response = await fetch(`${apiUrl}/events/${eventId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });

        const data = await response.json();
        if (!response.ok) {
            if (data.error) {
                throw new Error(`${data.error}${data.details ? `: ${data.details}` : ''}`);
            }
            throw new Error('Failed to update event');
        }
        
        displayResponse('Event updated successfully: ' + data.htmlLink);
    } catch (error) {
        displayResponse(`Error: ${error.message}`, true);
    }
}

async function deleteCalendarEvent() {
    try {
        const eventId = document.getElementById('eventId').value;
        if (!eventId) throw new Error('Event ID is required');

        const response = await fetch(`${apiUrl}/events/${eventId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const data = await response.json();
            if (data.error) {
                throw new Error(`${data.error}${data.details ? `: ${data.details}` : ''}`);
            }
            throw new Error('Failed to delete event');
        }
        
        displayResponse('Event deleted successfully');
    } catch (error) {
        displayResponse(`Error: ${error.message}`, true);
    }
}

document.addEventListener('DOMContentLoaded', checkAuthStatus);