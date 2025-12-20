import { Link, useLoaderData } from '@remix-run/react';
import {
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AISearchBar } from '~/components/search/AISearchBar';
import { MegaMenu } from '~/components/navigation/MegaMenu';
import { useRootLoader } from '~/utils/use-root-loader';
import { UserIcon } from '@heroicons/react/24/solid';
import { useScrollingUp } from '~/utils/use-scrolling-up';
import { classNames } from '~/utils/class-names';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ChannelSwitcher } from '~/components/layout/ChannelSwitcher';

export function Header({
  onCartIconClick,
  cartQuantity,
}: {
  onCartIconClick: () => void;
  cartQuantity: number;
}) {
  const data = useRootLoader();
  const isSignedIn = !!data.activeCustomer.activeCustomer?.id;
  const isScrollingUp = useScrollingUp();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Organize collections into hierarchy (parent/children)
  const topLevelCollections = data.collections.filter(
    (collection) => collection.parent?.name === '__root_collection__',
  );

  return (
    <header
      className={classNames(
        isScrollingUp ? 'sticky top-0 z-50 animate-dropIn' : '',
        'glass-nav w-full',
      )}
    >
      {/* Top bar with trust signals */}
      <div className="bg-navy-darker/80 text-white/70 text-center text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-4">
            <span>Free Shipping on Orders Over $100</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Expert Support Available</span>
          </div>
          <div className="flex items-center gap-4">
            <ChannelSwitcher />
            <Link
              to={isSignedIn ? '/account' : '/sign-in'}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isSignedIn ? t('account.myAccount') : t('account.signIn')}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img
                src="/cube-logo-small.webp"
                width={40}
                height={31}
                alt={t('common.logoAlt') || 'Logo'}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Mega Menu */}
          <MegaMenu collections={topLevelCollections} isMobile={false} />

          {/* AI Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden lg:block">
            <AISearchBar />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Mobile search toggle - simplified for now */}
            <div className="lg:hidden">
              <Link
                to="/search"
                className="glass-button p-2 rounded-lg"
                aria-label="Search"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Link>
            </div>

            {/* Cart */}
            <button
              className="relative glass-button p-2 rounded-lg text-white"
              onClick={onCartIconClick}
              aria-label="Open cart tray"
            >
              <ShoppingBagIcon className="w-6 h-6" />
              {cartQuantity > 0 && (
                <div className="absolute rounded-full -top-1 -right-1 bg-accent-primary min-w-5 min-h-5 flex items-center justify-center text-xs font-bold">
                  {cartQuantity}
                </div>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden glass-button p-2 rounded-lg text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10">
            <div className="pt-4">
              <AISearchBar />
            </div>
            <div className="mt-4">
              <MegaMenu collections={topLevelCollections} isMobile={true} />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
