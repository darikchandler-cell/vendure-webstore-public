/**
 * Channel Switcher Component
 * Multi-currency/language switcher for Vendure Channels/Locales
 */

import { useState } from 'react';
import { useRootLoader } from '~/utils/use-root-loader';
import { GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from '@remix-run/react';

interface ChannelSwitcherProps {
  className?: string;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
];

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export function ChannelSwitcher({ className = '' }: ChannelSwitcherProps) {
  const data = useRootLoader();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguage, setShowLanguage] = useState(true);

  const currentLanguage =
    languages.find((lang) => lang.code === data.locale) || languages[0];
  const currentCurrency =
    currencies.find((curr) => curr.code === data.activeChannel?.currencyCode) ||
    currencies[0];

  const handleLanguageChange = async (langCode: string) => {
    setIsOpen(false);
    if (langCode === data.locale) return;

    // Change language via i18n
    await i18n.changeLanguage(langCode);

    // Reload the page to apply language changes
    navigate(location.pathname + location.search, { replace: true });
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setIsOpen(false);
    if (currencyCode === data.activeChannel?.currencyCode) return;

    // In a real implementation, this would switch the Vendure channel
    // For now, we'll just show a placeholder message
    console.log('Currency change requested:', currencyCode);
    // TODO: Implement channel switching via API
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-button flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors"
        aria-label="Change language or currency"
        aria-expanded={isOpen}
      >
        <GlobeAltIcon className="w-5 h-5" />
        <span className="hidden sm:inline">
          {showLanguage ? currentLanguage.flag : currentCurrency.symbol}
        </span>
        <span className="hidden md:inline text-sm">
          {showLanguage
            ? currentLanguage.code.toUpperCase()
            : currentCurrency.code}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-lg z-20 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                type="button"
                onClick={() => setShowLanguage(true)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  showLanguage
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Language
              </button>
              <button
                type="button"
                onClick={() => setShowLanguage(false)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  !showLanguage
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Currency
              </button>
            </div>

            {/* Options */}
            <div className="max-h-64 overflow-y-auto">
              {showLanguage ? (
                <div className="py-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                        lang.code === data.locale
                          ? 'text-white bg-white/10'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {lang.code === data.locale && (
                        <span className="ml-auto text-primary-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-2">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                        curr.code === data.activeChannel?.currencyCode
                          ? 'text-white bg-white/10'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="font-mono">{curr.symbol}</span>
                      <span>{curr.name}</span>
                      <span className="ml-auto text-xs text-white/60">
                        {curr.code}
                      </span>
                      {curr.code === data.activeChannel?.currencyCode && (
                        <span className="ml-2 text-primary-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
