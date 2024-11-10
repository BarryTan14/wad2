// src/client/plugins/axios.js
import axios from 'axios'

// Set base URL for development
axios.defaults.baseURL = import.meta.env.DEV ? 'http://localhost:3000' : ''

// Add request interceptor for debugging
axios.interceptors.request.use(config => {
  console.log('Making request to:', config.url)
  return config
})

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log('Received response:', response.status)
    return response
  },
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default axios