const universityData = require('../data/universityData');
const { DateTime, Interval } = require('luxon');

function isConflict(date, durationHours, venueName) {
  const dt = DateTime.fromISO(date);
  const end = dt.plus({ hours: durationHours });
  for (const exam of universityData.exams) {
    if (Interval.fromDateTimes(DateTime.fromISO(exam.start), DateTime.fromISO(exam.end)).contains(dt)) {
      return true;
    }
  }
  for (const holiday of universityData.holidays) {
    if (Interval.fromDateTimes(DateTime.fromISO(holiday.start), DateTime.fromISO(holiday.end)).contains(dt)) {
      return true;
    }
  }
  const venue = universityData.venues.find(v => v.name === venueName);
  if (venue) {
    for (const booking of venue.bookings) {
      if (Interval.fromDateTimes(DateTime.fromISO(booking.start), DateTime.fromISO(booking.end)).overlaps(
        Interval.fromDateTimes(dt, end)
      )) {
        return true;
      }
    }
  }
  return false;
}

function suggestSlots({ beforeDate, afterDate, durationHours, venueName }) {
  const slots = [];
  let dt = DateTime.fromISO(afterDate).startOf('day');
  const endDt = DateTime.fromISO(beforeDate).endOf('day');
  while (dt < endDt) {
    for (let hour = 9; hour <= 18 - durationHours; hour++) {
      const slotStart = dt.set({ hour, minute: 0 });
      if (!isConflict(slotStart.toISO(), durationHours, venueName)) {
        slots.push(slotStart.toISO());
      }
    }
    dt = dt.plus({ days: 1 });
  }
  return slots;
}

module.exports = { suggestSlots }; 