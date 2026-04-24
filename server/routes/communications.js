const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('communications', [
  'id', 'template_name', 'type', 'subject', 'body', 'tone', 'compliance_status', 'effectiveness_score', 'use_count', 'category', 'notes', 'created_at', 'updated_at'
], 'template_name');
