const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('regulatory_alerts', [
  'id', 'title', 'regulation', 'type', 'severity', 'description', 'effective_date', 'impact_area', 'action_required', 'status', 'notes', 'created_at', 'updated_at'
], 'title');
