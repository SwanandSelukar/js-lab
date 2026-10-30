// timer.js — countdown (setInterval) and one-shot timeouts (setTimeout).

/* ---------- Countdown ---------- */

/**
 * Creates a controllable countdown.
 *   onTick(remaining)  — runs every second and on load/reset
 *   onFinish()         — runs once when the countdown reaches zero
 */
export function createCountdown({ onTick, onFinish, onStateChange = () => {} }) {
  let total = 0;
  let remaining = 0;
  let intervalId = null;

  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      onStateChange(false);
    }
  };

  const tick = () => {
    remaining -= 1;
    onTick(remaining);
    if (remaining <= 0) {
      stop();
      onFinish();
    }
  };

  return {
    /** Load a new duration (seconds) and stop any running countdown. */
    load(seconds) {
      stop();
      total = remaining = seconds;
      onTick(remaining);
    },
    /** Start or resume. Returns false if already running or nothing to count. */
    start() {
      if (intervalId !== null || remaining <= 0) return false;
      intervalId = setInterval(tick, 1000);
      onStateChange(true);
      return true;
    },
    pause: stop,
    /** Stop and go back to `seconds` (or the last loaded duration). */
    reset(seconds = total) {
      stop();
      total = remaining = seconds;
      onTick(remaining);
    },
    get remaining() { return remaining; },
    get running() { return intervalId !== null; },
  };
}

/* ---------- One-shot timeouts ---------- */
// Thin wrappers around setTimeout() that keep count of how many are waiting,
// so the interface can show it.

const waiting = new Set();
let onWaitingChange = () => {};

export function watchTimeouts(callback) {
  onWaitingChange = callback;
  callback(waiting.size);
}

/** Run `fn` once after `ms`. Returns an id for cancelAfter(). */
export function after(ms, fn) {
  const id = setTimeout(() => {
    waiting.delete(id);
    onWaitingChange(waiting.size);
    fn();
  }, ms);
  waiting.add(id);
  onWaitingChange(waiting.size);
  return id;
}

/** Cancel a timeout created with after(). */
export function cancelAfter(id) {
  if (waiting.delete(id)) {
    clearTimeout(id);
    onWaitingChange(waiting.size);
  }
}

/* ---------- Formatting ---------- */

/** 83 -> { m: '01', s: '23' } */
export function splitTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  return {
    m: String(Math.floor(safe / 60)).padStart(2, '0'),
    s: String(safe % 60).padStart(2, '0'),
  };
}
