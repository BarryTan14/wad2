<template>
    <div class="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div class="email-form bg-white p-4 rounded shadow-lg">
        <h1 class="text-center mb-4 text-primary">Email Sender</h1>
        
        <div class="mb-3">
          <label class="form-label">Recipient Email</label>
          <div class="input-group">
            <span class="input-group-text bg-primary text-white">
              <i class="fas fa-envelope"></i>
            </span>
            <input 
              v-model="form.to" 
              type="email" 
              class="form-control"
              :class="{ 'is-invalid': v$.form.to.$error }"
              @blur="v$.form.to.$touch()"
              placeholder="recipient@example.com"
            />
            <div class="invalid-feedback" v-if="v$.form.to.$error">
              {{ v$.form.to.$errors[0].$message }}
            </div>
          </div>
        </div>
  
        <div class="mb-3">
          <label class="form-label">Subject</label>
          <div class="input-group">
            <span class="input-group-text bg-primary text-white">
              <i class="fas fa-heading"></i>
            </span>
            <input 
              v-model="form.subject" 
              type="text" 
              class="form-control"
              :class="{ 'is-invalid': v$.form.subject.$error }"
              @blur="v$.form.subject.$touch()"
              placeholder="Email Subject"
            />
            <div class="invalid-feedback" v-if="v$.form.subject.$error">
              {{ v$.form.subject.$errors[0].$message }}
            </div>
          </div>
        </div>
  
        <div class="mb-3">
          <label class="form-label">Plain Text Content</label>
          <textarea 
            v-model="form.text" 
            class="form-control"
            :class="{ 'is-invalid': v$.form.text.$error }"
            rows="4"
            @blur="v$.form.text.$touch()"
            placeholder="Enter your email content here..."
          ></textarea>
          <div class="invalid-feedback" v-if="v$.form.text.$error">
            {{ v$.form.text.$errors[0].$message }}
          </div>
        </div>
  
        <div class="mb-3">
          <label class="form-label">HTML Content</label>
          <textarea 
            v-model="form.html" 
            class="form-control"
            :class="{ 'is-invalid': v$.form.html.$error }"
            rows="4"
            @input="updatePreview"
            @blur="v$.form.html.$touch()"
            placeholder="<h1>Hello</h1><p>This is HTML content</p>"
          ></textarea>
          <div class="invalid-feedback" v-if="v$.form.html.$error">
            {{ v$.form.html.$errors[0].$message }}
          </div>
        </div>
  
        <div class="preview-panel mt-4 bg-light p-3 rounded">
          <h5 class="text-primary">HTML Preview</h5>
          <div 
            class="border p-3 bg-white rounded"
            v-html="sanitizedPreview"
          ></div>
        </div>
  
        <div class="d-grid gap-2 mt-4">
          <button 
            @click="sendEmail" 
            class="btn btn-primary btn-lg"
            :disabled="loading || !formIsValid"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Sending...' : 'Send Email' }}
          </button>
        </div>
      </div>
  
      <!-- Toast Notification -->
      <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
        <div 
          class="toast"
          :class="{ show: showToast }"
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
        >
          <div class="toast-header" :class="toastHeaderClass">
            <strong class="me-auto text-white">Notification</strong>
            <button 
              type="button" 
              class="btn-close"
              @click="showToast = false"
            ></button>
          </div>
          <div class="toast-body" :class="toastClass">
            {{ toastMessage }}
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, reactive, computed } from 'vue'
  import useVuelidate from '@vuelidate/core'
  import { required, email } from '@vuelidate/validators'
  import DOMPurify from 'dompurify'
  import axios from 'axios'
  
  export default {
    name: 'EmailSender',
    setup() {
      const form = reactive({
        to: '',
        subject: '',
        text: '',
        html: ''
      })
  
      const rules = {
        form: {
          to: { required, email },
          subject: { required },
          text: { required },
          html: { required }
        }
      }
  
      const v$ = useVuelidate(rules, { form })
  
      return { form, v$ }
    },
    data() {
      return {
        loading: false,
        showToast: false,
        toastMessage: '',
        toastClass: '',
        toastHeaderClass: '',
        sanitizedPreview: ''
      }
    },
    computed: {
      formIsValid() {
        return !this.v$.$invalid
      }
    },
    methods: {
      updatePreview() {
        this.sanitizedPreview = DOMPurify.sanitize(this.form.html)
      },
      async sendEmail() {
      console.log('Sending email...')
      try {
        const isFormCorrect = await this.v$.$validate()
        if (!isFormCorrect) {
          console.log('Form validation failed')
          this.showNotification('Please fill in all required fields correctly.', 'error')
          return
        }

        this.loading = true
        console.log('Form data:', this.form)
      
        try {
          const response = await axios.post('/api/email/send', this.form)
          console.log('API response:', response.data)
          
          if (response.data.success) {
            this.showNotification('Email sent successfully!', 'success')
            console.log('Email sent successfully')
            // Reset form
            Object.keys(this.form).forEach(key => this.form[key] = '')
            this.v$.$reset()
            this.sanitizedPreview = ''
          } else {
            throw new Error(response.data.message || 'Failed to send email')
          }
        } catch (axiosError) {
          console.error('Axios error:', axiosError)
          if (axiosError.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response data:', axiosError.response.data)
            console.error('Response status:', axiosError.response.status)
            console.error('Response headers:', axiosError.response.headers)
            this.showNotification(`Server error: ${axiosError.response.data.message || axiosError.response.statusText}`, 'error')
          } else if (axiosError.request) {
            // The request was made but no response was received
            console.error('No response received:', axiosError.request)
            this.showNotification('No response from server. Please check your network connection.', 'error')
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up request:', axiosError.message)
            this.showNotification('Error setting up request. Please try again.', 'error')
          }
          throw axiosError
        }
      } catch (error) {
        console.error('Error in sendEmail method:', error)
        this.showNotification(error.message || 'An error occurred while sending the email', 'error')
      } finally {
        this.loading = false
      }
    },
      showNotification(message, type = 'success') {
        this.toastMessage = message
        this.toastClass = type === 'success' ? 'text-success' : 'text-danger'
        this.toastHeaderClass = type === 'success' ? 'bg-success' : 'bg-danger'
        this.showToast = true
        
        setTimeout(() => {
          this.showToast = false
        }, 5000)
      }
    }
  }
  </script>
  
  <style scoped>
  .email-form {
    max-width: 600px;
    width: 100%;
  }
  
  .preview-panel {
    background-color: #f8f9fa;
  }
  
  .toast {
    transition: opacity 0.3s ease-in-out;
    opacity: 0;
  }
  
  .toast.show {
    opacity: 1;
  }
  
  .btn-primary {
    background-color: #007bff;
    border-color: #007bff;
  }
  
  .btn-primary:hover {
    background-color: #0056b3;
    border-color: #0056b3;
  }
  
  .form-control:focus {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  </style>