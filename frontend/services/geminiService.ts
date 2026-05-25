import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize only if key is present
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to map generic or Arabic names to specific English search terms for better results
const getSearchQuery = (name: string): string => {
  const map: Record<string, string> = {
    'ستاد عمان الدولي': 'Amman International Stadium',
    'ستاد الملك عبدالله الثاني': 'King Abdullah II Stadium Amman',
    'ملعب مدينة الحسن': 'Al Hassan Stadium Irbid',
    'ستاد الأمير محمد': 'Prince Mohammed Stadium Zarqa',
    'ملعب البتراء': 'Petra Stadium Amman football',
    'ملعب الأمير فيصل': 'Prince Faisal Stadium Karak',
    'ملعب الأمير هاشم': 'Prince Hashim Stadium Ramtha',
    'ملعب تطوير العقبة': 'Aqaba Development Corporation Stadium',
    'ملعب الزرقاء المجتمعي': 'Prince Mohammed Stadium Zarqa',
    'ملعب إربد الشمالي': 'Al Hassan Stadium Irbid',
    'ساحة الأساطير': 'Petra Stadium Amman',
    'Stad Amman': 'Amman International Stadium',
    'Hussein Stadium': 'Al Hassan Stadium Irbid',
  };
  
  // Return mapped name or fallback to the original name with "Jordan" appended
  return map[name] || `${name} stadium Jordan`;
};

export const generateLeagueAdvice = async (query: string, lang: 'ar' | 'en' = 'ar'): Promise<string> => {
  if (!ai) return lang === 'ar' ? "API Key غير موجود." : "API Key is missing.";
  
  try {
    const prompt = lang === 'ar' 
      ? `أنت منظم دوريات رياضية محترف ومستشار لمنصة تدعى "كيك أوف" في الأردن. المستخدم يسأل: "${query}". قدم إجابة مفيدة ومختصرة وحماسية باللغة العربية.`
      : `You are a professional sports league organizer and consultant for "KickOff Jordan". The user asks: "${query}". Provide a helpful, concise, and enthusiastic answer in English.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (lang === 'ar' ? "عذراً، لا يمكنني تقديم النصيحة الآن." : "Sorry, I cannot provide advice right now.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return lang === 'ar' ? "حدث خطأ أثناء الاتصال بالمساعد الذكي." : "An error occurred while contacting the AI assistant.";
  }
};

export const getStadiumImage = async (stadiumName: string): Promise<string | null> => {
  if (!ai) return null;
  
  const searchQuery = getSearchQuery(stadiumName);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find a REAL, existing, publicly accessible image URL for "${searchQuery}".
      
      RULES:
      1. Prioritize "Wikimedia Commons" URLs (upload.wikimedia.org) or official news sources.
      2. The URL MUST be a direct link ending in .jpg, .png, or .webp.
      3. It must be an ACTUAL photo of the specific stadium named "${stadiumName}", not a generic field.
      4. If you find a Wikimedia file page, convert it to the direct image URL (e.g., https://upload.wikimedia.org/wikipedia/commons/...).
      5. Return ONLY the raw URL string. No JSON, no Markdown, no text.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text?.trim();
    // stricter regex to find a valid image url
    const urlMatch = text?.match(/https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)/i);
    
    // Fallback: sometimes the model returns a query parameter url (like google images), accept valid looking http links if extension check fails but looks like an image
    if (!urlMatch) {
       const broadMatch = text?.match(/https?:\/\/[^\s"']+/);
       // Basic validation to ensure it's a url
       if (broadMatch && (broadMatch[0].includes('http') || broadMatch[0].includes('www'))) {
           return broadMatch[0];
       }
       return null;
    }

    return urlMatch ? urlMatch[0] : null;
  } catch (error) {
    console.error("Gemini Image Search Error:", error);
    return null;
  }
};