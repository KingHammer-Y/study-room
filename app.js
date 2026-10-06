let USERS = [];
const ANIMALS=[
 {value:'🐻',name:'小熊',type:'bear',coat:'#c99368',muzzle:'#ecd5b5',inner:'#e1b991',accent:'#9b684d'},
 {value:'🐱',name:'小猫',type:'cat',coat:'#c8b88f',muzzle:'#f1e5ca',inner:'#bd8f85',accent:'#977b61'},
 {value:'🐰',name:'小兔',type:'rabbit',coat:'#d7c2ac',muzzle:'#f3e8da',inner:'#c78f8e',accent:'#899a75'},
 {value:'🦊',name:'小狐狸',type:'fox',coat:'#cb8a60',muzzle:'#f1ddc0',inner:'#d8ad87',accent:'#a9664b'},
 {value:'🐼',name:'小熊猫',type:'panda',coat:'#e6dfce',muzzle:'#f5eee0',inner:'#77736a',accent:'#817d73'},
 {value:'🐸',name:'小青蛙',type:'frog',coat:'#aebc8d',muzzle:'#d9dfb5',inner:'#d0d9ad',accent:'#71835d'},
 {value:'🦦',name:'小水獭',type:'otter',coat:'#aa8061',muzzle:'#e7cfaa',inner:'#c49b76',accent:'#856246'},
 {value:'🦔',name:'小刺猬',type:'hedgehog',coat:'#c6a883',muzzle:'#ead6b5',inner:'#aa8a66',accent:'#88775d'}
];
function animalInfo(value){return ANIMALS.find(a=>a.value===value)||ANIMALS[0]}
function animalSprite(value,cls='animal-sprite'){
 const a=animalInfo(value),grid=Array.from({length:16},()=>Array(12).fill('.'));
 const put=(x,y,c)=>{if(grid[y]&&grid[y][x]!==undefined)grid[y][x]=c};
 const block=(x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,c)};
 const head={bear:[[3,8],[2,9],[1,10],[1,10],[1,10],[1,10],[2,9],[3,8]],cat:[[3,8],[2,9],[1,10],[1,10],[1,10],[1,10],[2,9],[3,8]],rabbit:[[3,8],[2,9],[1,10],[1,10],[1,10],[1,10]],fox:[[3,8],[2,9],[1,10],[1,10],[1,10],[2,9],[2,9],[3,8]],panda:[[3,8],[2,9],[1,10],[1,10],[1,10],[1,10],[2,9],[3,8]],frog:[[3,8],[2,9],[1,10],[1,10],[1,10],[1,10],[2,9],[3,8]],otter:[[3,8],[2,9],[1,10],[1,10],[1,10],[1,10],[2,9],[3,8]],hedgehog:[[3,8],[2,9],[1,10],[1,10],[1,10],[1,10],[2,9],[3,8]]}[a.type];
 head.forEach((r,i)=>block(r[0],i+3,r[1]-r[0]+1,1,'C'));
 if(a.type==='rabbit'){block(3,0,2,4,'C');block(7,0,2,4,'C');block(4,1,1,2,'I');block(7,1,1,2,'I')}
 else if(a.type==='cat'){block(2,1,2,3,'C');block(8,1,2,3,'C');block(3,2,1,1,'I');block(8,2,1,1,'I')}
 else if(a.type==='fox'){block(2,1,2,3,'C');block(8,1,2,3,'C');block(3,3,1,1,'M');block(8,3,1,1,'M')}
 else if(a.type==='frog'){block(2,1,2,3,'C');block(8,1,2,3,'C');put(3,2,'M');put(8,2,'M')}
 else {block(2,2,2,2,'C');block(8,2,2,2,'C');block(3,2,1,1,'I');block(8,2,1,1,'I')}
 // Pixel body, little arms, apron and tail.
 block(3,10,6,5,'O');block(2,11,2,3,'O');block(8,11,2,3,'O');block(4,12,4,3,'A');block(1,12,1,1,'A');
 // Face details are deliberately chunky and use the same pixel grid for every species.
 put(4,6,'D');put(7,6,'D');block(5,7,2,2,'M');put(5,8,'A');put(6,8,'A');
 if(a.type==='panda'){block(3,5,2,3,'D');block(7,5,2,3,'D');put(4,6,'M');put(7,6,'M')}
 if(a.type==='hedgehog'){put(4,3,'A');put(6,2,'A');put(8,3,'A');put(9,4,'A')}
 if(a.type==='cat'||a.type==='otter'){put(2,7,'I');put(3,8,'I');put(8,8,'I');put(9,7,'I')}
 // Build a one-pixel dark outline around the colored sprite silhouette.
 const outline=new Set();for(let y=0;y<16;y++)for(let x=0;x<12;x++)if(grid[y][x]!=='.')for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(grid[yy]?.[xx]==='.')outline.add(`${xx},${yy}`)}
 const colors={C:a.coat,O:a.coat,M:a.muzzle,I:a.inner,A:a.accent,D:'#493d35'};let cells='';
 for(const key of outline){const [x,y]=key.split(',').map(Number);cells+=`<rect x="${x*8}" y="${y*8}" width="8" height="8" fill="#725b49"/>`}
 for(let y=0;y<16;y++)for(let x=0;x<12;x++){const c=grid[y][x];if(c!=='.')cells+=`<rect x="${x*8}" y="${y*8}" width="8" height="8" fill="${colors[c]}"/>`}
 return `<svg class="${cls}" viewBox="0 0 96 128" role="img" aria-label="${a.name}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${cells}</svg>`;
}
let client=null, roomId=null, presenceChannel=null, sessionsChannel=null;
let state={sessions:[],currentUser:null,roomName:'周末自习室'};
const byId=id=>USERS.find(u=>u.id===id);
const memberFor=id=>byId(id);
const activeFor=id=>state.sessions.find(s=>s.userId===id&&!s.endedAt);
const $=id=>document.getElementById(id);
const save=()=>render();
const fmtClock=(tz)=>new Intl.DateTimeFormat('zh-CN',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
function dateKey(date,tz){return new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
function zonedMidnight(key,tz){const [y,m,d]=key.split('-').map(Number);const guess=Date.UTC(y,m-1,d);const parts=new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess+12*3600000));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));const localAsUtc=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);const offset=localAsUtc-(guess+12*3600000);return guess-offset}
function dayDuration(userId,tz){const key=dateKey(new Date(),tz),[y,m,d]=key.split('-').map(Number),next=new Date(Date.UTC(y,m-1,d+1)),nextKey=`${next.getUTCFullYear()}-${String(next.getUTCMonth()+1).padStart(2,'0')}-${String(next.getUTCDate()).padStart(2,'0')}`,from=zonedMidnight(key,tz),to=zonedMidnight(nextKey,tz);return state.sessions.filter(s=>s.userId===userId).reduce((n,s)=>n+Math.max(0,Math.min(s.endedAt?Date.parse(s.endedAt):Date.now(),to)-Math.max(Date.parse(s.startedAt),from)),0)}
function durationText(ms){let m=Math.floor(ms/60000),h=Math.floor(m/60);m%=60;return `${String(h).padStart(2,'0')}时 ${String(m).padStart(2,'0')}分`}
function elapsedText(ms){let sec=Math.floor(ms/1000);const h=String(Math.floor(sec/3600)).padStart(2,'0');sec%=3600;const m=String(Math.floor(sec/60)).padStart(2,'0');const s=String(sec%60).padStart(2,'0');return `${h}:${m}:${s}`}
function shortDuration(ms){const m=Math.floor(ms/60000);return m>=60?`${Math.floor(m/60)}小时 ${m%60}分`:`${m} 分钟`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){
 const current=memberFor(state.currentUser);if(!current)return;
 $('currentName').textContent=current.name;$('profileAnimal').innerHTML=animalSprite(current.animal,'mini-sprite');$('startAnimal').innerHTML=animalSprite(current.animal,'hero-sprite');$('roomNameText')&&($('roomNameText').textContent=state.roomName);document.querySelector('.breadcrumbs b').textContent=state.roomName;
 $('roomScene').setAttribute('aria-label',state.roomName);
 const working=!!activeFor(current.id);$('startButton').classList.toggle('hidden',working);$('stopButton').classList.toggle('hidden',!working);$('elapsed').classList.toggle('hidden',!working);
 $('startTitle').textContent=working?'你正在专注':'准备好开始了吗？';$('startSubtitle').textContent=working?'陪伴着朋友，按自己的节奏来。':'坐到书桌前，给自己一点专注时间。';
 $('onlineCount').textContent=USERS.filter(u=>u.online).length;$('memberCount').textContent=`${USERS.length} 位成员`;$('memberNavCount').textContent=USERS.length;
 const desks=USERS.map((base,i)=>{const u=memberFor(base.id),active=activeFor(u.id),working=Boolean(active&&u.online),mode=working?'is-working':u.online?'is-online':'is-offline';return `<div class="desk-station ${mode}"><div class="desk-scene"><span class="work-bubble">${working?'Working':u.online?'在房间里':'晚安，好梦'}</span><div class="pet-line ${working?'working':''}">${animalSprite(u.animal,'room-sprite')}${working?'<span class="desk-book"><i></i><b></b></span>':''}</div><div class="lamp"><i></i><b></b><em></em></div><div class="desk-laptop"><i></i><b></b></div><div class="desk-cup"><i></i></div><div class="desk-top"></div><div class="desk-leg left"></div><div class="desk-leg right"></div><div class="desk-front"></div></div><span class="nameplate">${esc(u.name)} <i>${working?'WORKING':u.online?'在房间':'OFFLINE'}</i></span></div>`}).join('');$('desks').innerHTML=desks;
 $('roomList').innerHTML=USERS.map(base=>{const u=memberFor(base.id),a=activeFor(u.id),ms=dayDuration(u.id,'Europe/London');return `<div class="member-row"><div class="member-avatar">${animalSprite(u.animal,'list-sprite')}</div><div class="member-info"><b>${esc(u.name)}</b><span>今天专注 ${shortDuration(ms)}</span></div><span class="status-label">${u.online?(a?'✦ Working':'● 在线'):'○ 离线'}</span></div>`}).join('');
 const mineUK=dayDuration(current.id,'Europe/London'),mineCN=dayDuration(current.id,'Asia/Shanghai');$('totalTime').innerHTML=durationText(Math.max(mineUK,mineCN)).replace('时','<span>时</span>').replace('分','<span>分</span>');$('ukTotal').textContent=shortDuration(mineUK);$('cnTotal').textContent=shortDuration(mineCN);
 const recent=state.sessions.filter(s=>s.userId===current.id).sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)).slice(0,1)[0];$('sessionSummary').textContent=recent?`${state.sessions.filter(s=>s.userId===current.id&&dateKey(new Date(s.startedAt),'Europe/London')===dateKey(new Date(),'Europe/London')).length} 段专注 · 最近 ${new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(new Date(recent.startedAt))} 开始`:'开始今天的第一段专注吧';
 const now=new Date();$('todayLabel').textContent=new Intl.DateTimeFormat('en-GB',{weekday:'long',month:'long',day:'numeric',timeZone:'Europe/London'}).format(now).toUpperCase();$('londonClock').textContent=fmtClock('Europe/London');$('beijingClock').textContent=fmtClock('Asia/Shanghai');$('roomHeadingName').textContent=state.roomName;
 const active=activeFor(current.id);$('elapsed').textContent=active?elapsedText(Date.now()-Date.parse(active.startedAt)):'';
}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}
function modal(html){$('modalContent').innerHTML=html;$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
let editingProfile=null;
function showProfileEditor(id){const u=memberFor(id);editingProfile={id,animal:u.animal};modal(`<h3>编辑我的资料</h3><p>这是房间里显示的昵称和像素小伙伴。</p><label class="profile-label" for="profileNameInput">昵称</label><input id="profileNameInput" maxlength="18" value="${esc(u.name)}" autocomplete="off"><span class="profile-label">选择形象</span><div class="animal-picker">${ANIMALS.map(a=>`<button class="animal-option ${a.value===u.animal?'selected':''}" data-animal="${a.value}" aria-label="${a.name}">${animalSprite(a.value,'picker-sprite')}<small>${a.name}</small></button>`).join('')}</div><button class="save-button profile-save" data-profile-save="${id}">保存资料</button>`)}
$('startButton').onclick=async()=>{if(activeFor(state.currentUser))return;try{const {data,error}=await client.from('work_sessions').insert({room_id:roomId,user_id:state.currentUser,started_at:new Date().toISOString()}).select('id,room_id,user_id,started_at,ended_at').single();if(error)throw error;state.sessions.push({id:data.id,userId:data.user_id,startedAt:data.started_at,endedAt:data.ended_at});render();toast('专注开始啦，朋友们可以看到你在工作。')}catch(error){toast(error.message||'无法开始专注')}};
$('stopButton').onclick=async()=>{const s=activeFor(state.currentUser);if(!s)return;try{const endedAt=new Date().toISOString(),{error}=await client.from('work_sessions').update({ended_at:endedAt}).eq('id',s.id).eq('user_id',state.currentUser).is('ended_at',null);if(error)throw error;s.endedAt=endedAt;render();toast('这一段专注已保存。做得很好！')}catch(error){toast(error.message||'无法结束专注')}};
$('profileSwitch').onclick=()=>showProfileEditor(state.currentUser);
$('modalContent').addEventListener('click',async e=>{const animal=e.target.closest('[data-animal]');if(animal&&editingProfile){editingProfile.animal=animal.dataset.animal;document.querySelectorAll('.animal-option').forEach(x=>x.classList.toggle('selected',x===animal));return}const saveProfile=e.target.closest('[data-profile-save]');if(saveProfile){const u=memberFor(saveProfile.dataset.profileSave),name=$('profileNameInput').value.trim()||u.name;try{const {error}=await client.from('room_members').update({display_name:name,animal:editingProfile.animal}).eq('room_id',roomId).eq('user_id',state.currentUser);if(error)throw error;u.name=name;u.animal=editingProfile.animal;closeModal();render();toast(`${u.name}的资料已保存`)}catch(error){toast(error.message||'资料保存失败')}editingProfile=null}});
$('modalClose').onclick=closeModal;$('modal').onclick=e=>{if(e.target===$('modal'))closeModal()};
document.querySelectorAll('.view-toggle button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.view-toggle button').forEach(x=>x.classList.toggle('selected',x===b));$('roomScene').classList.toggle('hidden',b.dataset.view==='list');$('roomList').classList.toggle('hidden',b.dataset.view!=='list')});
function historyModal(){const current=memberFor(state.currentUser);const rows=[...state.sessions].sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)).map(s=>{const user=memberFor(s.userId),start=new Date(s.startedAt);return `<div class="member-row"><div class="member-avatar">${user?animalSprite(user.animal,'list-sprite'):'◷'}</div><div class="member-info"><b>${user?`${esc(user.name)} · `:''}${new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',timeZone:'Europe/London'}).format(start)} · ${new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(start)} 英国时间</b><span>${new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'}).format(start)} 中国时间开始 · ${s.endedAt?shortDuration(Date.parse(s.endedAt)-Date.parse(s.startedAt)):'正在进行'}</span></div><span class="status-label">${s.endedAt?'已完成':'Working'}</span></div>`}).join('');modal(`<h3><span class="history-title-sprite">${animalSprite(current.animal,'list-sprite')}</span>房间专注记录</h3><p>显示本房间所有成员的记录；时间同时按英国和中国时区展示。</p><div class="identity-list">${rows||'<p>房间里还没有专注记录。</p>'}</div>`)}
$('historyNav').onclick=historyModal;$('allHistory').onclick=historyModal;
$('helpButton').onclick=()=>modal('<h3>关于自习室</h3><p>房间成员、专注记录与聊天由 Supabase 保存，并通过 Realtime 同步。登录账号需要已经加入此房间。</p><p>日期统计按英国和中国各自的当地日历日计算。英国时间会自动适配夏令时。</p>');
$('copyLink').onclick=()=>toast('邀请功能暂未开放，目前固定为三位成员。');
$('moreButton').onclick=()=>modal(`<h3>房间成员</h3><p>当前成员：${USERS.map(u=>esc(memberFor(u.id).name)).join('、')}。</p><p>每位成员使用自己的 Supabase Auth 账号登录；只会显示已加入此房间的账号。</p>`);
$('roomMenu').onclick=()=>{
 const inputId='roomNameInput';
 modal(`<h3>编辑房间名称</h3><p>只有房间创建者可以修改名称。</p><label class="profile-label" for="${inputId}">房间名称</label><input id="${inputId}" maxlength="40" value="${esc(state.roomName)}" autocomplete="off"><button class="save-button" id="saveRoomName">保存</button>`);
 const input=$(inputId);input.focus();input.select();
 $('saveRoomName').onclick=async()=>{const name=input.value.trim();if(!name){input.focus();return}const button=$('saveRoomName');button.disabled=true;try{const {data,error}=await client.from('rooms').update({name}).eq('id',roomId).select('id,name').single();if(error)throw error;state.roomName=data.name;closeModal();render();toast('房间名称已更新')}catch(error){button.disabled=false;toast(error.message||'修改失败：请确认你是房间创建者')} };
};
function authError(message){$('authError').textContent=message;$('authError').classList.remove('hidden')}
function signedOut(message=''){ $('appShell').classList.add('hidden');$('authScreen').classList.remove('hidden');if(message)authError(message); }
function signedIn(){ $('authError').classList.add('hidden');$('authScreen').classList.add('hidden');$('appShell').classList.remove('hidden'); }
async function refreshSessions(){const {data,error}=await client.from('work_sessions').select('id,room_id,user_id,started_at,ended_at').eq('room_id',roomId).order('started_at',{ascending:true});if(error)throw error;state.sessions=(data||[]).map(s=>({id:s.id,userId:s.user_id,startedAt:s.started_at,endedAt:s.ended_at}));render()}
async function loadRoom(session){
 if(!session?.user){signedOut();return}
 const cfg=window.STUDYROOM_SUPABASE_CONFIG||{};let memberQuery=client.from('room_members').select('room_id,user_id,display_name,animal').eq('user_id',session.user.id).limit(1);
 if(cfg.roomId)memberQuery=memberQuery.eq('room_id',cfg.roomId);
 const {data:mine,error:memberError}=await memberQuery.maybeSingle();if(memberError)throw memberError;if(!mine)throw new Error('此 Supabase 账号还没有加入自习室 room_members。');
 roomId=mine.room_id;state.currentUser=session.user.id;
 const [{data:members,error:membersError},{data:room,error:roomError}]=await Promise.all([
  client.from('room_members').select('room_id,user_id,display_name,animal').eq('room_id',roomId),
  client.from('rooms').select('id,name').eq('id',roomId).maybeSingle()
 ]);
 if(membersError)throw membersError;if(roomError)throw roomError;
 USERS=(members||[]).map(m=>({id:m.user_id,name:m.display_name,animal:m.animal,online:m.user_id===state.currentUser}));
 state.roomName=room?.name||'周末自习室';await refreshSessions();signedIn();
 if(sessionsChannel)client.removeChannel(sessionsChannel);if(presenceChannel)client.removeChannel(presenceChannel);
 sessionsChannel=client.channel(`study-work-${roomId}`).on('postgres_changes',{event:'*',schema:'public',table:'work_sessions',filter:`room_id=eq.${roomId}`},()=>refreshSessions().catch(e=>toast(e.message))).subscribe();
 presenceChannel=client.channel(`study-presence-${roomId}`,{config:{presence:{key:state.currentUser}}})
  .on('presence',{event:'sync'},()=>{const roster=presenceChannel.presenceState();USERS.forEach(u=>u.online=false);Object.values(roster).flat().forEach(p=>{const m=byId(p.user_id);if(m)m.online=true});render()})
  .subscribe(status=>{if(status==='SUBSCRIBED')presenceChannel.track({user_id:state.currentUser})});
}
async function initializeAuth(){try{client=await window.getStudyRoomClient();const {data,error}=await client.auth.getSession();if(error)throw error;if(data.session)await loadRoom(data.session);else signedOut();client.auth.onAuthStateChange((event,session)=>{if(event!=='SIGNED_IN'&&event!=='SIGNED_OUT')return;queueMicrotask(()=>{if(session)loadRoom(session).catch(e=>signedOut(e.message));else{if(sessionsChannel)client.removeChannel(sessionsChannel);if(presenceChannel)client.removeChannel(presenceChannel);state={sessions:[],currentUser:null,roomName:'周末自习室'};USERS=[];signedOut()}})});}catch(error){signedOut(error.message||'连接 Supabase 失败')}}
$('authForm').addEventListener('submit',async e=>{e.preventDefault();$('authSubmit').disabled=true;$('authError').classList.add('hidden');try{client=client||await window.getStudyRoomClient();const {error}=await client.auth.signInWithPassword({email:$('authEmail').value.trim(),password:$('authPassword').value});if(error)throw error}catch(error){authError(error.message||'登录失败，请检查邮箱和密码')}finally{$('authSubmit').disabled=false}});
$('authSignOut').onclick=async()=>{if(!client)return;const {error}=await client.auth.signOut();if(error)toast(error.message)};
initializeAuth();setInterval(()=>{if(state.currentUser)render()},1000);render();
