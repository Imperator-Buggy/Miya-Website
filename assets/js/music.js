/* ==========================================================================
   Miya's Cookies — soft music-box soundtrack (Web Audio, zero audio files)
   --------------------------------------------------------------------------
   A gentle 3/4 lullaby in C major: a music-box melody (sine + faint octave
   partial with a quick pluck envelope), a warm pad underneath, and a soft
   waltz bass. Everything is synthesised on the fly, so it loads instantly
   and works offline. Browsers require a user gesture before audio can play,
   which is why the intro shows a "tap to begin" card first.

   Public API (window.MiyaMusic): start(), fadeOut(sec), toggle(), muted
   ========================================================================== */
(function () {
  'use strict';

  const MUTE_KEY = 'miya_music_muted';
  const BPM = 84;
  const BEAT = 60 / BPM;          // seconds per beat (3 beats per bar)
  const BAR = BEAT * 3;

  // MIDI note numbers. 0 = rest. Each entry: [note, beats]
  const MELODY = [
    [76, 1], [79, 1], [84, 1],      // E5 G5 C6
    [83, 2], [79, 1],               // B5 .  G5
    [81, 1], [79, 1], [76, 1],      // A5 G5 E5
    [74, 3],                        // D5 . .
    [76, 1], [79, 1], [84, 1],      // E5 G5 C6
    [86, 2], [83, 1],               // D6 .  B5
    [81, 1], [79, 1], [81, 1],      // A5 G5 A5
    [79, 3],                        // G5 . .
    [72, 1], [76, 1], [79, 1],      // C5 E5 G5
    [81, 2], [79, 1],               // A5 .  G5
    [77, 1], [76, 1], [74, 1],      // F5 E5 D5
    [76, 3],                        // E5 . .
    [74, 1], [77, 1], [81, 1],      // D5 F5 A5
    [79, 2], [76, 1],               // G5 .  E5
    [74, 1], [71, 1], [74, 1],      // D5 B4 D5
    [72, 3],                        // C5 . .
  ];
  // One chord per bar: [root, third, fifth] (low register for pad/bass)
  const CHORDS = [
    [48, 52, 55], [47, 50, 55], [45, 48, 52], [41, 45, 48],
    [48, 52, 55], [43, 47, 50], [41, 45, 48], [48, 52, 55],
    [48, 52, 55], [45, 48, 52], [41, 45, 48], [48, 52, 55],
    [43, 47, 50], [48, 52, 55], [43, 47, 50], [48, 52, 55],
  ];

  const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  let ctx = null, master = null, started = false, timer = null;
  let nextNoteTime = 0, melodyIdx = 0, barIdx = 0, beatInBar = 0;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  function ensureContext() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    // a touch of warmth: gentle low-pass on everything
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    master.connect(lp).connect(ctx.destination);
  }

  /* --- voices ----------------------------------------------------------- */
  function pluck(midi, time, vel) {
    // Music box: fast attack, exponential decay, plus a quiet octave partial
    const hz = midiToHz(midi);
    [[hz, vel], [hz * 2, vel * 0.18], [hz * 3, vel * 0.05]].forEach(([f, v]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(v, time + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 1.4);
      o.connect(g).connect(master);
      o.start(time);
      o.stop(time + 1.5);
    });
  }

  function pad(chord, time, dur) {
    chord.forEach((m) => {
      const o = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle'; o2.type = 'triangle';
      o.frequency.value = midiToHz(m + 12);
      o2.frequency.value = midiToHz(m + 12) * 1.004; // slight detune = warmth
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.045, time + 0.6);
      g.gain.setValueAtTime(0.045, time + dur - 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.2);
      o.connect(g); o2.connect(g); g.connect(master);
      o.start(time); o2.start(time);
      o.stop(time + dur + 0.3); o2.stop(time + dur + 0.3);
    });
  }

  function bass(midi, time, vel) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = midiToHz(midi);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vel, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + BEAT * 0.9);
    o.connect(g).connect(master);
    o.start(time);
    o.stop(time + BEAT);
  }

  /* --- scheduler (classic look-ahead pattern) --------------------------- */
  function schedule() {
    while (nextNoteTime < ctx.currentTime + 0.25) {
      const chord = CHORDS[barIdx % CHORDS.length];
      if (beatInBar === 0) {
        pad(chord, nextNoteTime, BAR);
        bass(chord[0], nextNoteTime, 0.16);
      } else {
        bass(chord[beatInBar === 1 ? 2 : 1] + 12, nextNoteTime, 0.07);
      }
      // melody note starting on this beat?
      let acc = 0, i = 0;
      const beatAbs = barIdx * 3 + beatInBar;
      const totalBeats = MELODY.reduce((s, n) => s + n[1], 0);
      const pos = beatAbs % totalBeats;
      for (; i < MELODY.length; i++) { if (acc === pos) break; acc += MELODY[i][1]; }
      if (i < MELODY.length && MELODY[i][0]) {
        const isDownbeat = beatInBar === 0;
        pluck(MELODY[i][0], nextNoteTime, isDownbeat ? 0.22 : 0.16);
      }
      nextNoteTime += BEAT;
      beatInBar = (beatInBar + 1) % 3;
      if (beatInBar === 0) barIdx++;
    }
  }

  function applyMute() {
    if (!master) return;
    const target = muted ? 0.0001 : 1;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.15);
    document.querySelectorAll('[data-music-toggle]').forEach((b) => {
      b.setAttribute('aria-pressed', String(!muted));
      b.classList.toggle('is-muted', muted);
    });
  }

  function start() {
    ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!started) {
      started = true;
      nextNoteTime = ctx.currentTime + 0.1;
      schedule();
      timer = setInterval(schedule, 100);
    }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 1, ctx.currentTime + 2.5);
    applyMute();
  }

  function fadeOut(sec) {
    if (!ctx || !started) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (sec || 1.5));
    setTimeout(() => { if (timer) { clearInterval(timer); timer = null; started = false; } }, (sec || 1.5) * 1000 + 100);
  }

  function toggle() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (!started && !muted) start(); else applyMute();
  }

  window.MiyaMusic = { start, fadeOut, toggle, get muted() { return muted; } };
  document.querySelectorAll('[data-music-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(!muted));
    b.classList.toggle('is-muted', muted);
  });
})();
