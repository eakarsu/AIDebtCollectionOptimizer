const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('compliance_checks', [
  'id', 'check_name', 'regulation', 'status', 'category', 'description', 'risk_level', 'last_checked', 'next_review', 'findings', 'notes', 'created_at', 'updated_at'
], 'check_name');
