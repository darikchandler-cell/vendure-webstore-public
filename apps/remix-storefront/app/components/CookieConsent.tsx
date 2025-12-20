import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          {t('cookieConsent.message') ||
            'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.'}
        </p>
        <button
          onClick={acceptCookies}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium whitespace-nowrap"
        >
          {t('cookieConsent.accept') || 'Accept'}
        </button>
      </div>
    </div>
  );
}
