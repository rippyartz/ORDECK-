// ═══════════════════════════════════════════════════════
//  ORDECK I — Supabase Global Backend
//  ─────────────────────────────────────────────────────
//  SETUP (2 minutes):
//  1. Go to https://supabase.com → New project (free)
//  2. Dashboard → SQL Editor → paste supabase-setup.sql → Run
//  3. Dashboard → Settings → API → copy Project URL + anon key
//  4. Paste them below and save
// ═══════════════════════════════════════════════════════

const SUPABASE_URL  = 'YOUR_SUPABASE_URL';   // e.g. https://xyzabc.supabase.co
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';

// Load Supabase client from CDN
(function loadSupabase() {
  if (window.supabase) return;
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = () => {
    window._sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    window.dispatchEvent(new Event('supabase-ready'));
  };
  s.onerror = () => {
    console.warn('ORDECK: Supabase CDN failed — falling back to localStorage');
    window._sbOffline = true;
    window.dispatchEvent(new Event('supabase-ready'));
  };
  document.head.appendChild(s);
})();

// ── Detect if configured ──
function sbConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON !== 'YOUR_SUPABASE_ANON_KEY' && !window._sbOffline;
}

// ─────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────
async function sbSignUp(email, password, name) {
  if (!sbConfigured()) return lsSignUp(email, password, name);
  const { data, error } = await _sb.auth.signUp({ email, password, options: { data: { name } } });
  if (error) throw error;
  // Create profile row
  await _sb.from('profiles').insert({ id: data.user.id, email, name, plan: 'standard' });
  return data.user;
}

async function sbSignIn(email, password) {
  if (!sbConfigured()) return lsSignIn(email, password);
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile } = await _sb.from('profiles').select('*').eq('id', data.user.id).single();
  if (profile && profile.banned) { await _sb.auth.signOut(); throw new Error('Account is banned.'); }
  return { ...data.user, ...profile };
}

async function sbSignOut() {
  if (!sbConfigured()) return;
  await _sb.auth.signOut();
}

async function sbGetSession() {
  if (!sbConfigured()) return lsGetSession();
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) return null;
  const { data: profile } = await _sb.from('profiles').select('*').eq('id', session.user.id).single();
  return profile ? { ...session.user, ...profile } : session.user;
}

async function sbUpdateProfile(updates) {
  if (!sbConfigured()) { return lsUpdateProfile(updates); }
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) return;
  await _sb.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', user.id);
}

// ─────────────────────────────────────────────────────
//  PUBLISHED PROJECTS
// ─────────────────────────────────────────────────────
async function sbPublishProject(proj) {
  if (!sbConfigured()) return lsPublishProject(proj);
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const row = {
    id: proj.id, author: user.id, studio: proj.studio,
    name: proj.name, description: proj.desc || '',
    visibility: proj.visibility || 'public',
    tags: proj.tags || [], thumb_url: proj.thumbUrl || null,
    license: proj.license || 'all-rights', collabs: proj.collabs || []
  };
  const { error } = await _sb.from('published_projects').upsert(row);
  if (error) throw error;
}

async function sbGetPublishedProjects({ studio, sort, search, limit } = {}) {
  if (!sbConfigured()) return lsGetPublishedProjects({ studio, sort, search, limit });
  let q = _sb.from('published_projects')
    .select(`*, author_profile:profiles!author(name,email,plan), likes(count), comments(count)`)
    .eq('visibility', 'public');
  if (studio) q = q.eq('studio', studio);
  if (search) q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  if (sort === 'likes') q = q.order('likes_count', { ascending: false });
  else q = q.order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return (data || []).map(sbMapProject);
}

async function sbGetMyProjects() {
  if (!sbConfigured()) return lsGetMyProjects();
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) return [];
  const { data } = await _sb.from('published_projects')
    .select(`*, likes(count), comments(count)`)
    .eq('author', user.id)
    .order('created_at', { ascending: false });
  return (data || []).map(sbMapProject);
}

async function sbGetProject(id) {
  if (!sbConfigured()) return lsGetProject(id);
  const { data } = await _sb.from('published_projects')
    .select(`*, author_profile:profiles!author(name,email,plan), likes(*), comments(*, author_profile:profiles!author(name,email))`)
    .eq('id', id).single();
  if (!data) return null;
  // Increment views
  await _sb.rpc('increment_views', { proj_id: id });
  return sbMapProject(data);
}

async function sbDeleteProject(id) {
  if (!sbConfigured()) return lsDeleteProject(id);
  const { error } = await _sb.from('published_projects').delete().eq('id', id);
  if (error) throw error;
}

async function sbToggleVisibility(id, vis) {
  if (!sbConfigured()) return lsToggleVisibility(id, vis);
  await _sb.from('published_projects').update({ visibility: vis }).eq('id', id);
}

function sbMapProject(row) {
  if (!row) return null;
  const authorProfile = row.author_profile || {};
  const likesArr = Array.isArray(row.likes) ? row.likes : [];
  const commentsArr = Array.isArray(row.comments) ? row.comments : [];
  return {
    id: row.id, studio: row.studio, name: row.name,
    desc: row.description, visibility: row.visibility,
    tags: row.tags || [], thumbUrl: row.thumb_url,
    license: row.license, collabs: row.collabs || [],
    author: authorProfile.email || row.author,
    authorName: authorProfile.name || '',
    authorPlan: authorProfile.plan || 'standard',
    likes: likesArr.map(l => l.user_id || l),
    likeCount: typeof row.likes === 'object' && row.likes?.count !== undefined ? row.likes.count : likesArr.length,
    comments: commentsArr.map(cm => ({
      id: cm.id, author: cm.author_profile?.email || cm.author,
      authorName: cm.author_profile?.name || '', text: cm.text, ts: new Date(cm.created_at).getTime()
    })),
    commentCount: commentsArr.length,
    views: row.views || 0,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at || row.created_at).getTime()
  };
}

// ─────────────────────────────────────────────────────
//  LIKES & COMMENTS
// ─────────────────────────────────────────────────────
async function sbToggleLike(projectId) {
  if (!sbConfigured()) return lsToggleLike(projectId);
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { data: existing } = await _sb.from('likes').select('*').eq('project_id', projectId).eq('user_id', user.id).single();
  if (existing) {
    await _sb.from('likes').delete().eq('project_id', projectId).eq('user_id', user.id);
    return false;
  } else {
    await _sb.from('likes').insert({ project_id: projectId, user_id: user.id });
    return true;
  }
}

async function sbAddComment(projectId, text) {
  if (!sbConfigured()) return lsAddComment(projectId, text);
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { data, error } = await _sb.from('comments').insert({ project_id: projectId, author: user.id, text }).select(`*, author_profile:profiles!author(name,email)`).single();
  if (error) throw error;
  return { id: data.id, author: data.author_profile?.email, authorName: data.author_profile?.name, text: data.text, ts: new Date(data.created_at).getTime() };
}

// ─────────────────────────────────────────────────────
//  FRIENDS
// ─────────────────────────────────────────────────────
function sbFriendPair(a, b) { return [a, b].sort(); }

async function sbSearchUser(email) {
  if (!sbConfigured()) return lsSearchUser(email);
  const { data } = await _sb.from('profiles').select('id,name,email,plan').eq('email', email).single();
  return data || null;
}

async function sbGetFriends() {
  if (!sbConfigured()) return lsGetFriends();
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) return { friends: [], requests: [], sent: [] };
  const { data } = await _sb.from('friends')
    .select(`*, user_a_profile:profiles!user_a(id,name,email,plan), user_b_profile:profiles!user_b(id,name,email,plan)`)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
  const rows = data || [];
  const friends = [], requests = [], sent = [];
  rows.forEach(r => {
    const iAmA = r.user_a === user.id;
    const other = iAmA ? r.user_b_profile : r.user_a_profile;
    if (!other) return;
    const entry = { id: r.id, rowId: r.id, email: other.email, name: other.name, plan: other.plan, userId: other.id };
    if (r.status === 'accepted') friends.push(entry);
    else if (r.requester === user.id) sent.push(entry);
    else requests.push(entry);
  });
  return { friends, requests, sent };
}

async function sbSendFriendRequest(toEmail) {
  if (!sbConfigured()) return lsSendFriendRequest(toEmail);
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { data: toUser } = await _sb.from('profiles').select('id').eq('email', toEmail).single();
  if (!toUser) throw new Error('User not found');
  const [a, b] = sbFriendPair(user.id, toUser.id);
  const { error } = await _sb.from('friends').insert({ user_a: a, user_b: b, status: 'pending', requester: user.id });
  if (error) throw error;
}

async function sbRespondFriendRequest(rowId, accept) {
  if (!sbConfigured()) return lsRespondFriendRequest(rowId, accept);
  if (accept) {
    await _sb.from('friends').update({ status: 'accepted' }).eq('id', rowId);
  } else {
    await _sb.from('friends').delete().eq('id', rowId);
  }
}

async function sbRemoveFriend(rowId) {
  if (!sbConfigured()) return lsRemoveFriend(rowId);
  await _sb.from('friends').delete().eq('id', rowId);
}

// ─────────────────────────────────────────────────────
//  MESSAGES (Real-time)
// ─────────────────────────────────────────────────────
let _sbMsgChannel = null;

async function sbGetMessages(otherUserId) {
  if (!sbConfigured()) return lsGetMessages(otherUserId);
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) return [];
  const tid = [user.id, otherUserId].sort().join('__');
  const { data } = await _sb.from('messages')
    .select(`*, sender_profile:profiles!sender(name,email), receiver_profile:profiles!receiver(name,email)`)
    .eq('thread_id', tid)
    .order('created_at', { ascending: true });
  // Mark as read
  await _sb.from('messages').update({ read: true }).eq('thread_id', tid).eq('receiver', user.id).eq('read', false);
  return (data || []).map(m => ({
    id: m.id, from: m.sender_profile?.email, fromName: m.sender_profile?.name,
    text: m.text, ts: new Date(m.created_at).getTime(), read: m.read
  }));
}

async function sbSendMessage(otherUserId, text) {
  if (!sbConfigured()) return lsSendMessage(otherUserId, text);
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const tid = [user.id, otherUserId].sort().join('__');
  const { data, error } = await _sb.from('messages')
    .insert({ thread_id: tid, sender: user.id, receiver: otherUserId, text })
    .select(`*, sender_profile:profiles!sender(name,email)`).single();
  if (error) throw error;
  return { id: data.id, from: data.sender_profile?.email, fromName: data.sender_profile?.name, text: data.text, ts: new Date(data.created_at).getTime() };
}

async function sbGetUnreadCount() {
  if (!sbConfigured()) return lsGetUnreadCount();
  const { data: { user } } = await _sb.auth.getUser();
  if (!user) return 0;
  const { count } = await _sb.from('messages').select('*', { count: 'exact', head: true }).eq('receiver', user.id).eq('read', false);
  return count || 0;
}

function sbSubscribeMessages(otherUserId, callback) {
  if (!sbConfigured()) return null;
  if (_sbMsgChannel) _sbMsgChannel.unsubscribe();
  const tid = [currentUser?._id || '', otherUserId].sort().join('__');
  _sbMsgChannel = _sb.channel('messages-' + tid)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${tid}` }, payload => {
      callback(payload.new);
    })
    .subscribe();
  return _sbMsgChannel;
}

function sbUnsubscribeMessages() {
  if (_sbMsgChannel) { _sbMsgChannel.unsubscribe(); _sbMsgChannel = null; }
}

// ─────────────────────────────────────────────────────
//  ADMIN (config stored in Supabase)
// ─────────────────────────────────────────────────────
async function sbAdminGetAllUsers() {
  if (!sbConfigured()) return Object.values(dbLoad());
  const { data } = await _sb.from('profiles').select('*').order('created_at', { ascending: false });
  return data || [];
}
async function sbAdminSetPlan(email, plan) {
  if (!sbConfigured()) { const db=dbLoad(); if(db[email])db[email].plan=plan; dbSave(db); return; }
  await _sb.from('profiles').update({ plan }).eq('email', email);
}
async function sbAdminBanUser(email, ban) {
  if (!sbConfigured()) { adminAuditLog(`${ban?'Banned':'Unbanned'} ${email}`,'warn'); return; }
  await _sb.from('profiles').update({ banned: ban }).eq('email', email);
}

// ─────────────────────────────────────────────────────
//  OFFLINE FALLBACK — localStorage (same as before)
// ─────────────────────────────────────────────────────
// These mirror every sb* function using the old localStorage DB
// so the app works even without Supabase configured.
function lsSignUp(email, password, name) {
  const db = dbLoad();
  if (db[email]) throw new Error('An account with this email already exists.');
  const user = { email, name, password: btoa(password), plan: 'standard', friends:{}, requests:{}, sent:{}, messages:{}, projects:{}, createdAt: Date.now() };
  db[email] = user; dbSave(db); sessionSave(email); return user;
}
function lsSignIn(email, password) {
  const db = dbLoad(); const user = db[email];
  if (!user) throw new Error('No account found with that email.');
  if (user.password !== btoa(password)) throw new Error('Incorrect password.');
  if (user.banned) throw new Error('Account is banned.');
  sessionSave(email); return user;
}
function lsGetSession() { const s = sessionLoad(); if (!s) return null; const db = dbLoad(); return db[s.email] || null; }
function lsUpdateProfile(updates) { const db=dbLoad(); const s=sessionLoad(); if(s&&db[s.email])Object.assign(db[s.email],updates); dbSave(db); }
function lsPublishProject(proj) { const all=projDBLoad(); all.unshift(proj); projDBSave(all); }
function lsGetPublishedProjects({studio,sort,search,limit}={}) {
  let all = projDBLoad().filter(p=>p.visibility==='public');
  if(studio) all=all.filter(p=>p.studio===studio);
  if(search){const q=search.toLowerCase();all=all.filter(p=>p.name.toLowerCase().includes(q)||(p.desc||'').toLowerCase().includes(q));}
  if(sort==='likes') all.sort((a,b)=>(b.likes||[]).length-(a.likes||[]).length);
  else all.sort((a,b)=>b.createdAt-a.createdAt);
  return limit ? all.slice(0,limit) : all;
}
function lsGetMyProjects() { const s=sessionLoad(); if(!s)return[]; return projDBLoad().filter(p=>p.author===s.email); }
function lsGetProject(id) { const p=projDBLoad().find(p=>p.id===id); if(p){p.views=(p.views||0)+1;projDBSave(projDBLoad().map(x=>x.id===id?p:x));} return p||null; }
function lsDeleteProject(id) { projDBSave(projDBLoad().filter(p=>p.id!==id)); }
function lsToggleVisibility(id,vis) { const all=projDBLoad(); const p=all.find(x=>x.id===id); if(p){p.visibility=vis;projDBSave(all);} }
function lsToggleLike(id) { const all=projDBLoad(); const p=all.find(x=>x.id===id); if(!p)return false; const me=sessionLoad()?.email; if(!me)return false; const i=p.likes.indexOf(me); if(i===-1)p.likes.push(me); else p.likes.splice(i,1); projDBSave(all); return i===-1; }
function lsAddComment(id,text) { const all=projDBLoad(); const p=all.find(x=>x.id===id); if(!p)return; const me=sessionLoad(); const cm={id:'c'+Date.now(),author:me?.email,authorName:me?.name||me?.email?.split('@')[0],text,ts:Date.now()}; p.comments.push(cm); projDBSave(all); return cm; }
function lsSearchUser(email) { const db=dbLoad(); const u=db[email]; return u?{email,name:u.name,plan:u.plan}:null; }
function lsGetFriends() { const s=sessionLoad(); if(!s)return{friends:[],requests:[],sent:[]}; const db=dbLoad(); const me=db[s.email]; if(!me)return{friends:[],requests:[],sent:[]}; const friends=Object.keys(me.friends||{}).map(e=>({email:e,name:db[e]?.name||e,plan:db[e]?.plan,rowId:e})); const requests=Object.keys(me.requests||{}).map(e=>({email:e,name:db[e]?.name||e,plan:db[e]?.plan,rowId:e})); const sent=Object.keys(me.sent||{}).map(e=>({email:e,name:db[e]?.name||e,plan:db[e]?.plan,rowId:e})); return{friends,requests,sent}; }
function lsSendFriendRequest(toEmail) { const db=dbLoad(); const s=sessionLoad(); const me=db[s?.email]; const to=db[toEmail]; if(!me||!to)throw new Error('User not found'); if(!me.sent)me.sent={}; if(!to.requests)to.requests={}; me.sent[toEmail]={name:to.name,ts:Date.now()}; to.requests[s.email]={name:me.name,ts:Date.now()}; dbSave(db); }
function lsRespondFriendRequest(rowId,accept) { const db=dbLoad(); const s=sessionLoad(); const me=db[s?.email]; if(!me)return; if(accept){if(!me.friends)me.friends={}; if(!db[rowId]?.friends) db[rowId].friends={}; me.friends[rowId]={since:Date.now()}; db[rowId].friends[s.email]={since:Date.now()}; delete me.requests[rowId]; if(db[rowId]?.sent) delete db[rowId].sent[s.email];}else{delete me.requests[rowId]; if(db[rowId]?.sent) delete db[rowId].sent[s.email];} dbSave(db); }
function lsRemoveFriend(rowId) { const db=dbLoad(); const s=sessionLoad(); const me=db[s?.email]; if(!me)return; delete me.friends[rowId]; if(db[rowId]?.friends) delete db[rowId].friends[s.email]; dbSave(db); }
function lsGetMessages(otherId) { const db=dbLoad(); const s=sessionLoad(); const me=db[s?.email]; if(!me)return[]; const tid=[s.email,otherId].sort().join('__'); return (me.messages?.[tid]||[]).map(m=>({...m,from:m.from||m.sender})); }
function lsSendMessage(otherId, text) { const db=dbLoad(); const s=sessionLoad(); const me=db[s?.email]; const other=db[otherId]; if(!me||!other)throw new Error('User not found'); const tid=[s.email,otherId].sort().join('__'); const msg={id:'m'+Date.now(),from:s.email,fromName:me.name,text,ts:Date.now()}; if(!me.messages)me.messages={}; if(!other.messages)other.messages={}; if(!me.messages[tid])me.messages[tid]=[]; if(!other.messages[tid])other.messages[tid]=[]; me.messages[tid].push(msg); other.messages[tid].push(msg); dbSave(db); return msg; }
function lsGetUnreadCount() { const db=dbLoad(); const s=sessionLoad(); const me=db[s?.email]; if(!me)return 0; let n=0; Object.values(me.messages||{}).forEach(t=>{ t.forEach(m=>{if(m.from!==s.email&&!m.read)n++;}); }); return n; }
