const { requireRole } = require('../middleware/auth');

function runRoleCheck(role, user) {
  let error;
  requireRole(role)({ user }, {}, (err) => { error = err; });
  return error;
}

test('librarian role gate rejects an authenticated patron', () => {
  const error = runRoleCheck('librarian', { role: 'patron' });
  expect(error.statusCode).toBe(403);
  expect(error.message).toBe('Forbidden: insufficient permissions');
});

test('librarian role gate allows a librarian', () => {
  expect(runRoleCheck('librarian', { role: 'librarian' })).toBeUndefined();
});
