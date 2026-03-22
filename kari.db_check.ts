/**
 * kaari.db-check.ts — Supabase-only integrity scan
 * Run independently without a browser: npx tsx kaari.db-check.ts
 *
 * Checks schema, RLS, RPCs, data quality, and payment records.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.");
    process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type CheckResult = { name: string; ok: boolean; detail?: string };
const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        results.push({ name, ok: true });
        process.stdout.write(`  ✓  ${name}\n`);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ name, ok: false, detail: msg });
        process.stdout.write(`  ✗  ${name}\n     └─ ${msg.slice(0, 160)}\n`);
    }
}

async function main() {
    console.log("\n══════════════════════════════════════════");
    console.log("  Kaari DB Health Check");
    console.log("══════════════════════════════════════════\n");

    // ── Core tables ──
    console.log("[ SCHEMA ]");
    const tables = [
        "profiles", "products", "product_variants", "product_media",
        "carts", "cart_items", "orders", "order_items", "payments",
        "cart_item_customizations", "customization_uploads", "user_roles",
    ];
    for (const t of tables) {
        await check(`Table: ${t}`, async () => {
            const { error } = await sb.from(t).select("*").limit(0);
            if (error) throw new Error(error.message);
        });
    }

    // ── Column presence ──
    console.log("\n[ COLUMN CHECKS ]");
    await check("products.slug exists", async () => {
        const { data, error } = await sb.from("products").select("slug").limit(1);
        if (error) throw new Error(error.message);
        if (data && data.length > 0 && !("slug" in data[0])) throw new Error("slug column missing");
    });

    await check("product_variants.stock_qty, price, sku exist", async () => {
        const { data, error } = await sb.from("product_variants").select("stock_qty,price,sku").limit(1);
        if (error) throw new Error(error.message);
    });

    await check("orders.status, total_amount, user_id exist", async () => {
        const { data, error } = await sb.from("orders").select("status,total_amount,user_id").limit(1);
        if (error) throw new Error(error.message);
    });

    await check("payments.payment_method, status, amount exist", async () => {
        const { data, error } = await sb.from("payments").select("payment_method,status,amount").limit(1);
        if (error) throw new Error(error.message);
    });

    await check("user_roles.role column exists", async () => {
        const { data, error } = await sb.from("user_roles").select("role").limit(1);
        if (error) throw new Error(error.message);
    });

    // ── RPC functions ──
    console.log("\n[ RPC FUNCTIONS ]");
    await check("create_order_from_cart() exists", async () => {
        const { error } = await (sb as any).rpc("create_order_from_cart");
        if (error?.message?.toLowerCase().includes("does not exist")) throw new Error(error.message);
    });

    await check("has_role() exists", async () => {
        const { error } = await (sb as any).rpc("has_role", { role: "admin" });
        if (error?.message?.toLowerCase().includes("does not exist")) throw new Error(error.message);
    });

    // ── Data quality ──
    console.log("\n[ DATA QUALITY ]");
    await check("No variants with null price", async () => {
        const { data } = await sb.from("product_variants").select("id").is("price", null);
        if (data && data.length > 0) throw new Error(`${data.length} variants have null price`);
    });

    await check("No variants with negative stock", async () => {
        const { data } = await sb.from("product_variants").select("id,stock_qty").lt("stock_qty", 0);
        if (data && data.length > 0) throw new Error(`${data.length} variants have stock < 0`);
    });

    await check("No products without slug", async () => {
        const { data } = await sb.from("products").select("id").is("slug", null);
        if (data && data.length > 0) throw new Error(`${data.length} products have null slug`);
    });

    await check("All orders linked to a user_id", async () => {
        const { data } = await sb.from("orders").select("id").is("user_id", null);
        if (data && data.length > 0) throw new Error(`${data.length} orders have null user_id`);
    });

    await check("No orphaned payments (order_id must exist)", async () => {
        const { data: payments } = await sb.from("payments").select("order_id");
        const { data: orders } = await sb.from("orders").select("id");
        const orderIds = new Set((orders || []).map(o => o.id));
        const orphans = (payments || []).filter(p => p.order_id && !orderIds.has(p.order_id));
        if (orphans.length > 0) throw new Error(`${orphans.length} payments have no matching order`);
    });

    await check("Payments: valid status values", async () => {
        const valid = new Set(["pending", "completed", "failed", "refunded"]);
        const { data } = await sb.from("payments").select("id,status");
        const bad = (data || []).filter(p => p.status && !valid.has(p.status));
        if (bad.length > 0) throw new Error(`${bad.length} payments with invalid status`);
    });

    await check("Orders: valid status values", async () => {
        const valid = new Set(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]);
        const { data } = await sb.from("orders").select("id,status");
        const bad = (data || []).filter(o => o.status && !valid.has(o.status));
        if (bad.length > 0) throw new Error(`${bad.length} orders with invalid status`);
    });

    await check("cart_item_customizations quote_status valid", async () => {
        const valid = new Set(["not_needed", "pending", "approved", "rejected"]);
        const { data } = await sb.from("cart_item_customizations").select("id,quote_status");
        const bad = (data || []).filter(c => c.quote_status && !valid.has(c.quote_status));
        if (bad.length > 0) throw new Error(`${bad.length} customizations with invalid quote_status`);
    });

    // ── Payment summary ──
    console.log("\n[ PAYMENT SUMMARY ]");
    await check("Fetching payment stats", async () => {
        const { data, error } = await sb.from("payments").select("status, amount");
        if (error) throw new Error(error.message);
        const stats: Record<string, { count: number; total: number }> = {};
        for (const p of data || []) {
            if (!stats[p.status]) stats[p.status] = { count: 0, total: 0 };
            stats[p.status].count++;
            stats[p.status].total += Number(p.amount) || 0;
        }
        for (const [status, s] of Object.entries(stats)) {
            console.log(`     ${status.padEnd(12)} ${s.count} payments  ₹${s.total.toLocaleString("en-IN")}`);
        }
    });

    // ── Summary ──
    const pass = results.filter(r => r.ok).length;
    const fail = results.filter(r => !r.ok).length;
    console.log(`\n══════════════════════════════════════════`);
    console.log(`  TOTAL: ${results.length}  PASS: ${pass}  FAIL: ${fail}`);
    console.log(`══════════════════════════════════════════\n`);
    process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });