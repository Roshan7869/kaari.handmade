import { useState, useCallback } from "react";

const phases = [
    {
        id: 1,
        title: "Preparation & Initial Setup",
        icon: "⚙️",
        color: "#00d4ff",
        steps: [
            {
                id: "1-1",
                title: "Audit Vite-specific code",
                description: "Scan for all Vite-specific patterns before migrating.",
                commands: [`# Find all Vite-specific imports
grep -r "import.meta.env" src/
grep -r "import.meta.glob" src/
grep -r "/@vite/" src/
grep -r "vite-plugin" .`],
                notes: "Document every VITE_ env var and Vite plugin usage. These all need Next.js equivalents."
            },
            {
                id: "1-2",
                title: "Create Next.js app with TypeScript",
                description: "Scaffold the new Next.js 14 app with App Router in a separate folder.",
                commands: [`npx create-next-app@latest next-app \\
  --typescript \\
  --tailwind \\
  --eslint \\
  --app \\
  --src-dir \\
  --import-alias "@/*"

cd next-app`],
                notes: "Use --app for App Router (Next.js 13+). Use --src-dir to mirror your existing structure."
            },
            {
                id: "1-3",
                title: "Install shadcn-ui",
                description: "Set up shadcn-ui component library in the new app.",
                commands: [`npx shadcn-ui@latest init
# Choose: Default style, Slate base color, CSS variables: yes

# Add commonly needed components
npx shadcn-ui@latest add button card dialog input label
npx shadcn-ui@latest add dropdown-menu navigation-menu sheet`],
                notes: "shadcn-ui components are copied into your project, not installed as a dependency."
            },
            {
                id: "1-4",
                title: "Install key dependencies",
                description: "Add all the packages your existing app uses.",
                commands: [`npm install \\
  @tanstack/react-query \\
  @supabase/supabase-js \\
  @supabase/auth-helpers-nextjs \\
  zustand \\
  framer-motion \\
  @react-three/fiber \\
  @react-three/drei \\
  three

npm install -D @types/three`],
                notes: "Replace @supabase/auth-helpers-react with @supabase/auth-helpers-nextjs for Next.js."
            },
            {
                id: "1-5",
                title: "Copy shared assets",
                description: "Move public assets and global styles to Next.js structure.",
                commands: [`# Copy public assets
cp -r ../your-vite-app/public/* ./public/

# Copy global styles
cp ../your-vite-app/src/index.css ./src/app/globals.css

# Copy component styles/modules
cp -r ../your-vite-app/src/styles ./src/styles/`],
                notes: "In Next.js, /public is the static file server root. References change from /src/assets to just /."
            }
        ]
    },
    {
        id: 2,
        title: "Core App Structure & Routing",
        icon: "🏗️",
        color: "#a78bfa",
        steps: [
            {
                id: "2-1",
                title: "Set up root layout (replaces _document + _app)",
                description: "Create the root layout.tsx — this replaces both _app.tsx and _document.tsx from Pages Router.",
                commands: [`// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}`],
                notes: "The layout.tsx in app/ is a Server Component by default. Only add 'use client' to Providers wrapper."
            },
            {
                id: "2-2",
                title: "Create Providers wrapper (client component)",
                description: "Wrap all context providers in a single client component.",
                commands: [`// src/components/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000 },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}`],
                notes: "QueryClient must be created inside useState to avoid sharing state between server requests."
            },
            {
                id: "2-3",
                title: "Migrate page routes to App Router",
                description: "Convert each Vite page to a Next.js App Router page.",
                commands: [`# Vite structure → Next.js App Router structure:
# src/pages/index.tsx      → src/app/page.tsx
# src/pages/products.tsx   → src/app/products/page.tsx
# src/pages/cart.tsx       → src/app/cart/page.tsx
# src/pages/admin.tsx      → src/app/admin/page.tsx
# src/pages/products/[id]  → src/app/products/[id]/page.tsx

// src/app/products/page.tsx
export default function ProductsPage() {
  return <ProductsView />
}

// src/app/products/[id]/page.tsx
export default function ProductPage({
  params
}: {
  params: { id: string }
}) {
  return <ProductDetail id={params.id} />
}`],
                notes: "Each folder in app/ needs a page.tsx to be a route. Use [slug] for dynamic segments."
            },
            {
                id: "2-4",
                title: "Create loading.tsx and error.tsx per route",
                description: "Add automatic loading UI and error boundaries per route.",
                commands: [`// src/app/products/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent" />
    </div>
  )
}

// src/app/products/error.tsx
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}`],
                notes: "These are co-located next to page.tsx and are automatically used by Next.js."
            }
        ]
    },
    {
        id: 3,
        title: "Component & Context Migration",
        icon: "🧩",
        color: "#34d399",
        steps: [
            {
                id: "3-1",
                title: "Copy components with 'use client' audit",
                description: "Move components from src/components/ — add 'use client' only where needed.",
                commands: [`cp -r ../your-vite-app/src/components ./src/components

# Add 'use client' to components that use:
# - useState, useEffect, useRef, useContext
# - onClick, onChange, and other event handlers
# - Browser APIs (window, document, localStorage)
# - Third-party hooks

# Server Components CAN use:
# - async/await directly
# - fetch() with caching
# - Direct DB/Supabase queries
# - fs, path, etc.`],
                notes: "Default to Server Components. Only add 'use client' when you hit a boundary that requires it."
            },
            {
                id: "3-2",
                title: "Update Next.js Link and Image imports",
                description: "Replace react-router-dom with next/link and img with next/image.",
                commands: [`// ❌ Old (React Router)
import { Link, useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/products')
<Link to="/products">Products</Link>

// ✅ New (Next.js)
import Link from 'next/link'
import { useRouter } from 'next/navigation'  // NOT next/router
const router = useRouter()
router.push('/products')
<Link href="/products">Products</Link>

// ❌ Old (img tag)
<img src="/hero.jpg" alt="Hero" />

// ✅ New (next/image)
import Image from 'next/image'
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />`],
                notes: "CRITICAL: In App Router, use 'next/navigation' NOT 'next/router'. They have different APIs."
            },
            {
                id: "3-3",
                title: "Migrate Context providers",
                description: "Copy contexts and make them client components.",
                commands: [`// src/contexts/AuthContext.tsx
'use client'  // ← ADD THIS

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}`],
                notes: "All Context providers must be Client Components since they use React state and hooks."
            },
            {
                id: "3-4",
                title: "Update env variable references",
                description: "Replace VITE_ prefixes with NEXT_PUBLIC_ for client-side vars.",
                commands: [`# .env.local (Next.js)
# Client-side (exposed to browser) — use NEXT_PUBLIC_ prefix
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Server-side only (NOT exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-key
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# In code: replace process.env.VITE_* with process.env.NEXT_PUBLIC_*
# Find and replace across all files:
# VITE_SUPABASE_URL → NEXT_PUBLIC_SUPABASE_URL`],
                notes: "Server-only vars (no NEXT_PUBLIC_ prefix) are NEVER sent to the browser — more secure."
            }
        ]
    },
    {
        id: 4,
        title: "Data Fetching & API Integration",
        icon: "🔌",
        color: "#fb923c",
        steps: [
            {
                id: "4-1",
                title: "Create Next.js API routes",
                description: "Move server-side logic to App Router API routes (Route Handlers).",
                commands: [`// src/app/api/products/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const body = await request.json()
  // ... handle POST
}`],
                notes: "Route Handlers replace both Next.js Pages API routes (pages/api/) and Express endpoints."
            },
            {
                id: "4-2",
                title: "Server Components with direct data fetching",
                description: "Fetch data directly in Server Components — no API round-trip needed.",
                commands: [`// src/app/products/page.tsx  (Server Component)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// No useState, no useEffect, no React Query needed!
export default async function ProductsPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
  
  return (
    <div>
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// Add Next.js caching
export const revalidate = 60 // Revalidate every 60 seconds`],
                notes: "This is the biggest paradigm shift. Server Components = zero client-side JS for data fetching."
            },
            {
                id: "4-3",
                title: "React Query for client-side mutations",
                description: "Keep React Query for client-side data mutations and real-time updates.",
                commands: [`// src/hooks/useProducts.ts
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}`],
                notes: "Use React Query for client-side mutations, optimistic updates, and real-time subscriptions."
            },
            {
                id: "4-4",
                title: "Set up Supabase middleware for auth",
                description: "Create middleware.ts to refresh Supabase sessions on every request.",
                commands: [`// src/middleware.ts  (at project root, not in src/app)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if expired
  await supabase.auth.getSession()
  
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}`],
                notes: "Middleware runs before every request. This keeps the Supabase session fresh without extra calls."
            }
        ]
    },
    {
        id: 5,
        title: "Special Features & Utilities",
        icon: "✨",
        color: "#f472b6",
        steps: [
            {
                id: "5-1",
                title: "Handle React Three Fiber (R3F) with dynamic imports",
                description: "R3F requires CSR — use dynamic imports with ssr: false.",
                commands: [`// src/components/Scene3D.tsx
'use client'
import dynamic from 'next/dynamic'

// ❌ This will break with SSR
// import { Canvas } from '@react-three/fiber'

// ✅ Dynamic import disables SSR for this component
const Canvas3D = dynamic(
  () => import('./Canvas3DInner'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-96 bg-black animate-pulse" />
  }
)

export default function Scene3D() {
  return <Canvas3D />
}

// src/components/Canvas3DInner.tsx
'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function Canvas3DInner() {
  return (
    <Canvas>
      <ambientLight />
      <OrbitControls />
      {/* your 3D content */}
    </Canvas>
  )
}`],
                notes: "Three.js uses browser-only APIs (WebGL). Never render it on the server."
            },
            {
                id: "5-2",
                title: "Migrate Stripe webhook handler",
                description: "Move Stripe webhook to a Next.js Route Handler.",
                commands: [`// src/app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!
  
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      // handle payment
      break
  }
  
  return NextResponse.json({ received: true })
}`],
                notes: "Use request.text() (not .json()) for webhooks — Stripe requires the raw body for signature verification."
            },
            {
                id: "5-3",
                title: "Set up lib/ utilities",
                description: "Organize utility libraries with proper Next.js patterns.",
                commands: [`// src/lib/supabase/client.ts (for client components)
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
export const createClient = () => createClientComponentClient()

// src/lib/supabase/server.ts (for server components)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
export const createServer = () => createServerComponentClient({ cookies })

// src/lib/supabase/middleware.ts (for middleware)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// src/lib/stripe.ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})`],
                notes: "Having separate client/server Supabase instances prevents accidental service-role key leaks."
            },
            {
                id: "5-4",
                title: "Set up analytics",
                description: "Add analytics compatible with Next.js App Router.",
                commands: [`// Option 1: Vercel Analytics (zero config on Vercel)
npm install @vercel/analytics

// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

// Option 2: Google Analytics with next/script
// src/app/layout.tsx
import Script from 'next/script'
<Script
  src={\`https://www.googletagmanager.com/gtag/js?id=\${GA_ID}\`}
  strategy="afterInteractive"
/>`],
                notes: "Use next/script with strategy='afterInteractive' for third-party scripts to avoid blocking hydration."
            }
        ]
    },
    {
        id: 6,
        title: "Testing & Validation",
        icon: "🧪",
        color: "#facc15",
        steps: [
            {
                id: "6-1",
                title: "Set up Vitest for unit tests",
                description: "Configure Vitest with Next.js compatibility.",
                commands: [`npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom

# vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

# src/test/setup.ts
import '@testing-library/jest-dom'`],
                notes: "Vitest is much faster than Jest for TypeScript projects. Works seamlessly with Next.js."
            },
            {
                id: "6-2",
                title: "Update Playwright E2E tests",
                description: "Update test routes and selectors for Next.js paths.",
                commands: [`# playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',  // Next.js default port
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})

# Update test routes:
# Old (Vite):   http://localhost:5173/products
# New (Next):   http://localhost:3000/products

# Run tests:
npx playwright test`],
                notes: "Next.js runs on port 3000 by default vs Vite's 5173. Update all baseURL references."
            },
            {
                id: "6-3",
                title: "Test critical user flows",
                description: "Manually verify all key user journeys work correctly.",
                commands: [`# Checklist — test each flow end-to-end:
# ✅ Auth flow: sign up, sign in, sign out, protected routes
# ✅ Product browsing: list, filter, search, detail page
# ✅ Cart flow: add item, update qty, remove item, persist on reload
# ✅ Checkout: Stripe payment, webhook, order confirmation
# ✅ Admin: CRUD operations, role-based access control
# ✅ 3D components: render correctly, no SSR errors
# ✅ Image optimization: all images load via next/image
# ✅ Dynamic routes: [id] pages resolve correctly
# ✅ API routes: all /api/* endpoints return correct data
# ✅ Middleware: auth protection redirects work`],
                notes: "Pay special attention to hydration errors in browser console — these indicate client/server mismatch."
            }
        ]
    },
    {
        id: 7,
        title: "Finalization & Deployment",
        icon: "🚀",
        color: "#f87171",
        steps: [
            {
                id: "7-1",
                title: "Optimize next.config.js",
                description: "Configure Next.js for production performance.",
                commands: [`// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    // Enable server actions if using forms
    serverActions: true,
  },
  // Bundle analyzer (dev only)
  // npm install -D @next/bundle-analyzer
}

module.exports = nextConfig`],
                notes: "Always configure image remotePatterns for external image sources — Next.js blocks unknown domains."
            },
            {
                id: "7-2",
                title: "Deploy to Vercel",
                description: "Deploy the Next.js app to Vercel (optimal for Next.js).",
                commands: [`# Option 1: Vercel CLI
npm install -g vercel
vercel

# Option 2: Connect GitHub repo to vercel.com (recommended)
# 1. Push to GitHub
# 2. Import repo at vercel.com/new
# 3. Add all environment variables from .env.local
# 4. Deploy

# Required env vars on Vercel:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`],
                notes: "Vercel auto-detects Next.js and optimizes the build. Edge functions, ISR, and image optimization all work out of the box."
            },
            {
                id: "7-3",
                title: "Update Stripe webhook URL",
                description: "Point Stripe webhooks to the new Next.js endpoint.",
                commands: [`# In Stripe Dashboard → Developers → Webhooks:
# Old: https://your-vite-app.com/webhook
# New: https://your-nextjs-app.vercel.app/api/webhooks/stripe

# Update STRIPE_WEBHOOK_SECRET in Vercel env vars
# with the new webhook's signing secret

# Test with Stripe CLI:
stripe listen --forward-to localhost:3000/api/webhooks/stripe`],
                notes: "Always test webhooks locally with Stripe CLI before deploying to production."
            },
            {
                id: "7-4",
                title: "Update Supabase auth redirect URLs",
                description: "Add the new domain to Supabase auth allowed URLs.",
                commands: [`# In Supabase Dashboard → Authentication → URL Configuration:
# Add to Redirect URLs:
# https://your-app.vercel.app/**
# https://your-custom-domain.com/**

# Update Site URL to production domain:
# https://your-app.vercel.app

# In code — update auth redirectTo:
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: \`\${location.origin}/auth/callback\`,
  },
})`],
                notes: "Supabase blocks auth redirects to unregistered URLs as a security measure."
            }
        ]
    }
];

const statusColors = {
    pending: "#3a3a4e",
    "in-progress": "#7c3aed",
    done: "#10b981"
};

const statusLabels = {
    pending: "Pending",
    "in-progress": "In Progress",
    done: "Done"
};

export default function MigrationTracker() {
    const [activePhase, setActivePhase] = useState(1);
    const [activeStep, setActiveStep] = useState(null);
    const [statuses, setStatuses] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [expandedCommands, setExpandedCommands] = useState({});

    const setStatus = useCallback((stepId, status) => {
        setStatuses(s => ({ ...s, [stepId]: status }));
    }, []);

    const copyCode = useCallback((text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const toggleCommands = useCallback((id) => {
        setExpandedCommands(s => ({ ...s, [id]: !s[id] }));
    }, []);

    const getPhaseProgress = (phase) => {
        const total = phase.steps.length;
        const done = phase.steps.filter(s => statuses[s.id] === "done").length;
        return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
    };

    const totalDone = Object.values(statuses).filter(v => v === "done").length;
    const totalSteps = phases.reduce((a, p) => a + p.steps.length, 0);
    const overallPct = Math.round((totalDone / totalSteps) * 100);

    const currentPhase = phases.find(p => p.id === activePhase);

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0b0b13",
            color: "#e2e8f0",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            display: "flex",
            flexDirection: "column"
        }}>
            {/* Google Font */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Syne:wght@400;700;800&display=swap');
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0b0b13; }
        ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 3px; }
        .step-btn:hover { background: #1a1a2e !important; }
        .phase-btn:hover { border-color: var(--c) !important; }
        .status-btn:hover { opacity: 0.85; }
        code { font-family: 'JetBrains Mono', monospace !important; }
      `}</style>

            {/* Header */}
            <div style={{
                borderBottom: "1px solid #1e1e2e",
                padding: "20px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.02)"
            }}>
                <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
                        <span style={{ color: "#00d4ff" }}>React</span>
                        <span style={{ color: "#555" }}> → </span>
                        <span style={{ color: "#a78bfa" }}>Next.js</span>
                        <span style={{ color: "#555", fontWeight: 400 }}> Migration</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>7 Phases · {totalSteps} Steps · TypeScript + Supabase + Stripe</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: overallPct === 100 ? "#10b981" : "#00d4ff" }}>
                        {overallPct}%
                    </div>
                    <div style={{ fontSize: 11, color: "#666" }}>{totalDone}/{totalSteps} complete</div>
                    <div style={{ marginTop: 6, height: 4, width: 120, background: "#1e1e2e", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${overallPct}%`, background: "linear-gradient(90deg, #00d4ff, #a78bfa)", borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Phase Sidebar */}
                <div style={{ width: 220, borderRight: "1px solid #1e1e2e", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
                    {phases.map(phase => {
                        const { done, total, pct } = getPhaseProgress(phase);
                        const active = activePhase === phase.id;
                        return (
                            <button
                                key={phase.id}
                                className="phase-btn"
                                onClick={() => { setActivePhase(phase.id); setActiveStep(null); }}
                                style={{
                                    "--c": phase.color,
                                    background: active ? `${phase.color}15` : "transparent",
                                    border: `1px solid ${active ? phase.color : "#1e1e2e"}`,
                                    borderRadius: 8,
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    color: active ? phase.color : "#888",
                                    transition: "all 0.15s"
                                }}
                            >
                                <div style={{ fontSize: 11, marginBottom: 2 }}>{phase.icon} Phase {phase.id}</div>
                                <div style={{ fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 700, lineHeight: 1.3, marginBottom: 6, color: active ? "#fff" : "#aaa" }}>
                                    {phase.title}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ flex: 1, height: 2, background: "#1e1e2e", borderRadius: 1, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${pct}%`, background: phase.color, borderRadius: 1, transition: "width 0.4s" }} />
                                    </div>
                                    <span style={{ fontSize: 10, color: "#555" }}>{done}/{total}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                    {/* Step List */}
                    <div style={{ width: 280, borderRight: "1px solid #1e1e2e", padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, padding: "0 4px" }}>
                            {currentPhase.icon} {currentPhase.title}
                        </div>
                        {currentPhase.steps.map((step, i) => {
                            const status = statuses[step.id] || "pending";
                            const active = activeStep === step.id;
                            return (
                                <button
                                    key={step.id}
                                    className="step-btn"
                                    onClick={() => setActiveStep(step.id)}
                                    style={{
                                        background: active ? "#12121f" : "transparent",
                                        border: `1px solid ${active ? currentPhase.color + "60" : "#1a1a2a"}`,
                                        borderRadius: 8,
                                        padding: "10px 12px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.15s",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 10
                                    }}
                                >
                                    <div style={{
                                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                                        background: status === "done" ? "#10b981" : status === "in-progress" ? "#7c3aed" : "#2a2a3e",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, color: "#fff"
                                    }}>
                                        {status === "done" ? "✓" : status === "in-progress" ? "…" : i + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, color: active ? "#fff" : "#ccc", fontFamily: "'Syne', sans-serif", fontWeight: 600, lineHeight: 1.3 }}>
                                            {step.title}
                                        </div>
                                        <div style={{ fontSize: 10, color: status === "done" ? "#10b981" : status === "in-progress" ? "#a78bfa" : "#555", marginTop: 3 }}>
                                            {statusLabels[status]}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Step Detail */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
                        {!activeStep ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#333" }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>{currentPhase.icon}</div>
                                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, color: currentPhase.color, marginBottom: 8 }}>
                                    Phase {currentPhase.id}: {currentPhase.title}
                                </div>
                                <div style={{ fontSize: 13, color: "#555" }}>Select a step from the list to see details</div>
                            </div>
                        ) : (() => {
                            const step = currentPhase.steps.find(s => s.id === activeStep);
                            if (!step) return null;
                            const status = statuses[step.id] || "pending";

                            return (
                                <div>
                                    {/* Step header */}
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: currentPhase.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                                                Phase {currentPhase.id} · {currentPhase.title}
                                            </div>
                                            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                                                {step.title}
                                            </div>
                                            <div style={{ fontSize: 13, color: "#888", marginTop: 8, lineHeight: 1.6 }}>
                                                {step.description}
                                            </div>
                                        </div>
                                        {/* Status controls */}
                                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                            {["pending", "in-progress", "done"].map(s => (
                                                <button
                                                    key={s}
                                                    className="status-btn"
                                                    onClick={() => setStatus(step.id, s)}
                                                    style={{
                                                        background: status === s ? statusColors[s] : "transparent",
                                                        border: `1px solid ${status === s ? statusColors[s] : "#2a2a3e"}`,
                                                        borderRadius: 6,
                                                        padding: "6px 12px",
                                                        cursor: "pointer",
                                                        color: status === s ? "#fff" : "#555",
                                                        fontSize: 11,
                                                        fontFamily: "inherit",
                                                        transition: "all 0.15s"
                                                    }}
                                                >
                                                    {s === "pending" ? "⬜ Pending" : s === "in-progress" ? "🔵 In Progress" : "✅ Done"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Commands */}
                                    {step.commands.map((cmd, ci) => {
                                        const cid = `${step.id}-${ci}`;
                                        const expanded = expandedCommands[cid] !== false;
                                        const lines = cmd.trim().split("\n");
                                        const preview = lines.slice(0, 3).join("\n");
                                        const hasMore = lines.length > 3;

                                        return (
                                            <div key={ci} style={{ marginBottom: 16 }}>
                                                <div style={{
                                                    background: "#0d0d1a",
                                                    border: "1px solid #1e1e2e",
                                                    borderRadius: 10,
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "8px 14px",
                                                        borderBottom: "1px solid #1a1a2a",
                                                        background: "#111122"
                                                    }}>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
                                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
                                                        </div>
                                                        <div style={{ display: "flex", gap: 8 }}>
                                                            {hasMore && (
                                                                <button
                                                                    onClick={() => toggleCommands(cid)}
                                                                    style={{
                                                                        background: "transparent", border: "none", cursor: "pointer",
                                                                        color: "#555", fontSize: 11, fontFamily: "inherit"
                                                                    }}
                                                                >
                                                                    {expanded ? "▲ Less" : "▼ More"}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => copyCode(cmd, cid)}
                                                                style={{
                                                                    background: copiedId === cid ? "#10b981" : "#1e1e2e",
                                                                    border: "none", borderRadius: 4, padding: "3px 10px",
                                                                    cursor: "pointer", color: copiedId === cid ? "#fff" : "#999",
                                                                    fontSize: 11, fontFamily: "inherit", transition: "all 0.2s"
                                                                }}
                                                            >
                                                                {copiedId === cid ? "✓ Copied!" : "Copy"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <pre style={{
                                                        margin: 0, padding: "16px 18px",
                                                        fontSize: 12, lineHeight: 1.7,
                                                        overflowX: "auto",
                                                        color: "#c9d1d9",
                                                        whiteSpace: "pre-wrap",
                                                        wordBreak: "break-word"
                                                    }}>
                                                        <code>
                                                            {expanded ? cmd.trim() : preview + (hasMore ? "\n..." : "")}
                                                        </code>
                                                    </pre>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Notes */}
                                    {step.notes && (
                                        <div style={{
                                            background: `${currentPhase.color}10`,
                                            border: `1px solid ${currentPhase.color}30`,
                                            borderRadius: 8,
                                            padding: "12px 16px",
                                            marginTop: 8
                                        }}>
                                            <div style={{ fontSize: 11, color: currentPhase.color, marginBottom: 4, fontWeight: 600 }}>
                                                💡 NOTE
                                            </div>
                                            <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6 }}>
                                                {step.notes}
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation */}
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, gap: 12 }}>
                                        {(() => {
                                            const allSteps = phases.flatMap(p => p.steps.map(s => ({ ...s, phaseId: p.id })));
                                            const idx = allSteps.findIndex(s => s.id === activeStep);
                                            const prev = allSteps[idx - 1];
                                            const next = allSteps[idx + 1];
                                            return (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            if (prev) { setActivePhase(prev.phaseId); setActiveStep(prev.id); }
                                                        }}
                                                        disabled={!prev}
                                                        style={{
                                                            background: prev ? "#1a1a2e" : "transparent",
                                                            border: "1px solid #1e1e2e",
                                                            borderRadius: 8, padding: "10px 20px",
                                                            cursor: prev ? "pointer" : "default",
                                                            color: prev ? "#ccc" : "#333",
                                                            fontSize: 13, fontFamily: "inherit"
                                                        }}
                                                    >
                                                        ← Previous
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setStatus(step.id, "done");
                                                            if (next) { setActivePhase(next.phaseId); setActiveStep(next.id); }
                                                        }}
                                                        style={{
                                                            background: currentPhase.color,
                                                            border: "none",
                                                            borderRadius: 8, padding: "10px 24px",
                                                            cursor: "pointer",
                                                            color: "#000",
                                                            fontSize: 13, fontFamily: "inherit",
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        {next ? "Mark Done & Next →" : "✅ Complete Migration!"}
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}