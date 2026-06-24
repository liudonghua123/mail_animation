<script setup lang="ts">
import { scenarios } from '../data/scenarios'
import ScenarioCard from '../components/ScenarioCard.vue'

const flow = [
  { role: 'MUA', desc: '用户撰写并发送邮件' },
  { role: 'MSA', desc: '接受提交，初步校验' },
  { role: 'MTA', desc: '查询 MX，SMTP 转发' },
  { role: 'MDA', desc: '写入收件人邮箱' },
]
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 py-8">
    <section class="text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-900 mb-3">
        SMTP 邮件传递动画
      </h1>
      <p class="text-slate-600 max-w-2xl mx-auto">
        可视化邮件在 MUA、MSA、MTA、MDA 之间通过 SMTP 协议传递的完整过程。
        支持本地投递、跨服务器传递、中继转发三种场景。
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">邮件流转总览</h2>
      <div class="card p-5">
        <div class="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-1">
          <div
            v-for="(n, i) in flow"
            :key="n.role"
            class="flex items-center gap-2 md:gap-1"
          >
            <div class="flex-1 md:flex-none md:w-32 text-center px-3 py-3 rounded-lg border border-slate-200 bg-slate-50">
              <div class="font-semibold text-indigo-600">{{ n.role }}</div>
              <div class="text-[11px] text-slate-500 mt-0.5">{{ n.desc }}</div>
            </div>
            <span v-if="i < flow.length - 1" class="text-slate-300 text-lg md:px-1">→</span>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-lg font-semibold text-slate-800 mb-4">选择场景开始</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <ScenarioCard
          v-for="s in scenarios"
          :key="s.id"
          :scenario="s"
        />
      </div>
    </section>
  </div>
</template>
