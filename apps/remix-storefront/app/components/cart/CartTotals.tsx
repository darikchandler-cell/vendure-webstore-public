import { Price } from '~/components/products/Price';
import { OrderDetailFragment } from '~/generated/graphql';
import { useTranslation } from 'react-i18next';

export function CartTotals({
  order,
}: {
  order?: OrderDetailFragment | null | undefined | any;
}) {
  const { t } = useTranslation();

  const totalDiscount =
    order?.discounts?.reduce(
      (acc: number, discount: { amountWithTax?: number | null }) =>
        acc + (discount.amountWithTax || 0),
      0,
    ) || 0;

  return (
    <dl className="border-t mt-6 border-gray-200 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <dt className="text-sm">{t('common.subtotal')}</dt>
        <dd className="text-sm font-medium text-gray-900">
          <Price
            priceWithTax={order?.subTotalWithTax}
            currencyCode={order?.currencyCode}
          ></Price>
        </dd>
      </div>
      {totalDiscount > 0 && (
        <div className="flex items-center justify-between">
          <dt className="text-sm text-green-600">
            {t('checkout.discount') || 'Discount'}
            {order?.couponCodes && order.couponCodes.length > 0 && (
              <span className="ml-2 text-xs">
                ({order.couponCodes.join(', ')})
              </span>
            )}
          </dt>
          <dd className="text-sm font-medium text-green-600">
            -
            <Price
              priceWithTax={totalDiscount}
              currencyCode={order?.currencyCode}
            ></Price>
          </dd>
        </div>
      )}
      <div className="flex items-center justify-between">
        <dt className="text-sm">{t('common.shipping')}</dt>
        <dd className="text-sm font-medium text-gray-900">
          <Price
            priceWithTax={order?.shippingWithTax ?? 0}
            currencyCode={order?.currencyCode}
          ></Price>
        </dd>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <dt className="text-base font-medium">{t('common.total')}</dt>
        <dd className="text-base font-medium text-gray-900">
          <Price
            priceWithTax={order?.totalWithTax}
            currencyCode={order?.currencyCode}
          ></Price>
        </dd>
      </div>
    </dl>
  );
}
