
import React, { useState, useEffect } from 'react';
import { backend } from '../services/backend';
import { Field } from '../types';
import FieldImage from '../components/FieldImage';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface ExploreProps {
    onBook: (field: Field, siblings: Field[]) => void;
    onReview?: (field: Field) => void;
}

const Explore: React.FC<ExploreProps> = ({ onBook, onReview }) => {
    const [allFields, setAllFields] = useState<Field[]>([]);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();
    const t = translations[language];
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [priceRange, setPriceRange] = useState(100);
    const [selectedType, setSelectedType] = useState('all');
    const [turfFilter, setTurfFilter] = useState({ artificial: true, natural: true, hybrid: true });
    const [amenityFilter, setAmenityFilter] = useState<string[]>([]);

    // value must match exactly what is stored in MongoDB (see seeds/fields.seed.js ALL_AMENITIES)
    const AMENITY_OPTIONS = [
      { label: 'مواقف سيارات',      value: 'Parking',        icon: 'fa-parking'    },
      { label: 'كافتيريا',           value: 'Cafeteria',      icon: 'fa-coffee'     },
      { label: 'غرف تبديل ملابس',   value: 'Locker Rooms',   icon: 'fa-door-open'  },
      { label: 'دورات مياه',         value: 'Showers',        icon: 'fa-restroom'   },
      { label: 'إضاءة ليلية',        value: 'Lighting',       icon: 'fa-lightbulb'  },
      { label: 'WiFi',               value: 'WiFi',           icon: 'fa-wifi'       },
      { label: 'منطقة مشجعين',       value: 'Spectator Area', icon: 'fa-users'      },
    ];
    const toggleAmenity = (val: string) =>
      setAmenityFilter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    const resetAll = () => {
      setPriceRange(100); setSelectedLocation('all');
      setSelectedType('all'); setAmenityFilter([]);
      setTurfFilter({ artificial: true, natural: true, hybrid: true });
    };

    useEffect(() => {
        backend.getFields().then(data => {
            setAllFields(data);
            setLoading(false);
        });
    }, []);

    const locations = ['all', ...Array.from(new Set(allFields.map(f => f.location.split(',')[0].trim())))];

    const filteredFields = allFields.filter(field => {
        const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) || field.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = selectedLocation === 'all' || field.location.includes(selectedLocation);
        const matchesPrice = field.pricePerHour <= priceRange;
        const matchesType = selectedType === 'all' || field.type === selectedType;
        
        let matchesTurf = false;
        if (field.turfType === 'عشب صناعي' && turfFilter.artificial) matchesTurf = true;
        if (field.turfType === 'عشب طبيعي' && turfFilter.natural) matchesTurf = true;
        if (field.turfType === 'هجين' && turfFilter.hybrid) matchesTurf = true;

        const matchesAmenities = amenityFilter.length === 0 ||
            amenityFilter.every(a => field.amenities.includes(a));

        return matchesSearch && matchesLocation && matchesPrice && matchesType && matchesTurf && matchesAmenities;
    });

    const getTurfDisplay = (turfType: string) => {
        if (turfType === 'عشب صناعي') return t.explore.turfTypes.artificial;
        if (turfType === 'عشب طبيعي') return t.explore.turfTypes.natural;
        if (turfType === 'هجين') return t.explore.turfTypes.hybrid;
        return turfType;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Search */}
            <div className="bg-white sticky top-0 z-30 shadow-soft border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl font-black text-slate-900 hidden md:block">{t.explore.title}</h1>
                        <div className="relative w-full md:w-96">
                            <i className={`fas fa-search absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`}></i>
                            <input 
                                type="text" 
                                placeholder={t.explore.searchPlaceholder} 
                                className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-72 flex-shrink-0 space-y-8 h-fit lg:sticky lg:top-32">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-soft">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <i className="fas fa-sliders-h text-emerald-500"></i> {t.explore.filter}
                                </h3>
                                <button onClick={resetAll} className="text-xs text-gray-400 hover:text-emerald-600 font-medium">{t.explore.reset}</button>
                            </div>
                            
                            {/* Location */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t.explore.location}</label>
                                <div className="relative">
                                    <select 
                                        value={selectedLocation}
                                        onChange={(e) => setSelectedLocation(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-emerald-500 outline-none appearance-none"
                                    >
                                        {locations.map(loc => <option key={loc} value={loc}>{loc === 'all' ? t.explore.all : loc}</option>)}
                                    </select>
                                    <i className={`fas fa-chevron-down absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none`}></i>
                                </div>
                            </div>

                            {/* Field Type */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t.explore.type}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['all', '4v4', '5v5', '6v6', '7v7'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setSelectedType(type)}
                                            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${selectedType === type ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {type === 'all' ? t.explore.all : type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-8">
                                <div className="flex justify-between mb-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">{t.explore.price}</label>
                                    <span className="text-xs font-bold text-emerald-600">{priceRange} {t.common.currency}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="100" 
                                    step="5"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    dir="ltr"
                                />
                            </div>

                            {/* Turf */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t.explore.turf}</label>
                                <div className="space-y-3">
                                    {[
                                        { id: 'artificial', label: t.explore.turfTypes.artificial },
                                        { id: 'natural', label: t.explore.turfTypes.natural },
                                        { id: 'hybrid', label: t.explore.turfTypes.hybrid }
                                    ].map(item => (
                                        <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${turfFilter[item.id as keyof typeof turfFilter] ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'}`}>
                                                {turfFilter[item.id as keyof typeof turfFilter] && <i className="fas fa-check text-white text-xs"></i>}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={turfFilter[item.id as keyof typeof turfFilter]} onChange={() => setTurfFilter(p => ({...p, [item.id]: !p[item.id as keyof typeof turfFilter]}))} />
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-600 transition-colors">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Amenities */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">الخدمات</label>
                                    {amenityFilter.length > 0 && (
                                        <button onClick={() => setAmenityFilter([])}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1">
                                            <i className="fas fa-times-circle text-[10px]"/> مسح ({amenityFilter.length})
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {AMENITY_OPTIONS.map(am => {
                                        const active = amenityFilter.includes(am.value);
                                        return (
                                            <label key={am.value} onClick={() => toggleAmenity(am.value)}
                                                className="flex items-center gap-3 cursor-pointer group py-1 rounded-lg px-1 hover:bg-gray-50 transition-colors">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${active ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : 'border-gray-300 bg-white'}`}>
                                                    {active && <i className="fas fa-check text-white text-[9px]"/>}
                                                </div>
                                                <span className={`flex items-center gap-2 text-sm font-medium transition-colors ${active ? 'text-emerald-700' : 'text-gray-600 group-hover:text-emerald-600'}`}>
                                                    <i className={`fas ${am.icon} text-xs w-3.5 text-center ${active ? 'text-emerald-500' : 'text-gray-400'}`}/>
                                                    {am.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {amenityFilter.length > 0 && (
                                    <p className="mt-3 text-[11px] text-slate-400 text-center">
                                        تعرض الملاعب التي تحتوي على <span className="text-emerald-600 font-bold">جميع</span> الخدمات المحددة
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1,2,3,4].map(n => (
                                    <div key={n} className="bg-white rounded-3xl h-80 animate-pulse border border-gray-100"></div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-500">{t.explore.resultsFound.replace('{count}', filteredFields.length.toString())}</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredFields.map((field) => (
                                        <div 
                                            key={field.id} 
                                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300 group"
                                        >
                                            <div className="h-52 relative">
                                                <FieldImage
                                                    alt={field.name}
                                                    stadiumName={field.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                                                    {field.type}
                                                </div>
                                                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-emerald-700 px-3 py-1.5 rounded-xl text-sm font-black shadow-sm">
                                                    {field.pricePerHour} {t.common.currency}
                                                </div>
                                            </div>
                                            
                                            <div className="p-5">
                                                <h3 className="font-bold text-lg text-slate-900 truncate mb-1">{field.name}</h3>
                                                
                                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                                    <i className="fas fa-map-marker-alt text-gray-300"></i> {field.location}
                                                </p>

                                                <div className="flex flex-wrap gap-2 mb-5">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{getTurfDisplay(field.turfType)}</span>
                                                    {field.amenities.slice(0, 2).map(am => (
                                                        <span key={am} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{am}</span>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => onBook(field, filteredFields)}
                                                        className="flex-1 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white font-bold rounded-xl transition-all text-sm border border-emerald-100 hover:border-emerald-500 flex justify-center items-center gap-2"
                                                    >
                                                        {t.explore.bookBtn} <i className={`fas ${language === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'} text-xs`}></i>
                                                    </button>
                                                    {onReview && (
                                                        <button
                                                            onClick={() => onReview(field)}
                                                            title="التقييمات"
                                                            className="py-3 px-3 bg-amber-50 text-amber-500 hover:bg-amber-400 hover:text-white font-bold rounded-xl transition-all text-sm border border-amber-100 hover:border-amber-400"
                                                        >
                                                            <i className="fas fa-star text-sm"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredFields.length === 0 && (
                                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 text-3xl">
                                            <i className="fas fa-search"></i>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">{t.explore.noResults}</h3>
                                        <p className="text-gray-500 mt-2">{t.explore.noResultsDesc}</p>
                                        <button onClick={() => {setPriceRange(100); setSelectedLocation('all'); setSearchTerm('');}} className="mt-6 px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors">
                                            {t.common.viewAll}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Explore;
