<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%--
  ARCHIVO: Interfaz/chatbot-modal.jsp
  USO: Incluir en tu layout principal antes de </body>:
       <%@ include file="chatbot-modal.jsp" %>
--%>

<!-- BOTÓN FLOTANTE -->
<button class="chatbot-fab" id="chatbotFab" onclick="chatbotOpen()" aria-label="Abrir asistente virtual">
  <i class="ti ti-message-circle"></i>
</button>

<!-- MODAL -->
<div class="chatbot-overlay" id="chatbotOverlay">
  <div class="chatbot-modal">
    <div class="chatbot-header">
      <div class="chatbot-header-info">
        <div class="chatbot-avatar"><i class="ti ti-robot"></i></div>
        <div>
          <p class="chatbot-title">Asistente Virtual</p>
          <p class="chatbot-status"><span class="chatbot-dot"></span> En línea</p>
        </div>
      </div>
      <button class="chatbot-btn-close" onclick="chatbotClose()"><i class="ti ti-x"></i></button>
    </div>
    <div class="chatbot-messages" id="chatbotMessages">
      <div class="chatbot-msg bot">
        <div class="chatbot-bubble">¡Hola! 👋 ¿En qué puedo ayudarte?</div>
        <span class="chatbot-time" id="chatbotInitTime"></span>
      </div>
    </div>
    <div class="chatbot-input-area">
      <textarea class="chatbot-input" id="chatbotInput"
        placeholder="Escribe un mensaje..." rows="1"
        onkeydown="chatbotHandleKey(event)"></textarea>
      <button class="chatbot-btn-send" onclick="chatbotSend()">
        <i class="ti ti-send"></i>
      </button>
    </div>
    <div class="chatbot-footer">Potenciado por Claude · IA</div>
  </div>
</div>

<style>
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');
.chatbot-fab {
  position: fixed; bottom: 28px; right: 28px;
  width: 54px; height: 54px; border-radius: 50%;
  background: #c0392b; color: #fff; border: none;
  cursor: pointer; font-size: 22px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(192,57,43,0.35);
  z-index: 9998; transition: background 0.2s, transform 0.15s;
}
.chatbot-fab:hover { background: #a93226; transform: scale(1.07); }
.chatbot-fab.hidden { display: none; }
.chatbot-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: none; align-items: flex-end; justify-content: flex-end;
  padding: 0 28px 28px 0; z-index: 9999;
}
.chatbot-overlay.active { display: flex; }
.chatbot-modal {
  background: #fff; border-radius: 16px;
  width: 370px; max-width: calc(100vw - 32px);
  display: flex; flex-direction: column;
  overflow: hidden; border: 1px solid rgba(0,0,0,0.1);
  animation: chatbotSlideUp 0.22s ease;
}
@keyframes chatbotSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.chatbot-header {
  background: #1a1a2e; padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between;
}
.chatbot-header-info { display: flex; align-items: center; gap: 10px; }
.chatbot-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: #c0392b; display: flex; align-items: center;
  justify-content: center; font-size: 18px; color: #fff;
}
.chatbot-title  { font-size: 14px; font-weight: 600; color: #fff; margin: 0; }
.chatbot-status { font-size: 11px; color: #9fe1cb; display: flex; align-items: center; gap: 4px; margin: 2px 0 0; }
.chatbot-dot    { width: 6px; height: 6px; border-radius: 50%; background: #1d9e75; }
.chatbot-btn-close {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.65); font-size: 20px; line-height: 1; padding: 2px;
}
.chatbot-btn-close:hover { color: #fff; }
.chatbot-messages {
  padding: 14px; display: flex; flex-direction: column;
  gap: 10px; height: 300px; overflow-y: auto;
  background: #f5f5f7; scroll-behavior: smooth;
}
.chatbot-msg { display: flex; flex-direction: column; max-width: 85%; }
.chatbot-msg.bot  { align-self: flex-start; }
.chatbot-msg.user { align-self: flex-end; }
.chatbot-bubble {
  padding: 9px 13px; border-radius: 14px;
  font-size: 13px; line-height: 1.55; word-break: break-word;
}
.chatbot-msg.bot .chatbot-bubble {
  background: #fff; border: 1px solid rgba(0,0,0,0.08);
  color: #1a1a1a; border-bottom-left-radius: 4px;
}
.chatbot-msg.user .chatbot-bubble {
  background: #c0392b; color: #fff; border-bottom-right-radius: 4px;
}
.chatbot-time { font-size: 10px; color: #888; margin-top: 3px; padding: 0 4px; }
.chatbot-msg.user .chatbot-time { align-self: flex-end; }
.chatbot-typing {
  display: flex; gap: 4px; align-items: center;
  background: #fff; border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px; border-bottom-left-radius: 4px;
  padding: 10px 14px; width: fit-content;
}
.chatbot-typing span {
  width: 6px; height: 6px; border-radius: 50%; background: #aaa;
  animation: chatbotBounce 1.1s infinite;
}
.chatbot-typing span:nth-child(2) { animation-delay: 0.18s; }
.chatbot-typing span:nth-child(3) { animation-delay: 0.36s; }
@keyframes chatbotBounce {
  0%,60%,100% { transform: translateY(0); }
  30%          { transform: translateY(-5px); }
}
.chatbot-input-area {
  padding: 10px 12px; border-top: 1px solid rgba(0,0,0,0.07);
  display: flex; gap: 8px; align-items: flex-end; background: #fff;
}
.chatbot-input {
  flex: 1; border: 1px solid rgba(0,0,0,0.15); border-radius: 20px;
  padding: 8px 14px; font-size: 13px; resize: none; outline: none;
  background: #f5f5f7; color: #1a1a1a; font-family: inherit;
  height: 36px; overflow: hidden; transition: border-color 0.15s;
}
.chatbot-input:focus { border-color: #c0392b; background: #fff; }
.chatbot-btn-send {
  width: 36px; height: 36px; border-radius: 50%;
  border: none; background: #c0392b; color: #fff;
  cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.15s, transform 0.1s;
}
.chatbot-btn-send:hover  { background: #a93226; }
.chatbot-btn-send:active { transform: scale(0.93); }
.chatbot-btn-send:disabled { background: #e0b0ad; cursor: not-allowed; }
.chatbot-footer { padding: 5px 14px 10px; text-align: center; font-size: 10px; color: #aaa; background: #fff; }
.chatbot-bubble.error { background: #fcebeb; color: #a32d2d; }
</style>

<script>
(function () {
  const MAX_HISTORY = 20;
  let chatHistory = [];
  let isSending = false;

  function nowTime() {
    return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }
  function scrollBottom() {
    const box = document.getElementById('chatbotMessages');
    box.scrollTop = box.scrollHeight;
  }
  function addMessage(text, role, isError) {
    const box  = document.getElementById('chatbotMessages');
    const wrap = document.createElement('div');
    wrap.className = 'chatbot-msg ' + (role === 'user' ? 'user' : 'bot');
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble' + (isError ? ' error' : '');
    bubble.textContent = text;
    const time = document.createElement('span');
    time.className = 'chatbot-time';
    time.textContent = nowTime();
    wrap.appendChild(bubble);
    wrap.appendChild(time);
    box.appendChild(wrap);
    scrollBottom();
  }
  function showTyping() {
    const box  = document.getElementById('chatbotMessages');
    const wrap = document.createElement('div');
    wrap.className = 'chatbot-msg bot';
    wrap.id = 'chatbotTyping';
    wrap.innerHTML = '<div class="chatbot-typing"><span></span><span></span><span></span></div>';
    box.appendChild(wrap);
    scrollBottom();
  }
  function removeTyping() {
    const el = document.getElementById('chatbotTyping');
    if (el) el.remove();
  }
  function setDisabled(v) {
    document.getElementById('chatbotInput').disabled = v;
    document.querySelector('.chatbot-btn-send').disabled = v;
    isSending = v;
  }

  async function callBackend(userText) {
    chatHistory.push({ role: 'user', content: userText });
    if (chatHistory.length > MAX_HISTORY) chatHistory = chatHistory.slice(-MAX_HISTORY);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error ' + res.status);
    }
    const data  = await res.json();
    const reply = data.reply || '(sin respuesta)';
    chatHistory.push({ role: 'assistant', content: reply });
    return reply;
  }

  window.chatbotSend = async function () {
    if (isSending) return;
    const input = document.getElementById('chatbotInput');
    const text  = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');
    setDisabled(true);
    showTyping();
    try {
      const reply = await callBackend(text);
      removeTyping();
      addMessage(reply, 'assistant');
    } catch (e) {
      removeTyping();
      addMessage('⚠ ' + (e.message || 'Error al conectar.'), 'bot', true);
    } finally {
      setDisabled(false);
      document.getElementById('chatbotInput').focus();
    }
  };

  window.chatbotHandleKey = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatbotSend(); }
  };
  window.chatbotOpen = function () {
    document.getElementById('chatbotOverlay').classList.add('active');
    document.getElementById('chatbotFab').classList.add('hidden');
    document.getElementById('chatbotInput').focus();
  };
  window.chatbotClose = function () {
    document.getElementById('chatbotOverlay').classList.remove('active');
    document.getElementById('chatbotFab').classList.remove('hidden');
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') chatbotClose(); });
  document.getElementById('chatbotInitTime').textContent = nowTime();
})();
</script>
