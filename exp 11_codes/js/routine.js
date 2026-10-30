// routine.js — the class routine, exported as plain data.
// Durations are short (seconds) so the whole routine can be demonstrated in a lab.

export const routine = [
  { id: 1, subject: 'Web Technologies',  venue: 'Lab 3',    duration: 15 },
  { id: 2, subject: 'Database Systems',  venue: 'Room 204', duration: 20 },
  { id: 3, subject: 'Computer Networks', venue: 'Lab 1',    duration: 25 },
];

// How long (ms) a class stays "In session" before the scheduler moves on.
export const ADVANCE_DELAY = 4000;

// How long (ms) a temporary status message stays on screen.
export const MESSAGE_TIME = 2500;

// Largest value the two-digit minutes display can show (99:59).
export const MAX_SECONDS = 99 * 60 + 59;
