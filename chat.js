(() => {
  const $ = id => document.getElementById(id);
  const LOCAL_KEY = 'study-nook-chat-preview-v1';
  const config = window.STUDYROOM_SUPABASE_CONFIG || {};
  const hasConfig = Boolean(config.url && config.publishableKey);
  const messagesNode = $('chatMessages');
  const panel = $('chatPanel');
  const toggle = $('chatToggle');
  const form = $('chatForm');
  const input = $('chatInput');
  const sendButton = $('chatSend');
  let client = window.studySupabaseClient || null;
  let channel = null;
  let roomId = config.roomId || null;
  let userId = null;
  let senderName = '';
  let roomNames = new Map();
  let seen = new Set();
  let unread = 0;
  let authListener = null;

  function setStatus(text, connected = false) {
    $('chatStatus').textContent = text;
    $('chatStatus').classList.toggle('is-connected', connected);
  }
  function stamp(iso) {
    const d = new Date(iso);
    const uk = new Intl.DateTimeFormat('en-GB', {hour:'2-digit', minute:'2-digit', timeZone:'Europe/London'}).format(d);
    const cn = new Intl.DateTimeFormat('zh-CN', {hour:'2-digit', minute:'2-digit', timeZone:'Asia/Shanghai'}).format(d);
    return `英国 ${uk} · 北京 ${cn}`;
  }
  function addMessage(message, local = false) {
    if (!message || seen.has(message.id)) return;
    seen.add(message.id);
    $('chatEmpty')?.remove();
    const author = message.sender || roomNames.get(message.user_id) || (local ? $('currentName').textContent : '房间成员');
    const row = document.createElement('article');
    row.className = `chat-message${message.user_id === userId && !local ? ' mine' : ''}`;
    const avatar = document.createElement('span');
    avatar.className = 'chat-avatar';
    avatar.textContent = author.slice(0, 1);
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    const meta = document.createElement('div');
    meta.className = 'chat-meta';
    const name = document.createElement('b');
    name.textContent = author;
    const time = document.createElement('time');
    time.dateTime = message.created_at;
    time.textContent = stamp(message.created_at);
    const body = document.createElement('p');
    body.textContent = message.body;
    meta.append(name, time);
    bubble.append(meta, body);
    row.append(avatar, bubble);
    messagesNode.append(row);
    messagesNode.scrollTop = messagesNode.scrollHeight;
    if (panel.classList.contains('hidden') && message.user_id !== userId) {
      unread += 1;
      $('chatUnread').textContent = unread > 9 ? '9+' : String(unread);
      $('chatUnread').classList.remove('hidden');
    }
  }
  function localMessages() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
    catch { return []; }
  }
  function renderLocalHistory() {
    localMessages().forEach(message => addMessage(message, true));
    setStatus('本地预览');
    $('chatHint').textContent = '本机预览消息';
  }
  function renderOpenState(open) {
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      unread = 0;
      $('chatUnread').classList.add('hidden');
      messagesNode.scrollTop = messagesNode.scrollHeight;
      input.focus();
    }
  }
  toggle.addEventListener('click', () => renderOpenState(panel.classList.contains('hidden')));
  $('chatClose').addEventListener('click', () => renderOpenState(false));
  window.addEventListener('storage', e => {
    if (e.key === LOCAL_KEY && !hasConfig) {
      messagesNode.querySelectorAll('.chat-message').forEach(node => node.remove());
      seen.clear();
      renderLocalHistory();
    }
  });

  async function getClient() {
    if (client) return client;
    if (!hasConfig) return null;
    client = await window.getStudyRoomClient();
    return client;
  }
  async function lookupMembership(uid) {
    if (roomId) {
      const {data, error} = await client.from('room_members').select('display_name').eq('room_id', roomId).eq('user_id', uid).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('当前账号不是这个房间的成员');
      senderName = data.display_name;
    } else {
      const {data, error} = await client.from('room_members').select('room_id,display_name').eq('user_id', uid).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('当前账号还没有加入自习室');
      roomId = data.room_id;
      senderName = data.display_name;
    }
    const {data:names, error:namesError} = await client.from('room_members').select('user_id,display_name').eq('room_id', roomId);
    if (namesError) throw namesError;
    roomNames = new Map((names || []).map(member => [member.user_id, member.display_name]));
  }
  async function loadHistory() {
    const {data, error} = await client.from('chat_messages')
      .select('id,room_id,user_id,body,created_at')
      .eq('room_id', roomId).order('created_at', {ascending:true});
    if (error) throw error;
    (data || []).forEach(message => addMessage({...message, sender:roomNames.get(message.user_id)}));
    messagesNode.scrollTop = messagesNode.scrollHeight;
  }
  async function fetchRealtimeMessage(id) {
    const {data, error} = await client.from('chat_messages')
      .select('id,room_id,user_id,body,created_at').eq('id', id).maybeSingle();
    if (!error && data) addMessage({...data, sender:roomNames.get(data.user_id)});
  }
  async function enterRoom(session) {
    if (!session?.user) return showLoginState();
    userId = session.user.id;
    roomId = config.roomId || null;
    setStatus('连接中…');
    await lookupMembership(userId);
    if (channel) await client.removeChannel(channel);
    channel = client.channel(`study-chat-${roomId}`)
      .on('postgres_changes', {event:'INSERT', schema:'public', table:'chat_messages', filter:`room_id=eq.${roomId}`}, payload => {
        if (payload.new?.id) fetchRealtimeMessage(payload.new.id);
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          setStatus('已连接', true);
          $('chatHint').textContent = `以${senderName}的身份发送`;
          try { await loadHistory(); }
          catch (error) { setStatus('读取消息失败'); console.error(error); }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setStatus('连接中断');
        }
      });
  }
  function showLoginState() {
    messagesNode.querySelectorAll('.chat-message').forEach(node => node.remove());
    seen.clear();
    if (!messagesNode.querySelector('.chat-empty')) {
      const empty = document.createElement('div'); empty.className = 'chat-empty'; empty.id = 'chatEmpty'; empty.textContent = '登录后查看房间消息。'; messagesNode.append(empty);
    }
    setStatus('请先登录');
    $('chatHint').textContent = '登录后可使用云端聊天';
    input.disabled = true;
    sendButton.disabled = true;
  }
  async function connect() {
    try {
      const supabaseClient = await getClient();
      if (!supabaseClient) { renderLocalHistory(); return; }
      client = supabaseClient;
      const {data, error} = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) showLoginState();
      else await enterRoom(data.session);
      if (!authListener) {
        const {data:listener} = client.auth.onAuthStateChange((_event, session) => {
          input.disabled = !session;
          sendButton.disabled = !session;
          if (session) enterRoom(session).catch(showError);
          else { if (channel) client.removeChannel(channel); channel = null; showLoginState(); }
        });
        authListener = listener.subscription;
      }
    } catch (error) {
      showError(error);
    }
  }
  function showError(error) {
    console.error('Study room chat:', error);
    setStatus(error?.message || '聊天暂不可用');
    $('chatHint').textContent = '检查 Supabase 登录、配置和 chat.sql';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body || body.length > 1000) return;
    sendButton.disabled = true;
    try {
      if (!client) {
        const message = {id:crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, user_id:'local-self', sender:$('currentName').textContent, body, created_at:new Date().toISOString()};
        const history = localMessages();
        history.push(message);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(history.slice(-100)));
        addMessage(message, true);
        window.dispatchEvent(new StorageEvent('storage', {key:LOCAL_KEY}));
      } else {
        if (!userId || !roomId) throw new Error('请先登录并加入房间');
        const {data, error} = await client.from('chat_messages').insert({room_id:roomId, user_id:userId, body}).select('id,room_id,user_id,body,created_at').single();
        if (error) throw error;
        addMessage({...data, sender:senderName});
      }
      input.value = '';
    } catch (error) { showError(error); }
    finally { sendButton.disabled = Boolean(client && !userId); input.focus(); }
  });

  if (hasConfig || client) {
    input.disabled = false;
    sendButton.disabled = false;
    connect();
  } else renderLocalHistory();
})();
