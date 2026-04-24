const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('analytics', [
  'id', 'metric_name', 'category', 'value', 'previous_value', 'change_percent', 'period', 'period_start', 'period_end', 'trend', 'notes', 'created_at', 'updated_at'
], 'metric_name');
