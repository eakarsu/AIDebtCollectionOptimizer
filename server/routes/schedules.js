const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('contact_schedules', [
  'id', 'debtor_name', 'contact_type', 'scheduled_date', 'scheduled_time', 'status', 'priority', 'agent_name', 'channel', 'attempt_number', 'notes', 'created_at', 'updated_at'
], 'debtor_name');
