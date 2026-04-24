const createCrudRouter = require('./crudHelper');
module.exports = createCrudRouter('debtors', [
  'id', 'name', 'email', 'phone', 'address', 'total_debt', 'status', 'account_number', 'last_contact', 'notes', 'created_at', 'updated_at'
], 'name');
