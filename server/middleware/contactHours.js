function isWithinContactHours(timezone = 'America/New_York') {
  const now = new Date();
  const options = { hour: 'numeric', hour12: false, timeZone: timezone };
  const hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now), 10);
  return hour >= 8 && hour < 21;
}

function getNextContactWindow(timezone = 'America/New_York') {
  const now = new Date();
  const options = { hour: 'numeric', hour12: false, timeZone: timezone };
  const currentHour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now), 10);

  const result = new Date(now);

  if (currentHour >= 21) {
    // After 9 PM - next window is 8 AM tomorrow
    result.setDate(result.getDate() + 1);
    result.setHours(result.getHours() + (24 - currentHour + 8));
    result.setMinutes(0, 0, 0);
  } else if (currentHour < 8) {
    // Before 8 AM - next window is 8 AM today
    result.setHours(result.getHours() + (8 - currentHour));
    result.setMinutes(0, 0, 0);
  }
  // else: already within contact hours, return now

  return result;
}

function contactHoursMiddleware(req, res, next) {
  // Only enforce on schedule creation
  if (req.method !== 'POST') {
    return next();
  }

  const timezone = (req.body && req.body.timezone) || 'America/New_York';

  if (!isWithinContactHours(timezone)) {
    const nextWindow = getNextContactWindow(timezone);
    return res.status(400).json({
      error: 'Contact attempted outside of allowed hours',
      message: 'FDCPA requires contacts between 8 AM and 9 PM in the debtor\'s local time.',
      nextContactWindow: nextWindow.toISOString(),
      timezone,
    });
  }

  next();
}

module.exports = {
  isWithinContactHours,
  getNextContactWindow,
  contactHoursMiddleware,
};
