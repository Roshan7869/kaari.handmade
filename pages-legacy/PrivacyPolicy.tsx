import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import KaariFooter from '@/components/KaariFooter';

const LAST_UPDATED = '26 March 2026';
const CONTACT_EMAIL = 'kaarihandmade@gmail.com';
const CONTACT_PHONE = '9131548788';
const BUSINESS_NAME = 'Kaari Handmade';

export default function PrivacyPolicy() {
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
            <h1 className="font-display text-4xl text-foreground mb-3">Privacy Policy</h1>
            <p className="font-body text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="prose prose-neutral max-w-none space-y-8 font-heritage text-foreground/80 text-base leading-relaxed">
            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">1. Introduction</h2>
              <p>
                Welcome to {BUSINESS_NAME} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We are committed to
                protecting your personal information and your right to privacy. This Privacy Policy explains how we
                collect, use, store, and share your information when you visit our website and make purchases.
              </p>
              <p className="mt-3">
                By using our website or placing an order, you agree to the terms described in this Privacy Policy. If
                you have any questions, you may contact us at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">2. Information We Collect</h2>
              <p>We collect information you provide directly, including:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>
                  <strong>Account Information:</strong> Name, email address, and password when you create an account.
                </li>
                <li>
                  <strong>Order Information:</strong> Shipping address, billing address, phone number, and order
                  details when you place an order.
                </li>
                <li>
                  <strong>Payment Information:</strong> We do not store card details. Payments are processed securely
                  by Cashfree Payments, a PCI-DSS compliant payment gateway.
                </li>
                <li>
                  <strong>Customisation Details:</strong> Any design preferences, messages, or files you upload for
                  custom orders.
                </li>
                <li>
                  <strong>Communications:</strong> Messages you send us via email or social media.
                </li>
              </ul>
              <p className="mt-3">We also collect certain information automatically when you visit our website:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Browser type, device type, and operating system</li>
                <li>Pages visited, time spent, and referring URLs</li>
                <li>IP address (anonymised where possible)</li>
                <li>Cookie identifiers (see Section 6)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Process and fulfil your orders</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Respond to your enquiries and provide customer support</li>
                <li>Personalise your shopping experience</li>
                <li>Detect and prevent fraud or security incidents</li>
                <li>Comply with legal obligations under Indian law (including the IT Act, 2000 and DPDP Act, 2023)</li>
                <li>Improve our website and product offerings using aggregated analytics</li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> sell, rent, or trade your personal information to third parties for their
                marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">4. Sharing Your Information</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>
                  <strong>Supabase:</strong> Our database and authentication provider, who stores your account and
                  order data securely on servers hosted in compliance with applicable data protection standards.
                </li>
                <li>
                  <strong>Cashfree Payments:</strong> Our payment processor, which receives your billing information
                  to complete transactions. Cashfree&apos;s privacy policy governs their handling of payment data.
                </li>
                <li>
                  <strong>Shipping Partners:</strong> Courier services who receive your name and delivery address to
                  fulfil orders.
                </li>
                <li>
                  <strong>Legal Authorities:</strong> When required by law, court order, or to protect our legal
                  rights.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">5. Data Retention</h2>
              <p>
                We retain your personal data for as long as necessary to provide our services, comply with legal
                obligations, and resolve disputes. Order records are retained for a minimum of 7 years as required by
                Indian GST and accounting laws. You may request deletion of your account data by contacting us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">6. Cookies</h2>
              <p>Our website uses the following types of cookies:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>
                  <strong>Essential Cookies:</strong> Required for login sessions, cart functionality, and payment
                  security.
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Google Tag Manager anonymised analytics to understand how
                  visitors use our site.
                </li>
              </ul>
              <p className="mt-3">
                You can disable non-essential cookies in your browser settings. Disabling essential cookies may prevent
                login and checkout from working correctly.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">7. Security</h2>
              <p>
                We take reasonable technical and organisational measures to protect your personal data, including:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>HTTPS encryption in transit</li>
                <li>Row-level security (RLS) policies on our database</li>
                <li>Input sanitisation to prevent injection attacks</li>
                <li>Rate limiting on authentication and payment endpoints</li>
                <li>HMAC-SHA256 webhook signature validation</li>
              </ul>
              <p className="mt-3">
                Despite our best efforts, no method of transmission over the internet is 100% secure. If you discover
                a security vulnerability, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">8. Your Rights</h2>
              <p>Under the Digital Personal Data Protection Act, 2023 (DPDP Act), you have the right to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate or incomplete personal data</li>
                <li>Erase your personal data (where legally permissible)</li>
                <li>Withdraw consent at any time (where processing is based on consent)</li>
                <li>Nominate a person to exercise these rights on your behalf</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">9. Children&apos;s Privacy</h2>
              <p>
                Our services are not directed to children under 18 years of age. We do not knowingly collect personal
                information from minors. If you believe a child has provided us with their data, please contact us and
                we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting
                the updated policy on this page with a revised &quot;Last updated&quot; date. Continued use of our
                website after changes are posted constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-foreground mb-3">11. Contact Us</h2>
              <p>For any privacy-related queries, please contact:</p>
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
                <p>Instagram: @kaari.handmade</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <KaariFooter />
    </main>
  );
}
