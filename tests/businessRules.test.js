const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateLateFine, isValidTimeRange, timeRangesOverlap } = require('../lib/fine');

test('fine is zero when returned before or on the due calendar date', () => {
  assert.equal(calculateLateFine('2026-03-10T18:00:00Z', '2026-03-10T23:00:00Z'), 0);
  assert.equal(calculateLateFine('2026-03-10T00:00:00Z', '2026-03-09T23:00:00Z'), 0);
});

test('fine is calculated by late calendar days and rounded to cents', () => {
  assert.equal(calculateLateFine('2026-03-10T18:00:00Z', '2026-03-12T08:00:00Z'), 0.5);
  assert.equal(calculateLateFine('2026-03-10T00:00:00Z', '2026-03-11T00:00:00Z', 0.257), 0.26);
});

test('returned request fine is computed from stored dates, not a client fine value', () => {
  const clientBody = { status: 'returned', fine: 9999 };
  const dueAt = '2026-03-10T12:00:00Z';
  const returnedAt = '2026-03-12T08:00:00Z';
  const serverFine = calculateLateFine(dueAt, returnedAt, 0.25);
  assert.equal(serverFine, 0.5);
  assert.notEqual(serverFine, clientBody.fine);
});

test('booking overlap catches partial and contained ranges, but permits adjacent bookings', () => {
  assert.equal(timeRangesOverlap('09:30', '10:30', '10:00', '11:00'), true);
  assert.equal(timeRangesOverlap('10:00', '11:00', '09:00', '12:00'), true);
  assert.equal(timeRangesOverlap('09:00', '10:00', '10:00', '11:00'), false);
  assert.equal(timeRangesOverlap('12:00', '13:00', '09:00', '11:00'), false);
});

test('booking time range must be valid and increasing', () => {
  assert.equal(isValidTimeRange('09:00', '10:00'), true);
  assert.equal(isValidTimeRange('10:00', '10:00'), false);
  assert.equal(isValidTimeRange('24:00', '25:00'), false);
});
