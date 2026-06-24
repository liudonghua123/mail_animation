import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AnimateView from '../views/AnimateView.vue'
import GlossaryView from '../views/GlossaryView.vue'
import AboutView from '../views/AboutView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/animate/:scenarioId', name: 'animate', component: AnimateView, props: true },
    { path: '/glossary', name: 'glossary', component: GlossaryView },
    { path: '/about', name: 'about', component: AboutView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
