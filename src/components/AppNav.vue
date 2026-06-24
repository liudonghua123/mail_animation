<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileOpen = ref(false)

const links = [
  { to: '/', label: '首页' },
  { to: '/glossary', label: '名词解释' },
  { to: '/about', label: '关于' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
    <div class="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
      <router-link to="/" class="flex items-center gap-2 font-semibold text-indigo-600">
        <span class="text-lg">✉</span>
        <span>SMTP 动画</span>
      </router-link>

      <!-- desktop -->
      <div class="hidden md:flex items-center gap-1">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="px-3 py-1.5 rounded-md text-sm transition-colors"
          :class="isActive(l.to) ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-100'"
        >{{ l.label }}</router-link>
      </div>

      <!-- mobile toggle -->
      <button class="md:hidden p-2 text-slate-600" @click="mobileOpen = !mobileOpen">
        <span class="text-xl">{{ mobileOpen ? '✕' : '☰' }}</span>
      </button>
    </div>

    <!-- mobile menu -->
    <div v-if="mobileOpen" class="md:hidden border-t border-slate-200 bg-white">
      <router-link
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="block px-4 py-2.5 text-sm border-b border-slate-100"
        :class="isActive(l.to) ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-slate-600'"
        @click="mobileOpen = false"
      >{{ l.label }}</router-link>
    </div>
  </nav>
</template>
