/**
 * Authentication Buttons Component
 * Placeholder buttons for Google and Facebook OAuth
 * Ready for future authentication implementation
 */

import { Link } from '@remix-run/react';
import { useRootLoader } from '~/utils/use-root-loader';
import { UserIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';

interface AuthButtonsProps {
  className?: string;
  showUserMenu?: boolean;
}

export function AuthButtons({
  className = '',
  showUserMenu = true,
}: AuthButtonsProps) {
  const data = useRootLoader();
  const { t } = useTranslation();
  const isSignedIn = !!data.activeCustomer.activeCustomer?.id;
  const customer = data.activeCustomer.activeCustomer;

  // If user is signed in, show user menu
  if (isSignedIn && showUserMenu) {
    return (
      <div className={`relative ${className}`}>
        <Link
          to="/account"
          className="glass-button flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="My account"
        >
          <UserIcon className="w-5 h-5" />
          <span className="hidden sm:inline text-sm">
            {customer?.firstName || t('account.myAccount')}
          </span>
        </Link>
      </div>
    );
  }

  // If not signed in, show sign-in link
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Link
        to="/sign-in"
        className="glass-button flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
        aria-label="Sign in"
      >
        <UserIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{t('account.signIn')}</span>
      </Link>
    </div>
  );
}
