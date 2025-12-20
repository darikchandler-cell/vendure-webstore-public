/**
 * Technical Specs Component
 * Displays product technical specifications using semantic HTML (<dl>, <dt>, <dd>)
 * for AI readability and SEO optimization
 */

import { useTranslation } from 'react-i18next';

interface TechnicalSpec {
  label: string;
  value: string | number;
  unit?: string;
}

interface TechnicalSpecsProps {
  specs: TechnicalSpec[];
  className?: string;
}

export function TechnicalSpecs({ specs, className = '' }: TechnicalSpecsProps) {
  const { t } = useTranslation();

  if (!specs || specs.length === 0) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4">
          {t('product.technicalSpecs') || 'Technical Specifications'}
        </h3>
        <p className="text-white/60">
          {t('product.noSpecsAvailable') ||
            'No technical specifications available.'}
        </p>
      </div>
    );
  }

  return (
    <section
      className={`glass-card rounded-xl p-6 ${className}`}
      aria-label="Technical Specifications"
    >
      <h3 className="text-xl font-semibold text-white mb-6">
        {t('product.technicalSpecs') || 'Technical Specifications'}
      </h3>
      <dl className="space-y-4">
        {specs.map((spec, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
          >
            <dt className="text-sm font-medium text-white/80 mb-1 sm:mb-0 sm:w-1/3 sm:pr-4">
              {spec.label}
            </dt>
            <dd className="text-sm text-white/90 sm:w-2/3">
              {typeof spec.value === 'number'
                ? spec.value.toLocaleString()
                : spec.value}
              {spec.unit && (
                <span className="text-white/60 ml-1">{spec.unit}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
