import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en';
import zh from './locales/zh';

i18n
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 绑定 react-i18next
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: 'en', // 默认语言为英文
    lng: 'en', // 初始语言设置为英文
    debug: false,

    interpolation: {
      escapeValue: false, // React 已经默认转义
    },

    detection: {
      // 语言检测顺序：localStorage > navigator
      order: ['localStorage', 'navigator'],
      // 缓存用户语言选择
      caches: ['localStorage'],
      // localStorage 的 key 名称
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
