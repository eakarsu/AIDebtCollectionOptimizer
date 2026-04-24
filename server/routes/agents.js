const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('collection_agents', [
  'id', 'name', 'email', 'phone', 'team', 'status', 'accounts_assigned', 'total_recovered', 'success_rate', 'performance_score', 'notes', 'created_at', 'updated_at'
], 'name');
