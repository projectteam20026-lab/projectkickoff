require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Field = require('../models/Field');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Notification = require('../models/Notification');

const FIELD_IMAGE = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070&auto=format&fit=crop';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany(), Field.deleteMany(), Team.deleteMany(),
    Tournament.deleteMany(), Match.deleteMany(), Notification.deleteMany(),
  ]);
  console.log('Cleared existing data');

  // ── Users ──
  const salt = await bcrypt.genSalt(10);
  const hashedPw = await bcrypt.hash('123456', salt);

  const [player, owner, admin] = await User.create([
    {
      name: 'أحمد الرشيد',
      email: 'player@kickoff.jo',
      password: hashedPw,
      phone: '0791234567',
      role: 'لاعب',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'سالم الكويتي',
      email: 'owner@kickoff.jo',
      password: hashedPw,
      phone: '0798887766',
      role: 'مالك ملعب',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'مدير النظام',
      email: 'admin@kickoff.jo',
      password: hashedPw,
      phone: '0790001122',
      role: 'مسؤول',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    },
  ]);
  console.log('✅ Users seeded');

  // ── Fields ──
  const fields = await Field.create([
    { name: 'ملاعب تراكس (Trax Jo)', location: 'عمان، طريق المطار', pricePerHour: 35, rating: 4.9, type: '6v6', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['مواقف سيارات', 'كافتيريا', 'إضاءة احترافية', 'دوشات'], description: 'واحدة من أرقى المجمعات الرياضية في عمان.', ownerId: owner._id },
    { name: 'ملاعب سوكر سيتي (Soccer City)', location: 'عمان، خلدا', pricePerHour: 25, rating: 4.7, type: '5v5', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['إضاءة ليلية', 'مياه مجانية', 'منطقة انتظار'], description: 'موقع استراتيجي في خلدا.', ownerId: owner._id },
    { name: 'ملاعب ذا ون (The One)', location: 'عمان، شارع مكة', pricePerHour: 30, rating: 4.8, type: '7v7', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['مواقف واسعة', 'غرف غيار', 'متجر رياضي'], description: 'ملعب سباعي واسع بنجيل من الجيل السادس.', ownerId: owner._id },
    { name: 'ملاعب أكاديمية الفرسان', location: 'عمان، طريق المطار', pricePerHour: 28, rating: 4.6, type: '6v6', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['مدربين محترفين', 'كافتيريا', 'حمامات حديثة'], description: 'بيئة احترافية مناسبة للأكاديميات.', ownerId: owner._id },
    { name: 'ملاعب الجول (Goal Fields)', location: 'إربد، شارع الثلاثين', pricePerHour: 20, rating: 4.5, type: '5v5', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['مواقف سيارات', 'كشك مبيعات'], description: 'أفضل ملاعب في إربد بأسعار مناسبة.', ownerId: owner._id },
    { name: 'ملعب النجوم المضيء', location: 'الزرقاء، شارع الأمير الحسن', pricePerHour: 18, rating: 4.3, type: '5v5', turfType: 'عشب طبيعي', images: [FIELD_IMAGE], amenities: ['إضاءة ليلية', 'مواقف سيارات'], description: 'ملعب بعشب طبيعي نادر في الزرقاء.', ownerId: owner._id },
    // ── Real Jordan Fields ──
    { name: '6 Yard Sports & Entertainment', location: 'عمان، شارع المدينة المنورة', pricePerHour: 30, rating: 4.7, type: '5v5', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['ملاعب داخلية وخارجية', 'معتمد FIFA', 'مواقف سيارات'], description: 'FIFA-approved indoor and outdoor football fields.', ownerId: owner._id },
    { name: '6 Yard Sports & Entertainment', location: 'عمان، شارع المدينة المنورة', pricePerHour: 35, rating: 4.7, type: '7v7', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['ملاعب داخلية وخارجية', 'معتمد FIFA', 'مواقف سيارات'], description: 'FIFA-approved indoor and outdoor football fields.', ownerId: owner._id },
    { name: 'KHBP Football Field', location: 'عمان، شارع الملك عبدالله الثاني', pricePerHour: 22, rating: 3.9, type: '7v7', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['مواقف سيارات', 'إضاءة ليلية'], description: 'Seven-a-side football field.', ownerId: owner._id },
    { name: 'Al Nashama Soccer Fields', location: 'عمان', pricePerHour: 25, rating: 4.5, type: '5v5', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['ملاعب متعددة', 'معتمد FIFA'], description: 'FIFA-standard mini football fields.', ownerId: owner._id },
    { name: '442 Football Park - City Mall', location: 'عمان، سيتي مول', pricePerHour: 20, rating: 3.7, type: '4v4', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['ملاعب داخلية', 'أقفاص تدريب'], description: 'Indoor football experience and training cages.', ownerId: owner._id },
    { name: '442 Football Park - Abdali', location: 'عمان، عبدالي مول', pricePerHour: 20, rating: 4.5, type: '4v4', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['تقنية متطورة', 'ملاعب داخلية حديثة'], description: 'Technology-enhanced football training and matches.', ownerId: owner._id },
    { name: 'Jordan Galaxy Stadium', location: 'عمان', pricePerHour: 25, rating: 4.3, type: '5v5', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['إضاءة احترافية', 'مواقف سيارات'], description: 'Mini football field in the heart of Amman.', ownerId: owner._id },
    { name: 'Aqaba Stadium Mini Fields', location: 'العقبة', pricePerHour: 18, rating: 4.2, type: '5v5', turfType: 'عشب صناعي', images: [FIELD_IMAGE], amenities: ['ملاعب متعددة', 'إضاءة ليلية'], description: 'Mini football fields available for booking in Aqaba.', ownerId: owner._id },
  ]);
  console.log('✅ Fields seeded');

  // ── Teams ──
  const teams = await Team.create([
    { name: 'نجوم عمان', userId: player._id, wins: 5, losses: 1, draws: 2, points: 17, logo: 'https://ui-avatars.com/api/?name=نجوم+عمان&background=10b981&color=fff&bold=true', players: ['أحمد الرشيد', 'خالد محمود', 'يوسف علي'], isUserTeam: true },
    { name: 'أسود الأردن', userId: player._id, wins: 4, losses: 2, draws: 1, points: 13, logo: 'https://ui-avatars.com/api/?name=أسود+الأردن&background=3b82f6&color=fff&bold=true', players: ['محمد سعيد', 'عمر طارق'], isUserTeam: false },
    { name: 'فرسان الشمال', userId: owner._id, wins: 3, losses: 3, draws: 3, points: 12, logo: 'https://ui-avatars.com/api/?name=فرسان+الشمال&background=f59e0b&color=fff&bold=true', players: ['سالم ناصر', 'راشد حسن'], isUserTeam: false },
    { name: 'صقور الجنوب', userId: owner._id, wins: 2, losses: 4, draws: 2, points: 8, logo: 'https://ui-avatars.com/api/?name=صقور+الجنوب&background=ef4444&color=fff&bold=true', players: ['طارق وليد'], isUserTeam: false },
  ]);
  console.log('✅ Teams seeded');

  // ── Tournaments ──
  const tournament = await Tournament.create({
    name: 'دوري الأردن الرمضاني 2025',
    sport: 'كرة القدم',
    status: 'جارية',
    maxTeams: 8,
    startDate: '2025-03-01',
    prizePool: '500 JD',
    registeredTeams: teams.map((t) => t._id),
    matchesGenerated: false,
    createdBy: admin._id,
  });

  const tournament2 = await Tournament.create({
    name: 'كأس عمان الصيفي 2025',
    sport: 'كرة القدم',
    status: 'التسجيل متاح',
    maxTeams: 8,
    startDate: '2025-06-15',
    prizePool: '300 JD',
    registeredTeams: [teams[0]._id, teams[1]._id],
    matchesGenerated: false,
    createdBy: admin._id,
  });
  console.log('✅ Tournaments seeded');

  // ── Matches ──
  await Match.create([
    { leagueId: tournament._id, homeTeamId: teams[0]._id, awayTeamId: teams[1]._id, homeTeam: teams[0].name, awayTeam: teams[1].name, homeScore: 3, awayScore: 1, date: '2025-03-05', status: 'انتهت' },
    { leagueId: tournament._id, homeTeamId: teams[2]._id, awayTeamId: teams[3]._id, homeTeam: teams[2].name, awayTeam: teams[3].name, homeScore: 2, awayScore: 2, date: '2025-03-08', status: 'انتهت' },
    { leagueId: tournament._id, homeTeamId: teams[0]._id, awayTeamId: teams[2]._id, homeTeam: teams[0].name, awayTeam: teams[2].name, homeScore: null, awayScore: null, date: '2025-03-12', status: 'مجدولة' },
    { leagueId: tournament._id, homeTeamId: teams[1]._id, awayTeamId: teams[3]._id, homeTeam: teams[1].name, awayTeam: teams[3].name, homeScore: null, awayScore: null, date: '2025-03-15', status: 'مجدولة' },
  ]);
  console.log('✅ Matches seeded');

  // ── Notifications ──
  await Notification.create([
    { userId: player._id, title: 'مرحباً بك في KickOff!', message: 'تم تفعيل حسابك بنجاح. استمتع بالحجز والمشاركة في البطولات.', type: 'system', read: false, date: new Date().toLocaleDateString('ar-JO') },
    { userId: player._id, title: 'بطولة جديدة متاحة', message: 'تم إطلاق بطولة "كأس عمان الصيفي 2025". سجّل فريقك الآن!', type: 'league', read: false, date: new Date().toLocaleDateString('ar-JO') },
    { userId: null, title: 'تحديث المنصة', message: 'تم إضافة ميزات جديدة للحجز والبطولات. تفضل بالاستكشاف!', type: 'system', read: false, date: new Date().toLocaleDateString('ar-JO') },
  ]);
  console.log('✅ Notifications seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  Player  → player@kickoff.jo  / 123456');
  console.log('  Owner   → owner@kickoff.jo   / 123456');
  console.log('  Admin   → admin@kickoff.jo   / 123456');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
