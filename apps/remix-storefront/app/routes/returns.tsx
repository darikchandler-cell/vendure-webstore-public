import { MetaFunction } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Returns & Refunds Policy | Vendure Storefront' },
    { name: 'description', content: 'Our returns and refunds policy' },
  ];
};

export default function ReturnsPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Returns & Refunds Policy</h1>
      <div className="prose prose-invert max-w-none">
        <p className="text-sm text-gray-400 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Return Eligibility</h2>
          <p className="mb-4">
            Items must be returned within 30 days of delivery. Products must be
            unused, in their original packaging, and in the same condition as
            when received.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How to Return</h2>
          <p className="mb-4">To initiate a return:</p>
          <ol className="list-decimal pl-6 mb-4">
            <li>Contact our customer service team</li>
            <li>Provide your order number and reason for return</li>
            <li>Receive a return authorization and shipping label</li>
            <li>Package the item securely and ship it back</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Refund Process</h2>
          <p className="mb-4">
            Once we receive and inspect your returned item, we will process your
            refund within 5-10 business days. Refunds will be issued to the
            original payment method.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            4. Non-Returnable Items
          </h2>
          <p className="mb-4">The following items cannot be returned:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Customized or personalized products</li>
            <li>Perishable goods</li>
            <li>Intimate or sanitary goods</li>
            <li>Items damaged by misuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Shipping Costs</h2>
          <p className="mb-4">
            Return shipping costs are the responsibility of the customer unless
            the item was defective or we made an error in your order.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Exchanges</h2>
          <p className="mb-4">
            We currently do not offer direct exchanges. To exchange an item,
            please return it and place a new order for the desired item.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p className="mb-4">
            For questions about returns, please contact us at:
          </p>
          <p className="mb-4">
            Email: returns@yourcompany.com
            <br />
            Phone: [REPLACE: Your Phone Number with Country Code]
          </p>
          <p className="text-sm text-yellow-400 italic mt-4">
            ⚠️ IMPORTANT: Before launching, replace the email and phone number
            above with your actual company contact information.
          </p>
        </section>
      </div>
    </div>
  );
}
