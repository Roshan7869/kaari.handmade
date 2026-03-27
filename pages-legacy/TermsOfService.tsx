import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import KaariFooter from '@/components/KaariFooter';

const LAST_UPDATED = '26 March 2026';
const CONTACT_EMAIL = 'kaarihandmade@gmail.com';
const CONTACT_PHONE = '9131548788';
const BUSINESS_NAME = 'Kaari Handmade';

export default function TermsOfService() {
  return (
    <main className="overflow-x-hidden">
      <Navbar variant="solid" />

      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="mb-10">
            <p className="font-heritage text-accent text-sm tracking-[0.3em] uppercase mb-2">Legal</p>
            <h1 className="font-display text-4xl text-foreground mb-3">Terms of Service</h1>
            <p className="font-body text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="prose prose-neutral max-w-none space-y-8 font-heritage text-foreground/80 text-base leading-relaxed">
            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing or using the {BUSINESS_NAME} website (&quot;Site&quot;) or purchasing our products, you
                agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms,
                please do not use our Site or services.
              </p>
              <p className="mt-3">
                These Terms constitute a legally binding agreement between you and {BUSINESS_NAME}, a handmade craft
                business operating in India. These Terms are governed by the laws of India, including the Indian
                Contract Act, 1872, the Consumer Protection Act, 2019, and the Information Technology Act, 2000.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">2. Products & Orders</h2>
              <h3 className="font-display text-lg text-foreground mb-2 mt-4">2.1 Handmade Products</h3>
              <p>
                All products are handmade by skilled artisans. Minor variations in colour, size, stitch pattern, and
                texture are inherent to the craft and not considered defects. Product images are representative; exact
                shades may differ due to screen calibration.
              </p>
              <h3 className="font-display text-lg text-foreground mb-2 mt-4">2.2 Pricing</h3>
              <p>
                All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes where stated.
                Shipping charges are shown at checkout. We reserve the right to update prices without prior notice;
                prices at the time of placing an order are final.
              </p>
              <h3 className="font-display text-lg text-foreground mb-2 mt-4">2.3 Order Acceptance</h3>
              <p>
                Placing an order constitutes an offer to purchase. We reserve the right to cancel or reject any order
                due to stock unavailability, pricing errors, or suspected fraud. You will be notified and fully
                refunded if an order is cancelled by us.
              </p>
              <h3 className="font-display text-lg text-foreground mb-2 mt-4">2.4 Custom Orders</h3>
              <p>
                Custom orders require your approval of a quote before production begins. Once a custom order enters
                production, it cannot be cancelled. Custom items are non-returnable unless they arrive damaged or
                significantly different from the agreed specification.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">3. Payment</h2>
              <p>
                Payments are processed securely through Cashfree Payments, a Reserve Bank of India (RBI) licensed
                payment aggregator. We accept UPI, debit cards, credit cards, and net banking. Cash on Delivery (COD)
                may be available in select areas.
              </p>
              <p className="mt-3">
                By providing payment information, you represent that you are authorised to use the payment method. We
                do not store card details on our servers.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">4. Shipping & Delivery</h2>
              <p>
                We ship within India. Standard delivery takes 5–10 business days; express options may be available at
                additional cost. Delivery timelines are estimates and may vary due to courier delays, holidays, or
                unforeseen events.
              </p>
              <p className="mt-3">
                Risk of loss and title pass to you upon dispatch. If an order is lost in transit, please contact us
                within 15 days of the expected delivery date so we can raise a claim with the courier.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">5. Returns, Exchanges & Refunds</h2>
              <h3 className="font-display text-lg text-foreground mb-2 mt-4">5.1 Standard Products</h3>
              <p>
                We accept returns within <strong>7 days</strong> of delivery for standard (non-custom) products,
                provided the item is unused, in its original packaging, and accompanied by proof of purchase.
              </p>
              <h3 className="font-display text-lg text-foreground mb-2 mt-4">5.2 Damaged / Defective Items</h3>
              <p>
                If you receive a damaged or defective item, please contact us within <strong>48 hours</strong> of
                delivery with photographs. We will arrange a replacement or full refund at our discretion.
              </p>
              <h3 className="font-display text-lg text-foreground mb-2 mt-4">5.3 Refund Timeline</h3>
              <p>
                Approved refunds are processed within 5–7 business days. Refunds are credited to the original payment
                method. Shipping costs are non-refundable unless the return is due to our error.
              </p>
              <h3 className="font-display text-lg text-foreground mb-2 mt-4">5.4 Non-Returnable Items</h3>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Custom or personalised orders (unless defective)</li>
                <li>Items damaged due to misuse or improper care</li>
                <li>Items returned after 7 days without prior approval</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">6. Intellectual Property</h2>
              <p>
                All designs, images, logos, and content on this Site are the intellectual property of{' '}
                {BUSINESS_NAME} or our artisans. You may not reproduce, distribute, or create derivative works without
                our written permission. Purchasing a product does not grant you any licence to reproduce or sell our
                designs.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">7. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You agree to
                notify us immediately of any unauthorised access to your account. We are not liable for losses arising
                from unauthorised use of your account.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">8. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Use the Site for any unlawful purpose</li>
                <li>Attempt to gain unauthorised access to any part of our system</li>
                <li>Interfere with or disrupt the integrity or performance of the Site</li>
                <li>Use automated tools (bots, scrapers) to access product or pricing data</li>
                <li>Submit false or fraudulent orders</li>
                <li>Impersonate another person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">9. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by Indian law, {BUSINESS_NAME} is not liable for any indirect,
                incidental, special, or consequential damages arising from your use of our Site or products. Our total
                liability to you for any claim shall not exceed the amount you paid for the order in question.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">10. Governing Law & Disputes</h2>
              <p>
                These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive
                jurisdiction of the courts located in Madhya Pradesh, India. We encourage you to contact us first to
                resolve any dispute amicably before initiating legal proceedings.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">11. Changes to Terms</h2>
              <p>
                We reserve the right to update these Terms at any time. Updated Terms will be posted on this page with
                a revised &quot;Last updated&quot; date. Continued use of our Site after changes are posted
                constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">12. Contact Us</h2>
              <p>For questions about these Terms, please contact:</p>
              <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-1">
                <p>
                  <strong>{BUSINESS_NAME}</strong>
                </p>
                <p>
                  Email:{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p>
                  Phone:{' '}
                  <a href={`tel:${CONTACT_PHONE}`} className="text-accent hover:underline">
                    {CONTACT_PHONE}
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <KaariFooter />
    </main>
  );
}
