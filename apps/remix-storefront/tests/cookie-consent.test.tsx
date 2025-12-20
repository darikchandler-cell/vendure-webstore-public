import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CookieConsent } from '../app/components/CookieConsent';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import userEvent from '@testing-library/user-event';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Initialize i18n for tests
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        cookieConsent: {
          message: 'We use cookies to enhance your experience.',
          accept: 'Accept',
          decline: 'Decline',
        },
      },
    },
  },
});

describe('CookieConsent', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should show consent banner when no consent is stored', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CookieConsent />
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/cookies/i)).toBeInTheDocument();
    });
  });

  it('should not show consent banner when consent is already given', () => {
    localStorage.setItem('cookieConsent', 'accepted');

    render(
      <I18nextProvider i18n={i18n}>
        <CookieConsent />
      </I18nextProvider>
    );

    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
  });

  it('should hide banner when accept is clicked', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <CookieConsent />
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/cookies/i)).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    await user.click(acceptButton);

    await waitFor(() => {
      expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
    });

    expect(localStorage.getItem('cookieConsent')).toBe('accepted');
  });
});

