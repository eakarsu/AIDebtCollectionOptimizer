const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('risk_assessments', [
  'id', 'debtor_name', 'risk_score', 'risk_level', 'factors', 'recommendation', 'collection_probability', 'estimated_recovery', 'last_assessed', 'account_age_days', 'notes', 'created_at', 'updated_at'
], 'debtor_name');
