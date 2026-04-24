const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('recovery_predictions', [
  'id', 'debtor_name', 'debt_amount', 'predicted_recovery', 'confidence_score', 'prediction_model', 'factors', 'time_horizon_days', 'recommended_strategy', 'predicted_date', 'notes', 'created_at', 'updated_at'
], 'debtor_name');
