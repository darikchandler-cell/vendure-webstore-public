import { MetaFunction } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

export const meta: MetaFunction = () => {
  return [
    { title: 'Privacy Policy | Vendure Storefront' },
    {
      name: 'description',
      content: 'Our privacy policy and data protection practices',
    },
  ];
};

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none">
        <p className="text-sm text-gray-400 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            We respect your privacy and are committed to protecting your
            personal data. This privacy policy explains how we collect, use, and
            safeguard your information when you visit our store.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Information We Collect
          </h2>
          <p className="mb-4">We collect the following types of information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              Personal identification information (name, email address, phone
              number)
            </li>
            <li>Shipping and billing addresses</li>
            <li>
              Payment information (processed securely through third-party
              payment processors)
            </li>
            <li>Order history and preferences</li>
            <li>Website usage data and analytics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. How We Use Your Information
          </h2>
          <p className="mb-4">We use your information to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders and account</li>
            <li>Improve our website and services</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Protection</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to
            protect your personal data against unauthorized access, alteration,
            disclosure, or destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
          <p className="mb-4">
            We use cookies to enhance your browsing experience, analyze site
            traffic, and personalize content. You can control cookies through
            your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            7. Third-Party Services
          </h2>
          <p className="mb-4">
            We may share your information with trusted third-party service
            providers who assist us in operating our website, conducting
            business, or serving you, as long as they agree to keep this
            information confidential.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this privacy policy, please contact us
            at:
          </p>
          <p className="mb-4">
            Email: privacy@yourcompany.com
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
