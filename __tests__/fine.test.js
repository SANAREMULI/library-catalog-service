const { calculateLateFine } = require('../lib/fine');

test('fine calculation returns $0.50 for a two-calendar-day late return', () => {
  const fine = calculateLateFine(
    '2026-03-10T18:00:00Z',
    '2026-03-12T08:00:00Z',
    0.25
  );

  expect(fine).toBe(0.5);
});

test('fine calculation never becomes negative for an on-time return', () => {
  expect(calculateLateFine('2026-03-10T12:00:00Z', '2026-03-10T09:00:00Z')).toBe(0);
});
