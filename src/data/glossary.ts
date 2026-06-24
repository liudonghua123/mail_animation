import type { GlossaryItem } from '../types'

export const glossary: GlossaryItem[] = [
  {
    term: 'MUA',
    full: 'Mail User Agent',
    definition: '用户代理，即邮件客户端（如 Outlook、Thunderbird）。发送时通过 SMTP 提交邮件；接收时通过 POP3/IMAP 从邮箱拉取邮件。',
    roleInAnimation: '动画中作为发件人和收件人节点出现。',
    nodeId: 'mua-sender',
  },
  {
    term: 'MSA',
    full: 'Mail Submission Agent',
    definition: '提交代理，接收 MUA 提交的邮件，做初步校验后交给 MTA。',
    roleInAnimation: '动画中位于 MUA 与 MTA 之间，负责接受提交。',
    nodeId: 'msa',
  },
  {
    term: 'MTA',
    full: 'Mail Transfer Agent',
    definition: '传输代理，根据收件人域名查询 MX 记录并通过 SMTP 将邮件转发到下一跳 MTA。',
    roleInAnimation: '动画中作为服务器间传递的核心节点。',
    nodeId: 'mta-sender',
  },
  {
    term: 'MDA',
    full: 'Mail Delivery Agent',
    definition: '投递代理，将收到的邮件写入收件人邮箱存储。',
    roleInAnimation: '动画中位于接收侧，将邮件交给收件人 MUA。',
    nodeId: 'mda',
  },
  {
    term: 'POP3 / IMAP',
    full: 'Post Office Protocol v3 / Internet Message Access Protocol',
    definition: '邮件拉取协议，MUA 通过它们从 MDA/邮箱存储读取邮件（本动画不演示拉取过程，仅在关于页说明）。',
    roleInAnimation: '动画中作为收件侧的概念性说明。',
  },
  {
    term: 'SMTP',
    full: 'Simple Mail Transfer Protocol',
    definition: '简单邮件传输协议，定义 MUA/MSA/MTA 之间用命令（HELO/MAIL FROM/RCPT TO/DATA 等）交换邮件。',
    roleInAnimation: '动画中命令气泡展示的对话内容。',
  },
  {
    term: 'MX 记录',
    full: 'Mail Exchange Record',
    definition: 'DNS 中指定某域名接收邮件的 MTA 主机记录。',
    roleInAnimation: '动画中跨服务器场景下，发件方 MTA 先查询 MX 记录。',
    nodeId: 'dns',
  },
  {
    term: 'Envelope',
    full: 'Envelope',
    definition: '信封，即 SMTP 会话中 MAIL FROM / RCPT TO 携带的路由信息，与邮件正文头部分离。',
    roleInAnimation: '动画中信封图标在节点间移动。',
  },
  {
    term: 'Header / Body',
    full: 'Header / Body',
    definition: '邮件头（From/To/Subject 等）与正文，DATA 命令后传输。',
    roleInAnimation: '动画中 DATA 步骤时体现。',
  },
  {
    term: 'Relay',
    full: 'Relay',
    definition: '中继转发，MTA 将邮件转发给下一跳 MTA 的过程，可能多跳。',
    roleInAnimation: '动画中中继转发场景展示多跳 MTA。',
  },
  {
    term: 'Queue',
    full: 'Queue',
    definition: '邮件队列，MTA 暂存待发邮件，失败时重试。',
    roleInAnimation: '动画中作为说明性概念提及。',
  },
]
