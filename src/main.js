import { createApp } from 'vue'
import App from './App.vue'
import Desktop from './Desktop.vue'
import './style.css'

const isDesktop = window.location.pathname.startsWith('/desktop')
createApp(isDesktop ? Desktop : App).mount('#app')
