'use client';

import { useEffect, useState } from 'react';
import en from '@/translations/en.json';
import hi from '@/translations/hi.json';
import kn from '@/translations/kn.json';

const translations = {
  en,
  hi,
  kn,
};

type TranslationKey = keyof typeof en;

export function useTranslation(lang: string) {
  const [language, setLanguage] = useState(lang);
  
  useEffect(() => {
    setLanguage(lang);
  }, [lang]);

  const t = (key: TranslationKey): string => {
    if (language === 'hi' && key in hi) {
      return (hi as any)[key];
    }
    if (language === 'kn' && key in kn) {
        return (kn as any)[key];
    }
    return en[key] || key;
  };

  return { t, setLanguage, language };
}
