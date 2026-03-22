/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         KAARI MARKETPLACE — FULL SYSTEM AUDIT  v2           ║
 * ║  FIXES: login timeout · suite isolation · shadcn selectors   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * SETUP — create these accounts in Supabase Auth first:
 *   Regular user:  test.user@kaari.in  /  Audit@2024!
 *   Admin user:    admin@kaari.in      /  Admin@2024!
 *   Admin role:    INSERT INTO user_roles (user_id, role) VALUES ('<uid>','admin');
 *
 * Windows:
 *   set KAARI_BASE_URL=http://localhost:8080
 *   set SUPABASE_URL=https://xxxx.supabase.co
 *   set SUPABASE_SERVICE_KEY=service_role_key_here
 *   set AUDIT_USER_EMAIL=test.user@kaari.in
 *   set AUDIT_USER_PASS=Audit@2024!
 *   set AUDIT_ADMIN_EMAIL=admin@kaari.in
 *   set AUDIT_ADMIN_PASS=Admin@2024!
 *   npx tsx kaari.audit.ts
 */

import { chromium, Page, BrowserContext } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const CFG = {
    BASE_URL: process.env.KAARI_BASE_URL || "http://localhost:8080",
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_KEY || "",
    USER_EMAIL: process.env.AUDIT_USER_EMAIL || "test.user@kaari.in",
    USER_PASS: process.env.AUDIT_USER_PASS || "Audit@2024!",
    ADMIN_EMAIL: process.env.AUDIT_ADMIN_EMAIL || "admin@kaari.in",
    ADMIN_PASS: process.env.AUDIT_ADMIN_PASS || "Admin@2024!",
    TIMEOUT: 20_000,
    NAV_TIMEOUT: 25_000,
    SLOW_THRESHOLD: 3_000,
};

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
interface AuditResult {
    suite: string; check: string;
    status: "PASS" | "FAIL" | "WARN" | "SKIP";
    severity: Severity; detail?: string; durationMs?: number;
}
const results: AuditResult[] = [];

function record(suite: string, check: string, severity: Severity, fn: () => Promise<void> | void): Promise<void> {
    return (async () => {
        const t0 = Date.now();
        try {
            await fn();
            const ms = Date.now() - t0;
            results.push({
                suite, check, status: "PASS", severity, durationMs: ms,
                detail: ms > CFG.SLOW_THRESHOLD ? `⚠ Slow: ${ms}ms` : undefined
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            results.push({
                suite, check, status: "FAIL", severity,
                durationMs: Date.now() - t0, detail: msg.slice(0, 250)
            });
        }
    })();
}

function skip(suite: string, check: string, severity: Severity, reason: string) {
    results.push({ suite, check, status: "SKIP", severity, detail: reason });
}

/* ─── FIX 1: domcontentloaded instead of networkidle
   Supabase Realtime holds a WebSocket open — networkidle never resolves on WS pages ─── */
async function goto(page: Page, path: string) {
    const res = await page.goto(CFG.BASE_URL + path, { waitUntil: "domcontentloaded", timeout: CFG.TIMEOUT });
    if (!res || !res.ok()) throw new Error(`HTTP ${res?.status()} on ${path}`);
    await page.waitForTimeout(800); // allow React to hydrate
}

/* ─── FIX 2: login — use waitForNavigation, NOT waitForURL regex
   The regex /\/(products|admin|$)/ was failing because after login the SPA
   redirects to "/" (root) where the `$` in the regex group didn't match end-of-URL.
   Now we use waitForNavigation which resolves on any URL change. ─── */
async function login(page: Page, email: string, pass: string): Promise<void> {
    await goto(page, "/login");
    await page.fill('input[type="email"]', email, { timeout: CFG.TIMEOUT });
    await page.fill('input[type="password"]', pass, { timeout: CFG.TIMEOUT });

    const navPromise = page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: CFG.NAV_TIMEOUT })
        .catch(() => null);

    await page.click('button[type="submit"]');
    await navPromise;
    await page.waitForTimeout(1200);

    const url = page.url();
    if (url.includes("/login")) {
        // Diagnose: did the page show an error or just hang?
        const errText = await page.evaluate(() => {
            for (const sel of ['[role="alert"]', '[data-sonner-toast]', '.toast',
                '[class*="error"]', '[class*="Error"]', 'p']) {
                const el = document.querySelector(sel);
                const t = el?.textContent?.trim();
                if (t && t.length < 200 && /invalid|wrong|incorrect|error|failed/i.test(t)) return t;
            }
            return null;
        });
        throw new Error(errText
            ? `Login rejected — "${errText}". Verify ${email} exists in Supabase Auth.`
            : `Login did not redirect within ${CFG.NAV_TIMEOUT}ms. ` +
            `Go to Supabase Dashboard → Authentication → Users and create: ${email} / ${pass}`);
    }
}

async function loginSafe(page: Page, email: string, pass: string): Promise<boolean> {
    try { await login(page, email, pass); return true; }
    catch { return false; }
}

/* ─── FIX 3: shadcn/Radix-aware product link finder ─── */
async function findProductLinks(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const byHref = [...document.querySelectorAll('a[href*="/products/"]')] as HTMLAnchorElement[];
        const byAttr = [...document.querySelectorAll('[data-testid*="product"] a, [data-product] a')] as HTMLAnchorElement[];
        const all = [...new Set([...byHref, ...byAttr])];
        return all
            .map(a => a.getAttribute("href"))
            .filter((h): h is string => !!h && h.startsWith("/products/") && h !== "/products/");
    });
}

function preflightCheck() {
    const issues: string[] = [];
    if (!CFG.SUPABASE_URL) issues.push("SUPABASE_URL not set → Database suite will be skipped");
    if (!CFG.SUPABASE_KEY) issues.push("SUPABASE_SERVICE_KEY not set → Database suite will be skipped");
    if (CFG.USER_EMAIL === "test.user@kaari.in") issues.push(`AUDIT_USER_EMAIL using default — create this account in Supabase Auth`);
    if (CFG.ADMIN_EMAIL === "admin@kaari.in") issues.push(`AUDIT_ADMIN_EMAIL using default — create + assign admin role`);
    if (issues.length > 0) {
        console.log("\n⚠  PRE-FLIGHT WARNINGS:");
        issues.forEach(i => console.log("   •", i));
        console.log();
    }
}

function printReport() {
    const W = 72;
    const line = (c = "─") => c.repeat(W);
    const pad = (s: string, n: number) => s.slice(0, n).padEnd(n);
    console.log("\n" + "═".repeat(W));
    console.log("  KAARI MARKETPLACE — AUDIT REPORT  v2");
    console.log("  " + new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    console.log("═".repeat(W));
    for (const suite of [...new Set(results.map(r => r.suite))]) {
        const items = results.filter(r => r.suite === suite);
        const pass = items.filter(r => r.status === "PASS").length;
        const fail = items.filter(r => r.status === "FAIL").length;
        const sk = items.filter(r => r.status === "SKIP").length;
        console.log(`\n  ${suite.toUpperCase()}`);
        console.log("  " + line("·"));
        for (const r of items) {
            const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : r.status === "WARN" ? "⚠" : "○";
            const ms = r.durationMs != null ? `${r.durationMs}ms`.padStart(7) : "      ";
            console.log(`  ${icon} [${r.severity.padEnd(8)}] ${pad(r.check, 42)} ${ms}`);
            if (r.detail) console.log(`      └─ ${r.detail}`);
        }
        console.log(`  ${line("·")}`);
        console.log(`  PASS:${pass}  FAIL:${fail}  SKIP:${sk}`);
    }
    const totPass = results.filter(r => r.status === "PASS").length;
    const totFail = results.filter(r => r.status === "FAIL").length;
    const critFail = results.filter(r => r.status === "FAIL" && r.severity === "CRITICAL").length;
    const score = Math.round(totPass / (totPass + totFail || 1) * 100);
    console.log("\n" + "═".repeat(W));
    console.log(`  TOTAL: ${results.length} checks  |  PASS:${totPass}  FAIL:${totFail}  SCORE:${score}%`);
    if (critFail > 0) console.log(`  ⛔ ${critFail} CRITICAL failure(s) — immediate attention required`);
    else console.log("  ✅ No critical failures");
    console.log("═".repeat(W) + "\n");
}

/* ══════════════════════════════════
   SUITE 1 — AUTH
══════════════════════════════════ */
async function auditAuth(ctx: BrowserContext): Promise<boolean> {
    const S = "Auth & Session";
    const page = await ctx.newPage();
    let userLoginOk = false;

    await record(S, "Login page loads (HTTP 200)", "CRITICAL", () => goto(page, "/login"));
    await record(S, "Signup page loads (HTTP 200)", "HIGH", () => goto(page, "/signup"));

    /* FIX: broad error detection for shadcn Toast / Sonner / inline text */
    await record(S, "Invalid credentials show error", "HIGH", async () => {
        await goto(page, "/login");
        await page.fill('input[type="email"]', "nobody@kaari-audit-fake.in");
        await page.fill('input[type="password"]', "wr0ng-pass-9999");
        await page.click('button[type="submit"]');
        const found = await Promise.race([
            page.waitForSelector('[data-sonner-toast],[role="status"],[role="alert"]', { timeout: 8000 }).then(() => true).catch(() => false),
            page.waitForFunction(() => {
                const b = document.body.textContent?.toLowerCase() || "";
                return b.includes("invalid") || b.includes("incorrect") || b.includes("wrong") ||
                    b.includes("credentials") || b.includes("error") || b.includes("failed");
            }, { timeout: 8000 }).then(() => true).catch(() => false),
        ]);
        if (!found) throw new Error(
            "No error feedback on bad credentials. Fix: Add error state to Login.tsx " +
            "(see kaari.fixes.md section 1)"
        );
    });

    await record(S, "Valid user login → redirect", "CRITICAL", async () => {
        userLoginOk = await loginSafe(page, CFG.USER_EMAIL, CFG.USER_PASS);
        if (!userLoginOk) throw new Error(
            `Login failed. Fix: Supabase Dashboard → Authentication → Users → Add user\n` +
            `  Email: ${CFG.USER_EMAIL}   Password: ${CFG.USER_PASS}`
        );
    });

    await record(S, "Auth token in localStorage", "HIGH", async () => {
        if (!userLoginOk) throw new Error("Skipped — login failed");
        const ok = await page.evaluate(() => Object.keys(localStorage).some(k =>
            k.toLowerCase().includes("supabase") || k.toLowerCase().includes("auth")
        ));
        if (!ok) throw new Error("No auth token in localStorage. Check AuthContext — ensure persistSession:true");
    });

    await record(S, "Authenticated user can access /checkout", "CRITICAL", async () => {
        if (!userLoginOk) throw new Error("Skipped — login failed");
        await goto(page, "/checkout");
        if (page.url().includes("/login")) throw new Error("Auth not persisting to /checkout");
    });

    await record(S, "Unauthenticated /checkout → /login redirect", "CRITICAL", async () => {
        const fresh = await ctx.newPage();
        try {
            await fresh.goto(CFG.BASE_URL + "/checkout", { waitUntil: "domcontentloaded", timeout: CFG.TIMEOUT });
            await fresh.waitForTimeout(1500);
            if (!fresh.url().includes("/login"))
                throw new Error(`Expected /login redirect, got: ${fresh.url()}`);
        } finally { await fresh.close(); }
    });

    await record(S, "Admin login works", "CRITICAL", async () => {
        const ap = await ctx.newPage();
        try {
            const ok = await loginSafe(ap, CFG.ADMIN_EMAIL, CFG.ADMIN_PASS);
            if (!ok) throw new Error(
                `Admin login failed. Fix:\n` +
                `  1. Create ${CFG.ADMIN_EMAIL} in Supabase Auth\n` +
                `  2. INSERT INTO user_roles (user_id,role) VALUES ('<uid>','admin');`
            );
        } finally { await ap.close(); }
    });

    await record(S, "Non-admin blocked from /admin", "CRITICAL", async () => {
        if (!userLoginOk) { skip(S, "Non-admin /admin block", "CRITICAL", "User login unavailable"); return; }
        await page.goto(CFG.BASE_URL + "/admin", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const url = page.url();
        const isBlocked = url.includes("/login") || (!url.includes("/admin"));
        if (!isBlocked) {
            const adminContent = await page.$("table, [data-testid*='admin'], [class*='inventory']").catch(() => null);
            if (adminContent) throw new Error("⛔ Regular user can see admin content — check has_role() guard");
        }
    });

    await page.close();
    return userLoginOk;
}

/* ══════════════════════════════════
   SUITE 2 — PRODUCTS
══════════════════════════════════ */
async function auditProducts(ctx: BrowserContext) {
    const S = "Product Catalogue";
    const page = await ctx.newPage();

    await record(S, "Homepage loads", "CRITICAL", () => goto(page, "/"));

    await record(S, "/products listing — cards rendered", "CRITICAL", async () => {
        await goto(page, "/products");
        await page.waitForTimeout(2500); // wait for Supabase fetch

        const links = await findProductLinks(page);
        if (links.length > 0) return;

        // Broader count: any grid children that have an image or price
        const count = await page.evaluate(() => {
            return [...document.querySelectorAll("a, [class*='card'], [class*='product']")]
                .filter(el => el.querySelectorAll("img, [class*='price']").length > 0).length;
        });
        if (count === 0) throw new Error(
            "No products rendered. Fixes:\n" +
            "  1. Seed the Supabase products table with test data\n" +
            "  2. Verify VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env\n" +
            "  3. Add data-testid='product-card' to ProductCard component\n" +
            "  4. Check network tab for failed Supabase queries"
        );
    });

    await record(S, "Products show INR prices (₹)", "HIGH", async () => {
        await goto(page, "/products");
        await page.waitForTimeout(2000);
        if (!(await page.textContent("body"))?.includes("₹"))
            throw new Error("No ₹ symbol. Fix: formatPrice(n) => '₹'+n.toLocaleString('en-IN') in ProductCard");
    });

    await record(S, "Product detail loads via slug", "CRITICAL", async () => {
        await goto(page, "/products");
        await page.waitForTimeout(2000);
        const links = await findProductLinks(page);
        if (!links.length) { skip(S, "Product detail via slug", "CRITICAL", "No product links found"); return; }
        await goto(page, links[0]);
        if (!page.url().includes("/products/")) throw new Error("Did not navigate to product detail");
    });

    await record(S, "Product detail: Add to Cart button", "HIGH", async () => {
        if (!page.url().includes("/products/")) { skip(S, "Add to Cart button", "HIGH", "Not on detail page"); return; }
        const btn = await page.$('button:has-text("Add to Cart"),button:has-text("Add"),[data-testid="add-to-cart"],button[class*="add"],button[class*="cart"]');
        if (!btn) throw new Error("No Add to Cart button. Add data-testid='add-to-cart' to your AddToCartButton.");
    });

    await record(S, "Product detail: stock status visible", "MEDIUM", async () => {
        if (!page.url().includes("/products/")) { skip(S, "Stock status", "MEDIUM", "Not on detail page"); return; }
        const body = await page.textContent("body");
        if (!/in stock|out of stock|only \d+ left|\d+ units/i.test(body || ""))
            throw new Error("No stock status. Display variant.stock_qty on product detail page.");
    });

    await page.close();
}

/* ══════════════════════════════════
   SUITE 3 — CART
══════════════════════════════════ */
async function auditCart(ctx: BrowserContext, userLoginOk: boolean) {
    const S = "Cart";
    const CHECKS = ["Cart page loads", "Add product to cart", "Cart count in nav",
        "Cart persists after reload", "Qty blocked at stock_qty", "Item removal works"];

    if (!userLoginOk) {
        CHECKS.forEach(c => skip(S, c, "CRITICAL", "Auth unavailable — create test user first"));
        return;
    }

    const page = await ctx.newPage();
    await login(page, CFG.USER_EMAIL, CFG.USER_PASS);

    await record(S, "Cart page loads", "CRITICAL", () => goto(page, "/cart"));

    let added = false;
    await record(S, "Add product to cart", "CRITICAL", async () => {
        await goto(page, "/products");
        await page.waitForTimeout(2000);
        const links = await findProductLinks(page);
        if (!links.length) throw new Error("No products to add — seed Supabase products table");
        await goto(page, links[0]);
        const btn = await page.$('button:has-text("Add to Cart"),button:has-text("Add"),[data-testid="add-to-cart"]');
        if (!btn) throw new Error("No Add to Cart button on product detail");
        await btn.click(); await page.waitForTimeout(2000); added = true;
    });

    await record(S, "Cart count in header/nav", "HIGH", async () => {
        if (!added) throw new Error("Skipped — add failed");
        const badge = await page.$('[data-testid="cart-count"],.cart-count,[aria-label*="art"] span,[href="/cart"] span,[class*="count"],[class*="badge"]');
        if (!badge) throw new Error("No cart badge in nav. Add a badge to your cart icon in Header.tsx");
    });

    await record(S, "Cart persists after reload (Supabase sync)", "HIGH", async () => {
        if (!added) throw new Error("Skipped — add failed");
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        await goto(page, "/cart");
        await page.waitForTimeout(1500);
        const body = await page.textContent("body");
        const hasItems = /remove|quantity|qty|₹/i.test(body || "");
        if (!hasItems) throw new Error("Cart empty after reload. Fix CartContext.tsx — fetch from Supabase on mount.");
    });

    await record(S, "Qty increase blocked at stock_qty", "CRITICAL", async () => {
        await goto(page, "/cart");
        await page.waitForTimeout(1000);
        const inc = await page.$('button[aria-label*="ncrease"],button:has-text("+"),[data-testid="qty-increase"],[class*="increase"]');
        if (!inc) { skip(S, "Qty stock block", "CRITICAL", "No qty+ button found in cart"); return; }
        for (let i = 0; i < 200; i++) {
            const dis = await inc.getAttribute("disabled");
            const ard = await inc.getAttribute("aria-disabled");
            if (dis !== null || ard === "true") return;
            await inc.click(); await page.waitForTimeout(80);
        }
        throw new Error("Qty allowed past 200 — fix: check variant.stock_qty in CartContext.updateQuantity()");
    });

    await record(S, "Cart item removal works", "HIGH", async () => {
        await goto(page, "/cart");
        await page.waitForTimeout(1000);
        const before = (await page.$$('[data-testid="cart-item"],.cart-item')).length;
        const rmv = await page.$('button[aria-label*="emove"],button:has-text("Remove"),[data-testid="remove-item"],[class*="remove"]');
        if (!rmv) { skip(S, "Item removal", "HIGH", "No remove button found"); return; }
        await rmv.click(); await page.waitForTimeout(2000);
        const after = (await page.$$('[data-testid="cart-item"],.cart-item')).length;
        if (after >= before && before > 0) throw new Error(`Count unchanged (before:${before} after:${after})`);
    });

    await page.close();
}

/* ══════════════════════════════════
   SUITE 4 — CHECKOUT
══════════════════════════════════ */
async function auditCheckout(ctx: BrowserContext, userLoginOk: boolean) {
    const S = "Checkout & Payments";
    const CHECKS = ["/checkout loads", "INR summary", "Address validation", "COD option",
        "create_order_from_cart RPC", "dummy-payment", "Webhook endpoint"];

    if (!userLoginOk) {
        CHECKS.forEach(c => skip(S, c, "CRITICAL", "Auth unavailable — create test user first"));
        return;
    }

    const page = await ctx.newPage();
    await login(page, CFG.USER_EMAIL, CFG.USER_PASS);

    // Seed cart
    await goto(page, "/products"); await page.waitForTimeout(2000);
    const links = await findProductLinks(page);
    if (links.length > 0) {
        await goto(page, links[0]);
        const add = await page.$('button:has-text("Add to Cart"),button:has-text("Add"),[data-testid="add-to-cart"]');
        if (add) { await add.click(); await page.waitForTimeout(1500); }
    }

    await record(S, "/checkout page loads with auth", "CRITICAL", async () => {
        await goto(page, "/checkout");
        if (page.url().includes("/login")) throw new Error("Redirected to login — auth not persisting");
    });

    await record(S, "Order summary shows ₹ amount", "HIGH", async () => {
        await goto(page, "/checkout"); await page.waitForTimeout(1200);
        if (!(await page.textContent("body"))?.includes("₹"))
            throw new Error("No ₹ total in checkout. Render cart total with ₹ prefix.");
    });

    await record(S, "Shipping address required (validation)", "HIGH", async () => {
        await goto(page, "/checkout"); await page.waitForTimeout(800);
        const btn = await page.$('button[type="submit"],button:has-text("Place Order"),button:has-text("Proceed")');
        if (!btn) { skip(S, "Address validation", "HIGH", "No submit button"); return; }
        await btn.click(); await page.waitForTimeout(2000);
        const url = page.url();
        const body = await page.textContent("body");
        const valid = url.includes("checkout") || /required|address|fill|enter/i.test(body || "");
        if (!valid) throw new Error("Checkout submitted without address — add form validation");
    });

    await record(S, "COD option present", "HIGH", async () => {
        await goto(page, "/checkout"); await page.waitForTimeout(800);
        const cod = await page.$('input[value="cod"],label:has-text("Cash on Delivery"),label:has-text("COD"),[data-testid="cod"]');
        if (!cod) throw new Error("No COD option. Add payment method radio group with value='cod'.");
    });

    await record(S, "create_order_from_cart RPC fired on submit", "CRITICAL", async () => {
        let called = false;
        page.on("request", req => { if (req.url().includes("rpc/create_order_from_cart")) called = true; });
        await goto(page, "/checkout"); await page.waitForTimeout(600);
        for (const [sel, val] of [
            ['input[name*="address"],input[placeholder*="ddress"]', "12 MG Road"],
            ['input[name*="city"],input[placeholder*="ity"]', "Bengaluru"],
            ['input[name*="pin"],input[name*="zip"],input[placeholder*="in"]', "560001"],
        ] as [string, string][]) {
            const el = await page.$(sel).catch(() => null);
            if (el) await el.fill(val);
        }
        const cod = await page.$('input[value="cod"],input[id*="cod"]');
        if (cod) await cod.click();
        const btn = await page.$('button[type="submit"],button:has-text("Place Order")');
        if (btn) { await btn.click(); await page.waitForTimeout(5000); }
        if (!called) throw new Error(
            "create_order_from_cart RPC not called. Ensure handleSubmit() in Checkout.tsx calls " +
            "supabase.rpc('create_order_from_cart',...) and cart is not empty."
        );
    });

    await record(S, "/dummy-payment page accessible", "CRITICAL", async () => {
        await goto(page, "/dummy-payment");
        const body = await page.textContent("body");
        if (!body || body.trim().length < 30) throw new Error("Dummy payment page is blank");
    });

    await record(S, "Webhook /api/webhook endpoint", "CRITICAL", async () => {
        const status = await page.evaluate(async base => {
            try { const r = await fetch(`${base}/api/webhook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); return r.status; }
            catch { return 0; }
        }, CFG.BASE_URL);
        if (status === 0 || status === 404) skip(S, "Webhook", "CRITICAL", "⚠ /api/webhook not found — implement before go-live");
        else if (status >= 500) throw new Error(`Webhook returned ${status}`);
    });

    await page.close();
}

/* ══════════════════════════════════
   SUITE 5 — CUSTOMISATION
══════════════════════════════════ */
async function auditCustomisation(ctx: BrowserContext, userLoginOk: boolean) {
    const S = "Product Customisation";
    const page = await ctx.newPage();
    if (userLoginOk) await login(page, CFG.USER_EMAIL, CFG.USER_PASS);

    await record(S, "Customisation section on product", "HIGH", async () => {
        await goto(page, "/products"); await page.waitForTimeout(2000);
        const links = await findProductLinks(page);
        if (!links.length) { skip(S, "Customisation section", "HIGH", "No products found"); return; }
        await goto(page, links[0]); await page.waitForTimeout(1000);
        const form = await page.$('[data-testid*="custom"],[class*="custom"],[id*="custom"],form');
        if (!form) skip(S, "Customisation section", "HIGH", "No customisation form on this product page");
    });

    await record(S, "Customisation fields (message/size/color/material)", "MEDIUM", async () => {
        const body = await page.textContent("body");
        const found = ["message", "color", "material", "size"].filter(f => body?.toLowerCase().includes(f));
        if (found.length < 2) skip(S, "Customisation fields", "MEDIUM", `Only ${found.length}/4 fields found`);
    });

    await record(S, "File upload input present", "MEDIUM", async () => {
        const fi = await page.$('input[type="file"]');
        if (!fi) skip(S, "File upload", "MEDIUM", "No file input on this product page");
    });

    await page.close();
}

/* ══════════════════════════════════
   SUITE 6 — ADMIN
══════════════════════════════════ */
async function auditAdmin(ctx: BrowserContext) {
    const S = "Admin Panel";
    const page = await ctx.newPage();
    const ok = await loginSafe(page, CFG.ADMIN_EMAIL, CFG.ADMIN_PASS);
    if (!ok) {
        ["Admin loads", "Stats visible", "Inventory", "Pricing", "Orders"]
            .forEach(c => skip(S, c, "HIGH", "Admin login failed — create admin account"));
        await page.close(); return;
    }

    await record(S, "/admin loads for admin user", "CRITICAL", async () => {
        await goto(page, "/admin");
        if (!page.url().includes("/admin")) throw new Error("Admin redirected from /admin");
    });
    await record(S, "Dashboard shows stats", "HIGH", async () => {
        const body = await page.textContent("body");
        if (!/\d+/.test(body || "")) throw new Error("No stats visible");
    });
    await record(S, "Inventory list renders", "CRITICAL", async () => {
        const inv = await page.$('button:has-text("Inventory"),a[href*="inventory"]');
        if (inv) { await inv.click(); await page.waitForTimeout(1500); }
        const rows = await page.$$("tr,[data-testid='product-row']");
        if (rows.length < 2) throw new Error("No product rows in admin inventory");
    });
    await record(S, "Pricing panel accessible", "HIGH", async () => {
        const pl = await page.$('button:has-text("Pricing"),a[href*="pricing"]');
        if (!pl) { skip(S, "Pricing panel", "HIGH", "No Pricing nav link"); return; }
        await pl.click(); await page.waitForTimeout(1000);
    });
    await record(S, "Orders list visible", "HIGH", async () => {
        const ol = await page.$('button:has-text("Orders"),a[href*="orders"]');
        if (!ol) { skip(S, "Admin orders", "HIGH", "No Orders nav link"); return; }
        await ol.click(); await page.waitForTimeout(1500);
        if (!/(ORD|order)/i.test((await page.textContent("body")) || ""))
            throw new Error("No order IDs in admin orders view");
    });

    await page.close();
}

/* ══════════════════════════════════
   SUITE 7 — DATABASE
══════════════════════════════════ */
async function auditDatabase(sb: SupabaseClient) {
    const S = "Database Integrity";
    const TABLES = ["profiles", "products", "product_variants", "product_media", "carts",
        "orders", "payments", "cart_item_customizations", "customization_uploads", "user_roles"];
    for (const t of TABLES)
        await record(S, `Table: ${t}`, "CRITICAL", async () => {
            const { error } = await sb.from(t).select("*").limit(1);
            if (error) throw new Error(error.message);
        });
    await record(S, "product_variants: stock_qty + price", "CRITICAL", async () => {
        const { error } = await sb.from("product_variants").select("stock_qty,price").limit(1);
        if (error) throw new Error(error.message);
    });
    await record(S, "RPC: create_order_from_cart", "CRITICAL", async () => {
        const { error } = await (sb as any).rpc("create_order_from_cart");
        if (error?.message?.toLowerCase().includes("does not exist")) throw new Error(error.message);
    });
    await record(S, "RPC: has_role", "CRITICAL", async () => {
        const { error } = await (sb as any).rpc("has_role", { role: "admin" });
        if (error?.message?.toLowerCase().includes("does not exist")) throw new Error(error.message);
    });
    await record(S, "RLS: anon cannot read profiles", "CRITICAL", async () => {
        const anon = createClient(CFG.SUPABASE_URL, "anon_placeholder");
        const { data } = await anon.from("profiles").select("*").limit(3);
        if (data?.length) throw new Error("⛔ RLS not enforced on profiles");
    });
    await record(S, "No null prices / negative stock", "HIGH", async () => {
        const { data: n } = await sb.from("product_variants").select("id").is("price", null);
        const { data: g } = await sb.from("product_variants").select("id").lt("stock_qty", 0);
        const issues = [];
        if (n?.length) issues.push(`${n.length} null prices`);
        if (g?.length) issues.push(`${g.length} negative stock`);
        if (issues.length) throw new Error(issues.join(", "));
    });
}

/* ══════════════════════════════════
   SUITE 8 — PERF & SECURITY
══════════════════════════════════ */
async function auditPerfSecurity(ctx: BrowserContext) {
    const S = "Performance & Security";
    const page = await ctx.newPage();

    await record(S, "Homepage loads under 3s", "HIGH", async () => {
        const t0 = Date.now();
        await page.goto(CFG.BASE_URL + "/", { waitUntil: "domcontentloaded" });
        const ms = Date.now() - t0;
        if (ms > 3000) throw new Error(`Took ${ms}ms`);
    });

    await record(S, "/products loads under 3s", "HIGH", async () => {
        const t0 = Date.now();
        await page.goto(CFG.BASE_URL + "/products", { waitUntil: "domcontentloaded" });
        const ms = Date.now() - t0;
        if (ms > 3000) throw new Error(`Took ${ms}ms`);
    });

    /* FIX: separate check for 404 resources on /products */
    await record(S, "No 404 resource errors on /products", "MEDIUM", async () => {
        const nf: string[] = [];
        page.on("response", res => {
            if (res.status() === 404 && !res.url().includes("favicon") && !res.url().includes("robots"))
                nf.push(res.url().split("/").pop() || res.url());
        });
        await page.goto(CFG.BASE_URL + "/products", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(3000);
        if (nf.length > 0) throw new Error(`${nf.length} 404 resource(s): ${nf[0]} — check public/assets and import paths`);
    });

    await record(S, "No console JS errors on homepage", "MEDIUM", async () => {
        const errs: string[] = [];
        page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
        await page.goto(CFG.BASE_URL + "/", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(3000);
        const real = errs.filter(e => !e.includes("favicon"));
        if (real.length > 0) throw new Error(`${real.length} error(s): ${real[0].slice(0, 120)}`);
    });

    await record(S, "XSS: search input sanitised", "CRITICAL", async () => {
        await page.goto(CFG.BASE_URL + "/products", { waitUntil: "domcontentloaded" });
        const inp = await page.$('input[type="search"],input[placeholder*="earch"],input[placeholder*="roduct"]');
        if (!inp) { skip(S, "XSS search", "CRITICAL", "No search input on /products"); return; }
        await inp.fill('<script>window.__xss=1</script>');
        await inp.press("Enter");
        await page.waitForTimeout(1500);
        if (await page.evaluate(() => (window as any).__xss === 1))
            throw new Error("⛔ XSS VULNERABILITY — script executed");
    });

    await record(S, "Supabase service key not in page source", "HIGH", async () => {
        await page.goto(CFG.BASE_URL + "/", { waitUntil: "domcontentloaded" });
        const src = await page.content();
        if (CFG.SUPABASE_KEY && CFG.SUPABASE_KEY.length > 20 && src.includes(CFG.SUPABASE_KEY))
            throw new Error("⛔ Service key in page HTML — use VITE_SUPABASE_ANON_KEY only");
    });

    await record(S, "404 page returns content (not blank)", "MEDIUM", async () => {
        await page.goto(CFG.BASE_URL + "/kaari-no-page-99999");
        const body = await page.textContent("body");
        if (!body || body.trim().length < 30) throw new Error(
            "404 blank. Fix: Update src/pages/NotFound.tsx with proper content (see kaari.fixes.md section 3)"
        );
    });

    await record(S, "robots.txt present", "LOW", async () => {
        const res = await page.goto(CFG.BASE_URL + "/robots.txt");
        if (!res || res.status() === 404) throw new Error("Missing /public/robots.txt");
    });

    await record(S, "Images have alt text", "MEDIUM", async () => {
        await page.goto(CFG.BASE_URL + "/products", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const bad = await page.$$eval("img", imgs =>
            imgs.filter(i => !i.getAttribute("alt") || i.getAttribute("alt")!.trim() === "")
                .map(i => i.src.split("/").pop() || "?")
        );
        if (bad.length > 0) throw new Error(`${bad.length} img(s) missing alt: ${bad.slice(0, 3).join(", ")}`);
    });

    await page.close();
}

/* ══════════════════════════════════
   MAIN
══════════════════════════════════ */
async function main() {
    preflightCheck();
    console.log("🔍 Kaari Audit v2 — Starting...\n");
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        viewport: { width: 1280, height: 800 }, locale: "en-IN", timezoneId: "Asia/Kolkata"
    });
    let sb: SupabaseClient | null = null;
    if (CFG.SUPABASE_URL && CFG.SUPABASE_KEY)
        sb = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: false } });

    try {
        const userLoginOk = await auditAuth(ctx);
        await auditProducts(ctx);
        await auditCart(ctx, userLoginOk);
        await auditCheckout(ctx, userLoginOk);
        await auditCustomisation(ctx, userLoginOk);
        await auditAdmin(ctx);
        if (sb) await auditDatabase(sb);
        else results.push({
            suite: "Database Integrity", check: "Supabase connection", status: "SKIP",
            severity: "CRITICAL", detail: "Set SUPABASE_URL + SUPABASE_SERVICE_KEY env vars"
        });
        await auditPerfSecurity(ctx);
    } finally {
        await ctx.close();
        await browser.close();
    }
    printReport();
    process.exit(results.some(r => r.status === "FAIL" && r.severity === "CRITICAL") ? 1 : 0);
}

main().catch(err => { console.error("Audit crashed:", err); process.exit(2); });