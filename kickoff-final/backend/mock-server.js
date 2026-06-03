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
  // ── قادمة / نشطة ──────────────────────────────────────────────────────────
  { _id: 'b1', id: 'b1', fieldId: '101', fieldName: 'ملعب الأمير محمد',      date: '2026-06-05', timeSlot: '18:00 - 19:00', status: 'مؤكد',          price: 35, paymentMethod: 'visa', userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b2', id: 'b2', fieldId: '102', fieldName: 'ملعب النصر',            date: '2026-06-07', timeSlot: '20:00 - 21:00', status: 'قيد الانتظار',  price: 40, paymentMethod: 'cash', userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b4', id: 'b4', fieldId: '104', fieldName: 'ملعب اربد الدولي',      date: '2026-06-10', timeSlot: '17:00 - 18:00', status: 'قيد الانتظار',  price: 30, paymentMethod: 'cash', userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b5', id: 'b5', fieldId: '101', fieldName: 'ملعب الأمير محمد',      date: '2026-06-15', timeSlot: '19:00 - 20:00', status: 'مؤكد',          price: 35, paymentMethod: 'visa', userId: '2', createdAt: new Date().toISOString() },
  // ── منتهية (ماضية) ─────────────────────────────────────────────────────────
  { _id: 'b6', id: 'b6', fieldId: '101', fieldName: 'ملعب الأمير محمد',      date: '2026-05-10', timeSlot: '18:00 - 19:30', status: 'منتهي',         price: 53, paymentMethod: 'visa', userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b7', id: 'b7', fieldId: '103', fieldName: 'ملعب الرياضة للجميع',   date: '2026-05-15', timeSlot: '17:00 - 19:00', status: 'منتهي',         price: 50, paymentMethod: 'cash', userId: '2', createdAt: new Date().toISOString() },
  { _id: 'b8', id: 'b8', fieldId: '102', fieldName: 'ملعب النصر',            date: '2026-05-20', timeSlot: '20:00 - 21:00', status: 'منتهي',         price: 40, paymentMethod: 'visa', userId: '2', createdAt: new Date().toISOString() },
  // ── ملغاة ──────────────────────────────────────────────────────────────────
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

// ─── Player Profiles (بيانات اللاعبين التفصيلية) ──────────────────────────────
const PLAYER_PROFILES = {
  'أحمد':  { name:'أحمد الخالدي',  position:'مهاجم',    age:24, goals:12, assists:5,  rating:8.2, bg:'3b82f6', nationality:'🇯🇴' },
  'محمد':  { name:'محمد العمري',   position:'قائد / وسط', age:26, goals:7,  assists:11, rating:8.7, bg:'10b981', nationality:'🇯🇴' },
  'خالد':  { name:'خالد السالم',   position:'مدافع',     age:23, goals:2,  assists:3,  rating:7.5, bg:'8b5cf6', nationality:'🇯🇴' },
  'عمر':   { name:'عمر الزيادي',   position:'مهاجم',    age:22, goals:9,  assists:4,  rating:7.9, bg:'f59e0b', nationality:'🇯🇴' },
  'سالم':  { name:'سالم الحمداني', position:'مدافع',     age:25, goals:1,  assists:6,  rating:7.3, bg:'ef4444', nationality:'🇯🇴' },
  'يوسف':  { name:'يوسف البكري',   position:'حارس مرمى', age:27, goals:0,  assists:0,  rating:8.1, bg:'64748b', nationality:'🇯🇴' },
  'راشد':  { name:'راشد النعيمي',  position:'وسط',       age:21, goals:5,  assists:8,  rating:7.6, bg:'0ea5e9', nationality:'🇯🇴' },
  'فارس':  { name:'فارس الشمري',   position:'قائد / مهاجم', age:28, goals:15, assists:6, rating:8.9, bg:'dc2626', nationality:'🇯🇴' },
  'طارق':  { name:'طارق العنزي',   position:'وسط',       age:24, goals:6,  assists:9,  rating:7.8, bg:'7c3aed', nationality:'🇯🇴' },
  'جاسم':  { name:'جاسم المنصور',  position:'مدافع',     age:23, goals:1,  assists:2,  rating:7.2, bg:'059669', nationality:'🇯🇴' },
  'حامد':  { name:'حامد الراشدي',  position:'وسط',       age:25, goals:4,  assists:7,  rating:7.5, bg:'d97706', nationality:'🇯🇴' },
  'وليد':  { name:'وليد السبيعي',  position:'مدافع',     age:22, goals:2,  assists:3,  rating:7.1, bg:'0891b2', nationality:'🇯🇴' },
  'سمير':  { name:'سمير بوعزيزي',  position:'مهاجم',    age:26, goals:10, assists:3,  rating:8.0, bg:'be123c', nationality:'🇯🇴' },
  'نادر':  { name:'نادر العامري',   position:'حارس مرمى', age:29, goals:0,  assists:1,  rating:7.8, bg:'1d4ed8', nationality:'🇯🇴' },
  'زياد':  { name:'زياد الحربي',   position:'وسط',       age:23, goals:5,  assists:6,  rating:7.4, bg:'166534', nationality:'🇯🇴' },
  'باسم':  { name:'باسم الكواري',  position:'مهاجم',    age:24, goals:8,  assists:4,  rating:7.7, bg:'92400e', nationality:'🇯🇴' },
  'رامي':  { name:'رامي الصاوي',   position:'مدافع',     age:25, goals:0,  assists:4,  rating:7.0, bg:'4338ca', nationality:'🇯🇴' },
  'منذر':  { name:'منذر العجمي',   position:'وسط',       age:22, goals:3,  assists:5,  rating:7.3, bg:'0f766e', nationality:'🇯🇴' },
  'صالح':  { name:'صالح النمر',    position:'مدافع',     age:27, goals:1,  assists:2,  rating:6.9, bg:'9f1239', nationality:'🇯🇴' },
  'حسن':   { name:'حسن قاسم',      position:'وسط',       age:23, goals:4,  assists:7,  rating:7.6, bg:'1e3a5f', nationality:'🇯🇴' },
  'أنس':   { name:'أنس الوهيبي',   position:'مهاجم',    age:21, goals:7,  assists:3,  rating:7.5, bg:'78350f', nationality:'🇯🇴' },
  'مروان': { name:'مروان الجمال',  position:'قائد / وسط', age:27, goals:9,  assists:13, rating:9.1, bg:'b45309', nationality:'🇯🇴' },
  'جاد':   { name:'جاد السكري',    position:'مهاجم',    age:22, goals:14, assists:5,  rating:8.5, bg:'7e22ce', nationality:'🇯🇴' },
  'ريان':  { name:'ريان الغامدي',  position:'مدافع',     age:24, goals:3,  assists:4,  rating:7.8, bg:'0369a1', nationality:'🇯🇴' },
  'بشير':  { name:'بشير حداد',     position:'حارس مرمى', age:28, goals:0,  assists:0,  rating:8.3, bg:'374151', nationality:'🇯🇴' },
  'غسان':  { name:'غسان الدوسري',  position:'مدافع',     age:25, goals:2,  assists:5,  rating:7.6, bg:'065f46', nationality:'🇯🇴' },
  'شادي':  { name:'شادي عيسى',     position:'وسط',       age:23, goals:6,  assists:8,  rating:7.9, bg:'701a75', nationality:'🇯🇴' },
  'علي':   { name:'علي فريد',      position:'مهاجم',    age:20, goals:11, assists:4,  rating:8.0, bg:'c2410c', nationality:'🇯🇴' },
  'سعد':   { name:'سعد الحسيني',   position:'وسط',       age:23, goals:4,  assists:6,  rating:7.4, bg:'1e40af', nationality:'🇯🇴' },
  'نور':   { name:'نور الشريف',    position:'مهاجم',    age:21, goals:8,  assists:3,  rating:7.7, bg:'047857', nationality:'🇯🇴' },
  'ماجد':  { name:'ماجد اليامي',   position:'مدافع',     age:26, goals:1,  assists:3,  rating:7.1, bg:'7c2d12', nationality:'🇯🇴' },
  'حسين':  { name:'حسين العتيبي',  position:'حارس مرمى', age:29, goals:0,  assists:0,  rating:8.0, bg:'4a1d96', nationality:'🇯🇴' },
  'كريم':  { name:'كريم رضا',      position:'وسط',       age:24, goals:5,  assists:7,  rating:7.5, bg:'0c4a6e', nationality:'🇯🇴' },
  'تامر':  { name:'تامر السيد',    position:'مهاجم',    age:22, goals:9,  assists:4,  rating:7.8, bg:'831843', nationality:'🇯🇴' },
  'وائل':  { name:'وائل صالح',     position:'مدافع',     age:25, goals:2,  assists:3,  rating:7.2, bg:'14532d', nationality:'🇯🇴' },
  'لؤي':   { name:'لؤي النبهاني',  position:'وسط',       age:23, goals:4,  assists:6,  rating:7.4, bg:'1c1917', nationality:'🇯🇴' },
  'عادل':  { name:'عادل زرقاوي',   position:'مهاجم',    age:24, goals:7,  assists:3,  rating:7.6, bg:'4d7c0f', nationality:'🇯🇴' },
  'بلال':  { name:'بلال توفيق',    position:'مدافع',     age:22, goals:1,  assists:2,  rating:6.8, bg:'1e3a5f', nationality:'🇯🇴' },
  'قيس':   { name:'قيس الحمادي',   position:'وسط',       age:25, goals:5,  assists:8,  rating:7.7, bg:'78350f', nationality:'🇯🇴' },
  'زاهر':  { name:'زاهر الأمين',   position:'مهاجم',    age:23, goals:10, assists:5,  rating:8.1, bg:'0f766e', nationality:'🇯🇴' },
  'معن':   { name:'معن الصليبي',   position:'حارس مرمى', age:27, goals:0,  assists:0,  rating:7.9, bg:'4338ca', nationality:'🇯🇴' },
  'سليم':  { name:'سليم برادة',    position:'مدافع',     age:24, goals:2,  assists:4,  rating:7.3, bg:'9f1239', nationality:'🇯🇴' },
};

const TEAMS = [
  // لا أحد من حسابات التجربة يملك فريقاً مسبقاً — المستخدم يبدأ من شاشة الاختيار
  { _id: 't1', id: 't1', name: 'النسور',   wins: 8,  losses: 2, draws: 1, points: 25, logo: '🦅', players: ['أحمد','محمد','خالد','عمر','سالم','يوسف','راشد'], isUserTeam: false, userId: 'npc1' },
  { _id: 't2', id: 't2', name: 'الأسود',   wins: 6,  losses: 3, draws: 2, points: 20, logo: '🦁', players: ['فارس','طارق','جاسم','حامد','وليد','سمير','نادر'], isUserTeam: false, userId: 'npc2' },
  { _id: 't3', id: 't3', name: 'الصقور',   wins: 5,  losses: 4, draws: 2, points: 17, logo: '🦆', players: ['زياد','باسم','رامي','منذر','صالح','حسن','أنس'],  isUserTeam: false, userId: 'npc3' },
  { _id: 't4', id: 't4', name: 'البرق',    wins: 10, losses: 1, draws: 0, points: 30, logo: '⚡', players: ['مروان','جاد','ريان','بشير','غسان','شادي','علي'],  isUserTeam: false, userId: 'npc4' },
  { _id: 't5', id: 't5', name: 'الوثبة',   wins: 4,  losses: 4, draws: 2, points: 14, logo: '🌟', players: ['سعد','نور','ماجد','حسين','كريم'], isUserTeam: false, userId: 'npc5' },
  { _id: 't6', id: 't6', name: 'الريان',   wins: 5,  losses: 3, draws: 2, points: 17, logo: '⭐', players: ['تامر','وائل','لؤي'], isUserTeam: false, userId: 'npc6' },
  { _id: 't7', id: 't7', name: 'الشباب',   wins: 3,  losses: 5, draws: 2, points: 11, logo: '🔥', players: ['عادل','بلال'], isUserTeam: false, userId: 'npc7' },
  { _id: 't8', id: 't8', name: 'الاتحاد',  wins: 6,  losses: 2, draws: 2, points: 20, logo: '💫', players: ['قيس','زاهر','معن','سليم'], isUserTeam: false, userId: 'npc8' },
];

// ─── Team Chat & Join Requests ────────────────────────────────────────────────
const TEAM_MESSAGES = {
  't1': [
    { id: 'tcm1', teamId: 't1', userId: '2',    userName: 'محمد اللاعب',  userAvatar: 'https://ui-avatars.com/api/?name=محمد&background=10b981&color=fff',  text: 'يا شباب، مباراتنا القادمة ضد البرق يوم 28/5 🔥',       timestamp: '2026-05-24T09:30:00Z' },
    { id: 'tcm2', teamId: 't1', userId: 'mem1', userName: 'أحمد',         userAvatar: 'https://ui-avatars.com/api/?name=أحمد&background=3b82f6&color=fff',    text: 'إن شاء الله نفوز! لازم نتدرب قبلها 💪',              timestamp: '2026-05-24T09:45:00Z' },
    { id: 'tcm3', teamId: 't1', userId: 'mem2', userName: 'خالد',         userAvatar: 'https://ui-avatars.com/api/?name=خالد&background=8b5cf6&color=fff',    text: 'أنا جاهز، موعد التدريب؟',                             timestamp: '2026-05-24T10:00:00Z' },
    { id: 'tcm4', teamId: 't1', userId: '2',    userName: 'محمد اللاعب',  userAvatar: 'https://ui-avatars.com/api/?name=محمد&background=10b981&color=fff',  text: 'غداً الساعة 7 مساءً في ملعب الأمير محمد 🏟️',           timestamp: '2026-05-24T10:15:00Z' },
    { id: 'tcm5', teamId: 't1', userId: 'mem3', userName: 'عمر',          userAvatar: 'https://ui-avatars.com/api/?name=عمر&background=f59e0b&color=fff',     text: 'حاضرين يا كابتن 🫡',                                  timestamp: '2026-05-25T08:00:00Z' },
    { id: 'tcm6', teamId: 't1', userId: 'mem4', userName: 'سالم',         userAvatar: 'https://ui-avatars.com/api/?name=سالم&background=ef4444&color=fff',    text: 'أنا برضو حاضر 👍',                                    timestamp: '2026-05-25T08:05:00Z' },
    { id: 'tcm7', teamId: 't1', userId: 'mem1', userName: 'أحمد',         userAvatar: 'https://ui-avatars.com/api/?name=أحمد&background=3b82f6&color=fff',    text: 'يلا كلنا على قلب واحد، نروح بطلين 🏆',               timestamp: '2026-05-26T07:30:00Z' },
  ],
};

const JOIN_REQUESTS = [];

const TOURNAMENTS = [
  { _id: 'tr1', id: 'tr1', name: 'دوري الأردن الأول',      sport: 'كرة قدم', type: 'دوري',        status: 'جارية',   teamsCount: 8, maxTeams: 8,  startDate: '2026-05-01', prizePool: '500 JD',  registeredTeams: ['t1','t2','t3','t4','t5','t6','t7','t8'], matchesGenerated: true  },
  { _id: 'tr6', id: 'tr6', name: 'كأس عمان الكبير',       sport: 'كرة قدم', type: 'كاس',         cupRounds: 8,  status: 'جارية',  teamsCount: 8, maxTeams: 8,  startDate: '2026-05-15', prizePool: '750 JD',  registeredTeams: ['t1','t2','t3','t4','t5','t6','t7','t8'], matchesGenerated: true  },
  { _id: 'tr2', id: 'tr2', name: 'كأس الشباب',             sport: 'كرة قدم', type: 'كاس',         cupRounds: 8,  status: 'قادمة',  teamsCount: 2, maxTeams: 8,  startDate: '2026-06-10', prizePool: '300 JD',  registeredTeams: ['t1','t2'],           matchesGenerated: false },
  { _id: 'tr3', id: 'tr3', name: 'بطولة رمضان الخماسية',   sport: 'كرة قدم', type: 'دوري وكاس',   status: 'منتهية',  teamsCount: 4, maxTeams: 4,  startDate: '2026-03-15', prizePool: '200 JD',  registeredTeams: ['t1','t2','t3','t4'], matchesGenerated: true,  winner: 't4', runnerUp: 't1' },
  { _id: 'tr4', id: 'tr4', name: 'كأس الاستقلال',          sport: 'كرة قدم', type: 'كاس',         cupRounds: 16, status: 'قادمة',  teamsCount: 3, maxTeams: 16, startDate: '2026-07-01', prizePool: '1000 JD', registeredTeams: ['t1','t2','t3'],      matchesGenerated: false },
  { _id: 'tr5', id: 'tr5', name: 'دوري نجوم الشمال',       sport: 'كرة قدم', type: 'دوري',        status: 'منتهية',  teamsCount: 4, maxTeams: 4,  startDate: '2026-02-01', prizePool: '400 JD',  registeredTeams: ['t1','t2','t3','t4'], matchesGenerated: true,  winner: 't4', runnerUp: 't2' },
];

const MATCHES = [
  // ── tr1: دوري الأردن الأول (جارية، دوري) ──────────────────────────────────
  { _id: 'm1', id: 'm1', leagueId: 'tr1', round: 'group', homeTeam: 'النسور', awayTeam: 'الأسود',  homeTeamId: 't1', awayTeamId: 't2', homeScore: 3,    awayScore: 1,    date: '2026-05-10', status: 'انتهت'   },
  { _id: 'm2', id: 'm2', leagueId: 'tr1', round: 'group', homeTeam: 'الصقور', awayTeam: 'البرق',   homeTeamId: 't3', awayTeamId: 't4', homeScore: 0,    awayScore: 2,    date: '2026-05-12', status: 'انتهت'   },
  { _id: 'm5', id: 'm5', leagueId: 'tr1', round: 'group', homeTeam: 'النسور', awayTeam: 'الصقور',  homeTeamId: 't1', awayTeamId: 't3', homeScore: 2,    awayScore: 0,    date: '2026-05-14', status: 'انتهت'   },
  { _id: 'm6', id: 'm6', leagueId: 'tr1', round: 'group', homeTeam: 'البرق',  awayTeam: 'الأسود',  homeTeamId: 't4', awayTeamId: 't2', homeScore: 4,    awayScore: 1,    date: '2026-05-16', status: 'انتهت'   },
  { _id: 'm3', id: 'm3', leagueId: 'tr1', round: 'group', homeTeam: 'النسور', awayTeam: 'البرق',   homeTeamId: 't1', awayTeamId: 't4', homeScore: null, awayScore: null, date: '2026-05-28', status: 'مجدولة'  },
  { _id: 'm4', id: 'm4', leagueId: 'tr1', round: 'group', homeTeam: 'الأسود', awayTeam: 'الصقور',  homeTeamId: 't2', awayTeamId: 't3', homeScore: null, awayScore: null, date: '2026-05-30', status: 'مجدولة'  },
  // ── tr3: بطولة رمضان الخماسية (منتهية، دوري وكاس) ────────────────────────
  { _id: 'm-t3-1', id: 'm-t3-1', leagueId: 'tr3', round: 'group', homeTeam: 'النسور', awayTeam: 'الأسود',  homeTeamId: 't1', awayTeamId: 't2', homeScore: 2,    awayScore: 1,    date: '2026-03-16', status: 'انتهت'  },
  { _id: 'm-t3-2', id: 'm-t3-2', leagueId: 'tr3', round: 'group', homeTeam: 'الصقور', awayTeam: 'البرق',   homeTeamId: 't3', awayTeamId: 't4', homeScore: 1,    awayScore: 3,    date: '2026-03-17', status: 'انتهت'  },
  { _id: 'm-t3-3', id: 'm-t3-3', leagueId: 'tr3', round: 'group', homeTeam: 'النسور', awayTeam: 'البرق',   homeTeamId: 't1', awayTeamId: 't4', homeScore: 2,    awayScore: 2,    date: '2026-03-19', status: 'انتهت'  },
  { _id: 'm-t3-4', id: 'm-t3-4', leagueId: 'tr3', round: 'group', homeTeam: 'الأسود', awayTeam: 'الصقور',  homeTeamId: 't2', awayTeamId: 't3', homeScore: 1,    awayScore: 0,    date: '2026-03-21', status: 'انتهت'  },
  { _id: 'm-t3-5', id: 'm-t3-5', leagueId: 'tr3', round: 'sf',    homeTeam: 'النسور', awayTeam: 'الصقور',  homeTeamId: 't1', awayTeamId: 't3', homeScore: 3,    awayScore: 1,    date: '2026-03-22', status: 'انتهت'  },
  { _id: 'm-t3-6', id: 'm-t3-6', leagueId: 'tr3', round: 'sf',    homeTeam: 'البرق',  awayTeam: 'الأسود',  homeTeamId: 't4', awayTeamId: 't2', homeScore: 2,    awayScore: 0,    date: '2026-03-22', status: 'انتهت'  },
  { _id: 'm-t3-7', id: 'm-t3-7', leagueId: 'tr3', round: 'final', homeTeam: 'النسور', awayTeam: 'البرق',   homeTeamId: 't1', awayTeamId: 't4', homeScore: 1,    awayScore: 2,    date: '2026-03-25', status: 'انتهت'  },
  // ── tr5: دوري نجوم الشمال (منتهية، دوري) ─────────────────────────────────
  { _id: 'm-t5-1', id: 'm-t5-1', leagueId: 'tr5', round: 'group', homeTeam: 'النسور', awayTeam: 'الأسود',  homeTeamId: 't1', awayTeamId: 't2', homeScore: 1,    awayScore: 1,    date: '2026-02-05', status: 'انتهت'  },
  { _id: 'm-t5-2', id: 'm-t5-2', leagueId: 'tr5', round: 'group', homeTeam: 'الصقور', awayTeam: 'البرق',   homeTeamId: 't3', awayTeamId: 't4', homeScore: 0,    awayScore: 3,    date: '2026-02-07', status: 'انتهت'  },
  { _id: 'm-t5-3', id: 'm-t5-3', leagueId: 'tr5', round: 'group', homeTeam: 'النسور', awayTeam: 'البرق',   homeTeamId: 't1', awayTeamId: 't4', homeScore: 0,    awayScore: 1,    date: '2026-02-10', status: 'انتهت'  },
  { _id: 'm-t5-4', id: 'm-t5-4', leagueId: 'tr5', round: 'group', homeTeam: 'الأسود', awayTeam: 'الصقور',  homeTeamId: 't2', awayTeamId: 't3', homeScore: 2,    awayScore: 0,    date: '2026-02-12', status: 'انتهت'  },
  { _id: 'm-t5-5', id: 'm-t5-5', leagueId: 'tr5', round: 'group', homeTeam: 'النسور', awayTeam: 'الصقور',  homeTeamId: 't1', awayTeamId: 't3', homeScore: 3,    awayScore: 1,    date: '2026-02-14', status: 'انتهت'  },
  { _id: 'm-t5-6', id: 'm-t5-6', leagueId: 'tr5', round: 'group', homeTeam: 'البرق',  awayTeam: 'الأسود',  homeTeamId: 't4', awayTeamId: 't2', homeScore: 2,    awayScore: 2,    date: '2026-02-16', status: 'انتهت'  },
  // ── tr6: كأس عمان الكبير (جارية، كاس، دور الـ8) ────────────────────────────
  // ربع النهائي — 4 مباريات (3 انتهت، 1 جارية)
  { _id: 'm-t6-qf1', id: 'm-t6-qf1', leagueId: 'tr6', round: 'qf', homeTeam: 'النسور',  awayTeam: 'الوثبة',  homeTeamId: 't1', awayTeamId: 't5', homeScore: 3,    awayScore: 1,    date: '2026-05-18', status: 'انتهت'   },
  { _id: 'm-t6-qf2', id: 'm-t6-qf2', leagueId: 'tr6', round: 'qf', homeTeam: 'الريان',  awayTeam: 'الصقور',  homeTeamId: 't6', awayTeamId: 't3', homeScore: 2,    awayScore: 0,    date: '2026-05-18', status: 'انتهت'   },
  { _id: 'm-t6-qf3', id: 'm-t6-qf3', leagueId: 'tr6', round: 'qf', homeTeam: 'البرق',   awayTeam: 'الشباب',  homeTeamId: 't4', awayTeamId: 't7', homeScore: 2,    awayScore: 0,    date: '2026-05-19', status: 'انتهت'   },
  { _id: 'm-t6-qf4', id: 'm-t6-qf4', leagueId: 'tr6', round: 'qf', homeTeam: 'الأسود',  awayTeam: 'الاتحاد', homeTeamId: 't2', awayTeamId: 't8', homeScore: null, awayScore: null, date: '2026-05-26', status: 'مجدولة'  },
  // نصف النهائي — مجدولة بعد انتهاء ربع النهائي
  { _id: 'm-t6-sf1', id: 'm-t6-sf1', leagueId: 'tr6', round: 'sf', homeTeam: 'النسور',  awayTeam: 'الريان',  homeTeamId: 't1', awayTeamId: 't6', homeScore: null, awayScore: null, date: '2026-06-06', status: 'مجدولة'  },
  { _id: 'm-t6-sf2', id: 'm-t6-sf2', leagueId: 'tr6', round: 'sf', homeTeam: 'البرق',   awayTeam: 'TBD',     homeTeamId: 't4', awayTeamId: null, homeScore: null, awayScore: null, date: '2026-06-06', status: 'مجدولة'  },
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
  const { name, email, role, firstName, lastName, username, age } = req.body;
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
    age: age ? Number(age) : undefined,
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
app.get('/api/bookings', (_, res) => {
  const now = new Date();
  // تحديث الحجوزات المؤكدة التي انتهى موعدها إلى "منتهي"
  BOOKINGS.forEach(b => {
    if (b.status === 'مؤكد') {
      const [startTime] = (b.timeSlot || '').split(' - ');
      const bookingEnd = new Date(`${b.date}T${startTime || '23:59'}:00`);
      if (bookingEnd < now) b.status = 'منتهي';
    }
  });
  ok(res, BOOKINGS);
});

app.get('/api/bookings/slots', (req, res) => {
  const all = ['08:00 - 09:00','09:00 - 10:00','10:00 - 11:00','16:00 - 17:00','17:00 - 18:00','18:00 - 19:00','19:00 - 20:00','20:00 - 21:00','21:00 - 22:00'];
  const booked = BOOKINGS.filter(b => b.fieldId === req.query.fieldId && b.date === req.query.date && b.status !== 'ملغي').map(b => b.timeSlot);
  const available = all.filter(s => !booked.includes(s));
  ok(res, { available, booked });
});

app.post('/api/bookings', (req, res) => {
  const field = FIELDS.find(f => f._id === req.body.fieldId) || FIELDS[0];
  // الحالة تأتي من الطلب (مؤكد إذا فيزا، قيد الانتظار إذا كاش)
  const status = req.body.status || (req.body.paymentMethod === 'cash' ? 'قيد الانتظار' : 'مؤكد');
  const b = {
    _id: String(Date.now()), id: String(Date.now()),
    fieldName: field.name,
    status,
    price: req.body.price || field.pricePerHour,
    userId: (currentUser || USERS[1])._id,
    createdAt: new Date().toISOString(),
    ...req.body,
    status, // يتجاوز أي status في req.body بعد الحساب
  };
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
  const newId = String(Date.now());
  const t = { _id: newId, id: newId, wins: 0, losses: 0, draws: 0, points: 0, isUserTeam: true, userId: (currentUser || USERS[1])._id, ...req.body };
  TEAMS.push(t);
  // طلبات انضمام تجريبية — تظهر فور إنشاء الفريق لتوضيح نظام الإدارة
  JOIN_REQUESTS.push(
    { id: `jr-d1-${newId}`, teamId: newId, userId: 'demo1', userName: 'كريم رضا',    userAvatar: 'https://ui-avatars.com/api/?name=كريم&background=0c4a6e&color=fff',  requestedAt: new Date().toISOString(), status: 'pending' },
    { id: `jr-d2-${newId}`, teamId: newId, userId: 'demo2', userName: 'نور الشريف',  userAvatar: 'https://ui-avatars.com/api/?name=نور&background=047857&color=fff',   requestedAt: new Date().toISOString(), status: 'pending' },
    { id: `jr-d3-${newId}`, teamId: newId, userId: 'demo3', userName: 'زاهر الأمين', userAvatar: 'https://ui-avatars.com/api/?name=زاهر&background=0f766e&color=fff',  requestedAt: new Date().toISOString(), status: 'pending' },
  );
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

// Team chat
app.get('/api/teams/:id/chat', (req, res) => {
  res.json({ success: true, data: TEAM_MESSAGES[req.params.id] || [] });
});

app.post('/api/teams/:id/chat', (req, res) => {
  const user = currentUser || USERS[1];
  const msg = {
    id: `tcm-${Date.now()}`,
    teamId: req.params.id,
    userId: user._id || user.id,
    userName: user.name,
    userAvatar: user.avatar,
    text: (req.body.text || '').trim(),
    timestamp: new Date().toISOString(),
  };
  if (!TEAM_MESSAGES[req.params.id]) TEAM_MESSAGES[req.params.id] = [];
  TEAM_MESSAGES[req.params.id].push(msg);
  res.json({ success: true, data: msg });
});

// Team join requests
app.post('/api/teams/:id/join', (req, res) => {
  const user = currentUser || USERS[1];
  const uid = user._id || user.id;
  if (JOIN_REQUESTS.find(r => r.teamId === req.params.id && r.userId === uid))
    return res.json({ success: false, error: 'طلب الانضمام موجود بالفعل' });
  const jr = {
    id: `jr-${Date.now()}`,
    teamId: req.params.id,
    userId: uid,
    userName: user.name,
    userAvatar: user.avatar,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  JOIN_REQUESTS.push(jr);
  res.json({ success: true, data: jr });
});

app.get('/api/teams/:id/join-requests', (req, res) => {
  res.json({ success: true, data: JOIN_REQUESTS.filter(r => r.teamId === req.params.id && r.status === 'pending') });
});

// قبول / رفض طلب انضمام
app.put('/api/teams/join-requests/:requestId/respond', (req, res) => {
  const jr = JOIN_REQUESTS.find(r => r.id === req.params.requestId);
  if (!jr) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
  const { status } = req.body; // 'accepted' | 'rejected'
  jr.status = status;
  if (status === 'accepted') {
    const team = TEAMS.find(t => t._id === jr.teamId || t.id === jr.teamId);
    if (team) {
      if (!team.players) team.players = [];
      if (!team.players.includes(jr.userName)) team.players.push(jr.userName);
    }
  }
  res.json({ success: true });
});

// طرد عضو من الفريق
app.delete('/api/teams/:id/members/:playerName', (req, res) => {
  const team = TEAMS.find(t => t._id === req.params.id || t.id === req.params.id);
  if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });
  const name = decodeURIComponent(req.params.playerName);
  team.players = (team.players || []).filter(p => p !== name);
  if (team.viceCaptain === name) team.viceCaptain = null;
  res.json({ success: true, team });
});

// تغيير دور عضو (مساعد قائد / لاعب)
app.put('/api/teams/:id/members/:playerName/role', (req, res) => {
  const team = TEAMS.find(t => t._id === req.params.id || t.id === req.params.id);
  if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });
  const name = decodeURIComponent(req.params.playerName);
  const { role } = req.body; // 'vice-captain' | 'player'
  if (role === 'vice-captain') {
    team.viceCaptain = name;
  } else {
    if (team.viceCaptain === name) team.viceCaptain = null;
  }
  res.json({ success: true, team });
});

// حذف الفريق بالكامل (للقائد فقط)
app.delete('/api/teams/:id', (req, res) => {
  const idx = TEAMS.findIndex(t => t._id === req.params.id || t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });
  TEAMS.splice(idx, 1);
  // احذف طلبات الانضمام المرتبطة
  const id = req.params.id;
  const before = JOIN_REQUESTS.length;
  for (let i = JOIN_REQUESTS.length - 1; i >= 0; i--) {
    if (JOIN_REQUESTS[i].teamId === id) JOIN_REQUESTS.splice(i, 1);
  }
  res.json({ success: true });
});

// مغادرة الفريق (للأعضاء الذين ليسوا القائد)
app.post('/api/teams/:id/leave', (req, res) => {
  const team = TEAMS.find(t => t._id === req.params.id || t.id === req.params.id);
  if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });
  const { playerName } = req.body;
  if (!playerName) return res.status(400).json({ success: false, error: 'اسم اللاعب مطلوب' });
  team.players = (team.players || []).filter(p => p !== playerName);
  if (team.viceCaptain === playerName) team.viceCaptain = null;
  res.json({ success: true });
});

// سجل الفريق (مباريات + بطولات + إنجازات)
app.get('/api/teams/:id/history', (req, res) => {
  const teamId = req.params.id;
  const team = TEAMS.find(t => t._id === teamId || t.id === teamId);
  if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });
  const teamName = team.name;

  // مباريات الفريق
  const matches = MATCHES
    .filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId ||
                 m.homeTeam === teamName || m.awayTeam === teamName)
    .map(m => {
      const isHome = m.homeTeamId === teamId || (m.homeTeam === teamName && m.homeTeamId !== teamId ? false : m.homeTeam === teamName);
      const myScore    = isHome ? m.homeScore    : m.awayScore;
      const theirScore = isHome ? m.awayScore    : m.homeScore;
      const opponent   = isHome ? m.awayTeam     : m.homeTeam;
      const result = m.status === 'انتهت'
        ? (myScore > theirScore ? 'win' : myScore < theirScore ? 'loss' : 'draw')
        : m.status === 'مباشر' ? 'live' : 'upcoming';
      const league = TOURNAMENTS.find(t => t._id === m.leagueId || t.id === m.leagueId);
      return { id: m.id, date: m.date, opponent, myScore, theirScore, result, status: m.status, round: m.round, leagueName: league ? league.name : '', leagueId: m.leagueId };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // بطولات الفريق
  const tournaments = TOURNAMENTS
    .filter(t => t.registeredTeams && (t.registeredTeams.includes(teamId) || t.registeredTeams.includes(teamName)))
    .map(t => ({
      id: t.id, name: t.name, type: t.type, status: t.status,
      startDate: t.startDate, prizePool: t.prizePool,
      isChampion:  t.winner   === teamId,
      isRunnerUp:  t.runnerUp === teamId,
    }));

  const champWins = tournaments.filter(t => t.isChampion).length;
  ok(res, { matches, tournaments, champWins });
});

// ─── Tournaments ──────────────────────────────────────────────────────────────
app.get('/api/tournaments', (_, res) => ok(res, TOURNAMENTS));

app.post('/api/tournaments', (req, res) => {
  const t = { _id: String(Date.now()), id: String(Date.now()), registeredTeams: [], teamsCount: 0, matchesGenerated: false, ...req.body };
  TOURNAMENTS.push(t);
  ok(res, t);
});

app.get('/api/tournaments/:id', (req, res) => {
  const t = TOURNAMENTS.find(x => x._id === req.params.id || x.id === req.params.id);
  t ? ok(res, t) : res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
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

// ─── Player Profile by name ───────────────────────────────────────────────────
app.get('/api/players/profile', (req, res) => {
  const name = (req.query.name || '').trim();
  const firstName = name.split(' ')[0];

  // أولاً: ابحث عن يوزر حقيقي مسجّل
  const realUser = USERS.find(u =>
    u.name === name ||
    u.name === firstName ||
    (u.firstName && u.firstName === firstName)
  );

  let profile = null;
  if (realUser) {
    // ارجع فقط البيانات اللي حطها اليوزر لما سجّل
    profile = {
      name: realUser.name,
      age: realUser.age || null,
      phone: realUser.phone || null,
      bg: null,
      nationality: null,
    };
  } else {
    // fallback للاعبين الوهميين في الفرق التجريبية (بدون مركز)
    const mock = PLAYER_PROFILES[firstName];
    if (mock) {
      profile = {
        name: mock.name,
        age: mock.age || null,
        phone: null,
        bg: mock.bg || null,
        nationality: mock.nationality || null,
      };
    }
  }

  // ابحث عن الفريق الذي يلعب فيه (ابحث بالاسم الكامل وبالاسم الأول)
  const team = TEAMS.find(t =>
    Array.isArray(t.players) &&
    (t.players.includes(name) || t.players.includes(firstName))
  );

  ok(res, { profile, team: team || null });
});

// ─── Friendly Challenges ──────────────────────────────────────────────────────
const CHALLENGES = [
  {
    id: 'ch1',
    fromTeamId: 't4', fromTeamName: 'البرق', fromTeamLogo: '⚡',
    toTeamId:   't1', toTeamName:   'النسور', toTeamLogo: '🦅',
    proposedDate: '2026-06-03', proposedTime: '18:00',
    proposedFieldId: '101', proposedFieldName: 'ملعب الأمير محمد',
    message: 'يا نسور، جاهزين للتحدي؟ مباراة ودية نارية! ⚡🔥',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ch2',
    fromTeamId: 't1', fromTeamName: 'النسور', fromTeamLogo: '🦅',
    toTeamId:   't2', toTeamName:   'الأسود', toTeamLogo: '🦁',
    proposedDate: '2026-06-05', proposedTime: '20:00',
    proposedFieldId: '102', proposedFieldName: 'ملعب النصر',
    message: 'يا أسود، وديّة بيننا؟',
    status: 'accepted',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ch3',
    fromTeamId: 't3', fromTeamName: 'الصقور', fromTeamLogo: '🦆',
    toTeamId:   't1', toTeamName:   'النسور', toTeamLogo: '🦅',
    proposedDate: '2026-06-08', proposedTime: '19:00',
    proposedFieldId: '103', proposedFieldName: 'ملعب الرياضة للجميع',
    message: 'نتحداكم يا نسور 🦆⚽',
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const CHALLENGE_CHATS = {
  'ch1': [
    { id: 'cc1', challengeId: 'ch1', teamId: 't4', teamName: 'البرق', senderName: 'مروان (قائد البرق)', text: 'هيا يا نسور، جاوبوا! 🔥', timestamp: new Date(Date.now() - 3000000).toISOString() },
  ],
  'ch2': [
    { id: 'cc2', challengeId: 'ch2', teamId: 't1', teamName: 'النسور', senderName: 'محمد اللاعب (قائد النسور)', text: 'تمام، نلتقي في ملعب النصر 🤝', timestamp: new Date(Date.now() - 80000000).toISOString() },
    { id: 'cc3', challengeId: 'ch2', teamId: 't2', teamName: 'الأسود', senderName: 'فارس (قائد الأسود)', text: 'موافقون، سنكون هناك 🦁', timestamp: new Date(Date.now() - 79000000).toISOString() },
  ],
};

// GET challenges for team (incoming + sent)
app.get('/api/teams/:id/challenges', (req, res) => {
  const tid = req.params.id;
  const incoming = CHALLENGES.filter(c => c.toTeamId === tid);
  const sent     = CHALLENGES.filter(c => c.fromTeamId === tid);
  ok(res, { incoming, sent });
});

// POST send a challenge
app.post('/api/teams/:id/challenge', (req, res) => {
  const fromTeam = TEAMS.find(t => t._id === req.body.fromTeamId) || TEAMS.find(t => t.userId === (currentUser || USERS[1])._id) || TEAMS[0];
  const toTeam   = TEAMS.find(t => t._id === req.params.id);
  if (!toTeam) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });
  const ch = {
    id: `ch-${Date.now()}`,
    fromTeamId: fromTeam._id, fromTeamName: fromTeam.name, fromTeamLogo: fromTeam.logo || '⚽',
    toTeamId:   toTeam._id,   toTeamName:   toTeam.name,   toTeamLogo:   toTeam.logo || '⚽',
    proposedDate: req.body.proposedDate || '',
    proposedTime: req.body.proposedTime || '',
    proposedFieldId:   req.body.proposedFieldId   || '',
    proposedFieldName: req.body.proposedFieldName || '',
    message: req.body.message || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  CHALLENGES.push(ch);
  ok(res, ch);
});

// PUT respond to challenge (accept / reject)
app.put('/api/teams/challenges/:id/respond', (req, res) => {
  const ch = CHALLENGES.find(c => c.id === req.params.id);
  if (!ch) return res.status(404).json({ success: false, error: 'التحدي غير موجود' });
  ch.status = req.body.status;
  ok(res, ch);
});

// GET challenge chat
app.get('/api/teams/challenges/:id/chat', (req, res) => {
  ok(res, CHALLENGE_CHATS[req.params.id] || []);
});

// POST send message in challenge chat
app.post('/api/teams/challenges/:id/chat', (req, res) => {
  const user     = currentUser || USERS[1];
  const ch       = CHALLENGES.find(c => c.id === req.params.id);
  const userTeam = TEAMS.find(t => t.userId === user._id) || TEAMS[0];
  const msg = {
    id: `cc-${Date.now()}`,
    challengeId: req.params.id,
    teamId: userTeam._id,
    teamName: userTeam.name,
    senderName: `${user.name} (قائد ${userTeam.name})`,
    text: req.body.text || '',
    timestamp: new Date().toISOString(),
  };
  if (!CHALLENGE_CHATS[req.params.id]) CHALLENGE_CHATS[req.params.id] = [];
  CHALLENGE_CHATS[req.params.id].push(msg);
  ok(res, msg);
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
