# Payment Terms Feature - Migration and Testing

## Database Migration

Before deploying, run the migration on your PlanetScale database:

1. Open PlanetScale dashboard and select your development branch
2. Run the SQL from `lib/migration-add-payment-terms.sql`:

```sql
ALTER TABLE ep_events
  ADD COLUMN payment_info_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN payment_mode VARCHAR(20) NULL,
  ADD COLUMN total_event_cost DECIMAL(10,2) NULL,
  ADD COLUMN payment_due_date DATE NULL,
  ADD COLUMN collection_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN collection_locked_at TIMESTAMP NULL;

ALTER TABLE ep_signups
  ADD COLUMN amount_due DECIMAL(10,2) NULL;
```

3. Promote to main when ready

## Testing on to.lgbtq-hub.com

1. Deploy the `feature/payment-terms` branch to Netlify (or merge to your deployment branch)
2. Ensure the migration has been run on the database
3. Test flow:
   - Create event: Coordinate page - select Paid, choose Fixed or Split, enter amount, optional collection date
   - Signup page: Payment summary appears for paid events
   - Event page: Payment summary appears
   - Manage page: Payment summary, Lock Collection button (split only), edit payment fields
   - Admin: Payment summary in row details
   - Calendar: Payment summary in event details panel

## Lock Collection (Split Cost)

For split-cost events, the coordinator can "Lock Collection" from the manage page. This:
- Freezes the signup count
- Calculates final amount per person (total / count, rounded up to 2 decimals)
- Stores amount_due on each signup record
- Prevents further changes to the split amount
