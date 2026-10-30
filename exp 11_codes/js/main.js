// main.js — imports the other modules and wires them together.

import { routine, ADVANCE_DELAY, MAX_SECONDS } from './routine.js';
import { startClock } from './clock.js';
import { createCountdown, watchTimeouts, after } from './timer.js';
import * as ui from './ui.js';

const states = routine.map(() => 'pending'); // pending | next | active | live | done
let index = 0;        // class currently loaded into the countdown
let phase = 'ready';  // ready | running | paused | started | finished

const current = () => routine[index];

/* ---------- Messages for each phase ---------- */

function phaseMessage() {
  switch (phase) {
    case 'running':  return [`Counting down to ${current().subject}.`, 'info'];
    case 'paused':   return ['Paused. Press Start to resume.', 'warn'];
    case 'finished': return ['Routine complete. Press Reset to run it again.', 'success'];
    default:         return ['Ready for the next class.', 'info'];
  }
}

function applyPhase(next) {
  phase = next;
  if (phase === 'running' || phase === 'paused' || phase === 'ready') {
    states[index] = phase === 'running' ? 'active' : 'next';
    ui.renderRoutine(routine, states);
  }
  ui.renderPhase(phase);
  ui.setStatus(...phaseMessage());
  ui.setControls({
    start: phase === 'ready' || phase === 'paused',
    pause: phase === 'running',
    reset: phase !== 'started',
    set:   phase === 'ready' || phase === 'paused',
  });
}

/* ---------- Countdown ---------- */

const countdown = createCountdown({
  onTick: (seconds) => ui.renderCountdown(seconds, phase === 'finished' ? '' : current().subject),
  onFinish: onClassStart,
  onStateChange: ui.renderCountdownActive,
});

function loadClass(i) {
  index = i;
  states[i] = 'next';
  countdown.load(current().duration);
  ui.renderUpcoming(current());
  ui.renderRoutine(routine, states);
  applyPhase('ready');
}

// Countdown hit zero: announce the class, then (setTimeout) move to the next one.
function onClassStart() {
  states[index] = 'live';
  ui.renderRoutine(routine, states);
  applyPhase('started');
  ui.setStatus(`Started: ${current().subject}!`, 'success');
  after(ADVANCE_DELAY, advance);
}

function advance() {
  states[index] = 'done';
  if (index + 1 < routine.length) {
    loadClass(index + 1);
    ui.flashStatus(`Next up: ${current().subject}.`, 'info', phaseMessage);
  } else {
    ui.renderRoutine(routine, states);
    ui.renderUpcoming(null, { finished: true });
    countdown.reset(0);
    applyPhase('finished');
  }
}

/* ---------- Controls ---------- */

document.getElementById('btn-start').addEventListener('click', () => {
  if (countdown.start()) applyPhase('running');
});

document.getElementById('btn-pause').addEventListener('click', () => {
  countdown.pause();
  applyPhase('paused');
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (phase === 'finished') {
    states.fill('pending');
    loadClass(0);
    return;
  }
  countdown.reset(current().duration);
  applyPhase('ready');
  ui.flashStatus('Timer reset to the class duration.', 'info', phaseMessage);
});

document.getElementById('set-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const raw = ui.readSeconds();
  const seconds = Number(raw);
  if (raw === '' || !Number.isInteger(seconds) || seconds < 1 || seconds > MAX_SECONDS) {
    ui.flashStatus(`Enter a whole number from 1 to ${MAX_SECONDS}.`, 'error', phaseMessage);
    return;
  }
  countdown.reset(seconds);
  ui.clearSecondsInput();
  applyPhase('ready');
  ui.flashStatus(`Timer set to ${seconds} seconds.`, 'success', phaseMessage);
});

/* ---------- Start up ---------- */

watchTimeouts(ui.renderTimeoutsWaiting);
startClock(ui.renderClock);
ui.renderClockActive(true);
ui.renderCountdownActive(false);
loadClass(0);
ui.markModulesLoaded();
