const { timeRangesOverlap, isValidTimeRange } = require('../lib/fine');

test('booking conflict check rejects a partial overlap', () => {
  const existing = { startTime: '10:00', endTime: '11:00' };
  const requested = { startTime: '10:30', endTime: '11:30' };

  expect(isValidTimeRange(requested.startTime, requested.endTime)).toBe(true);
  expect(
    timeRangesOverlap(
      requested.startTime,
      requested.endTime,
      existing.startTime,
      existing.endTime
    )
  ).toBe(true);
});

test('adjacent booking times do not conflict', () => {
  expect(timeRangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
});
