import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';
import FieldImage from '../components/FieldImage';
import { Field, League, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';


const CITIES = ['عمان', 'الزرقاء', 'إربد', 'العقبة', 'السلط', 'مادبا', 'جرش', 'عجلون'];

interface HomeProps {
  navigate?: (page: string) => void;
}

interface FieldsState {
  featured:  Field[];
  topRated:  Field[];
  cheapest:  Field[];
  byCity:    Field[];
  recent:    Field[];
}

const FieldCard: React.FC<{ field: Field; onNavigate: () => void; badge?: string }> = ({
  field,
  onNavigate,
  badge,
}) => (
  <div
    onClick={onNavigate}
    className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
  >
    <div className="relative h-48 overflow-hidden">
      <FieldImage
        src={field.images?.[0]}
        alt={field.name}
        stadiumName={field.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-white">
        <i className="fas fa-star text-yellow-400 text-[10px]" />
        {field.rating || '—'}
      </div>
      <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
        {field.type}
      </div>
      {badge && (
        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur text-white px-2.5 py-1 rounded-full text-xs font-bold">
          {badge}
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-black text-slate-900 text-base mb-1 truncate">{field.name}</h3>
      <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
        <i className="fas fa-map-marker-alt text-emerald-400" />
        {field.city || field.location}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">/ ساعة</span>
        <span className="text-lg font-black text-slate-900">
          {field.pricePerHour} <span className="text-sm font-bold text-emerald-600">د.أ</span>
        </span>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onNavigate(); }}
        className="mt-3 w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors"
      >
        احجز الآن
      </button>
    </div>
  </div>
);

const SectionHeader: React.FC<{
  label: string;
  title: string;
  onViewAll: () => void;
}> = ({ label, title, onViewAll }) => (
  <div className="flex justify-between items-center mb-10">
    <div className="text-start">
      <span className="text-emerald-500 text-sm font-bold block mb-1">{label}</span>
      <h2 className="text-3xl font-black text-slate-900">{title}</h2>
    </div>
    <button
      onClick={onViewAll}
      className="flex items-center gap-2 text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors"
    >
      <i className="fas fa-arrow-right text-xs" />
      عرض الكل
    </button>
  </div>
);

const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="rounded-3xl bg-slate-100 animate-pulse h-72" />
    ))}
  </div>
);

const Home: React.FC<HomeProps> = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isPlayer  = !!user && user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN;

  const [fields, setFields]           = useState<FieldsState>({
    featured: [], topRated: [], cheapest: [], byCity: [], recent: [],
  });
  const [tournaments, setTournaments] = useState<League[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeCity, setActiveCity]   = useState(CITIES[0]);
  const [cityLoading, setCityLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      backend.getFields({ featured: 'true', limit: '8', sort: '-rating' }),
      backend.getFields({ sort: '-rating', limit: '8' }),
      backend.getFields({ sort: 'pricePerHour', limit: '8' }),
      backend.getFields({ sort: '-createdAt', limit: '4' }),
      backend.getLeagues(),
    ]).then(([featured, topRated, cheapest, recent, leagues]) => {
      setFields({
        featured,
        topRated,
        cheapest,
        byCity: [],
        recent,
      });
      setTournaments(
        leagues
          .filter((x: League) => x.status !== 'مكتملة')
          .slice(0, 2)
      );
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setCityLoading(true);
    backend.getFieldsByCity(activeCity, { limit: '8', sort: '-rating' })
      .then(res => {
        setFields(prev => ({
          ...prev,
          byCity: res,
        }));
      })
      .finally(() => setCityLoading(false));
  }, [activeCity]);

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80"
            alt="ملعب كرة قدم"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-950/95" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            المنصة الرياضية الأولى في الأردن
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
            حجزك أسهل..
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-300">
              لعبك أمتع!
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
            انطلق في رحلة رياضية متكاملة، حجز فوري للملاعب وتنظيم احترافي للبطولات،
            تواصل مع مجتمع رياضي شغوف في أفضل الملاعب الأردنية. كل ما تحتاجه في مكان واحد.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/explore')}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl text-lg shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <i className="fas fa-futbol" />
              احجز ملعب الآن
            </button>
            <button
              onClick={() => navigate('/leagues')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 font-bold rounded-2xl text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-trophy" />
              انضم للبطولات
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/50 z-10">
          <i className="fas fa-chevron-down text-xl" />
        </div>
      </section>


      {/* ══ FEATURED FIELDS ═══════════════════════════════════════════════ */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="الملاعب المميزة"
            title="أبرز الملاعب في الأردن"
            onViewAll={() => navigate('/explore')}
          />
          {loading ? (
            <SkeletonGrid />
          ) : fields.featured.length === 0 ? (
            <p className="text-center text-slate-400 py-8">لا توجد ملاعب مميزة حالياً</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {fields.featured.slice(0, 4).map(f => (
                <FieldCard
                  key={String(f.id)}
                  field={f}
                  onNavigate={() => navigate('/explore')}
                  badge="⭐ مميز"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ TOP RATED ═════════════════════════════════════════════════════ */}
      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="الأعلى تقييماً"
            title="ملاعب اختارها اللاعبون"
            onViewAll={() => navigate('/explore?sort=-rating')}
          />
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {fields.topRated.slice(0, 4).map((f, i) => (
                <FieldCard
                  key={String(f.id)}
                  field={f}
                  onNavigate={() => navigate('/explore')}
                  badge={i === 0 ? '🥇 #1' : i === 1 ? '🥈 #2' : i === 2 ? '🥉 #3' : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ CHEAPEST ══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="أفضل الأسعار"
            title="ملاعب في متناول الجميع"
            onViewAll={() => navigate('/explore?sort=pricePerHour')}
          />
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {fields.cheapest.slice(0, 4).map(f => (
                <FieldCard
                  key={String(f.id)}
                  field={f}
                  onNavigate={() => navigate('/explore')}
                  badge={`${f.pricePerHour} د.أ / ساعة`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ BY CITY ═══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="استكشف بالمحافظة"
            title="ملاعب في مدينتك"
            onViewAll={() => navigate(`/explore?city=${encodeURIComponent(activeCity)}`)}
          />

          {/* City tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {CITIES.map(city => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeCity === city
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {cityLoading ? (
            <SkeletonGrid />
          ) : fields.byCity.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              <i className="fas fa-map-marker-alt text-5xl mb-4 block opacity-30" />
              <p className="font-medium">لا توجد ملاعب في {activeCity} حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {fields.byCity.slice(0, 4).map(f => (
                <FieldCard
                  key={String(f.id)}
                  field={f}
                  onNavigate={() => navigate('/explore')}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ TOURNAMENT CTA ════════════════════════════════════════════════ */}
      {!isPlayer && (
        <section className="py-20 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-emerald-950/30 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 rounded-3xl" />
                  <img
                    src="https://images.pexels.com/photos/15153169/pexels-photo-15153169.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="لاعب كرة قدم"
                    className="w-full max-w-sm rounded-3xl object-cover aspect-[3/4] shadow-2xl"
                  />
                </div>
              </div>

              <div>
                <span className="text-emerald-400 font-bold text-sm block mb-4">
                  🏆 نظّم بطولتك الآن
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                  نظم بطولتك الخاصة
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-300">
                    باحترافية كاملة
                  </span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  من لحظة إنشاء البطولة إلى إدارة المباريات وحساب النقاط تلقائياً،
                  نوفر لك كل الأدوات لتنظيم بطولة احترافية على أعلى مستوى في أي مكان.
                </p>

                <ul className="space-y-3 mb-10">
                  {['جداول تلقائية كاملة', 'مباريات تُدار لكل فريق', 'نظام نتائج مشهور'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-check text-emerald-400 text-[10px]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/new-tournament')}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl text-lg shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.55)] transition-all transform hover:-translate-y-0.5"
                >
                  أنشئ بطولتك الآن
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ ACTIVE TOURNAMENTS ════════════════════════════════════════════ */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-emerald-500 text-sm font-bold block mb-2">المشاركة مفتوحة</span>
            <h2 className="text-3xl font-black text-slate-900">البطولات النشطة</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-3xl bg-slate-200 animate-pulse h-52" />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              <i className="fas fa-trophy text-5xl mb-4 block opacity-30" />
              <p className="font-medium">لا توجد بطولات نشطة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {tournaments.map(t => (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex justify-between items-start relative z-10">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        t.status === 'جارية'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {t.status === 'جارية' ? '🟢 فعالة' : '🔵 قادمة'}
                      </span>
                      <i className="fas fa-trophy text-emerald-400/50 text-3xl" />
                    </div>
                    <h3 className="text-white font-black text-xl mt-3 leading-tight relative z-10">{t.name}</h3>
                    <p className="text-slate-400 text-sm mt-1 relative z-10">
                      <i className="fas fa-calendar-alt ml-1" />
                      {new Date(t.startDate).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-center">
                        <span className="text-2xl font-black text-slate-900">{t.teamsCount}/{t.maxTeams}</span>
                        <span className="text-xs text-slate-500 block mt-0.5">الفرق</span>
                      </div>
                      <div className="w-px h-10 bg-slate-100" />
                      <div className="text-center">
                        <span className="text-2xl font-black text-emerald-600">{t.prizePool}</span>
                        <span className="text-xs text-slate-500 block mt-0.5">الجائزة</span>
                      </div>
                      <div className="w-px h-10 bg-slate-100" />
                      <div className="text-center">
                        <span className="text-2xl font-black text-slate-900">{t.sport}</span>
                        <span className="text-xs text-slate-500 block mt-0.5">الرياضة</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all"
                          style={{ width: `${Math.min((t.teamsCount / t.maxTeams) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{t.maxTeams - t.teamsCount} مقعد متبقي</p>
                    </div>

                    <button
                      onClick={() => navigate('/leagues')}
                      className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
                    >
                      سجّل فريقك
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/leagues')}
              className="px-8 py-3 border-2 border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-600 font-bold rounded-2xl transition-all"
            >
              عرض جميع البطولات
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer id="footer" className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl">
                  <i className="fas fa-futbol" />
                </div>
                <span className="text-white font-black text-xl">كيك أوف</span>
              </div>
              <p className="text-sm leading-relaxed mb-5">
                منصتك الرياضية الأولى لحجز الملاعب وتنظيم البطولات الاحترافية.
                انضم لآلاف اللاعبين في نظام واحد.
              </p>
              <div className="flex gap-3">
                {['twitter', 'instagram', 'facebook-f', 'youtube'].map(s => (
                  <a key={s} href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-emerald-500 flex items-center justify-center transition-colors">
                    <i className={`fab fa-${s} text-sm`} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-5">روابط سريعة</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'الرئيسية',        path: '/' },
                  { label: 'استكشاف الملاعب', path: '/explore' },
                  { label: 'البطولات',        path: '/leagues' },
                  { label: 'تسجيل الدخول',   path: '/login' },
                  { label: 'من نحن',          path: '#' },
                ].map((l, i) => (
                  <li key={i}>
                    <Link to={l.path} className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                      <i className="fas fa-chevron-left text-[10px] text-emerald-500/50" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-5">الدعم والمساعدة</h4>
              <ul className="space-y-3 text-sm">
                {['مركز المساعدة', 'الشروط والأحكام', 'سياسة الخصوصية', 'سياسة الدفع', 'اتصل بنا'].map((l, i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                      <i className="fas fa-chevron-left text-[10px] text-emerald-500/50" />
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <span>© 2026 كيك أوف. جميع الحقوق محفوظة.</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 font-medium">جميع الأنظمة تعمل بشكل طبيعي</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
