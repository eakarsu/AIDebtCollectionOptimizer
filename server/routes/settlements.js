const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('settlements', [
  'id', 'debtor_name', 'original_amount', 'settlement_amount', 'discount_percent', 'status', 'offered_date', 'expiry_date', 'accepted_date', 'payment_terms', 'notes', 'created_at', 'updated_at'
], 'debtor_name');
