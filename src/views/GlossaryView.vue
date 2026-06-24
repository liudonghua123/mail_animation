<script setup lang="ts">
import { ref } from 'vue'
import { glossary } from '../data/glossary'
import Glossary from '../components/Glossary.vue'

const selectedNodeId = ref<string | null>(null)
</script>

<template>
  <div class="max-w-[900px] mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold text-slate-900 mb-1">名词解释</h1>
    <p class="text-sm text-slate-500 mb-5">邮件系统中各角色与协议术语的说明</p>
    <Glossary :items="glossary" :selected-node-id="selectedNodeId" />
  </div>
</template>
