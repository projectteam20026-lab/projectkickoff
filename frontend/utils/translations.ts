import { UserRole } from '../types';

export const translations = {
  ar: {
    common: {
      kickoff: "كيك أوف",
      welcome: "مرحباً",
      search: "بحث",
      loading: "جاري التحميل...",
      back: "عودة",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      confirm: "تأكيد",
      viewAll: "عرض الكل",
      noData: "لا توجد بيانات",
      currency: "د.أ",
      perHour: "دينار/س",
    },
    nav: {
      home: "الرئيسية",
      explore: "الملاعب",
      leagues: "البطولات",
      admin: "الإدارة",
      dashboard: "لوحة التحكم",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      notifications: "الإشعارات",
      new: "جديد",
      profile: "حسابي",
    },
    auth: {
      welcomeBack: "مرحباً بعودتك",
      subtitle: "سجل الدخول لإدارة حجوزاتك ومبارياتك",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      rememberMe: "تذكرني",
      login: "تسجيل الدخول",
      loginLoading: "جاري الاتصال...",
      noAccount: "ليس لديك حساب؟",
      createAccount: "أنشئ حساباً مجاناً",
      heroTitle: "المجد ينتظرك",
      heroSubtitle: "أفضل منصة لحجز الملاعب وتنظيم الدوريات في الأردن.",
    },
    home: {
      badge: "المنصة الرياضية الأولى في الأردن",
      titleStart: "احجز ملعبك.",
      titleEnd: "سيطر على اللعبة.",
      subtitle: "انطلق في رحلة رياضية متكاملة. حجز فوري للملاعب، تنظيم احترافي للبطولات، وتواصل مع مجتمع رياضي شغوف.",
      bookNow: "احجز ملعب الآن",
      joinLeague: "انضم لبطولة",
      whyKickoff: "لماذا كيك أوف؟",
      whySubtitle: "صممنا المنصة لرفع مستوى التجربة الرياضية للاعبين وأصحاب الملاعب على حد سواء.",
      features: {
        booking: { title: "حجز فوري وذكي", desc: "وداعاً للمكالمات. شاهد التوفر الحقيقي واحجز في ثوانٍ مع تأكيد فوري عبر الرسائل." },
        leagues: { title: "إدارة بطولات احترافية", desc: "نظام آلي للجداول، النتائج، والترتيب. عش أجواء البطولات العالمية محلياً." },
        ai: { title: "مساعد ذكي AI", desc: "احصل على نصائح تنظيمية واقتراحات للملاعب باستخدام أحدث تقنيات الذكاء الاصطناعي." }
      },
      featuredFields: "ملاعب مميزة",
      featuredSubtitle: "أفضل الوجهات الرياضية الأعلى تقييماً.",
      viewAllFields: "عرض جميع الملاعب"
    },
    explore: {
      title: "استكشف الملاعب",
      searchPlaceholder: "ابحث باسم الملعب أو المنطقة...",
      filter: "تصفية",
      reset: "إعادة تعيين",
      location: "الموقع",
      all: "الكل",
      type: "نوع الملعب",
      price: "السعر / ساعة",
      turf: "الأرضية",
      turfTypes: {
        artificial: "عشب صناعي",
        natural: "عشب طبيعي",
        hybrid: "هجين"
      },
      resultsFound: "تم العثور على {count} نتيجة",
      noResults: "لم نعثر على ملاعب",
      noResultsDesc: "حاول تغيير خيارات البحث أو إزالة بعض الفلاتر.",
      bookBtn: "احجز الملعب"
    },
    dashboard: {
      welcome: "مرحباً، {name} 👋",
      subtitle: "إليك ملخص لنشاطاتك الرياضية اليوم.",
      addField: "إضافة ملعب",
      tabs: {
        overview: "نظرة عامة",
        bookings: "الحجوزات",
        teams: "فرقي"
      },
      stats: {
        revenue: "إجمالي الإيرادات",
        activeBookings: "الحجوزات النشطة",
        occupancy: "نسبة الإشغال",
        rating: "التقييم العام",
        users: "إجمالي المستخدمين",
        totalBookings: "إجمالي الحجوزات",
        monthlyRevenue: "الإيرادات (الشهر)"
      },
      recentActivity: "النشاط القادم",
      noBookings: "لا توجد حجوزات قادمة.",
      quickSummary: "ملخص سريع",
      bookingsCount: "حجوزات",
      teamsCount: "فرق",
      manageTeams: "إدارة الفرق",
      manageTeamsTitle: "إدارة الفرق",
      manageTeamsSubtitle: "قم ببناء فريقك للمنافسة في البطولات القادمة.",
      newTeam: "فريق جديد",
      noTeams: "لا توجد فرق مضافة",
      noTeamsDesc: "كون فريقك الخاص، أضف اللاعبين، وابدأ رحلة المنافسة في بطولات كيك أوف.",
      startNow: "ابدأ الآن",
      players: "لاعبين",
      manageSquad: "إدارة التشكيلة",
      win: "فوز",
      draw: "تعادل",
      loss: "خسارة",
      bookingHistory: "سجل الحجوزات الكامل",
      table: {
        field: "الملعب",
        date: "التاريخ",
        time: "الوقت",
        price: "القيمة",
        status: "الحالة",
        action: "إجراء"
      }
    },
    leagues: {
      title: "البطولات والدوريات",
      subtitle: "المجد ينتظر الأبطال. اختر بطولتك وابدأ المنافسة.",
      registerTeam: "تسجيل فريق",
      backToList: "العودة للقائمة",
      started: "بدأت {date}",
      share: "مشاركة",
      follow: "متابعة",
      tabs: {
        standings: "الترتيب",
        fixtures: "المباريات",
        stats: "الإحصائيات"
      },
      table: {
        rank: "المركز",
        team: "الفريق",
        played: "لعب",
        won: "فوز",
        drawn: "تعادل",
        lost: "خسارة",
        points: "نقاط",
        form: "آخر 5"
      },
      progress: "تقدم البطولة",
      prizes: "الجوائز",
      teams: "الفرق",
      start: "البداية",
      live: "مباشر"
    },
    admin: {
      overview: "نظرة عامة",
      users: "المستخدمين",
      fields: "الملاعب",
      reports: "البلاغات",
      settings: "الإعدادات",
      userTable: {
        user: "المستخدم",
        role: "الدور",
        status: "الحالة",
        action: "إجراء"
      },
      active: "نشط",
      ban: "حظر"
    },
    settings: {
      title: "الإعدادات",
      subtitle: "إدارة ملفك الشخصي وتفضيلات الحساب.",
      tabs: {
        general: "عام",
        notifications: "الإشعارات",
        security: "الأمان",
        facility: "المنشأة",
        logs: "سجلات النظام"
      },
      form: {
        fullName: "الاسم الكامل",
        phone: "رقم الهاتف",
        email: "البريد الإلكتروني",
        language: "اللغة",
        save: "حفظ التغييرات"
      },
      notif: {
        title: "تفضيلات الإشعارات",
        email: "إشعارات البريد الإلكتروني",
        emailDesc: "استلام تأكيد الحجوزات والفواتير",
        push: "إشعارات التطبيق",
        pushDesc: "تحديثات فورية عن المباريات والنتائج"
      },
      sec: {
        title: "الأمان وكلمة المرور",
        current: "كلمة المرور الحالية",
        new: "كلمة المرور الجديدة",
        confirm: "تأكيد كلمة المرور"
      }
    },
    modals: {
      booking: {
        title: "حجز ملعب",
        selectDate: "اختر التاريخ",
        availableSlots: "المواعيد المتاحة",
        total: "السعر الإجمالي",
        confirmTitle: "تأكيد التفاصيل",
        stadium: "الملعب",
        time: "الموعد",
        note: "يتم الدفع نقداً عند الوصول. يرجى التواجد قبل الموعد بـ 15 دقيقة.",
        successTitle: "تم الحجز بنجاح!",
        successDesc: "استعد للمباراة! تم إرسال تفاصيل الحجز إلى بريدك الإلكتروني.",
        homeBtn: "العودة للرئيسية",
        continue: "متابعة",
        confirmBtn: "تأكيد الحجز"
      },
      team: {
        editTitle: "تعديل الفريق",
        createTitle: "إنشاء فريق جديد",
        name: "اسم الفريق",
        namePlaceholder: "مثال: الصقور",
        logo: "رابط الشعار",
        roster: "قائمة اللاعبين",
        addPlayer: "اسم اللاعب",
        emptyRoster: "أضف لاعبين لفريقك",
        save: "حفظ التعديلات",
        create: "إنشاء الفريق"
      }
    },
    ai: {
      title: "المساعد الذكي",
      placeholder: "اكتب استفسارك هنا...",
      welcome: "أهلاً! أنا مساعدك الذكي في كيك أوف. اسألني عن كيفية تنظيم بطولة أو البحث عن أفضل ملعب!"
    }
  },
  en: {
    common: {
      kickoff: "KickOff",
      welcome: "Welcome",
      search: "Search",
      loading: "Loading...",
      back: "Back",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      confirm: "Confirm",
      viewAll: "View All",
      noData: "No data available",
      currency: "JOD",
      perHour: "JOD/hr",
    },
    nav: {
      home: "Home",
      explore: "Fields",
      leagues: "Leagues",
      admin: "Admin",
      dashboard: "Dashboard",
      settings: "Settings",
      logout: "Logout",
      notifications: "Notifications",
      new: "New",
      profile: "Profile",
    },
    auth: {
      welcomeBack: "Welcome Back",
      subtitle: "Log in to manage your bookings and matches",
      email: "Email Address",
      password: "Password",
      forgotPassword: "Forgot Password?",
      rememberMe: "Remember me",
      login: "Log In",
      loginLoading: "Connecting...",
      noAccount: "Don't have an account?",
      createAccount: "Sign up for free",
      heroTitle: "Glory Awaits",
      heroSubtitle: "The premier platform for field booking and league management in Jordan.",
    },
    home: {
      badge: "Jordan's #1 Sports Platform",
      titleStart: "Book Your Field.",
      titleEnd: "Own The Game.",
      subtitle: "Embark on a complete sports journey. Instant field booking, professional league management, and a passionate sports community.",
      bookNow: "Book a Field",
      joinLeague: "Join a League",
      whyKickoff: "Why KickOff?",
      whySubtitle: "Designed to elevate the sports experience for players and field owners alike.",
      features: {
        booking: { title: "Smart & Instant Booking", desc: "No more phone calls. See real-time availability and book in seconds with instant confirmation." },
        leagues: { title: "Pro League Management", desc: "Automated schedules, results, and standings. Experience world-class tournaments locally." },
        ai: { title: "AI Smart Assistant", desc: "Get organizing tips and field suggestions using state-of-the-art AI technology." }
      },
      featuredFields: "Featured Fields",
      featuredSubtitle: "Top-rated sports destinations.",
      viewAllFields: "View All Fields"
    },
    explore: {
      title: "Explore Fields",
      searchPlaceholder: "Search by stadium name or area...",
      filter: "Filters",
      reset: "Reset",
      location: "Location",
      all: "All",
      type: "Field Type",
      price: "Price / Hour",
      turf: "Turf Type",
      turfTypes: {
        artificial: "Artificial Turf",
        natural: "Natural Grass",
        hybrid: "Hybrid"
      },
      resultsFound: "{count} results found",
      noResults: "No fields found",
      noResultsDesc: "Try changing your search criteria or removing some filters.",
      bookBtn: "Book Field"
    },
    dashboard: {
      welcome: "Hello, {name} 👋",
      subtitle: "Here is a summary of your sports activities today.",
      addField: "Add Field",
      tabs: {
        overview: "Overview",
        bookings: "Bookings",
        teams: "My Teams"
      },
      stats: {
        revenue: "Total Revenue",
        activeBookings: "Active Bookings",
        occupancy: "Occupancy Rate",
        rating: "Overall Rating",
        users: "Total Users",
        totalBookings: "Total Bookings",
        monthlyRevenue: "Revenue (Month)"
      },
      recentActivity: "Upcoming Activity",
      noBookings: "No upcoming bookings.",
      quickSummary: "Quick Summary",
      bookingsCount: "Bookings",
      teamsCount: "Teams",
      manageTeams: "Manage Teams",
      manageTeamsTitle: "Team Management",
      manageTeamsSubtitle: "Build your team to compete in upcoming leagues.",
      newTeam: "New Team",
      noTeams: "No teams added",
      noTeamsDesc: "Create your own team, add players, and start competing in KickOff leagues.",
      startNow: "Start Now",
      players: "Players",
      manageSquad: "Manage Squad",
      win: "Win",
      draw: "Draw",
      loss: "Loss",
      bookingHistory: "Full Booking History",
      table: {
        field: "Field",
        date: "Date",
        time: "Time",
        price: "Price",
        status: "Status",
        action: "Action"
      }
    },
    leagues: {
      title: "Leagues & Tournaments",
      subtitle: "Glory awaits the champions. Choose your league and start competing.",
      registerTeam: "Register Team",
      backToList: "Back to List",
      started: "Started {date}",
      share: "Share",
      follow: "Follow",
      tabs: {
        standings: "Standings",
        fixtures: "Fixtures",
        stats: "Stats"
      },
      table: {
        rank: "Pos",
        team: "Team",
        played: "P",
        won: "W",
        drawn: "D",
        lost: "L",
        points: "Pts",
        form: "Last 5"
      },
      progress: "League Progress",
      prizes: "Prize Pool",
      teams: "Teams",
      start: "Start",
      live: "Live"
    },
    admin: {
      overview: "Overview",
      users: "Users",
      fields: "Fields",
      reports: "Reports",
      settings: "Settings",
      userTable: {
        user: "User",
        role: "Role",
        status: "Status",
        action: "Action"
      },
      active: "Active",
      ban: "Ban"
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your profile and account preferences.",
      tabs: {
        general: "General",
        notifications: "Notifications",
        security: "Security",
        facility: "Facility",
        logs: "System Logs"
      },
      form: {
        fullName: "Full Name",
        phone: "Phone Number",
        email: "Email Address",
        language: "Language",
        save: "Save Changes"
      },
      notif: {
        title: "Notification Preferences",
        email: "Email Notifications",
        emailDesc: "Receive booking confirmations and invoices",
        push: "Push Notifications",
        pushDesc: "Instant updates on matches and results"
      },
      sec: {
        title: "Security & Password",
        current: "Current Password",
        new: "New Password",
        confirm: "Confirm Password"
      }
    },
    modals: {
      booking: {
        title: "Book Field",
        selectDate: "Select Date",
        availableSlots: "Available Slots",
        total: "Total Price",
        confirmTitle: "Confirm Details",
        stadium: "Stadium",
        time: "Time",
        note: "Payment is cash on arrival. Please arrive 15 mins before your slot.",
        successTitle: "Booking Successful!",
        successDesc: "Get ready! Booking details have been sent to your email.",
        homeBtn: "Return Home",
        continue: "Continue",
        confirmBtn: "Confirm Booking"
      },
      team: {
        editTitle: "Edit Team",
        createTitle: "Create New Team",
        name: "Team Name",
        namePlaceholder: "Ex: The Falcons",
        logo: "Logo URL",
        roster: "Roster",
        addPlayer: "Player Name",
        emptyRoster: "Add players to your team",
        save: "Save Changes",
        create: "Create Team"
      }
    },
    ai: {
      title: "Smart Assistant",
      placeholder: "Type your question here...",
      welcome: "Hello! I am your KickOff smart assistant. Ask me how to organize a league or find the best field!"
    }
  }
};

export const translateStatus = (status: string, lang: 'ar' | 'en') => {
  const map: Record<string, string> = {
    'مؤكد': 'Confirmed',
    'قيد الانتظار': 'Pending',
    'ملغي': 'Cancelled',
    'جارية': 'Ongoing',
    'مكتملة': 'Completed',
    'التسجيل متاح': 'Registration Open',
    'مجدولة': 'Scheduled',
    'مباشر': 'Live',
    'انتهت': 'Finished'
  };

  if (lang === 'en' && map[status]) return map[status];
  return status; // Fallback to original if AR or no map
};

export const translateRole = (role: string, lang: 'ar' | 'en') => {
   const map: Record<string, string> = {
    'لاعب': 'Player',
    'مالك ملعب': 'Field Owner',
    'مسؤول': 'Admin'
   };
   if (lang === 'en' && map[role]) return map[role];
   return role;
};
