/**
 * Mega Menu Component
 * Hierarchical navigation structure with glassmorphism styling
 */

import { Link } from '@remix-run/react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { classNames } from '~/utils/class-names';

interface Collection {
  id: string;
  name: string;
  slug: string;
  children?: Collection[];
}

interface MegaMenuProps {
  collections: Collection[];
  isMobile?: boolean;
}

export function MegaMenu({ collections, isMobile = false }: MegaMenuProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (collectionId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpenMenu(collectionId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (isMobile) {
    return (
      <nav className="md:hidden" aria-label="Main navigation">
        <ul className="space-y-2">
          {collections.map((collection) => (
            <li key={collection.id}>
              {collection.children && collection.children.length > 0 ? (
                <details className="group">
                  <summary className="flex items-center justify-between px-4 py-2 text-white/90 hover:text-white cursor-pointer">
                    <Link
                      to={`/collections/${collection.slug}`}
                      className="flex-1"
                      prefetch="intent"
                    >
                      {collection.name}
                    </Link>
                    <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="ml-4 mt-2 space-y-1">
                    {collection.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          to={`/collections/${child.slug}`}
                          className="block px-4 py-2 text-white/70 hover:text-white transition-colors"
                          prefetch="intent"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <Link
                  to={`/collections/${collection.slug}`}
                  className="block px-4 py-2 text-white/90 hover:text-white transition-colors"
                  prefetch="intent"
                >
                  {collection.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className="hidden md:block" aria-label="Main navigation">
      <ul className="flex items-center space-x-6">
        {collections.map((collection) => (
          <li
            key={collection.id}
            className="relative"
            onMouseEnter={() => handleMouseEnter(collection.id)}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              to={`/collections/${collection.slug}`}
              className={classNames(
                'flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent rounded',
                openMenu === collection.id ? 'text-white' : '',
              )}
              prefetch="intent"
              aria-expanded={
                collection.children && collection.children.length > 0
                  ? openMenu === collection.id
                  : undefined
              }
              aria-haspopup={
                collection.children && collection.children.length > 0
                  ? 'true'
                  : undefined
              }
            >
              {collection.name}
              {collection.children && collection.children.length > 0 && (
                <ChevronDownIcon
                  className={classNames(
                    'h-4 w-4 transition-transform',
                    openMenu === collection.id ? 'rotate-180' : '',
                  )}
                />
              )}
            </Link>

            {collection.children &&
              collection.children.length > 0 &&
              openMenu === collection.id && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 glass-card rounded-lg p-4 z-50 animate-dropIn"
                  role="menu"
                  aria-label={`${collection.name} submenu`}
                >
                  <ul className="space-y-2" role="none">
                    {collection.children.map((child) => (
                      <li key={child.id} role="none">
                        <Link
                          to={`/collections/${child.slug}`}
                          className="block px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
                          prefetch="intent"
                          role="menuitem"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
