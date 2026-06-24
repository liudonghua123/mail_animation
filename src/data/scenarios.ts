import type { Scenario } from '../types'

const localDelivery: Scenario = {
  id: 'local',
  name: '本地投递',
  description: '同一服务器内：MUA → MSA → MTA → MDA → 邮箱',
  nodes: [
    { id: 'mua-sender', role: 'MUA', label: '发件人 MUA', x: 80, y: 130 },
    { id: 'msa', role: 'MSA', label: 'MSA', x: 280, y: 130 },
    { id: 'mta-sender', role: 'MTA', label: 'MTA', x: 480, y: 130 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 680, y: 130 },
    { id: 'mailbox', role: 'MUA', label: '收件人邮箱', x: 880, y: 130 },
  ],
  steps: [
    { from: 'mua-sender', to: 'msa', command: 'EHLO client.local', response: '250-mail.local', direction: 'client->server', description: 'MUA 向 MSA 发起 SMTP 会话', duration: 1000, session: 'MUA↔MSA' },
    { from: 'msa', to: 'mua-sender', command: 'MAIL FROM:<alice@local>', response: '250 OK', direction: 'server->client', description: '声明发件人（响应）', duration: 700, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'RCPT TO:<bob@local>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'DATA', response: '354 End data with <CRLF>.<CRLF>', direction: 'client->server', description: '请求传输正文', duration: 800, session: 'MUA↔MSA', mailContent: 'Subject: Hello Bob\nFrom: alice@local\nTo: bob@local\n\nHi Bob, this is a test mail.' },
    { from: 'mua-sender', to: 'msa', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MUA↔MSA' },
    { from: 'msa', to: 'mta-sender', command: 'EHLO msa.local', response: '250-mail.local', direction: 'client->server', description: 'MSA 向 MTA 发起 SMTP 会话', duration: 1000, session: 'MSA↔MTA' },
    { from: 'msa', to: 'mta-sender', command: 'MAIL FROM:<alice@local>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MSA↔MTA' },
    { from: 'msa', to: 'mta-sender', command: 'RCPT TO:<bob@local>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MSA↔MTA' },
    { from: 'msa', to: 'mta-sender', command: 'DATA', response: '354 End data with <CRLF>.<CRLF>', direction: 'client->server', description: '请求传输正文', duration: 800, session: 'MSA↔MTA' },
    { from: 'msa', to: 'mta-sender', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MSA↔MTA' },
    { from: 'mta-sender', to: 'mda', command: '本地投递', direction: 'transfer', description: 'MTA 识别为本地用户，交给 MDA', duration: 1000 },
    { from: 'mda', to: 'mailbox', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入收件人邮箱存储', duration: 1000 },
  ],
}

const crossServer: Scenario = {
  id: 'cross',
  name: '跨服务器传递',
  description: 'MUA → MSA → MTA(a) → DNS MX → MTA(b) → MDA → 邮箱',
  nodes: [
    { id: 'mua-sender', role: 'MUA', label: '发件人 MUA', x: 60, y: 180 },
    { id: 'msa', role: 'MSA', label: 'MSA', x: 220, y: 180 },
    { id: 'mta-sender', role: 'MTA', label: '发件方 MTA', x: 400, y: 180 },
    { id: 'dns', role: 'DNS', label: 'DNS (MX)', x: 560, y: 60 },
    { id: 'mta-receiver', role: 'MTA', label: '收件方 MTA', x: 720, y: 180 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 880, y: 180 },
    { id: 'mailbox', role: 'MUA', label: '收件人邮箱', x: 1040, y: 180 },
  ],
  steps: [
    { from: 'mua-sender', to: 'msa', command: 'EHLO client.a.com', response: '250-msa.a.com', direction: 'client->server', description: 'MUA 提交邮件到 MSA', duration: 1000, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'RCPT TO:<bob@b.com>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MUA↔MSA', mailContent: 'Subject: Hello from a.com\nFrom: alice@a.com\nTo: bob@b.com\n\nCross-server delivery test.' },
    { from: 'mua-sender', to: 'msa', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MUA↔MSA' },
    { from: 'msa', to: 'mta-sender', command: 'EHLO msa.a.com', response: '250-mta.a.com', direction: 'client->server', description: 'MSA 向发件方 MTA 发起会话', duration: 1000, session: 'MSA↔MTA(a)' },
    { from: 'msa', to: 'mta-sender', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MSA↔MTA(a)' },
    { from: 'msa', to: 'mta-sender', command: 'RCPT TO:<bob@b.com>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MSA↔MTA(a)' },
    { from: 'msa', to: 'mta-sender', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MSA↔MTA(a)' },
    { from: 'msa', to: 'mta-sender', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MSA↔MTA(a)' },
    { from: 'mta-sender', to: 'dns', command: 'QUERY MX for b.com', response: 'ANSWER: mx.b.com', direction: 'client->server', description: '查询收件域名 MX 记录', duration: 1000, session: 'MTA(a)↔DNS' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'EHLO mta.a.com', response: '250-mta.b.com', direction: 'client->server', description: '发件方 MTA 连接收件方 MTA', duration: 1000, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: 'SMTP 信封发件人', duration: 700, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'RCPT TO:<bob@b.com>', response: '250 OK', direction: 'client->server', description: 'SMTP 信封收件人', duration: 700, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-receiver', to: 'mda', command: '本地投递', direction: 'transfer', description: '收件方 MTA 交给 MDA', duration: 1000 },
    { from: 'mda', to: 'mailbox', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入收件人邮箱', duration: 1000 },
  ],
}

const relay: Scenario = {
  id: 'relay',
  name: '中继转发',
  description: 'MTA(a) → 中继 MTA → MTA(b) → MDA → 邮箱',
  nodes: [
    { id: 'mta-sender', role: 'MTA', label: '发件方 MTA', x: 80, y: 160 },
    { id: 'mta-relay', role: 'MTA', label: '中继 MTA', x: 380, y: 160 },
    { id: 'mta-receiver', role: 'MTA', label: '收件方 MTA', x: 680, y: 160 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 880, y: 160 },
    { id: 'mailbox', role: 'MUA', label: '收件人邮箱', x: 1080, y: 160 },
  ],
  steps: [
    { from: 'mta-sender', to: 'mta-relay', command: 'EHLO mta.a.com', response: '250-relay.net', direction: 'client->server', description: '发件方 MTA 连接中继', duration: 1000, session: 'MTA(a)↔MTA(relay)' },
    { from: 'mta-sender', to: 'mta-relay', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MTA(a)↔MTA(relay)' },
    { from: 'mta-sender', to: 'mta-relay', command: 'RCPT TO:<bob@b.com>', response: '250 OK (relayed)', direction: 'client->server', description: '中继接受转发', duration: 700, session: 'MTA(a)↔MTA(relay)' },
    { from: 'mta-sender', to: 'mta-relay', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MTA(a)↔MTA(relay)', mailContent: 'Subject: Relayed mail\nFrom: alice@a.com\nTo: bob@b.com\n\nThis mail was relayed.' },
    { from: 'mta-sender', to: 'mta-relay', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MTA(a)↔MTA(relay)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'EHLO relay.net', response: '250-mta.b.com', direction: 'client->server', description: '中继连接收件方 MTA', duration: 1000, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'RCPT TO:<bob@b.com>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-receiver', to: 'mda', command: '本地投递', direction: 'transfer', description: '收件方 MTA 交给 MDA', duration: 1000 },
    { from: 'mda', to: 'mailbox', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入邮箱', duration: 1000 },
  ],
}

export const scenarios: Scenario[] = [localDelivery, crossServer, relay]
