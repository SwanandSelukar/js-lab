// ui.js — everything that touches the DOM. Text is always set with textContent.

import { splitTime, after, cancelAfter } from './timer.js';
import { MESSAGE_TIME } from './routine.js';

const $ = (id) => document.getElementById(id);

const el = {
  clockTime: $('clock-time'),
  clockDate: $('clock-date'),
  board: $('board'),
  phase: $('phase'),
  boardTitle: $('board-title'),
  subject: $('subject'),
  venue: $('venue'),
  length: $('length'),
  flap: $('flap'),
  flapSr: $('flap-sr'),
  status: $('status'),
  routine: $('routine-body'),
  routineCount: $('routine-count'),
  bar: $('bar'),
  barFill: $('bar-fill'),
  barLabel: $('bar-label'),
  startBtn: $('btn-start'),
  pauseBtn: $('btn-pause'),
  resetBtn: $('btn-reset'),
  setBtn: $('btn-set'),
  secondsInput: $('seconds'),
  tClock: $('t-clock'),
  tCountdown: $('t-countdown'),
  tTimeout: $('t-timeout'),
  modules: $('modules-status'),
};

/* ---------- Clock ---------- */

export function renderClock({ time, date }) {
  el.clockTime.textContent = time;
  el.clockDate.textContent = date;
}

/* ---------- Split-flap digits ---------- */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const tiles = [...el.flap.querySelectorAll('.tile')];

function setDigit(tile, digit) {
  const faces = {
    top: tile.querySelector('.top i'),
    bottom: tile.querySelector('.bottom i'),
    foldTop: tile.querySelector('.fold-top i'),
    foldBottom: tile.querySelector('.fold-bottom i'),
  };
  const old = tile.dataset.digit;
  if (old === digit) return;
  tile.dataset.digit = digit;

  if (old === undefined || reduceMotion.matches) {
    Object.values(faces).forEach((face) => { face.textContent = digit; });
    return;
  }

  // Restart the fold: the old digit's top half falls, the new digit's bottom half rises.
  tile.classList.remove('flipping');
  faces.top.textContent = digit;
  faces.foldTop.textContent = old;
  faces.foldBottom.textContent = digit;
  void tile.offsetWidth; // force reflow so the animation restarts
  tile.classList.add('flipping');

  const finish = () => {
    faces.bottom.textContent = tile.dataset.digit;
    tile.classList.remove('flipping');
  };
  tile.querySelector('.fold-bottom').addEventListener('animationend', finish, { once: true });
}

export function renderCountdown(seconds, label) {
  const { m, s } = splitTime(seconds);
  const digits = m + s;
  tiles.forEach((tile, i) => setDigit(tile, digits[i]));
  el.flapSr.textContent = `${Number(m)} minutes ${Number(s)} seconds`;
  document.title = seconds > 0 && label
    ? `${m}:${s} · ${label} — Class Scheduler`
    : 'Class Scheduler & Countdown';
}

/* ---------- Upcoming class + phase ---------- */

const PHASES = {
  ready:    'Ready',
  running:  'Running',
  paused:   'Paused',
  started:  'In session',
  finished: 'All done',
};

export function renderUpcoming(cls, { finished = false } = {}) {
  if (finished) {
    el.subject.textContent = 'Routine complete';
    el.venue.textContent = 'No more classes today';
    el.length.textContent = '';
    return;
  }
  el.subject.textContent = cls.subject;
  el.venue.textContent = cls.venue;
  el.length.textContent = `${cls.duration} s class`;
}

const BOARD_TITLES = { started: 'Now in session', finished: 'Today' };

export function renderPhase(phase) {
  el.phase.textContent = PHASES[phase];
  el.boardTitle.textContent = BOARD_TITLES[phase] ?? 'Next class';
  el.board.dataset.phase = phase;
}

/* ---------- Status message ---------- */

let clearTimer = null;

/** Show the always-on message for the current phase. */
export function setStatus(text, tone = 'info') {
  if (clearTimer !== null) { cancelAfter(clearTimer); clearTimer = null; }
  el.status.textContent = text;
  el.status.dataset.tone = tone;
}

/** Show a message that falls back to `fallback()` after a short delay (setTimeout). */
export function flashStatus(text, tone, fallback) {
  setStatus(text, tone);
  clearTimer = after(MESSAGE_TIME, () => {
    clearTimer = null;
    const [t, k] = fallback();
    el.status.textContent = t;
    el.status.dataset.tone = k;
  });
}

/* ---------- Routine table + progress ---------- */

const STATE_LABEL = {
  done: 'Completed',
  live: 'In session',
  next: 'Up next',
  active: 'Running',
  pending: 'Pending',
};

export function renderRoutine(routine, states) {
  el.routine.replaceChildren(...routine.map((cls, i) => {
    const row = document.createElement('li');
    row.className = 'row';
    row.dataset.state = states[i];

    const num = document.createElement('span');
    num.className = 'row-num';
    num.textContent = String(i + 1);

    const main = document.createElement('span');
    main.className = 'row-main';
    const name = document.createElement('strong');
    name.textContent = cls.subject;
    const venue = document.createElement('span');
    venue.textContent = cls.venue;
    main.append(name, venue);

    const dur = document.createElement('span');
    dur.className = 'row-dur';
    dur.textContent = `${cls.duration} s`;

    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = STATE_LABEL[states[i]];

    row.append(num, main, dur, pill);
    return row;
  }));

  const done = states.filter((s) => s === 'done').length;
  const pct = Math.round((done / routine.length) * 100);
  el.routineCount.textContent = `${routine.length} classes`;
  el.barFill.style.width = `${pct}%`;
  el.bar.setAttribute('aria-valuenow', String(pct));
  el.barLabel.textContent = `${done} of ${routine.length} completed`;
}

/* ---------- Controls ---------- */

export function setControls({ start, pause, reset, set }) {
  el.startBtn.disabled = !start;
  el.pauseBtn.disabled = !pause;
  el.resetBtn.disabled = !reset;
  el.setBtn.disabled = !set;
  el.secondsInput.disabled = !set;
}

export function readSeconds() { return el.secondsInput.value.trim(); }
export function clearSecondsInput() { el.secondsInput.value = ''; }

/* ---------- Timer activity strip ---------- */

export function renderClockActive(active) {
  el.tClock.dataset.on = String(active);
  el.tClock.querySelector('.t-state').textContent = active ? 'Ticking' : 'Stopped';
}
export function renderCountdownActive(active) {
  el.tCountdown.dataset.on = String(active);
  el.tCountdown.querySelector('.t-state').textContent = active ? 'Running' : 'Stopped';
}
export function renderTimeoutsWaiting(count) {
  el.tTimeout.dataset.on = String(count > 0);
  el.tTimeout.querySelector('.t-state').textContent =
    count === 0 ? 'None waiting' : `${count} waiting`;
}

export function markModulesLoaded() {
  el.modules.textContent = 'Loaded';
  el.modules.dataset.on = 'true';
}
