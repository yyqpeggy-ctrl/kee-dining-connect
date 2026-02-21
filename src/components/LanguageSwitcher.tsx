import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      title={i18n.language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{i18n.language === 'zh' ? 'EN' : '中文'}</span>
    </button>
  );
};

export default LanguageSwitcher;
