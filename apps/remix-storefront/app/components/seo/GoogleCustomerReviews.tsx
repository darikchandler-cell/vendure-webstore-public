/**
 * Google Customer Reviews Badge Component
 * Displays Google Customer Reviews trust badge and collects reviews
 */

interface GoogleCustomerReviewsProps {
  merchantId?: string;
  orderId?: string;
  email?: string;
  country?: string;
  estimatedDeliveryDate?: string;
}

/**
 * Google Customer Reviews Badge
 * Display on product pages and homepage
 */
export function GoogleCustomerReviewsBadge({
  merchantId = process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_ID || '',
}: {
  merchantId?: string;
}) {
  if (!merchantId) {
    return null;
  }

  return (
    <div
      id="google-customer-reviews-badge"
      data-merchant-id={merchantId}
      data-badge-type="badge"
    />
  );
}

/**
 * Google Customer Reviews Opt-in Script
 * Add to checkout completion page
 */
export function GoogleCustomerReviewsOptIn({
  merchantId,
  orderId,
  email,
  country = 'US',
  estimatedDeliveryDate,
}: GoogleCustomerReviewsProps) {
  if (!merchantId || !orderId || !email) {
    return null;
  }

  const deliveryDate = estimatedDeliveryDate || 
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days from now

  return (
    <>
      <script
        src="https://apis.google.com/js/platform.js?onload=renderOptIn"
        async
        defer
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.renderOptIn = function() {
              window.gapi.load('surveyoptin', function() {
                window.gapi.surveyoptin.render({
                  "merchant_id": ${merchantId},
                  "order_id": "${orderId}",
                  "email": "${email}",
                  "delivery_country": "${country}",
                  "estimated_delivery_date": "${deliveryDate}"
                });
              });
            };
          `,
        }}
      />
    </>
  );
}


