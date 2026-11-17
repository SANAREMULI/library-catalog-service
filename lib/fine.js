const DAY_MS = 24 * 60 * 60 * 1000;

function calculateLateFine(dueAt, returnedAt, ratePerDay = 0.25) {
  const due = new Date(dueAt);
  const returned = new Date(returnedAt);
  if (Number.isNaN(due.getTime()) || Number.isNaN(returned.getTime())) {
    throw new TypeError('dueAt and returnedAt must be valid dates');
  }
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const returnedDay = Date.UTC(returned.getUTCFullYear(), returned.getUTCMonth(), returned.getUTCDate());
  const daysLate = Math.max(0, Math.floor((returnedDay - dueDay) / DAY_MS));
  return Math.round(daysLate * ratePerDay * 100) / 100;
}

function timeRangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function isValidTimeRange(start, end) {
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  return timePattern.test(start) && timePattern.test(end) && start < end;
}

module.exports = { calculateLateFine, timeRangesOverlap, isValidTimeRange };
