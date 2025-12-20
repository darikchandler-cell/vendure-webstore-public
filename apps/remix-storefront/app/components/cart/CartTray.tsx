import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CartContents } from './CartContents';
import { Link, useLocation } from '@remix-run/react';
import { Price } from '~/components/products/Price';
import { CartLoaderData } from '~/routes/api.active-order';
import { CurrencyCode } from '~/generated/graphql';
import { useTranslation } from 'react-i18next';

export function CartTray({
  open,
  onClose,
  activeOrder,
  adjustOrderLine,
  removeItem,
}: {
  open: boolean;
  onClose: (closed: boolean) => void;
  activeOrder: CartLoaderData['activeOrder'] | null | undefined | any;
  adjustOrderLine?: (lineId: string, quantity: number) => void;
  removeItem?: (lineId: string) => void;
}) {
  const currencyCode = activeOrder?.currencyCode || CurrencyCode.Usd;
  const location = useLocation();
  const editable = !location.pathname.startsWith('/checkout');
  const { t } = useTranslation();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden z-20"
        onClose={onClose}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 pl-0 sm:pl-10 max-w-full flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300 sm:duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300 sm:duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen max-w-full md:max-w-md">
                <div className="h-full flex flex-col glass-card overflow-y-scroll">
                  <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg font-medium text-white">
                        {t('cart.title')}
                      </Dialog.Title>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          type="button"
                          className="-m-2 p-2 text-white/60 hover:text-white transition-colors"
                          onClick={() => onClose(false)}
                        >
                          <span className="sr-only">
                            {t('common.closePanel')}
                          </span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-8">
                      {activeOrder?.totalQuantity ? (
                        <CartContents
                          orderLines={activeOrder?.lines ?? []}
                          currencyCode={currencyCode!}
                          editable={editable}
                          removeItem={removeItem}
                          adjustOrderLine={adjustOrderLine}
                        ></CartContents>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-xl text-white/60">
                          {t('cart.empty')}
                        </div>
                      )}
                    </div>
                  </div>

                  {activeOrder?.totalQuantity && editable && (
                    <div className="border-t border-white/10 py-6 px-4 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-white">
                        <p>{t('common.subtotal')}</p>
                        <p>
                          {currencyCode && (
                            <Price
                              priceWithTax={activeOrder?.subTotalWithTax ?? 0}
                              currencyCode={currencyCode}
                            />
                          )}
                        </p>
                      </div>
                      <p className="mt-0.5 text-sm text-white/60">
                        {t('cart.shippingMessage')}
                      </p>
                      <div className="mt-6">
                        <Link
                          to="/checkout"
                          onClick={() => onClose(false)}
                          className="glass-button flex justify-center items-center px-6 py-3 rounded-md text-base font-medium text-white hover:bg-white/20 transition-all"
                        >
                          {t('cart.checkout')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
