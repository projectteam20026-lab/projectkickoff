'use strict';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║        KickOff Jordan — Mock Server (No Database)        ║
 * ║  يشتغل بدون MongoDB، يرجع بيانات وهمية لكل الـ endpoints ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const cors    = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', credentials: false }));

// ─── JWT وهمي ─────────────────────────────────────────────────────────────────
const FAKE_TOKEN = 'mock_token_kickoff_jordan_2024';

// ─── بيانات وهمية ─────────────────────────────────────────────────────────────

const USERS = [
  { _id: '1', id: '1', name: 'أحمد المسؤول',  firstName: 'أحمد',  lastName: 'المسؤول',  username: 'admin_jo',   playerId: '',         email: 'admin@kickoff.jo',  role: 'مسؤول',      phone: '0791234567', avatar: 'https://ui-avatars.com/api/?name=أحمد&background=8b5cf6&color=fff' },
  { _id: '2', id: '2', name: 'محمد اللاعب',   firstName: 'محمد',  lastName: 'اللاعب',   username: 'mo_player',  playerId: 'KO-AB12C', email: 'player@kickoff.jo', role: 'لاعب',       phone: '0799876543', avatar: 'https://ui-avatars.com/api/?name=محمد&background=10b981&color=fff' },
  { _id: '3', id: '3', name: 'سارة اللاعبة',  firstName: 'سارة',  lastName: 'اللاعبة',  username: 'sara_kicks', playerId: 'KO-X7Y2Z', email: 'sara@kickoff.jo',   role: 'لاعب',       phone: '0785551234', avatar: 'https://ui-avatars.com/api/?name=سارة&background=f59e0b&color=fff' },
  { _id: '4', id: '4', name: 'عمر المالك',    firstName: 'عمر',   lastName: 'المالك',   username: 'owner_omar', playerId: '',         email: 'owner@kickoff.jo',  role: 'مالك ملعب',  phone: '0778889900', avatar: 'https://ui-avatars.com/api/?name=عمر&background=64748b&color=fff' },
];

const FIELDS = [
  { _id: '101', id: '101', name: 'ملعب الأمير محمد', location: 'عمان - الجبيهة',      pricePerHour: 35, rating: 4.8, type: '7-a-side', turfType: 'عشب صناعي', images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600'], amenities: ['إضاءة','مواقف','غرف تغيير','مياه'], description: 'ملعب مجهز بالكامل بإضاءة ليلية وعشب صناعي عالي الجودة', ownerId: '4' },
  { _id: '102', id: '102', name: 'ملعب النصر',        location: 'عمان - شميساني',      pricePerHour: 40, rating: 4.5, type: '11-a-side', turfType: 'عشب طبيعي', images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600'], amenities: ['إضاءة','مواقف','كافيتيريا'], description: 'ملعب كبير مناسب للمباريات الرسمية', ownerId: '4' },
  { _id: '103', id: '103', name: 'ملعب الرياضة للجميع', location: 'الزرقاء - الرصيفة', pricePerHour: 25, rating: 4.2, type: '5-a-side', turfType: 'عشب صناعي', images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600'], amenities: ['إضاءة','مياه'], description: 'ملعب صغير مناسب لمباريات السداسية', ownerId: '4' },
  { _id: '104', id: '104', name: 'ملعب اربد الدولي',   location: 'اربد - وسط البلد',   pricePerHour: 30, rating: 4.6, type: '7-a-side', turfType: 'عشب صناعي', images: ['https://images.unsplash.com/photo-1624880357913-a8539238245b?w=600'], amenities: ['إضاءة','مواقف','غرف تغيير'], description: 'ملعب متطور في قلب مدينة اربد', ownerId: '4' },
];

const BOOKINGS = [
  { _id: 'b1', id: 'b1', fieldId: '101', fieldName: 'ملعب الأمير محمد',      date: '2026-05-28', timeSlot: '18:00 - 19:00', status: 'مؤكد',          price: 35, userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b2', id: 'b2', fieldId: '102', fieldName: 'ملعب النصر',            date: '2026-05-29', timeSlot: '20:00 - 21:00', status: 'قيد الانتظار',  price: 40, userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b4', id: 'b4', fieldId: '104', fieldName: 'ملعب اربد الدولي',      date: '2026-05-30', timeSlot: '17:00 - 18:00', status: 'قيد الانتظار',  price: 30, userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b5', id: 'b5', fieldId: '101', fieldName: 'ملعب الأمير محمد',      date: '2026-06-02', timeSlot: '19:00 - 20:00', status: 'مؤكد',          price: 35, userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b3', id: 'b3', fieldId: '103', fieldName: 'ملعب الرياضة للجميع',   date: '2026-05-10', timeSlot: '16:00 - 17:00', status: 'ملغي',          price: 25, userId: '2', createdAt: new Date().toISOString() },
];

// ─── حجوزات تجريبية للتحقق من نظام التذكير (تُحسب عند بدء الخادم) ────────────
;(function addDemoReminderBookings() {
  function padZ(n) { return String(n).padStart(2, '0'); }
  function localDate(d) { return `${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`; }
  function localHHMM(d) { return `${padZ(d.getHours())}:${padZ(d.getMinutes())}`; }
  function addMins(d, m) { return new Date(d.getTime() + m * 60000); }
  function makeSlot(start, dur) {
    return `${localHHMM(start)} - ${localHHMM(addMins(start, dur || 60))}`;
  }
  const now  = new Date();
  const t50  = addMins(now, 50);   // سيقع في نافذة التذكير (30-70 دقيقة)
  const t20  = addMins(now, 20);   // سيقع في نافذة الإلغاء التلقائي (≤30 دقيقة)
  BOOKINGS.push(
    { _id: 'bDemo1', id: 'bDemo1', fieldId: '101', fieldName: 'ملعب الأمير محمد',    date: localDate(t50), timeSlot: makeSlot(t50), status: 'قيد الانتظار', price: 35, userId: '2', createdAt: now.toISOString() },
    { _id: 'bDemo2', id: 'bDemo2', fieldId: '103', fieldName: 'ملعب الرياضة للجميع', date: localDate(t20), timeSlot: makeSlot(t20), status: 'قيد الانتظار', price: 25, userId: '2', createdAt: now.toISOString() },
  );
  console.log(`[ReminderDemo] bDemo1 → ${localDate(t50)} ${makeSlot(t50)}  (تذكير)`);
  console.log(`[ReminderDemo] bDemo2 → ${localDate(t20)} ${makeSlot(t20)}  (إلغاء تلقائي)`);
})();

const TEAMS = [
  { _id: 't1', id: 't1', name: 'النسور',    wins: 8,  losses: 2, draws: 1, points: 25, logo: '🦅', players: ['أحمد','محمد','خالد','عمر','سالم','يوسف','راشد'], isUserTeam: true,  userId: '2' },
  { _id: 't2', id: 't2', name: 'الأسود',    wins: 6,  losses: 3, draws: 2, points: 20, logo: '🦁', players: ['فارس','طارق','جاسم','حامد','وليد','سمير','نادر'], isUserTeam: false, userId: '3' },
  { _id: 't3', id: 't3', name: 'الصقور',   wins: 5,  losses: 4, draws: 2, points: 17, logo: '🦆', players: ['زياد','باسم','رامي','منذر','صالح','حسن','أنس'],  isUserTeam: false, userId: '4' },
  { _id: 't4', id: 't4', name: 'البرق',     wins: 10, losses: 1, draws: 0, points: 30, logo: '⚡', players: ['مروان','جاد','ريان','بشير','غسان','شادي','علي'],  isUserTeam: false, userId: '4' },
];

const TOURNAMENTS = [
  { _id: 'tr1', id: 'tr1', name: 'دوري الأردن الأول',      sport: 'كرة قدم', status: 'جارٍ',    teamsCount: 4, maxTeams: 8,  startDate: '2026-05-01', prizePool: '500 JD', registeredTeams: ['t1','t2','t3','t4'], matchesGenerated: true  },
  { _id: 'tr2', id: 'tr2', name: 'كأس الشباب',             sport: 'كرة قدم', status: 'قادم',    teamsCount: 2, maxTeams: 8,  startDate: '2026-06-10', prizePool: '300 JD', registeredTeams: ['t1','t2'],           matchesGenerated: false },
  { _id: 'tr3', id: 'tr3', name: 'بطولة رمضان الخماسية',   sport: 'كرة قدم', status: 'منتهية',  teamsCount: 8, maxTeams: 8,  startDate: '2026-03-15', prizePool: '200 JD', registeredTeams: [],                   matchesGenerated: true  },
];

const MATCHES = [
  { _id: 'm1', id: 'm1', leagueId: 'tr1', homeTeam: 'النسور', awayTeam: 'الأسود',  homeTeamId: 't1', awayTeamId: 't2', homeScore: 3, awayScore: 1, date: '2026-05-10', status: 'انتهت'  },
  { _id: 'm2', id: 'm2', leagueId: 'tr1', homeTeam: 'الصقور', awayTeam: 'البرق',   homeTeamId: 't3', awayTeamId: 't4', homeScore: 0, awayScore: 2, date: '2026-05-12', status: 'انتهت'  },
  { _id: 'm3', id: 'm3', leagueId: 'tr1', homeTeam: 'النسور', awayTeam: 'البرق',   homeTeamId: 't1', awayTeamId: 't4', homeScore: null, awayScore: null, date: '2026-05-28', status: 'قادمة' },
  { _id: 'm4', id: 'm4', leagueId: 'tr1', homeTeam: 'الأسود', awayTeam: 'الصقور',  homeTeamId: 't2', awayTeamId: 't3', homeScore: null, awayScore: null, date: '2026-05-30', status: 'قادمة' },
];

const NOTIFICATIONS = [
  { _id: 'n1', id: 'n1', title: 'حجز مؤكد ✅',          message: 'تم تأكيد حجزك في ملعب الأمير محمد يوم الاثنين', date: new Date().toISOString(), read: false, type: 'booking',     userId: '2' },
  { _id: 'n2', id: 'n2', title: 'مباراة قادمة ⚽',       message: 'مباراتك مع البرق بعد 4 أيام - استعد!',           date: new Date().toISOString(), read: false, type: 'match',       userId: '2' },
  { _id: 'n3', id: 'n3', title: 'انضم لبطولة جديدة 🏆', message: 'كأس الشباب متاح للتسجيل الآن',                   date: new Date().toISOString(), read: true,  type: 'tournament',  userId: '2' },
];

const REVIEWS = [
  { id: 'r1', fieldId: '101', userId: '2', userName: 'محمد العمري',  userAvatar: 'https://ui-avatars.com/api/?name=محمد&background=3b82f6&color=fff', rating: 5, comment: 'ملعب ممتاز وإضاءة رائعة!',        createdAt: '2026-05-01T10:00:00Z' },
  { id: 'r2', fieldId: '101', userId: '3', userName: 'سارة خالد',    userAvatar: 'https://ui-avatars.com/api/?name=سارة&background=f59e0b&color=fff',  rating: 4, comment: 'جيد جداً، ننصح به',               createdAt: '2026-05-05T14:00:00Z' },
  { id: 'r3', fieldId: '102', userId: '2', userName: 'محمد العمري',  userAvatar: 'https://ui-avatars.com/api/?name=محمد&background=3b82f6&color=fff', rating: 4, comment: 'ملعب واسع مناسب للمباريات الكبيرة', createdAt: '2026-05-08T09:00:00Z' },
];

// ─── متغير لتخزين الـ current user ─────────────────────────────────────────────
let currentUser = null;

// ─── Helper ───────────────────────────────────────────────────────────────────
function ok(res, data, extra = {}) {
  res.json({ success: true, data, ...extra });
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ status: 'OK', message: 'KickOff Jordan MOCK API 🎭', timestamp: new Date() });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = USERS.find(u => u.email === email) || USERS[1];
  currentUser = user;
  res.json({ success: true, user, token: FAKE_TOKEN });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role, firstName, lastName, username } = req.body;
  const normalEmail = (email||'').toLowerCase();
  if (USERS.find(u => u.email === normalEmail))
    return res.status(400).json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' });
  if (username && USERS.find(u => u.username === username))
    return res.status(400).json({ success: false, error: 'اسم المستخدم مستخدم بالفعل' });
  const bgColor = role === 'مالك ملعب' ? '64748b' : role === 'مسؤول' ? '8b5cf6' : '10b981';
  const isPlayer = !role || role === 'لاعب';
  const playerId = isPlayer ? 'KO-' + Math.random().toString(36).slice(2, 7).toUpperCase() : '';
  const newUser = {
    _id: String(Date.now()), id: String(Date.now()),
    name: name || `${firstName||''} ${lastName||''}`.trim(),
    firstName: firstName || '', lastName: lastName || '',
    username: username || '',
    playerId,
    email: normalEmail,
    role: role || 'لاعب',
    phone: '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name||firstName||'U')}&background=${bgColor}&color=fff`,
  };
  USERS.push(newUser);
  currentUser = newUser;
  res.json({ success: true, user: newUser, token: FAKE_TOKEN });
});

app.get('/api/auth/me', (_, res) => {
  const user = currentUser || USERS[1];
  res.json({ success: true, user });
});

app.put('/api/auth/me', (req, res) => {
  const user = currentUser || USERS[1];
  // تحقق من تكرار اسم المستخدم
  if (req.body.username && req.body.username !== user.username) {
    const taken = USERS.find(u => u.username === req.body.username && u._id !== user._id);
    if (taken) return res.status(400).json({ success: false, error: 'اسم المستخدم مستخدم بالفعل، اختر اسماً آخر' });
  }
  // تحقق من تكرار البريد الإلكتروني
  if (req.body.email && req.body.email !== user.email) {
    const taken = USERS.find(u => u.email === req.body.email && u._id !== user._id);
    if (taken) return res.status(400).json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' });
  }
  Object.assign(user, req.body);
  res.json({ success: true, user });
});

app.post('/api/auth/forgot-password', (_, res) => {
  res.json({ success: true, message: 'تم إرسال رابط استعادة كلمة المرور (وهمياً)' });
});

app.post('/api/auth/reset-password/:token', (_, res) => {
  res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح (وهمياً)' });
});

// ─── Fields ───────────────────────────────────────────────────────────────────
app.get('/api/fields', (_, res) => ok(res, FIELDS));

app.get('/api/fields/:id', (req, res) => {
  const f = FIELDS.find(x => x._id === req.params.id);
  f ? ok(res, f) : res.status(404).json({ success: false, error: 'الملعب غير موجود' });
});

app.post('/api/fields', (req, res) => {
  const f = { _id: String(Date.now()), id: String(Date.now()), ...req.body };
  FIELDS.push(f);
  ok(res, f);
});

app.put('/api/fields/:id', (req, res) => {
  const i = FIELDS.findIndex(x => x._id === req.params.id);
  if (i >= 0) { Object.assign(FIELDS[i], req.body); ok(res, FIELDS[i]); }
  else res.status(404).json({ success: false, error: 'غير موجود' });
});

app.delete('/api/fields/:id', (req, res) => {
  const i = FIELDS.findIndex(x => x._id === req.params.id);
  if (i >= 0) FIELDS.splice(i, 1);
  res.json({ success: true });
});

// ─── Bookings ─────────────────────────────────────────────────────────────────
app.get('/api/bookings', (_, res) => ok(res, BOOKINGS));

app.get('/api/bookings/slots', (req, res) => {
  const all = ['08:00 - 09:00','09:00 - 10:00','10:00 - 11:00','16:00 - 17:00','17:00 - 18:00','18:00 - 19:00','19:00 - 20:00','20:00 - 21:00','21:00 - 22:00'];
  const booked = BOOKINGS.filter(b => b.fieldId === req.query.fieldId && b.date === req.query.date && b.status !== 'ملغي').map(b => b.timeSlot);
  const available = all.filter(s => !booked.includes(s));
  ok(res, { available, booked });
});

app.post('/api/bookings', (req, res) => {
  const field = FIELDS.find(f => f._id === req.body.fieldId) || FIELDS[0];
  const b = { _id: String(Date.now()), id: String(Date.now()), fieldName: field.name, status: 'مؤكد', price: field.pricePerHour, userId: (currentUser || USERS[1])._id, createdAt: new Date().toISOString(), ...req.body };
  BOOKINGS.push(b);
  ok(res, b);
});

app.put('/api/bookings/:id/cancel', (req, res) => {
  const b = BOOKINGS.find(x => x._id === req.params.id || x.id === req.params.id);
  if (b) b.status = 'ملغي';
  res.json({ success: true });
});

// تأكيد / تحديث الحجز
app.put('/api/bookings/:id', (req, res) => {
  const b = BOOKINGS.find(x => x._id === req.params.id || x.id === req.params.id);
  if (!b) return res.status(404).json({ success: false, error: 'الحجز غير موجود' });
  Object.assign(b, req.body);
  res.json({ success: true, booking: b });
});

// ─── Teams ────────────────────────────────────────────────────────────────────
app.get('/api/teams', (_, res) => ok(res, TEAMS));

app.post('/api/teams', (req, res) => {
  const t = { _id: String(Date.now()), id: String(Date.now()), wins: 0, losses: 0, draws: 0, points: 0, isUserTeam: true, userId: (currentUser || USERS[1])._id, ...req.body };
  TEAMS.push(t);
  res.json({ success: true, team: t });
});

app.put('/api/teams/:id', (req, res) => {
  const i = TEAMS.findIndex(x => x._id === req.params.id);
  if (i >= 0) { Object.assign(TEAMS[i], req.body); res.json({ success: true, team: TEAMS[i] }); }
  else res.status(404).json({ success: false, error: 'غير موجود' });
});

app.delete('/api/teams/:id', (req, res) => {
  const i = TEAMS.findIndex(x => x._id === req.params.id);
  if (i >= 0) TEAMS.splice(i, 1);
  res.json({ success: true });
});

// ─── Tournaments ──────────────────────────────────────────────────────────────
app.get('/api/tournaments', (_, res) => ok(res, TOURNAMENTS));

app.post('/api/tournaments', (req, res) => {
  const t = { _id: String(Date.now()), id: String(Date.now()), registeredTeams: [], teamsCount: 0, matchesGenerated: false, ...req.body };
  TOURNAMENTS.push(t);
  ok(res, t);
});

app.put('/api/tournaments/:id', (req, res) => {
  const i = TOURNAMENTS.findIndex(x => x._id === req.params.id);
  if (i >= 0) { Object.assign(TOURNAMENTS[i], req.body); ok(res, TOURNAMENTS[i]); }
  else res.status(404).json({ success: false, error: 'غير موجود' });
});

app.delete('/api/tournaments/:id', (req, res) => {
  const i = TOURNAMENTS.findIndex(x => x._id === req.params.id);
  if (i >= 0) TOURNAMENTS.splice(i, 1);
  res.json({ success: true });
});

app.post('/api/tournaments/:id/register', (req, res) => {
  const t = TOURNAMENTS.find(x => x._id === req.params.id);
  if (t && !t.registeredTeams.includes(req.body.teamId)) {
    t.registeredTeams.push(req.body.teamId);
    t.teamsCount = t.registeredTeams.length;
  }
  res.json({ success: true });
});

// ─── Matches ──────────────────────────────────────────────────────────────────
app.get('/api/matches', (req, res) => {
  const list = req.query.leagueId ? MATCHES.filter(m => m.leagueId === req.query.leagueId) : MATCHES;
  ok(res, list);
});

app.put('/api/matches/:id/result', (req, res) => {
  const m = MATCHES.find(x => x._id === req.params.id);
  if (m) { m.homeScore = req.body.homeScore; m.awayScore = req.body.awayScore; m.status = req.body.status || 'انتهت'; }
  res.json({ success: true });
});

// ─── Notifications ────────────────────────────────────────────────────────────
app.get('/api/notifications', (_, res) => ok(res, NOTIFICATIONS));

app.put('/api/notifications/read-all', (_, res) => {
  NOTIFICATIONS.forEach(n => n.read = true);
  ok(res, NOTIFICATIONS);
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
app.get('/api/reviews', (req, res) => {
  const list = req.query.fieldId ? REVIEWS.filter(r => r.fieldId === req.query.fieldId) : REVIEWS;
  ok(res, list);
});

app.get('/api/reviews/my', (req, res) => {
  const user = currentUser || USERS[1];
  const r = REVIEWS.find(x => x.fieldId === req.query.fieldId && x.userId === user._id);
  ok(res, r || null);
});

app.post('/api/reviews', (req, res) => {
  const user = currentUser || USERS[1];
  const r = { id: String(Date.now()), userId: user._id, userName: user.name, userAvatar: user.avatar, createdAt: new Date().toISOString(), ...req.body };
  REVIEWS.push(r);
  ok(res, r);
});

app.delete('/api/reviews/:id', (req, res) => {
  const i = REVIEWS.findIndex(x => x.id === req.params.id);
  if (i >= 0) REVIEWS.splice(i, 1);
  res.json({ success: true });
});

// ─── Admin ────────────────────────────────────────────────────────────────────
app.get('/api/admin/stats', (_, res) => {
  ok(res, { totalUsers: USERS.length, totalFields: FIELDS.length, totalBookings: BOOKINGS.length, totalRevenue: BOOKINGS.reduce((s, b) => s + (b.price || 0), 0), activeBookings: BOOKINGS.filter(b => b.status === 'مؤكد').length });
});

app.get('/api/admin/users',      (_, res) => ok(res, USERS));
app.get('/api/admin/bookings',   (_, res) => ok(res, BOOKINGS));
app.get('/api/admin/fields',     (_, res) => ok(res, FIELDS));
app.get('/api/admin/teams',      (_, res) => ok(res, TEAMS));
app.get('/api/admin/tournaments',(_, res) => ok(res, TOURNAMENTS));

app.delete('/api/admin/users/:id', (req, res) => {
  const i = USERS.findIndex(x => x._id === req.params.id);
  if (i >= 0) USERS.splice(i, 1);
  res.json({ success: true });
});

app.put('/api/admin/users/:id/role', (req, res) => {
  const u = USERS.find(x => x._id === req.params.id);
  if (u) u.role = req.body.role;
  ok(res, u);
});

app.put('/api/admin/bookings/:id', (req, res) => {
  const b = BOOKINGS.find(x => x._id === req.params.id);
  if (b) Object.assign(b, req.body);
  ok(res, b);
});

app.delete('/api/admin/bookings/:id', (req, res) => {
  const i = BOOKINGS.findIndex(x => x._id === req.params.id);
  if (i >= 0) BOOKINGS.splice(i, 1);
  res.json({ success: true });
});

app.post('/api/admin/fields', (req, res) => {
  const f = { _id: String(Date.now()), id: String(Date.now()), ...req.body };
  FIELDS.push(f);
  ok(res, f);
});

app.put('/api/admin/fields/:id', (req, res) => {
  const i = FIELDS.findIndex(x => x._id === req.params.id);
  if (i >= 0) { Object.assign(FIELDS[i], req.body); ok(res, FIELDS[i]); }
  else res.status(404).json({ success: false, error: 'غير موجود' });
});

app.delete('/api/admin/fields/:id', (req, res) => {
  const i = FIELDS.findIndex(x => x._id === req.params.id);
  if (i >= 0) FIELDS.splice(i, 1);
  res.json({ success: true });
});

app.delete('/api/admin/teams/:id', (req, res) => {
  const i = TEAMS.findIndex(x => x._id === req.params.id);
  if (i >= 0) TEAMS.splice(i, 1);
  res.json({ success: true });
});

app.post('/api/admin/tournaments', (req, res) => {
  const t = { _id: String(Date.now()), id: String(Date.now()), registeredTeams: [], teamsCount: 0, matchesGenerated: false, ...req.body };
  TOURNAMENTS.push(t);
  ok(res, t);
});

app.put('/api/admin/tournaments/:id', (req, res) => {
  const i = TOURNAMENTS.findIndex(x => x._id === req.params.id);
  if (i >= 0) { Object.assign(TOURNAMENTS[i], req.body); ok(res, TOURNAMENTS[i]); }
  else res.status(404).json({ success: false, error: 'غير موجود' });
});

app.delete('/api/admin/tournaments/:id', (req, res) => {
  const i = TOURNAMENTS.findIndex(x => x._id === req.params.id);
  if (i >= 0) TOURNAMENTS.splice(i, 1);
  res.json({ success: true });
});

// ─── Leagues (alias for tournaments used by frontend) ─────────────────────────
app.get('/api/leagues',          (_, res) => ok(res, TOURNAMENTS));
app.get('/api/leagues/:id',      (req, res) => {
  const l = TOURNAMENTS.find(x => x._id === req.params.id);
  l ? ok(res, l) : res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
});
app.post('/api/leagues',   (req, res) => {
  const t = { _id: String(Date.now()), id: String(Date.now()), registeredTeams: [], teamsCount: 0, matchesGenerated: false, ...req.body };
  TOURNAMENTS.push(t); ok(res, t);
});
app.put('/api/leagues/:id', (req, res) => {
  const i = TOURNAMENTS.findIndex(x => x._id === req.params.id);
  if (i >= 0) { Object.assign(TOURNAMENTS[i], req.body); ok(res, TOURNAMENTS[i]); }
  else res.status(404).json({ success: false, error: 'غير موجود' });
});
app.delete('/api/leagues/:id', (req, res) => {
  const i = TOURNAMENTS.findIndex(x => x._id === req.params.id);
  if (i >= 0) TOURNAMENTS.splice(i, 1);
  res.json({ success: true });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => {
  console.log('\n🎭  KickOff Jordan — MOCK SERVER (بدون داتا بيس)');
  console.log(`    Running on : http://localhost:${PORT}`);
  console.log(`    Health     : http://localhost:${PORT}/api/health`);
  console.log('\n📧  حسابات جاهزة (أي كلمة مرور تشتغل):');
  console.log('  ┌──────────────────────────────────────────────────────┐');
  console.log('  │  لاعب    : player@kickoff.jo   / أي كلمة مرور       │');
  console.log('  │  مالك    : owner@kickoff.jo    / أي كلمة مرور       │');
  console.log('  │  مسؤول   : admin@kickoff.jo    / أي كلمة مرور       │');
  console.log('  └──────────────────────────────────────────────────────┘\n');
});
