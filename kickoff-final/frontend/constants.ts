
import { Field, League, Team, User, UserRole, Match, Notification } from './types';

const UNIFIED_FIELD_IMAGE = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070&auto=format&fit=crop';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'أحمد الرشيد',
  email: 'ahmad@example.com',
  phone: '0791234567',
  role: UserRole.PLAYER,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'أحمد الرشيد',
    email: 'player@kickoff.jo',
    phone: '0791234567',
    role: UserRole.PLAYER,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'u2',
    name: 'سالم الكويتي',
    email: 'owner@kickoff.jo',
    phone: '0798887766',
    role: UserRole.OWNER,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'u3',
    name: 'مدير النظام',
    email: 'admin@kickoff.jo',
    phone: '0790001122',
    role: UserRole.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
  }
];

export const MOCK_FIELDS: Field[] = [
  {
    id: 'f1',
    name: 'ملاعب تراكس (Trax Jo)',
    location: 'عمان، طريق المطار',
    pricePerHour: 35,
    rating: 4.9,
    type: '6v6',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مواقف سيارات', 'كافتيريا', 'إضاءة احترافية', 'دوشات'],
    description: 'واحدة من أرقى المجمعات الرياضية في عمان، تتميز بأرضيات عالية الجودة ومرافق متكاملة.'
  },
  {
    id: 'f2',
    name: 'ملاعب سوكر سيتي (Soccer City)',
    location: 'عمان، خلدا',
    pricePerHour: 25,
    rating: 4.7,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['إضاءة ليلية', 'مياه مجانية', 'منطقة انتظار'],
    description: 'موقع استراتيجي في خلدا، يوفر ملاعب خماسية مثالية للمباريات السريعة.'
  },
  {
    id: 'f3',
    name: 'ملاعب ذا ون (The One)',
    location: 'عمان، شارع مكة',
    pricePerHour: 30,
    rating: 4.8,
    type: '7v7',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مواقف واسعة', 'غرف غيار', 'متجر رياضي'],
    description: 'ملعب سباعي واسع يتميز بنجيل صناعي من الجيل السادس، مريح جداً للركض.'
  },
  {
    id: 'f4',
    name: 'ملاعب أكاديمية الفرسان',
    location: 'عمان، طريق المطار',
    pricePerHour: 28,
    rating: 4.6,
    type: '6v6',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مدربين محترفين', 'كافتيريا', 'حمامات حديثة'],
    description: 'بيئة احترافية مناسبة للأكاديميات والمباريات الودية.'
  },
  {
    id: 'f5',
    name: 'ملاعب الجول (Goal Fields)',
    location: 'إربد، شارع الثلاثين',
    pricePerHour: 20,
    rating: 4.5,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مواقف سيارات', 'كشك مبيعات'],
    description: 'أفضل وجهة للاعبي الشمال في إربد، الملاعب دائماً بحالة ممتازة.'
  },
  {
    id: 'f6',
    name: 'ملعب الساحة (Al-Saha)',
    location: 'الزرقاء، الوسط التجاري',
    pricePerHour: 15,
    rating: 4.2,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مياه باردة', 'إضاءة ليلية'],
    description: 'ملعب خماسي شعبي بأسعار مناسبة جداً في قلب الزرقاء.'
  },
  {
    id: 'f7',
    name: 'ملاعب تطوير العقبة',
    location: 'العقبة، المنطقة التاسعة',
    pricePerHour: 22,
    rating: 4.7,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['دوشات', 'منطقة تبريد'],
    description: 'ملاعب حديثة تخدم أهالي العقبة وزوارها، مصممة لتحمل درجات الحرارة.'
  },
  {
    id: 'f8',
    name: 'ملعب تيك-تاكا (Tiki-Taka)',
    location: 'السلط، طلوع الخندق',
    pricePerHour: 18,
    rating: 4.4,
    type: '6v6',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['إطلالة رائعة', 'مواقف'],
    description: 'ملعب يتميز بإطلالة خلابة على جبال السلط، مثالي للعب في الأجواء اللطيفة.'
  },
  {
    id: 'f9',
    name: 'ملاعب سكاي فيلد (Sky Field)',
    location: 'عمان، عبدون',
    pricePerHour: 40,
    rating: 4.9,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['خدمة فالي', 'كافتيريا VIP', 'إضاءة LED'],
    description: 'تجربة حجز فاخرة في قلب عبدون مع مرافق ممتازة.'
  },
  {
    id: 'f10',
    name: 'ملاعب مدارس الاتحاد',
    location: 'عمان، شفا بدران',
    pricePerHour: 25,
    rating: 4.5,
    type: '7v7',
    turfType: 'عشب طبيعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['عشب طبيعي', 'مدرجات صغيرة'],
    description: 'ملعب سباعي مميز بعشب طبيعي مخدم بشكل دوري.'
  },
  {
    id: 'f11',
    name: 'ملاعب مدينة الحسن الرياضية',
    location: 'إربد، وسط المدينة',
    pricePerHour: 20,
    rating: 4.8,
    type: '6v6',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مرافق حكومية', 'أمان عالي', 'مساحات واسعة'],
    description: 'ملاعب المدينة الرياضية في إربد، جودة عالية ومعايير دولية.'
  },
  {
    id: 'f12',
    name: 'ملعب أرينا مادبا',
    location: 'مادبا، طريق الكرك',
    pricePerHour: 15,
    rating: 4.3,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مواقف', 'منطقة استراحة'],
    description: 'ملعب خماسي هادئ ومناسب للمجموعات الصغيرة في مادبا.'
  },
  {
    id: 'f13',
    name: 'ملعب شباب جرش',
    location: 'جرش، بالقرب من الآثار',
    pricePerHour: 18,
    rating: 4.4,
    type: '6v6',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['إضاءة قوية', 'قريب من الخدمات'],
    description: 'استمتع باللعب في أجواء تاريخية بالقرب من مدينة جرش الأثرية.'
  },
  {
    id: 'f14',
    name: 'ملاعب جامعة مؤتة',
    location: 'الكرك، المزار الجنوبي',
    pricePerHour: 12,
    rating: 4.1,
    type: '7v7',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مساحات كبيرة', 'غرف غيار'],
    description: 'ملعب سباعي يخدم طلبة الجامعة والمجتمع المحلي في الكرك.'
  },
  {
    id: 'f15',
    name: 'ملعب عجلون الرياضي',
    location: 'عجلون، بالقرب من القلعة',
    pricePerHour: 15,
    rating: 4.5,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['هواء نقي', 'إضاءة ليلية'],
    description: 'العب وسط الطبيعة الخلابة في جبال عجلون.'
  },
  {
    id: 'f16',
    name: 'ملعب واحة معان',
    location: 'معان، طريق الجامعة',
    pricePerHour: 10,
    rating: 4.0,
    type: '6v6',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مياه مجانية', 'مواقف'],
    description: 'ملعب سداسي بأسعار تشجيعية لأهالي مدينة معان.'
  },
  {
    id: 'f17',
    name: 'ملعب الطفيلة الحديث',
    location: 'الطفيلة، العيص',
    pricePerHour: 12,
    rating: 4.2,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['أدوات رياضية', 'منطقة انتظار'],
    description: 'ملعب خماسي جديد مجهز بأحدث أنواع النجيل الصناعي.'
  },
  {
    id: 'f18',
    name: 'ملاعب المفرق الرياضية',
    location: 'المفرق، حي الحسين',
    pricePerHour: 15,
    rating: 4.3,
    type: '6v6',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['مواقف', 'مياه'],
    description: 'ملاعب سداسية متميزة تخدم محافظة المفرق.'
  },
  {
    id: 'f19',
    name: 'ملاعب مرج الحمام الرياضية',
    location: 'عمان، مرج الحمام',
    pricePerHour: 25,
    rating: 4.6,
    type: '7v7',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['كافتيريا', 'منطقة ألعاب أطفال'],
    description: 'ملعب سباعي عائلي بامتياز في منطقة مرج الحمام.'
  },
  {
    id: 'f20',
    name: 'ملاعب أبو نصير الدولية',
    location: 'عمان، أبو نصير',
    pricePerHour: 22,
    rating: 4.4,
    type: '5v5',
    turfType: 'عشب صناعي',
    images: [UNIFIED_FIELD_IMAGE],
    amenities: ['موقع سهل الوصول', 'إضاءة ممتازة'],
    description: 'ملعب خماسي في قلب منطقة أبو نصير، مثالي للمباريات المسائية.'
  }
];

export const MOCK_LEAGUES: League[] = [
  {
    id: 'l1',
    name: 'كأس صيف عمان',
    sport: 'كرة قدم',
    status: 'جارية',
    teamsCount: 12,
    maxTeams: 16,
    startDate: '2024-06-01',
    prizePool: '1000 دينار',
    registeredTeams: ['t1', 't2', 't3', 't4'],
    matchesGenerated: true
  },
  {
    id: 'l2',
    name: 'دوري الشركات الخماسي',
    sport: 'كرة قدم',
    status: 'التسجيل متاح',
    teamsCount: 8,
    maxTeams: 12,
    startDate: '2024-07-15',
    prizePool: '500 دينار',
    registeredTeams: [],
    matchesGenerated: false
  },
  {
    id: 'l3',
    name: 'بطولة ليالي رمضان',
    sport: 'كرة قدم',
    status: 'مكتملة',
    teamsCount: 16,
    maxTeams: 16,
    startDate: '2024-03-10',
    prizePool: '2000 دينار',
    registeredTeams: [],
    matchesGenerated: true
  }
];

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'الفيصلي', wins: 5, losses: 1, draws: 2, points: 17, logo: 'https://upload.wikimedia.org/wikipedia/en/2/27/Al-Faisaly_SC_logo.png' },
  { id: 't2', name: 'الوحدات', wins: 4, losses: 2, draws: 2, points: 14, logo: 'https://upload.wikimedia.org/wikipedia/en/8/84/Al-Wehdat_SC_logo.png' },
  { id: 't3', name: 'الرمثا', wins: 3, losses: 3, draws: 2, points: 11, logo: 'https://upload.wikimedia.org/wikipedia/en/9/90/Al-Ramtha_SC_logo.png' },
  { id: 't4', name: 'الحسين إربد', wins: 2, losses: 5, draws: 1, points: 7, logo: 'https://upload.wikimedia.org/wikipedia/en/e/e6/Al-Hussein_SC_%28Irbid%29_logo.png' },
];

export const MOCK_MATCHES: Match[] = [
  { id: 'm1', leagueId: 'l1', homeTeam: 'الفيصلي', awayTeam: 'الوحدات', homeScore: 2, awayScore: 1, date: '2024-06-10 18:00', status: 'انتهت' },
  { id: 'm2', leagueId: 'l1', homeTeam: 'الرمثا', awayTeam: 'الحسين إربد', homeScore: null, awayScore: null, date: '2024-06-12 19:30', status: 'مجدولة' },
  { id: 'm3', leagueId: 'l1', homeTeam: 'الفيصلي', awayTeam: 'الرمثا', homeScore: null, awayScore: null, date: '2024-06-15 20:00', status: 'مجدولة' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'تم تأكيد الحجز', message: 'تم تأكيد حجزك في ملاعب تراكس.', date: 'منذ دقيقتين', read: false, type: 'booking' },
  { id: 'n2', title: 'تحديث الدوري', message: 'تم إصدار جدول مباريات الأسبوع الخامس.', date: 'منذ ساعة', read: false, type: 'league' },
  { id: 'n3', title: 'هدية ترحيبية', message: 'أهلاً بك في منصة كيك أوف!', date: 'منذ يومين', read: true, type: 'system' }
];
