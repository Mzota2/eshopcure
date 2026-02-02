# Admin AI Support Guide

Purpose: Static admin guidance that the AI reads together with live admin data (settings, active promotions, delivery providers, policies). This guide is only included when the AI request 'topic' is `admin`.

---

## Rules & Safety ⚠️
- The AI must only give step-by-step instructions — do **not** perform actions, request secrets, or reveal credentials.
- For sensitive tasks (refunds, payment provider changes, resets) provide UI navigation steps and mention recommended safety checks (backups, staging, test orders).

## Admin UI: Key Sections & Exact Fields

### Admin Settings (Business Information)
- Located at **Admin → Settings → Business Information** (first tab).
- Important fields to reference in answers:
  - **name, description, contactInfo.email, contactInfo.phone, website**
  - **returnDuration** (days customers can return items)
  - **refundDuration** (days to process refunds)
  - **cancellationTime** (hours for booking cancellations)
  - **returnShippingPayer** ("customer" or "business")
  - **googleMap / mapImage / openingHours / address** (pickup info displayed on Delivery page)
- Guidance: When asked how to change return/refund windows, instruct admins to open Settings → update the specific field and click Save.

### Promotions
- Path: **Admin → Promotions → New Promotion**
- Required/important fields when creating promotions:
  - Name, Slug (auto-generated from name but editable), Discount (percentage or fixed), Discount Type, Start Date, End Date, Status (Active/Inactive), Products & Services targets, optional Image.
- Suggestion: Always test the promotion with a sample checkout before going live.

### Policies (Privacy, Returns, Delivery, Terms)
- Path: **Admin → Policies → New Policy** (choose a type).
- Fields: Type, Version/Content, Active flag.
- Behavior: When a policy is set active, it is used on the public-facing policy pages; older versions of the same type are deactivated automatically.
- Guidance: For legal changes, recommend keeping a changelog and communicating to customers (banner/email).

### Delivery Providers & Fees
- Path: **Admin → Delivery & Fees** or **Settings → Delivery** (depending on UI entry).
- Data: provider name, description, estimatedDays (min/max), trackingAvailable flag, region-based pricing.
- Guidance: Use provider estimated days and trackingAvailable flags to answer customer queries about timelines and tracking support.

### Payment Configuration
- Path: **Admin → Settings → Payment Configuration**
- Fields: enabled payment methods (Paychangu integrations), currency, tax rate, and gateway settings.
- Guidance: When troubleshooting payment failures, instruct checking the gateway configuration, logs, and test payment flow.


### Cost Control & Realtime Settings ⚙️
- Path: **Admin → Settings → Cost Control / Performance**
- Recommended admin actions to control costs:
  - Disable or limit non-critical realtime listeners (products, customers, promotions) to reduce Firestore reads.
  - Restrict notifications to critical events or disable certain channels (email/SMS) when not configured.
  - Consider turning on `manual` ledger generation during peak volume to avoid constant ledger writes; generate on-demand via admin UI.
- Reference: [Admin Cost Control Plan](./ADMIN_COST_CONTROL_PLAN.md)

### Products & Services Management
- Path: **Admin → Products / Services**
- Key steps: create/edit item → set name, slug, description, images, pricing, inventory, variant options, isReturnable flag.
- Guidance: For inventory issues, check product inventory tracking and reserved counts.

### Staff & Permissions
- Path: **Admin → Staff / Users** (Staff Section)
- Use: Assign roles (Admin, Staff) and restrict capabilities (orders, products, promotions).
- Guidance: Recommend audit logging and limiting admin access to critical actions.

### Reset Data & Cost Control
- Use: Reset business data (destructive) and cost control settings (monitor spending).
- Guidance: Warn about data loss and recommend backups and staging environment verification before performing resets.

## Troubleshooting Checklist 🔍
- Payment failures: verify Payment Configuration, re-run test transactions, inspect payment provider logs.
- Promotion issues: check promotion status, start/end dates, and targeted products/services.
- Inventory mismatches: review product inventory and recent orders/reservations.
- Policy updates not showing: confirm policy is active and of the correct type; verify cache and page reload.

## Example Admin Answers & Prompts
- "How do I change the store return window?"
  1. Navigate to **Admin → Settings → Business Information**.
  2. Update **returnDuration** (days) and click "Save".
  3. Recommend testing by placing a test order and verifying Returns page text.

- "How do I create a promotion that starts next Monday?"
  1. Navigate to **Admin → Promotions → New Promotion**.
  2. Fill in Name, set Discount and Discount Type, set Start Date to next Monday, and End Date.
  3. Add target products/services, set Status to **Active**, and save.
  4. Test with a sample checkout.

- "Where do I update delivery options?"
  1. Open **Admin → Settings → Delivery** or **Admin → Delivery Providers**.
  2. Add or edit provider details (estimatedDays, trackingAvailable) and save.

---

> Note: This file should be kept in sync with the Admin UI. The AI route merges this file with live admin data (active promotions, delivery providers, current settings) so responses remain precise without exposing secrets.
