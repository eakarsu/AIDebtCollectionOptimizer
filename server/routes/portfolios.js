const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('portfolios', [
  'id', 'name', 'total_accounts', 'total_value', 'recovered_value', 'recovery_rate', 'average_age_days', 'status', 'acquisition_date', 'source', 'notes', 'created_at', 'updated_at'
], 'name');
