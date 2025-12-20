/**
 * AI Search Bar Component
 * Prominent search input with sparkle icon and chat-like appearance
 */

import { Form, useNavigate } from '@remix-run/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function AISearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URL(window.location.href).searchParams;
      setQuery(urlParams.get('q') ?? '');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <Form
      method="get"
      action="/search"
      onSubmit={handleSubmit}
      className="relative w-full max-w-2xl"
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SparklesIcon className="h-5 w-5 text-white/60" aria-hidden="true" />
        </div>
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common.search') || 'Search products...'}
          className="glass-input w-full pl-12 pr-4 py-3 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
          aria-label="Search products"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="submit"
            className="glass-button px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-white/20 transition-all"
            aria-label="Submit search"
          >
            Search
          </button>
        </div>
      </div>
      {/* AI Recommendation hint - UI ready for backend integration */}
      <div className="mt-2 text-xs text-white/50 flex items-center gap-1">
        <SparklesIcon className="h-3 w-3" />
        <span>AI-powered search - Get personalized recommendations</span>
      </div>
    </Form>
  );
}
