import { Fragment } from 'react';
import { Dialog, Disclosure, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/solid';
import { useSearchParams, useSubmit } from '@remix-run/react';
import { FacetFilterTracker } from '~/components/facet-filter/facet-filter-tracker';
import { useTranslation } from 'react-i18next';

export default function FacetFilterControls({
  facetFilterTracker,
  mobileFiltersOpen,
  setMobileFiltersOpen,
}: {
  facetFilterTracker: FacetFilterTracker;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (value: boolean) => void;
}) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const q = searchParams.getAll('q');
  const { t } = useTranslation();

  const handleMobileFilterChange = (
    facetValueId: string,
    checked: boolean,
  ) => {
    // Create new params preserving all existing search params
    const newParams = new URLSearchParams(searchParams);
    const currentFvids = newParams.getAll('fvid');

    if (checked) {
      // Add the facet value if not already present
      if (!currentFvids.includes(facetValueId)) {
        newParams.append('fvid', facetValueId);
      }
    } else {
      // Remove the facet value by filtering it out
      newParams.delete('fvid');
      currentFvids
        .filter((id) => id !== facetValueId)
        .forEach((id) => newParams.append('fvid', id));
    }

    // Submit the form with updated params, preserving all other params
    submit(newParams, { method: 'get', preventScrollReset: true });
  };

  return (
    <>
      {/* Mobile filter dialog */}
      <Transition.Root show={mobileFiltersOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 lg:hidden"
          onClose={setMobileFiltersOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="ml-auto relative max-w-xs w-full h-full glass-card shadow-xl py-4 pb-12 flex flex-col overflow-y-auto">
                <div className="px-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">
                    {t('common.filters')}
                  </h2>
                  <button
                    type="button"
                    className="-mr-2 w-10 h-10 glass-button p-2 rounded-md flex items-center justify-center text-white/70 hover:text-white"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    <span className="sr-only">{t('common.closeMenu')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4 border-t border-white/10">
                  <input type="hidden" name="q" value={q} />
                  {facetFilterTracker.facetsWithValues.map((facet) => (
                    <Disclosure
                      as="div"
                      key={facet.id}
                      defaultOpen={true}
                      className="border-t border-white/10 px-4 py-6"
                    >
                      {({ open }) => (
                        <>
                          <h3 className="-mx-2 -my-3 flow-root">
                            <Disclosure.Button className="px-2 py-3 glass-button w-full flex items-center justify-between text-white/60 hover:text-white rounded-lg">
                              <span className="font-medium text-white uppercase">
                                {facet.name}
                              </span>
                              <span className="ml-6 flex items-center">
                                {open ? (
                                  <MinusSmallIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <PlusSmallIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                            </Disclosure.Button>
                          </h3>
                          <Disclosure.Panel className="pt-6">
                            <div className="space-y-6">
                              {facet.values.map((value, optionIdx) => (
                                <div
                                  key={value.id}
                                  className="flex items-center"
                                >
                                  <input
                                    id={`filter-mobile-${facet.id}-${optionIdx}`}
                                    type="checkbox"
                                    checked={value.selected}
                                    onChange={(ev) =>
                                      handleMobileFilterChange(
                                        value.id,
                                        ev.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 border-white/20 rounded text-primary-600 focus:ring-primary-500 bg-white/10"
                                  />
                                  <label
                                    htmlFor={`filter-mobile-${facet.id}-${optionIdx}`}
                                    className="ml-3 min-w-0 flex-1 text-white/80"
                                  >
                                    {value.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <aside className="hidden lg:block glass-card rounded-xl p-6">
        <input type="hidden" name="q" value={q} />
        {facetFilterTracker.facetsWithValues.map((facet) => (
          <Disclosure
            as="div"
            key={facet.id}
            defaultOpen={true}
            className="border-b border-white/10 py-6 last:border-b-0"
          >
            {({ open }) => (
              <>
                <h3 className="-my-3 flow-root">
                  <Disclosure.Button className="py-3 glass-button w-full flex items-center justify-between text-sm text-white/60 hover:text-white rounded-lg">
                    <span className="font-medium text-white uppercase">
                      {facet.name}
                    </span>
                    <span className="ml-6 flex items-center">
                      {open ? (
                        <MinusSmallIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      ) : (
                        <PlusSmallIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                  </Disclosure.Button>
                </h3>
                <Disclosure.Panel className="pt-6">
                  <div className="space-y-4">
                    {facet.values.map((value, optionIdx) => (
                      <div key={value.id} className="flex items-center">
                        <input
                          id={`filter-${facet.id}-${optionIdx}`}
                          name={`fvid`}
                          defaultValue={value.id}
                          type="checkbox"
                          checked={value.selected}
                          onChange={() => {}}
                          className="h-4 w-4 border-white/20 rounded text-primary-600 focus:ring-primary-500 bg-white/10"
                        />
                        <label
                          htmlFor={`filter-${facet.id}-${optionIdx}`}
                          className="ml-3 text-sm text-white/80"
                        >
                          {value.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </aside>
    </>
  );
}
