// clock.js — live clock built on setInterval().

const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
});
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

/**
 * Calls `onTick({ time, date })` once immediately and then every second.
 * Returns a function that stops the clock (clearInterval).
 */
export function startClock(onTick) {
  const tick = () => {
    const now = new Date();
    onTick({ time: timeFormat.format(now), date: dateFormat.format(now) });
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
