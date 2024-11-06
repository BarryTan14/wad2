import './assets/main.css'

import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import {createPinia} from 'pinia'
import {useAuthStore} from './stores/auth.js'
import {useToastStore} from "./stores/toast.js";


const app = createApp(App)
const pinia = createPinia()

app.config.globalProperties.$socket = io();

// use global authstore and toaststore instead;

app.use(pinia)
app.config.globalProperties.$authStore = useAuthStore();
app.config.globalProperties.$toastStore = useToastStore();
app.use(router)

// Add navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    //const authStore = this.$authStore;
    const toastStore = useToastStore();
    const hasAuthMeta = to.matched.some(record => 'requiresAuth' in record.meta)
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    if (hasAuthMeta)
        // Check if we've already initialized auth
        if (!authStore.isAuthenticated && !authStore.loading) {
            // Verify auth status
            const isAuthenticated = await authStore.checkAuth()
            if (!isAuthenticated && requiresAuth) {
                toastStore.error("You need authentication to access this resource");
                next('/login')
                return
            }
            if (isAuthenticated && !requiresAuth) {
                toastStore.warning("You have been redirected");
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
                toastStore.error("You need authentication to access this resource");
                next('/login')
                return
            }

            if (authStore.isAuthenticated && !requiresAuth) {
                toastStore.warning("You have been redirected");
                next('/')
                return
            }
        }
    next()
})

// Initialize auth before mounting
const authStore = useAuthStore()
authStore.initializeAuth().then(()=>{
    const vm = app.mount('#app')
})

