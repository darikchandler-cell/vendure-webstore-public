/**
 * Coupon Code Input Component
 * Allows users to apply and remove coupon codes during checkout
 */

import { useState, FormEvent } from 'react';
import { useFetcher } from '@remix-run/react';
import { XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { CartLoaderData } from '~/routes/api.active-order';
import Alert from '~/components/Alert';

interface CouponCodeInputProps {
  appliedCouponCodes?: string[];
  onCouponApplied?: () => void;
}

export function CouponCodeInput({
  appliedCouponCodes = [],
  onCouponApplied,
}: CouponCodeInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher<CartLoaderData>();
  const { t } = useTranslation();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!couponCode.trim()) {
      setError(
        t('checkout.couponCodeRequired') || 'Please enter a coupon code',
      );
      return;
    }

    fetcher.submit(
      {
        action: 'applyCouponCode',
        couponCode: couponCode.trim().toUpperCase(),
      },
      {
        method: 'post',
        action: '/api/active-order',
      },
    );
  };

  const handleRemoveCoupon = (code: string) => {
    setError(null);
    fetcher.submit(
      {
        action: 'removeCouponCode',
        couponCode: code,
      },
      {
        method: 'post',
        action: '/api/active-order',
      },
    );
  };

  // Check for errors from the fetcher
  const fetcherError =
    fetcher.data?.activeOrderError?.errorCode === 'COUPON_CODE_EXPIRED_ERROR' ||
    fetcher.data?.activeOrderError?.errorCode === 'COUPON_CODE_INVALID_ERROR' ||
    fetcher.data?.activeOrderError?.errorCode === 'COUPON_CODE_LIMIT_ERROR'
      ? fetcher.data.activeOrderError.message
      : null;

  const displayError = error || fetcherError;

  // Clear coupon code on successful application
  if (fetcher.state === 'idle' && fetcher.data && !fetcherError && couponCode) {
    setCouponCode('');
    onCouponApplied?.();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="couponCode" className="sr-only">
            {t('checkout.couponCode') || 'Coupon Code'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <TagIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              id="couponCode"
              name="couponCode"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setError(null);
              }}
              placeholder={
                t('checkout.couponCodePlaceholder') || 'Enter coupon code'
              }
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              disabled={fetcher.state === 'submitting'}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={fetcher.state === 'submitting' || !couponCode.trim()}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {fetcher.state === 'submitting'
            ? t('common.applying') || 'Applying...'
            : t('checkout.applyCoupon') || 'Apply'}
        </button>
      </form>

      {displayError && <Alert message={displayError} />}

      {appliedCouponCodes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {t('checkout.appliedCoupons') || 'Applied Coupons:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {appliedCouponCodes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
              >
                {code}
                <button
                  type="button"
                  onClick={() => handleRemoveCoupon(code)}
                  className="text-green-600 hover:text-green-800 focus:outline-none"
                  aria-label={`Remove coupon ${code}`}
                  disabled={fetcher.state === 'submitting'}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
