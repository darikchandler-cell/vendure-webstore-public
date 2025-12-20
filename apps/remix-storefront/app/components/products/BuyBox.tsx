/**
 * Buy Box Component
 * Product purchase section with price, quantity, add to cart, compare, SKU, UPC, and shipping alerts
 */

import { useState } from 'react';
import { Price } from './Price';
import { StockLevelLabel } from './StockLevelLabel';
import { CheckIcon, HeartIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import Alert from '~/components/Alert';
import { CurrencyCode } from '~/generated/graphql';

interface Variant {
  id: string;
  name: string;
  priceWithTax: number;
  currencyCode: string;
  sku: string;
  stockLevel: string;
}

interface BuyBoxProps {
  variants: Variant[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
  onAddToCart: (e: React.FormEvent<HTMLFormElement>) => void;
  qtyInCart: number;
  isSubmitting: boolean;
  error?: string;
  upc?: string;
  shippingAlert?: string;
  onCompareToggle?: (checked: boolean) => void;
}

export function BuyBox({
  variants,
  selectedVariantId,
  onVariantChange,
  onAddToCart,
  qtyInCart,
  isSubmitting,
  error,
  upc,
  shippingAlert,
  onCompareToggle,
}: BuyBoxProps) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [compareChecked, setCompareChecked] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const handleCompareChange = (checked: boolean) => {
    setCompareChecked(checked);
    onCompareToggle?.(checked);
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <form onSubmit={onAddToCart} className="space-y-6">
        {/* Variant Selection */}
        {variants.length > 1 && (
          <div>
            <label
              htmlFor="productVariant"
              className="block text-sm font-medium text-white/90 mb-2"
            >
              {t('product.selectOption')}
            </label>
            <select
              id="productVariant"
              name="variantId"
              value={selectedVariantId}
              onChange={(e) => onVariantChange(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price */}
        <div>
          <div className="text-4xl font-bold text-white mb-2">
            <Price
              priceWithTax={selectedVariant?.priceWithTax ?? 0}
              currencyCode={
                (selectedVariant?.currencyCode as CurrencyCode) ??
                CurrencyCode.Usd
              }
            />
          </div>
        </div>

        {/* Quantity Selector */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-white/90 mb-2"
          >
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter in quantity field
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            aria-label="Quantity"
            className="glass-input w-24 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        {/* Add to Cart Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label={
            qtyInCart > 0 ? `${qtyInCart} items in cart` : 'Add to cart'
          }
          className={`w-full glass-button py-4 px-6 rounded-lg text-lg font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent ${
            isSubmitting
              ? 'opacity-50 cursor-not-allowed'
              : qtyInCart > 0
              ? 'bg-green-600/20 hover:bg-green-600/30'
              : 'hover:bg-white/20'
          }`}
        >
          {qtyInCart > 0 ? (
            <span className="flex items-center justify-center">
              <CheckIcon className="w-5 h-5 mr-2" aria-hidden="true" />
              {qtyInCart} {t('product.inCart')}
            </span>
          ) : (
            t('product.addToCart')
          )}
        </button>

        {/* Compare Checkbox */}
        {onCompareToggle && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="compare"
              checked={compareChecked}
              onChange={(e) => handleCompareChange(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
            />
            <label htmlFor="compare" className="ml-2 text-sm text-white/80">
              Add to Compare
            </label>
          </div>
        )}

        {/* Trust Signals */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          {selectedVariant?.sku && (
            <div className="flex items-center text-sm text-white/70">
              <span className="font-medium mr-2">SKU:</span>
              <span className="font-mono">{selectedVariant.sku}</span>
            </div>
          )}
          {upc && (
            <div className="flex items-center text-sm text-white/70">
              <span className="font-medium mr-2">UPC:</span>
              <span className="font-mono">{upc}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-white/70">
            <StockLevelLabel stockLevel={selectedVariant?.stockLevel} />
          </div>
          {shippingAlert && (
            <div className="glass-card bg-yellow-500/20 border-yellow-500/30 p-3 rounded-lg">
              <p className="text-sm text-yellow-200 font-medium">
                {shippingAlert}
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4">
            <Alert message={error} />
          </div>
        )}
      </form>
    </div>
  );
}
