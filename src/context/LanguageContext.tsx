/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';

type Lang = 'en' | 'th';

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'nav.browse': 'Browse',
    'nav.singles': 'Singles',
    'nav.search': 'Search for beats, genres, editors...',
    'singles.title': 'Singles',
    'singles.filters': 'Filters',
    'singles.hide_sidebar': 'Hide Sidebar',
    'singles.show_sidebar': 'Filters',
    'singles.search_placeholder': 'Search tracks...',
    'singles.bpm_range': 'BPM Range',
    'singles.key': 'Key',
    'singles.genres': 'Genres',
    'singles.sort_by': 'Sort by:',
    'singles.newest': 'Newest',
    'table.track': 'Track',
    'table.bpm': 'BPM',
    'table.key': 'Key',
    'table.genre': 'Genre',
    'table.stats': 'Stats',
    'table.action': 'Action',
    'genre.all': 'All Genres',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty_msg': "Looks like you haven't added any beat packs yet.",
    'cart.browse_btn': 'Browse Beats',
    'cart.summary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.clear': 'Clear Cart',
    'auth.welcome': 'Welcome Back',
    'auth.create': 'Create Account',
    'auth.login_msg': 'Login to your DJ account',
    'auth.signup_msg': 'Sign up to start downloading beats',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.processing': 'Processing...',
    'auth.have_account': 'Already have an account?',
    'auth.no_account': "Don't have an account?",
    'pack.back': 'Back to Browse',
    'pack.tracklist': 'Tracklist',
    'pack.tracks': 'Tracks',
    'pack.add_to_cart': 'Add to Cart',
    'player.select': 'Select a track',
    'player.various': 'Various Artists',
  },
  th: {
    'nav.browse': 'เลือกซื้อ',
    'nav.singles': 'เพลงเดี่ยว',
    'nav.search': 'ค้นหาบีท แนวเพลง ผู้ตัดต่อ...',
    'singles.title': 'เพลงเดี่ยว',
    'singles.filters': 'ตัวกรอง',
    'singles.hide_sidebar': 'ซ่อนแถบด้านข้าง',
    'singles.show_sidebar': 'ตัวกรอง',
    'singles.search_placeholder': 'ค้นหาเพลง...',
    'singles.bpm_range': 'ช่วง BPM',
    'singles.key': 'คีย์',
    'singles.genres': 'แนวเพลง',
    'singles.sort_by': 'เรียงตาม:',
    'singles.newest': 'ใหม่สุด',
    'table.track': 'เพลง',
    'table.bpm': 'BPM',
    'table.key': 'คีย์',
    'table.genre': 'แนวเพลง',
    'table.stats': 'สถิติ',
    'table.action': 'การดำเนินการ',
    'genre.all': 'ทุกแนวเพลง',
    'auth.login': 'เข้าสู่ระบบ',
    'auth.signup': 'สมัครสมาชิก',
    'cart.title': 'ตะกร้าสินค้า',
    'cart.empty': 'ตะกร้าว่างเปล่า',
    'cart.empty_msg': 'ยังไม่มีสินค้าในตะกร้า',
    'cart.browse_btn': 'เลือกซื้อบีท',
    'cart.summary': 'สรุปคำสั่งซื้อ',
    'cart.subtotal': 'ราคารวม',
    'cart.total': 'ยอดรวม',
    'cart.checkout': 'ดำเนินการชำระเงิน',
    'cart.clear': 'ล้างตะกร้า',
    'auth.welcome': 'ยินดีต้อนรับ',
    'auth.create': 'สร้างบัญชี',
    'auth.login_msg': 'เข้าสู่ระบบบัญชี DJ ของคุณ',
    'auth.signup_msg': 'สมัครสมาชิกเพื่อดาวน์โหลดบีท',
    'auth.email': 'อีเมล',
    'auth.password': 'รหัสผ่าน',
    'auth.processing': 'กำลังดำเนินการ...',
    'auth.have_account': 'มีบัญชีอยู่แล้ว?',
    'auth.no_account': 'ยังไม่มีบัญชี?',
    'pack.back': 'กลับไปหน้าเลือกซื้อ',
    'pack.tracklist': 'รายชื่อเพลง',
    'pack.tracks': 'เพลง',
    'pack.add_to_cart': 'เพิ่มลงตะกร้า',
    'player.select': 'เลือกเพลง',
    'player.various': 'Various Artists',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'en';
  });

  const handleSetLanguage = (lang: Lang) => {
    localStorage.setItem('lang', lang);
    setLanguage(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
