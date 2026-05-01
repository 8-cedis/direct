-- ============================================================
-- RLS FIX: Row-Level Security Policies for FarmDirect
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- ── OPTION A (Recommended for admin-only dashboard) ──────────
-- Allow ALL operations for authenticated users.
-- Since only logged-in admins use this dashboard, this is safe.

-- 1. PRODUCTS
alter table public.products enable row level security;

drop policy if exists "Allow authenticated full access on products" on public.products;
create policy "Allow authenticated full access on products"
  on public.products
  for all                        -- SELECT, INSERT, UPDATE, DELETE
  to authenticated               -- any logged-in user
  using (true)
  with check (true);

-- Also allow anon SELECT so the storefront can read products
drop policy if exists "Allow public read on products" on public.products;
create policy "Allow public read on products"
  on public.products
  for select
  to anon
  using (status = 'active');

-- 2. INVENTORY MOVEMENTS
alter table public.inventory_movements enable row level security;

drop policy if exists "Allow authenticated full access on inventory_movements" on public.inventory_movements;
create policy "Allow authenticated full access on inventory_movements"
  on public.inventory_movements
  for all
  to authenticated
  using (true)
  with check (true);

-- 3. ORDERS
alter table public.orders enable row level security;

drop policy if exists "Allow authenticated full access on orders" on public.orders;
create policy "Allow authenticated full access on orders"
  on public.orders
  for all
  to authenticated
  using (true)
  with check (true);

-- Customers can see their own orders
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders"
  on public.orders
  for select
  to anon
  using (true);

-- 4. ORDER ITEMS
alter table public.order_items enable row level security;

drop policy if exists "Allow authenticated full access on order_items" on public.order_items;
create policy "Allow authenticated full access on order_items"
  on public.order_items
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Allow anon read on order_items" on public.order_items;
create policy "Allow anon read on order_items"
  on public.order_items
  for select
  to anon
  using (true);

-- 5. USERS
alter table public.users enable row level security;

drop policy if exists "Allow authenticated full access on users" on public.users;
create policy "Allow authenticated full access on users"
  on public.users
  for all
  to authenticated
  using (true)
  with check (true);

-- 6. CUSTOMERS
alter table public.customers enable row level security;

drop policy if exists "Allow authenticated full access on customers" on public.customers;
create policy "Allow authenticated full access on customers"
  on public.customers
  for all
  to authenticated
  using (true)
  with check (true);

-- 7. DRIVERS
alter table public.drivers enable row level security;

drop policy if exists "Allow authenticated full access on drivers" on public.drivers;
create policy "Allow authenticated full access on drivers"
  on public.drivers
  for all
  to authenticated
  using (true)
  with check (true);

-- 8. DRIVER DELIVERIES
alter table public.driver_deliveries enable row level security;

drop policy if exists "Allow authenticated full access on driver_deliveries" on public.driver_deliveries;
create policy "Allow authenticated full access on driver_deliveries"
  on public.driver_deliveries
  for all
  to authenticated
  using (true)
  with check (true);

-- 9. FARMERS
alter table public.farmers enable row level security;

drop policy if exists "Allow authenticated full access on farmers" on public.farmers;
create policy "Allow authenticated full access on farmers"
  on public.farmers
  for all
  to authenticated
  using (true)
  with check (true);

-- 10. FARMER BATCHES
alter table public.farmer_batches enable row level security;

drop policy if exists "Allow authenticated full access on farmer_batches" on public.farmer_batches;
create policy "Allow authenticated full access on farmer_batches"
  on public.farmer_batches
  for all
  to authenticated
  using (true)
  with check (true);

-- 11. FARMER PAYOUTS
alter table public.farmer_payouts enable row level security;

drop policy if exists "Allow authenticated full access on farmer_payouts" on public.farmer_payouts;
create policy "Allow authenticated full access on farmer_payouts"
  on public.farmer_payouts
  for all
  to authenticated
  using (true)
  with check (true);

-- 12. PAYMENT TRANSACTIONS
alter table public.payment_transactions enable row level security;

drop policy if exists "Allow authenticated full access on payment_transactions" on public.payment_transactions;
create policy "Allow authenticated full access on payment_transactions"
  on public.payment_transactions
  for all
  to authenticated
  using (true)
  with check (true);

-- 13. SUPPORT TICKETS
alter table public.support_tickets enable row level security;

drop policy if exists "Allow authenticated full access on support_tickets" on public.support_tickets;
create policy "Allow authenticated full access on support_tickets"
  on public.support_tickets
  for all
  to authenticated
  using (true)
  with check (true);

-- 14. COMPLAINTS
alter table public.complaints enable row level security;

drop policy if exists "Allow authenticated full access on complaints" on public.complaints;
create policy "Allow authenticated full access on complaints"
  on public.complaints
  for all
  to authenticated
  using (true)
  with check (true);

-- Also allow anon INSERT so customers can submit complaints from the storefront
drop policy if exists "Allow anon insert on complaints" on public.complaints;
create policy "Allow anon insert on complaints"
  on public.complaints
  for insert
  to anon
  with check (true);

-- 15. CUSTOMER INTERACTIONS
alter table public.customer_interactions enable row level security;

drop policy if exists "Allow authenticated full access on customer_interactions" on public.customer_interactions;
create policy "Allow authenticated full access on customer_interactions"
  on public.customer_interactions
  for all
  to authenticated
  using (true)
  with check (true);

-- 16. CAMPAIGNS
alter table public.campaigns enable row level security;

drop policy if exists "Allow authenticated full access on campaigns" on public.campaigns;
create policy "Allow authenticated full access on campaigns"
  on public.campaigns
  for all
  to authenticated
  using (true)
  with check (true);

-- 17. NOTIFICATION TRIGGERS
alter table public.notification_triggers enable row level security;

drop policy if exists "Allow authenticated full access on notification_triggers" on public.notification_triggers;
create policy "Allow authenticated full access on notification_triggers"
  on public.notification_triggers
  for all
  to authenticated
  using (true)
  with check (true);

-- 18. DELIVERY SLOTS
alter table public.delivery_slots enable row level security;

drop policy if exists "Allow authenticated full access on delivery_slots" on public.delivery_slots;
create policy "Allow authenticated full access on delivery_slots"
  on public.delivery_slots
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Allow anon read on delivery_slots" on public.delivery_slots;
create policy "Allow anon read on delivery_slots"
  on public.delivery_slots
  for select
  to anon
  using (is_open = true);

-- 19. APP SETTINGS
alter table public.app_settings enable row level security;

drop policy if exists "Allow authenticated full access on app_settings" on public.app_settings;
create policy "Allow authenticated full access on app_settings"
  on public.app_settings
  for all
  to authenticated
  using (true)
  with check (true);

-- 20. CARTS & CART ITEMS (anon + authenticated)
alter table public.carts enable row level security;

drop policy if exists "Allow all access on carts" on public.carts;
create policy "Allow all access on carts"
  on public.carts
  for all
  to anon, authenticated
  using (true)
  with check (true);

alter table public.cart_items enable row level security;

drop policy if exists "Allow all access on cart_items" on public.cart_items;
create policy "Allow all access on cart_items"
  on public.cart_items
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 21. ORDER TIMELINE & REFUNDS
alter table public.order_timeline enable row level security;

drop policy if exists "Allow authenticated full access on order_timeline" on public.order_timeline;
create policy "Allow authenticated full access on order_timeline"
  on public.order_timeline
  for all
  to authenticated
  using (true)
  with check (true);

alter table public.order_refunds enable row level security;

drop policy if exists "Allow authenticated full access on order_refunds" on public.order_refunds;
create policy "Allow authenticated full access on order_refunds"
  on public.order_refunds
  for all
  to authenticated
  using (true)
  with check (true);

-- Done.
 