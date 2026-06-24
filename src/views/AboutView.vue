<script setup lang="ts">
</script>

<template>
  <div class="max-w-[800px] mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold text-slate-900 mb-4">关于</h1>

    <section class="card p-5 mb-4">
      <h2 class="font-semibold text-slate-800 mb-2">SMTP 协议背景</h2>
      <p class="text-sm text-slate-600 leading-relaxed">
        SMTP（Simple Mail Transfer Protocol）是互联网邮件传输的核心协议，
        定义了 MUA、MSA、MTA 之间用 EHLO、MAIL FROM、RCPT TO、DATA、QUIT 等命令
        以及 250、354、221 等响应码交换邮件的会话流程。一次完整的 SMTP 会话
        包含握手、信封声明、正文传输、关闭四个阶段。
      </p>
    </section>

    <section class="card p-5 mb-4">
      <h2 class="font-semibold text-slate-800 mb-2">本动画的准确性说明</h2>
      <ul class="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
        <li>每个 SMTP 会话（MUA↔MSA、MSA↔MTA、MTA↔MTA）均完整展示 EHLO/MAIL FROM/RCPT TO/DATA/QUIT 及对应响应。</li>
        <li>MSA 与 MTA 之间是独立的 SMTP 会话，而非内部"转交"。</li>
        <li>所有响应（250 OK、354、221 等）方向均为 server→client，from/to 与请求相反。</li>
        <li>跨服务器场景中，MTA 先通过 DNS 查询收件域名的 MX 记录，再连接目标 MTA。</li>
      </ul>
    </section>

    <section class="card p-5">
      <h2 class="font-semibold text-slate-800 mb-2">未演示的部分</h2>
      <ul class="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
        <li>收件人 MUA 通过 POP3 / IMAP 从邮箱拉取邮件的过程不在 SMTP 范畴，本动画不演示。</li>
        <li>TLS/SSL 加密（STARTTLS）的握手过程未展示。</li>
        <li>邮件队列（Queue）的重试机制作为概念提及，未动画化。</li>
      </ul>
    </section>
  </div>
</template>
