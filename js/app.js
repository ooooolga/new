/**
 * 事事如嗦 — 嗦语 聊天前端
 * Coze API 由 server.js 代理，密钥在 .env 中配置
 */

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    '欢迎来到事事如嗦——我是嗦语，把那些堵在心里的‘硬面条’交给我，让我们像嗦面一样，把那些烦心事儿都嗦走啦！',
};

const MOCK_HISTORY = [];

const state = {
  sessions: [],
  activeId: null,
  conversationId: null,
  isSending: false,
  cozeConfigured: false,
  demoMode: true,
  offlineOnly: false,
};

const API = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.api : { health: '/api/health', chat: '/api/chat' };

function uid() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getActiveSession() {
  return state.sessions.find((s) => s.id === state.activeId);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessageHtml(text) {
  return escapeHtml(text).replace(/\n/g, '<br />');
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;

  list.innerHTML = state.sessions
    .map(
      (s) => `
    <button
      type="button"
      data-id="${s.id}"
      class="history-item w-full text-left px-3 py-3 rounded-2xl transition-colors ${
        s.id === state.activeId
          ? 'bg-white/90 shadow-card border border-oatDeep'
          : 'hover:bg-white/50 border border-transparent'
      }"
    >
      <div class="font-medium text-sm text-coffee truncate">${escapeHtml(s.title)}</div>
      <p class="text-xs text-mist mt-1 truncate">${escapeHtml(s.preview || '')}</p>
      <p class="text-[11px] text-mist/80 mt-1">${escapeHtml(s.time || '')}</p>
    </button>
  `,
    )
    .join('');

  list.querySelectorAll('.history-item').forEach((btn) => {
    btn.addEventListener('click', () => switchSession(btn.dataset.id));
  });
}

function renderMessages() {
  const container = document.getElementById('messages');
  const session = getActiveSession();
  const messages = session?.messages?.length ? session.messages : [WELCOME_MESSAGE];
  const agentLabel = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.agentName : '嗦语';

  container.innerHTML = messages
    .map((msg) => {
      const isUser = msg.role === 'user';
      return `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2">
        ${
          !isUser
            ? `<span class="hidden sm:inline text-[11px] text-mist shrink-0 mb-1">${agentLabel}</span>`
            : ''
        }
        <div
          class="max-w-[85%] md:max-w-[70%] px-4 py-3 text-[15px] leading-relaxed shadow-card ${
            isUser
              ? 'bubble-user text-white rounded-[1.25rem] rounded-br-md'
              : 'bg-white text-coffeeDark border border-oatDeep/50 rounded-[1.25rem] rounded-bl-md'
          }"
        >
          ${formatMessageHtml(msg.content)}
        </div>
      </div>
    `;
    })
    .join('');

  container.scrollTop = container.scrollHeight;
}

function updateHeader() {
  const session = getActiveSession();
  document.getElementById('chat-title').textContent = session?.title || '嗦语在等你';
  document.getElementById('chat-subtitle').textContent =
    session?.preview || '把那些堵在心里的硬面条，慢慢嗦出来';
}

function switchSession(id) {
  state.activeId = id;
  const session = getActiveSession();
  state.conversationId = session?.conversationId || null;
  renderHistory();
  renderMessages();
  updateHeader();
}

function createSession({ title = '新嗦一碗', preview = '', messages = [], conversationId = null } = {}) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const session = {
    id: uid(),
    title,
    preview,
    time: `今天 ${time}`,
    messages: messages.length ? [...messages] : [WELCOME_MESSAGE],
    conversationId,
  };
  state.sessions.unshift(session);
  state.activeId = session.id;
  state.conversationId = conversationId;
  return session;
}

function startNewChat() {
  createSession();
  renderHistory();
  renderMessages();
  updateHeader();
  document.getElementById('message-input').focus();
}

function appendMessage(role, content) {
  const session = getActiveSession();
  if (!session) return;
  session.messages.push({ role, content });
  if (role === 'user') {
    session.preview = content.slice(0, 30);
    if (session.title === '新嗦一碗') {
      session.title = content.slice(0, 12) + (content.length > 12 ? '…' : '');
    }
  }
  renderMessages();
  renderHistory();
  updateHeader();
}

const MIN_NOODLE_MS = 1200;
let noodleShownAt = 0;

/** AI 思考中循环动画 */
const NOODLE_THINKING_HTML = `
  <div class="noodle-thinking bg-white border border-oatDeep/50 rounded-[1.25rem] rounded-bl-md px-5 py-3 shadow-card">
    <div class="noodle-stage" role="status" aria-label="嗦语思考中">
      <svg viewBox="0 0 200 175" width="160" height="140" xmlns="http://www.w3.org/2000/svg" style="display: block; overflow: visible;">
        <g stroke="#C9B89A" stroke-width="1.3" stroke-linecap="round" fill="none" opacity="0.55">
          <path d="M 118 50 Q 114 42 118 34 Q 122 26 118 18">
            <animate attributeName="opacity" values="0;0.65;0" dur="2.6s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0,8; 0,-4" dur="2.6s" repeatCount="indefinite"/>
          </path>
          <path d="M 128 54 Q 124 46 128 38 Q 132 30 128 22">
            <animate attributeName="opacity" values="0;0.55;0" dur="2.6s" begin="0.6s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0,8; 0,-4" dur="2.6s" begin="0.6s" repeatCount="indefinite"/>
          </path>
          <path d="M 138 52 Q 134 44 138 36 Q 142 28 138 20">
            <animate attributeName="opacity" values="0;0.6;0" dur="2.6s" begin="1.2s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0,8; 0,-4" dur="2.6s" begin="1.2s" repeatCount="indefinite"/>
          </path>
        </g>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0; 0,-6; 0,0" dur="3.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"/>
          <g transform="translate(122, 112)">
            <g stroke="#E0B870" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.92">
              <path d="M -7 0 Q -9 14 -5 28 Q -3 42 -7 56"/>
              <path d="M -3 0 Q -5 14 -1 28 Q 1 44 -3 58"/>
              <path d="M 1 0 Q 3 14 -1 28 Q -3 44 1 58"/>
              <path d="M 5 0 Q 3 16 7 30 Q 9 44 5 58"/>
              <path d="M 9 0 Q 11 14 7 28 Q 5 42 9 56"/>
              <path d="M -5 0 Q -6 10 -3 18" opacity="0.7"/>
              <path d="M 7 0 Q 8 12 5 22" opacity="0.7"/>
            </g>
            <g stroke="#F5DAA0" stroke-width="0.8" stroke-linecap="round" fill="none" opacity="0.85">
              <path d="M -5 2 Q -7 16 -3 30"/>
              <path d="M 1 2 Q -1 16 3 30"/>
              <path d="M 6 2 Q 8 16 5 30"/>
            </g>
          </g>
          <g transform="rotate(30, 100, 95)">
            <g>
              <rect x="40" y="85" width="120" height="4" rx="1.5" fill="#A37846"/>
              <rect x="40" y="85" width="120" height="1.2" rx="0.5" fill="#C9925A" opacity="0.8"/>
            </g>
            <g>
              <rect x="42" y="93" width="120" height="4" rx="1.5" fill="#B88654"/>
              <rect x="42" y="93" width="120" height="1.2" rx="0.5" fill="#D9A370" opacity="0.8"/>
            </g>
          </g>
          <g transform="translate(130, 120)">
            <g stroke="#D9AB68" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.98">
              <path d="M -8 0 Q -10 12 -6 24 Q -4 36 -8 48"/>
              <path d="M -4 0 Q -6 12 -2 24 Q 0 38 -4 50"/>
              <path d="M 0 0 Q 2 12 -2 24 Q -4 38 0 50"/>
              <path d="M 4 0 Q 2 14 6 26 Q 8 38 4 50"/>
              <path d="M 8 0 Q 10 12 6 24 Q 4 36 8 48"/>
              <path d="M 12 0 Q 10 14 14 26 Q 16 36 12 46"/>
              <path d="M -6 0 Q -7 10 -4 16" opacity="0.7"/>
              <path d="M 10 0 Q 11 12 8 20" opacity="0.7"/>
              <path d="M 6 0 Q 8 10 5 18" opacity="0.6"/>
            </g>
            <g stroke="#F5DAA0" stroke-width="0.8" stroke-linecap="round" fill="none" opacity="0.85">
              <path d="M -6 2 Q -8 14 -4 26"/>
              <path d="M 0 2 Q -2 14 2 26"/>
              <path d="M 5 2 Q 7 14 4 26"/>
              <path d="M 10 2 Q 8 12 12 24"/>
            </g>
          </g>
        </g>
      </svg>
    </div>
    <p class="noodle-hint text-[11px] text-mist mt-2 text-center tracking-wide">嗦语正在嗦面…</p>
  </div>
`;

function setTyping(show) {
  const container = document.getElementById('messages');
  const existing = document.getElementById('typing-indicator');
  if (!show) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const el = document.createElement('div');
  el.id = 'typing-indicator';
  el.className = 'flex justify-start items-end gap-2';
  el.innerHTML = `
    <span class="hidden sm:inline text-[11px] text-mist mb-10 shrink-0">嗦语</span>
    ${NOODLE_THINKING_HTML}
  `;
  noodleShownAt = Date.now();
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function hideThinking() {
  const elapsed = Date.now() - noodleShownAt;
  if (noodleShownAt && elapsed < MIN_NOODLE_MS) {
    await new Promise((r) => setTimeout(r, MIN_NOODLE_MS - elapsed));
  }
  setTyping(false);
}

function updateStreamingBubbleSync(content) {
  const bubble = document.getElementById('streaming-reply');
  if (!bubble) return;
  bubble.querySelector('.stream-content').innerHTML = formatMessageHtml(content);
  const container = document.getElementById('messages');
  container.scrollTop = container.scrollHeight;
}

async function updateStreamingBubble(content) {
  await hideThinking();

  let bubble = document.getElementById('streaming-reply');
  const container = document.getElementById('messages');

  if (!bubble) {
    const wrap = document.createElement('div');
    wrap.id = 'streaming-reply';
    wrap.className = 'flex justify-start items-end gap-2';
    wrap.innerHTML = `
      <span class="hidden sm:inline text-[11px] text-mist mb-1">嗦语</span>
      <div class="stream-content max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-[1.25rem] rounded-bl-md text-[15px] leading-relaxed shadow-card bg-white text-coffeeDark border border-oatDeep/50"></div>
    `;
    container.appendChild(wrap);
    bubble = wrap;
  }

  bubble.querySelector('.stream-content').innerHTML = formatMessageHtml(content);
  container.scrollTop = container.scrollHeight;
}

function finalizeStreamingBubble(content) {
  document.getElementById('streaming-reply')?.remove();
  appendMessage('assistant', content);
}

function setSending(loading) {
  state.isSending = loading;
  document.getElementById('btn-send').disabled = loading;
  document.getElementById('message-input').disabled = loading;
}

function updateStatusBadge() {
  const badge = document.getElementById('status-badge');
  if (!badge) return;

  if (state.offlineOnly) {
    badge.innerHTML =
      '<span class="w-2 h-2 rounded-full bg-millet"></span><span>仅界面预览（请运行 启动.bat）</span>';
  } else if (state.cozeConfigured) {
    badge.innerHTML =
      '<span class="w-2 h-2 rounded-full bg-sage"></span><span>嗦语已连接</span>';
  } else if (state.demoMode) {
    badge.innerHTML =
      '<span class="w-2 h-2 rounded-full bg-millet"></span><span>演示模式（配置 .env 后启用嗦语）</span>';
  } else {
    badge.innerHTML =
      '<span class="w-2 h-2 rounded-full bg-red-400"></span><span>等待配置 Coze API</span>';
  }
}

function localDemoReply(message) {
  const snippets = [
    `谢谢你愿意说出来。关于「${message.slice(0, 20)}${message.length > 20 ? '…' : ''}」，我能感受到你在认真面对自己的感受。`,
    '我听到你了。愿意把委屈嗦出来，本身就是一种勇气。',
    '你的感受值得被重视。我们不必急着给出答案，先一起把情绪安放好。',
  ];
  return `${snippets[Math.floor(Math.random() * snippets.length)]}\n\n此刻，做三次缓慢的深呼吸，然后告诉我：如果给今天的情绪打一个 0–10 分，你会打几分？`;
}

async function streamLocalDemo(text) {
  await waitForPaint();
  let full = '';
  const chunks = text.match(/[\s\S]{1,6}/g) || [text];
  for (const chunk of chunks) {
    full += chunk;
    await updateStreamingBubble(full);
    await new Promise((r) => setTimeout(r, 35));
  }
  finalizeStreamingBubble(full);
}

async function checkHealth() {
  try {
    const res = await fetch(API.health);
    const data = await res.json();
    state.cozeConfigured = data.cozeConfigured;
    state.demoMode = data.demoMode;
    state.offlineOnly = false;
  } catch {
    state.cozeConfigured = false;
    state.demoMode = true;
    state.offlineOnly = true;
  }
  updateStatusBadge();
}

async function sendMessage(text) {
  setSending(true);
  setTyping(true);
  await waitForPaint();

  if (state.offlineOnly) {
    await streamLocalDemo(localDemoReply(text));
    setSending(false);
    return;
  }

  let fullReply = '';
  let streamStarted = false;

  try {
    const res = await fetch(API.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        conversationId: state.conversationId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `请求失败 (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        let event = 'message';
        let dataStr = '';
        for (const line of block.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:')) dataStr += line.slice(5).trim();
        }
        if (!dataStr) continue;

        let data;
        try {
          data = JSON.parse(dataStr);
        } catch {
          continue;
        }

        if (event === 'meta' && data.conversationId) {
          state.conversationId = data.conversationId;
          const session = getActiveSession();
          if (session) session.conversationId = data.conversationId;
        }

        if (event === 'delta' && data.content) {
          fullReply += data.content;
          if (!streamStarted) {
            streamStarted = true;
            await updateStreamingBubble(fullReply);
          } else {
            updateStreamingBubbleSync(fullReply);
          }
        }

        if (event === 'error') {
          throw new Error(data.message || '对话出错');
        }

        if (event === 'done') {
          if (data.content) fullReply = data.content;
        }
      }
    }

    const looksLikeApiError =
      /token|bot_id|does not exist|incorrect|error|错误/i.test(fullReply) &&
      fullReply.length < 280;

    if (looksLikeApiError) {
      throw new Error(
        fullReply.includes('bot_id') || fullReply.includes('does not exist')
          ? '智能体 Bot ID 不正确。请在 .env 中填写 Coze 智能体页面地址栏 bot/ 后的数字，并确认已发布为 API。'
          : fullReply.includes('token') || fullReply.includes('Token')
            ? 'API Token 无效。请在 Coze 后台重新生成令牌并更新 .env 中的 COZE_API_TOKEN。'
            : fullReply,
      );
    }

    if (!streamStarted) {
      await hideThinking();
    }
    finalizeStreamingBubble(fullReply || '嗦语暂时没接上，请稍后再试。');
  } catch (err) {
    await hideThinking();
    document.getElementById('streaming-reply')?.remove();
    appendMessage(
      'assistant',
      `⚠️ ${err.message}\n\n免费token用完了<(＿　＿)>。`,
    );
  } finally {
    setSending(false);
  }
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
}

function bindNewChatButtons() {
  ['btn-new-chat', 'btn-new-chat-top'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', startNewChat);
  });
}

function init() {
  MOCK_HISTORY.forEach((item) => {
    state.sessions.push({
      id: item.id,
      title: item.title,
      preview: item.preview,
      time: item.time,
      messages: [...item.messages],
      conversationId: null,
    });
  });

  state.activeId = state.sessions[0]?.id || null;
  if (!state.activeId) createSession();

  renderHistory();
  renderMessages();
  updateHeader();
  checkHealth();
  bindNewChatButtons();

  const input = document.getElementById('message-input');
  input.addEventListener('input', () => autoResizeTextarea(input));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('chat-form').requestSubmit();
    }
  });

  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.isSending) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    autoResizeTextarea(input);
    appendMessage('user', text);
    await sendMessage(text);
  });
}

document.addEventListener('DOMContentLoaded', init);
