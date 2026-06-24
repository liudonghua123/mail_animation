<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNav from './components/AppNav.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNav />
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <footer class="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
      SMTP 邮件传递动画 · 仅供教学演示
    </footer>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
