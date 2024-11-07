// stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
    }),

    getters: {
        currentUser: (state) => state.user,
        isLoggedIn: (state) => state.isAuthenticated,
    },

    actions: {
        async updateProfileState() {
            this.loading = true
            try {
                await this.checkAuth()
            } catch (error) {
                console.error('Failed to initialize auth:', error)
            } finally {
                this.loading = false
            }
        },
        // Improved checkAuth that properly validates the token
        async checkAuth() {
            try {
                const response = await fetch('/user/api/auth/check', {
                    credentials: 'include', // Ensures cookies are sent
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error('Auth check failed')
                }

                const data = await response.json()

                // Update store state with user data
                this.user = data.user
                this.isAuthenticated = true
                return true
            } catch (error) {
                this.user = null
                this.isAuthenticated = false
                return false
            }
        },

        // Initialize auth state - call this when app starts
        async initializeAuth() {
            this.loading = true
            try {
                await this.checkAuth()
            } catch (error) {
                console.error('Failed to initialize auth:', error)
            } finally {
                this.loading = false
            }
        },

        // Rest of your store actions (login, logout, etc.)
        async login(username, password) {
            this.loading = true
            this.error = null

            try {
                const response = await fetch('/user/api/auth/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                })

                const data = await response.json()

                if (!response.ok) {
                    throw data || 'Login failed'
                }

                // Update store state
                this.user = data.user
                this.isAuthenticated = true

                return data
            } catch (error) {
                //this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        async register(email, username, password) {
            this.loading = true
            this.error = null

            try {
                const response = await fetch('/user/api/auth/register', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, username, password })
                })

                const data = await response.json()

                if (!response.ok) {
                    throw data || 'Register failed'
                }

                // Update store state
                this.user = data.user
                this.isAuthenticated = true

                return data
            } catch (error) {
                //this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        async logout() {
            this.loading = true
            this.error = null

            try {
                const response = await fetch('/user/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                const data = await response.json()

                if (!response.ok) {
                    throw data || 'Logout failed'
                }

                // Clear store state
                this.user = null
                this.isAuthenticated = false

                return data
            } catch (error) {
                //this.error.errors = error
                throw error
            } finally {
                this.loading = false
            }
        }
    }
})