import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, XCircle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import KaariFooter from '@/components/KaariFooter';

type CheckpointStatus = 'done' | 'partial' | 'missing';

interface Checkpoint {
  id: string;
  title: string;
  status: CheckpointStatus;
  description: string;
  guide: string;
}

interface Area {
  id: string;
  emoji: string;
  label: string;
  checkpoints: Checkpoint[];
}

const AREAS: Area[] = [
  {
    id: 'security',
    emoji: '🔒',
    label: 'Security',
    checkpoints: [
      {
        id: 'sec-1',
        title: 'CASHFREE_SECRET_KEY in server-only env vars',
        status: 'partial',
        description:
          'The Cashfree secret key must never be exposed to the browser. Currently the client-side cashfree.ts can reference it; ensure it lives only in Supabase Edge Function environment variables.',
        guide:
          'Move CASHFREE_SECRET_KEY to your Supabase Edge Function secrets (Project Settings → Edge Functions → Secrets). Remove it from any VITE_ prefixed env var. The client should only receive a short-lived payment token from the server, never the secret.',
      },
      {
        id: 'sec-2',
        title: 'Webhook HMAC-SHA256 signature validation',
        status: 'done',
        description:
          'Your webhook.ts validates Cashfree callbacks using HMAC-SHA256 with constant-time comparison, preventing signature forgery and timing attacks.',
        guide: 'Already implemented in src/lib/webhook.ts. Ensure validateWebhookSignature() is called in the Edge Function before processing any webhook payload.',
      },
      {
        id: 'sec-3',
        title: 'Server-side amount re-verification after payment',
        status: 'partial',
        description:
          'After a payment callback, re-fetch the expected order amount from the database and compare it with the amount reported by the gateway — this prevents price manipulation attacks.',
        guide:
          'In your payment-webhook Edge Function, after signature validation: 1) fetch the order from DB using the order_id. 2) Compare order.total_amount with the amount in the webhook payload. 3) If they differ, mark the payment as fraudulent and do NOT fulfil the order.',
      },
      {
        id: 'sec-4',
        title: 'Input sanitisation (XSS prevention)',
        status: 'done',
        description:
          'src/lib/sanitization.ts provides sanitizeTextInput(), sanitizeSearchQuery(), sanitizeUrl(), validateEmail(), and validatePhone() — all user-facing forms use these.',
        guide: 'Already implemented. Ensure every new form field calls sanitizeTextInput() on change. For search queries, always use sanitizeSearchQuery().',
      },
      {
        id: 'sec-5',
        title: 'Rate limiting on auth & payment endpoints',
        status: 'done',
        description:
          'src/lib/rateLimit.ts limits login to 5 attempts/15 min, signup to 3/hr, payment to 5/hr, and checkout to 10/15 min with exponential backoff.',
        guide: 'Already implemented. For server-side hardening, also add Supabase Auth\'s built-in brute-force protection (Auth settings → Security).',
      },
      {
        id: 'sec-6',
        title: 'Open redirect prevention',
        status: 'done',
        description:
          'src/lib/redirect.ts validates redirect URLs against an allowlist, blocking protocol-relative and external redirects.',
        guide: 'Already implemented. Add your production domain to the ALLOWED_DOMAINS array in src/lib/redirect.ts before going live.',
      },
      {
        id: 'sec-7',
        title: 'Constant-time comparison (timing attack prevention)',
        status: 'done',
        description:
          'timingSafeEqual() in webhook.ts prevents timing attacks during signature comparison using XOR comparison rather than short-circuit string equality.',
        guide: 'Already implemented in src/lib/webhook.ts. Never use === for secret/signature comparison.',
      },
      {
        id: 'sec-8',
        title: 'CSP & security headers configured',
        status: 'done',
        description:
          'Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy headers are configured in public/_headers (Netlify) and vercel.json.',
        guide: 'Already implemented. Before launch, audit your CSP with https://csp-evaluator.withgoogle.com/ and tighten the script-src directive to remove \'unsafe-inline\' if possible.',
      },
    ],
  },
  {
    id: 'legal',
    emoji: '⚖️',
    label: 'Legal & Compliance',
    checkpoints: [
      {
        id: 'legal-1',
        title: 'Privacy Policy page live at /privacy',
        status: 'done',
        description:
          'A full Privacy Policy covering data collection, usage, sharing, cookies, DPDP Act 2023 rights, and contact details is now live at /privacy.',
        guide: 'Page is live. Review it with a legal advisor to ensure it matches your exact data flows, especially if you integrate new third-party services.',
      },
      {
        id: 'legal-2',
        title: 'Terms of Service page live at /terms',
        status: 'done',
        description:
          'Terms of Service covering orders, pricing, shipping, returns, refunds, intellectual property, and governing law (Indian courts) is live at /terms.',
        guide: 'Page is live. Have a lawyer review the liability limitation clause and consumer protection obligations under the Consumer Protection Act, 2019.',
      },
      {
        id: 'legal-3',
        title: 'Refund & Return policy documented',
        status: 'done',
        description:
          'Refund and return policy is included in the Terms of Service: 7-day returns for standard items, 48-hour damage reporting, 5–7 business day refund processing.',
        guide: 'The policy is within Terms of Service (Section 5). If you want a dedicated page for better discoverability, create src/pages/RefundPolicy.tsx and link it from the footer and checkout page.',
      },
      {
        id: 'legal-4',
        title: 'Cookie consent banner',
        status: 'missing',
        description:
          'No cookie consent banner is shown to new visitors. While India\'s DPDP Act 2023 is still being operationalised, best practice for international visitors requires explicit consent for analytics cookies.',
        guide:
          'Add a simple cookie consent banner component: 1) Show on first visit using localStorage flag. 2) Offer Accept / Decline for analytics cookies. 3) Only load GTM/analytics scripts after consent. Consider using react-cookie-consent library or a minimal custom implementation.',
      },
      {
        id: 'legal-5',
        title: 'IT Act 2000 / DPDP 2023 compliance notice',
        status: 'partial',
        description:
          'The Privacy Policy references the DPDP Act 2023, but the signup form lacks an explicit consent checkbox linking to the Privacy Policy.',
        guide:
          'On the signup form, add: [ ] I agree to the Privacy Policy and Terms of Service (required checkbox). On the checkout form, add: "By placing this order you agree to our Terms of Service and Privacy Policy."',
      },
      {
        id: 'legal-6',
        title: 'Cashfree merchant KYC & business registration',
        status: 'partial',
        description:
          'Cashfree test mode is active. Live payment collection requires completing merchant KYC, GST registration (if applicable), and business verification on the Cashfree merchant dashboard.',
        guide:
          'Log in to merchant.cashfree.com → Go Live → Complete KYC. Required documents: PAN card, Aadhaar, bank account details, GST certificate (if turnover > ₹20 LPA). Processing takes 2–3 business days.',
      },
    ],
  },
  {
    id: 'performance',
    emoji: '⚡',
    label: 'Performance & Reliability',
    checkpoints: [
      {
        id: 'perf-1',
        title: 'Code splitting & lazy loading',
        status: 'done',
        description:
          'All route-level components use React.lazy() + Suspense with a PageLoader fallback, creating separate JS bundles per route.',
        guide: 'Already implemented in App.tsx. Run `npm run build` and inspect the dist/ folder — each route should produce its own chunk file.',
      },
      {
        id: 'perf-2',
        title: 'Image optimisation (WebP format)',
        status: 'done',
        description:
          'Product images are served in WebP format with lazy loading on all img tags. The imageConversion.ts utility handles format conversion.',
        guide: 'Already implemented. For further gains, set explicit width and height on above-the-fold images to prevent Cumulative Layout Shift (CLS).',
      },
      {
        id: 'perf-3',
        title: 'React Query caching (stale-while-revalidate)',
        status: 'done',
        description:
          'TanStack React Query caches product data with 30s stale time, reducing redundant API calls and delivering instant navigation for cached pages.',
        guide: 'Already implemented. To improve cache lifetime for static data, increase staleTime for products to 5 minutes: staleTime: 1000 * 60 * 5.',
      },
      {
        id: 'perf-4',
        title: 'Error boundaries on key components',
        status: 'done',
        description:
          'ErrorBoundary component wraps critical UI regions, preventing a crash in one component from taking down the entire page.',
        guide: 'Already implemented in src/components/ErrorBoundary.tsx. Ensure it wraps cart, checkout, and payment sections.',
      },
      {
        id: 'perf-5',
        title: 'Loading skeletons for product grid',
        status: 'done',
        description:
          'ProductCardSkeleton components are shown while database products load, maintaining layout stability and perceived performance.',
        guide: 'Already implemented. Consider adding skeletons to the product detail page gallery too.',
      },
      {
        id: 'perf-6',
        title: '404 Not Found page',
        status: 'done',
        description:
          'A custom NotFound page is served for unknown routes, providing navigation back to the shop.',
        guide: 'Already implemented in src/pages/NotFound.tsx. Ensure the page includes a link back to the home page and product catalogue.',
      },
      {
        id: 'perf-7',
        title: 'Error tracking service (Sentry / LogRocket)',
        status: 'missing',
        description:
          'Currently logger.ts is silent in production. Runtime errors are invisible, making it hard to diagnose customer-reported issues.',
        guide:
          'Install Sentry: `npm install @sentry/react`. In main.tsx, add: Sentry.init({ dsn: "YOUR_DSN", environment: import.meta.env.MODE }). Wrap your app in <Sentry.ErrorBoundary>. Sign up free at sentry.io.',
      },
    ],
  },
  {
    id: 'ux',
    emoji: '🛒',
    label: 'UX & Conversion',
    checkpoints: [
      {
        id: 'ux-1',
        title: 'Mobile-responsive design',
        status: 'done',
        description:
          'Tailwind CSS responsive utilities (sm:, md:, lg:) ensure the layout adapts across phone, tablet, and desktop viewports.',
        guide: 'Already implemented. Test with Chrome DevTools device emulation at 375px (iPhone SE) and 390px (iPhone 14) widths.',
      },
      {
        id: 'ux-2',
        title: 'Product search & category filters',
        status: 'done',
        description:
          'ProductGrid.tsx provides full-text search, 8 category filters, 4 sort options, and pagination — all client-side with sanitised input.',
        guide: 'Already implemented. Consider adding server-side full-text search (Supabase FTS) when the product catalogue exceeds 200 items for better performance.',
      },
      {
        id: 'ux-3',
        title: 'Product customisation flow with quote system',
        status: 'done',
        description:
          'Products with allow_customization: true support a full customisation workflow: message, size, colour, material, file uploads, budget range, delivery deadline, and quote approval.',
        guide: 'Already implemented. Notify customers via email when their quote is approved or rejected — currently this requires manual Supabase notification triggers.',
      },
      {
        id: 'ux-4',
        title: 'Cart synced to Supabase (cross-device)',
        status: 'done',
        description:
          'Cart items are persisted in the Supabase database linked to the user\'s account, so the cart survives page refreshes, browser restarts, and device switches.',
        guide: 'Already implemented in CartContext.tsx. Ensure RLS policies allow users to only read/write their own cart rows.',
      },
      {
        id: 'ux-5',
        title: 'Social share feature (WhatsApp, X, Instagram)',
        status: 'done',
        description:
          'Product detail page has a share drawer with WhatsApp, X/Twitter, Instagram deep link, and copy-link. Product cards have a hover share button using the Web Share API.',
        guide: 'Already implemented via ShareDrawer component. Track share events by adding trackEvent(\'share\', { method, item_id }) inside the share handlers.',
      },
      {
        id: 'ux-6',
        title: 'Related products on product detail page',
        status: 'done',
        description:
          'The RelatedProducts component shows other products from the catalogue, increasing average pages-per-session and cross-sell opportunities.',
        guide: 'Already implemented. Improve relevance by filtering related products by the same category as the current product.',
      },
      {
        id: 'ux-7',
        title: 'Order confirmation emails to customers',
        status: 'partial',
        description:
          'Orders are confirmed on-screen at /order-confirmation/:orderId, but automated transactional emails (order confirmation, shipping update) are not yet configured.',
        guide:
          'Set up Supabase Edge Function triggered on order insert: 1) Install Resend (resend.com) — free 3000 emails/month. 2) Create supabase/functions/send-order-email/index.ts. 3) Use a Supabase Database Webhook on the orders table (on INSERT with status=\'pending\') to call the function.',
      },
    ],
  },
  {
    id: 'operations',
    emoji: '🏗️',
    label: 'Operations & Business',
    checkpoints: [
      {
        id: 'ops-1',
        title: 'Admin dashboard with metrics',
        status: 'done',
        description:
          'AdminDashboard.tsx provides an overview of orders, revenue, product count, and customer metrics for business monitoring.',
        guide: 'Already implemented. Add a revenue trend chart (daily/weekly) using recharts — already a dependency — to track sales performance over time.',
      },
      {
        id: 'ops-2',
        title: 'Inventory / stock management',
        status: 'done',
        description:
          'product_variants.stock_qty is validated before every cart add and quantity update. Stock is decremented atomically via the create_order_from_cart RPC function.',
        guide: 'Already implemented. Add a low-stock alert: when stock_qty < 5, show a "Only X left" badge on the product card and detail page.',
      },
      {
        id: 'ops-3',
        title: 'Order management & status tracking',
        status: 'done',
        description:
          'AdminOrders.tsx lists all orders with status filters. AdminOrderDetail.tsx shows full order info with status update controls. order_status_events tracks the history.',
        guide: 'Already implemented. Add a shipment tracking URL field to orders so customers can track their package from the order confirmation page.',
      },
      {
        id: 'ops-4',
        title: 'Customer management panel',
        status: 'done',
        description:
          'AdminCustomers.tsx lists registered customers with their order history and allows admin to view profile details.',
        guide: 'Already implemented. Add export-to-CSV for customer emails to use for marketing campaigns (with user consent as per the Privacy Policy).',
      },
      {
        id: 'ops-5',
        title: 'Analytics tracking (Google Tag Manager)',
        status: 'done',
        description:
          'trackEvent() in src/lib/analytics.ts pushes e-commerce events (view_item, add_to_cart, begin_checkout, purchase) to window.dataLayer for GTM.',
        guide: 'Already implemented. Configure GTM to forward events to Google Analytics 4. Set up a GA4 property at analytics.google.com and connect it via GTM.',
      },
      {
        id: 'ops-6',
        title: 'Admin audit logging for compliance',
        status: 'done',
        description:
          'src/lib/auditLog.ts records all admin actions (product CRUD, order status changes, user role changes) with before/after state for immutable audit trail.',
        guide: 'Already implemented. Ensure the admin_audit_log Supabase table has RLS set to INSERT-only for authenticated admins and SELECT-only for super-admins.',
      },
    ],
  },
];

const STATUS_CONFIG = {
  done: {
    icon: CheckCircle2,
    label: 'Complete',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    dot: 'bg-green-500',
  },
  partial: {
    icon: AlertCircle,
    label: 'Partial',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
  },
  missing: {
    icon: XCircle,
    label: 'Missing',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-500',
  },
} as const;

function score(checkpoints: Checkpoint[]): { done: number; partial: number; missing: number; pct: number } {
  let done = 0;
  let partial = 0;
  let missing = 0;
  for (const c of checkpoints) {
    if (c.status === 'done') done++;
    else if (c.status === 'partial') partial++;
    else missing++;
  }
  // done=1, partial=0.5, missing=0
  const pct = Math.round(((done + partial * 0.5) / checkpoints.length) * 100);
  return { done, partial, missing, pct };
}

function CheckpointCard({ cp }: { cp: Checkpoint }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[cp.status];
  const Icon = cfg.icon;

  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${cfg.bg}`}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium text-foreground leading-snug">{cp.title}</p>
          <span
            className={`inline-block mt-1 font-body text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color} ${
              cp.status === 'done'
                ? 'bg-green-100'
                : cp.status === 'partial'
                  ? 'bg-amber-100'
                  : 'bg-red-100'
            }`}
          >
            {cfg.label}
          </span>
        </div>
        <span className={`shrink-0 ${cfg.color} mt-0.5`}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-current/10">
              <p className="font-heritage text-sm text-foreground/80 leading-relaxed pt-3">{cp.description}</p>
              <div className="rounded-md bg-background/70 p-3">
                <p className="font-body text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">
                  Implementation Guide
                </p>
                <p className="font-heritage text-sm text-foreground/75 leading-relaxed">{cp.guide}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AreaSection({ area }: { area: Area }) {
  const s = score(area.checkpoints);
  const barColor =
    s.pct >= 80 ? 'bg-green-500' : s.pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl text-foreground flex items-center gap-2">
          <span>{area.emoji}</span>
          {area.label}
        </h2>
        <span className="font-body text-sm font-semibold text-muted-foreground">
          {s.done}/{area.checkpoints.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${s.pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        />
      </div>

      <div className="space-y-2">
        {area.checkpoints.map((cp) => (
          <CheckpointCard key={cp.id} cp={cp} />
        ))}
      </div>
    </motion.div>
  );
}

export default function MarketAudit() {
  const allCheckpoints = useMemo(() => AREAS.flatMap((a) => a.checkpoints), []);
  const overall = score(allCheckpoints);

  const gaugeColor =
    overall.pct >= 80 ? '#22c55e' : overall.pct >= 60 ? '#f59e0b' : '#ef4444';
  const gaugeLabel =
    overall.pct >= 80
      ? 'Market Ready 🚀'
      : overall.pct >= 60
        ? 'Almost There ⚠️'
        : 'Needs Work ❌';

  return (
    <main className="overflow-x-hidden bg-gradient-warm">
      <Navbar variant="solid" />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="font-heritage text-accent text-sm tracking-[0.3em] uppercase mb-3">
              Market Readiness
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              34-Checkpoint Audit
            </h1>
            <p className="font-heritage text-muted-foreground text-lg max-w-xl mx-auto">
              A comprehensive inspection of your project across security, legal, performance, UX, and operations.
            </p>
          </motion.div>

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="fabric-card p-8 mb-12 text-center"
          >
            <div className="flex flex-col items-center">
              <Trophy className="w-10 h-10 mb-3" style={{ color: gaugeColor }} />
              <div
                className="font-display text-7xl font-bold mb-2"
                style={{ color: gaugeColor }}
              >
                {overall.pct}%
              </div>
              <p className="font-display text-2xl text-foreground mb-6">{gaugeLabel}</p>

              {/* Score breakdown bar */}
              <div className="w-full max-w-md h-3 bg-muted rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: gaugeColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${overall.pct}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </div>

              {/* Stat chips */}
              <div className="flex flex-wrap justify-center gap-4 text-sm font-body">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-semibold">{overall.done} Complete</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 font-semibold">{overall.partial} Partial</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 font-semibold">{overall.missing} Missing</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Area matrix */}
          <div className="mb-12">
            <h2 className="font-display text-2xl text-foreground mb-6 text-center">Performance Matrix</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {AREAS.map((area) => {
                const s = score(area.checkpoints);
                const col =
                  s.pct >= 80
                    ? 'border-green-300 bg-green-50'
                    : s.pct >= 50
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-red-300 bg-red-50';
                const textCol =
                  s.pct >= 80
                    ? 'text-green-700'
                    : s.pct >= 50
                      ? 'text-amber-700'
                      : 'text-red-700';
                return (
                  <div
                    key={area.id}
                    className={`border-2 rounded-xl p-5 text-center ${col}`}
                  >
                    <div className="text-3xl mb-2">{area.emoji}</div>
                    <p className="font-display text-base text-foreground mb-1">{area.label}</p>
                    <p className={`font-display text-3xl font-bold ${textCol}`}>{s.pct}%</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {s.done}/{area.checkpoints.length} complete
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority list */}
          <div className="fabric-card p-6 mb-12">
            <h2 className="font-display text-xl text-foreground mb-4">🎯 Priority Action List</h2>
            <p className="font-heritage text-sm text-muted-foreground mb-4">
              Address these items in order before going live:
            </p>
            <ol className="space-y-3">
              {[
                {
                  n: 1,
                  title: 'Move CASHFREE_SECRET_KEY to server-only Edge Function secrets',
                  urgency: 'critical',
                },
                {
                  n: 2,
                  title: 'Add amount re-verification in payment webhook handler',
                  urgency: 'critical',
                },
                {
                  n: 3,
                  title: 'Complete Cashfree merchant KYC to enable live payments',
                  urgency: 'critical',
                },
                {
                  n: 4,
                  title: 'Add consent checkbox (Privacy Policy link) on signup & checkout forms',
                  urgency: 'high',
                },
                {
                  n: 5,
                  title: 'Add cookie consent banner for analytics cookies',
                  urgency: 'high',
                },
                {
                  n: 6,
                  title: 'Set up order confirmation emails via Resend + Supabase Edge Function',
                  urgency: 'high',
                },
                {
                  n: 7,
                  title: 'Integrate Sentry for runtime error tracking in production',
                  urgency: 'medium',
                },
                {
                  n: 8,
                  title: 'Add production domain to redirect.ts ALLOWED_DOMAINS allowlist',
                  urgency: 'medium',
                },
              ].map(({ n, title, urgency }) => (
                <li key={n} className="flex items-start gap-3">
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-body text-xs font-bold text-white ${
                      urgency === 'critical'
                        ? 'bg-red-500'
                        : urgency === 'high'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                    }`}
                  >
                    {n}
                  </span>
                  <div>
                    <span className="font-body text-sm text-foreground">{title}</span>
                    <span
                      className={`ml-2 font-body text-xs font-semibold uppercase tracking-wide ${
                        urgency === 'critical'
                          ? 'text-red-600'
                          : urgency === 'high'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                      }`}
                    >
                      {urgency}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Detailed checkpoints by area */}
          <div>
            <h2 className="font-display text-2xl text-foreground mb-8 text-center">
              Detailed Checkpoint Breakdown
            </h2>
            {AREAS.map((area) => (
              <AreaSection key={area.id} area={area} />
            ))}
          </div>
        </div>
      </div>

      <KaariFooter />
    </main>
  );
}
