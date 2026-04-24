const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('payment_plans', [
  'id', 'debtor_name', 'original_amount', 'plan_amount', 'monthly_payment', 'duration_months', 'interest_rate', 'status', 'start_date', 'next_payment_date', 'notes', 'created_at', 'updated_at'
], 'debtor_name');
