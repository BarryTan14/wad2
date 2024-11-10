// import './assets/main.css'

import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import {createPinia} from 'pinia'
import {useAuthStore} from './stores/auth.js'
/*import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';*/

//import {useToastStore} from "./stores/toast.js";

import VueSweetalert2 from 'sweetalert2';

const socket = io({
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
    // Add your socket URL if not connecting to same origin
    // url: 'http://your-server-url'
})

// import 'sweetalert2/dist/sweetalert2.min.css';

const options = {
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    reverseButtons: true
};


const app = createApp(App)
const pinia = createPinia()

app.config.globalProperties.$socket = socket;

app.config.globalProperties.$socketManager = {
    connect() {
        if (!socket.connected) {
            socket.connect()
        }
    },
    disconnect() {
        if (socket.connected) {
            socket.disconnect()
        }
    },
    reconnect() {
        if (socket.connected) {
            socket.disconnect()
        }
        // Give a small delay before reconnecting
        setTimeout(() => {
            socket.connect()
        }, 1000)
    }
}

// use global authstore and toaststore instead;

app.use(pinia)
app.config.globalProperties.$authStore = useAuthStore();
//app.config.globalProperties.$toastStore = useToastStore();
app.config.globalProperties.$swal = VueSweetalert2.mixin(options);
app.config.globalProperties.$toast = VueSweetalert2.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: true,
    timer: 3000,
    timerProgressBar: true
});

app.use(router)

// Add navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    //const authStore = this.$authStore;
    const hasAuthMeta = to.matched.some(record => 'requiresAuth' in record.meta)
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    if (hasAuthMeta)
        // Check if we've already initialized auth
        if (!authStore.isAuthenticated && !authStore.loading) {
            // Verify auth status
            const isAuthenticated = await authStore.checkAuth()
            if (!isAuthenticated && requiresAuth) {
                VueSweetalert2.mixin(options).fire({
                    icon: 'warning',
                    title: 'You need authentication to access this resource.'
                })
                next('/login')
                return
            }
            if (isAuthenticated && !requiresAuth) {
                /*VueSweetalert2.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: true,
                    timer: 3000,
                    timerProgressBar: true
                }).fire({
                    icon: 'info',
                    title: 'You have been redirected.'
                })*/
                next('/')
                return
            }
        } else if (authStore.loading) {
            // Wait for auth check to complete
            await new Promise(resolve => {
                const checkLoading = () => {
                    if (!authStore.loading) {
                        resolve()
                    } else {
                        setTimeout(checkLoading, 50)
                    }
                }
                checkLoading()
            })

            if (!authStore.isAuthenticated && requiresAuth) {
                VueSweetalert2.mixin(options).fire({
                    icon: 'warning',
                    title: 'You need authentication to access this resource.'
                })
                next('/login')
                return
            }

            if (authStore.isAuthenticated && !requiresAuth) {
                /*VueSweetalert2.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: true,
                    timer: 3000,
                    timerProgressBar: true
                }).fire({
                    icon: 'info',
                    title: 'You have been redirected.'
                })*/
                next('/')
                return
            }
        }
    next()
})

// Initialize auth before mounting
const authStore = useAuthStore()
authStore.initializeAuth().then(() => {
    const vm = app.mount('#app')
})

