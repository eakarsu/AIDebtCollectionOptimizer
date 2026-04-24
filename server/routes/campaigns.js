const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('campaigns', [
  'id', 'name', 'type', 'status', 'target_audience', 'start_date', 'end_date', 'budget', 'response_rate', 'recovery_rate', 'notes', 'created_at', 'updated_at'
], 'name');
