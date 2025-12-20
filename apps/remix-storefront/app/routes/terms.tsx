import { MetaFunction } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Terms of Service | Vendure Storefront' },
    {
      name: 'description',
      content: 'Terms and conditions for using our store',
    },
  ];
};

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-invert max-w-none">
        <p className="text-sm text-gray-400 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="mb-4">
            By accessing and using this website, you accept and agree to be
            bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily access the materials on our
            website for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Products and Pricing
          </h2>
          <p className="mb-4">
            We reserve the right to change prices and product availability at
            any time. All prices are displayed in the currency specified and are
            subject to change without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Orders and Payment</h2>
          <p className="mb-4">
            By placing an order, you agree to provide accurate and complete
            information. We reserve the right to refuse or cancel any order for
            any reason, including but not limited to product availability,
            errors in pricing, or fraud prevention.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            5. Shipping and Delivery
          </h2>
          <p className="mb-4">
            Shipping times are estimates and not guaranteed. We are not
            responsible for delays caused by shipping carriers or customs.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            6. Returns and Refunds
          </h2>
          <p className="mb-4">
            Please refer to our Returns Policy for information about returns and
            refunds. We reserve the right to refuse returns that do not meet our
            return policy requirements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            7. Intellectual Property
          </h2>
          <p className="mb-4">
            All content on this website, including text, graphics, logos, and
            images, is the property of our company and is protected by copyright
            and trademark laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            8. Limitation of Liability
          </h2>
          <p className="mb-4">
            In no event shall our company be liable for any damages arising out
            of the use or inability to use the materials on this website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            9. Contact Information
          </h2>
          <p className="mb-4">
            If you have questions about these terms, please contact us at:
          </p>
          <p className="mb-4">
            Email: legal@yourcompany.com
            <br />
            Address: [REPLACE: Your Company Address, City, State, ZIP Code,
            Country]
          </p>
          <p className="text-sm text-yellow-400 italic mt-4">
            ⚠️ IMPORTANT: Before launching, replace the email and address above
            with your actual company contact information.
          </p>
        </section>
      </div>
    </div>
  );
}
