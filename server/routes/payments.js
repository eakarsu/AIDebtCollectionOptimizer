const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('payments', [
  'id', 'debtor_name', 'amount', 'payment_method', 'status', 'reference_number', 'payment_date', 'due_date', 'account_number', 'plan_id', 'notes', 'created_at', 'updated_at'
], 'debtor_name');
