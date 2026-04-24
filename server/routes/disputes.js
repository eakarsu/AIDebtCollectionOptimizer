const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('disputes', [
  'id', 'debtor_name', 'dispute_type', 'status', 'amount_disputed', 'description', 'resolution', 'filed_date', 'resolved_date', 'priority', 'notes', 'created_at', 'updated_at'
], 'debtor_name');
