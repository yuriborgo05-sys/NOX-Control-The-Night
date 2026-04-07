/**
 * Bamboo Audio Engine — Web Audio API (no external dependencies)
 * All sounds are synthesized programmatically in-browser.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone({ frequency = 880, duration = 0.15, type = 'sine', volume = 0.3, delay = 0 } = {}) {
  try {
    const ctx = getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  } catch (e) {
    // Silently fail if audio not supported
  }
}

/** Apple Pay-style "ding" — Check-in confermato */
export function playCheckInSound() {
  playTone({ frequency: 1046, duration: 0.12, type: 'sine', volume: 0.25 });
  playTone({ frequency: 1318, duration: 0.2, type: 'sine', volume: 0.2, delay: 0.1 });
}

/** Festive pop — Bottiglia consegnata */
export function playBottleDeliveredSound() {
  // Cork pop effect: short noise burst + ascending tones
  playTone({ frequency: 200, duration: 0.05, type: 'square', volume: 0.15 });
  playTone({ frequency: 523, duration: 0.1, type: 'sine', volume: 0.2, delay: 0.06 });
  playTone({ frequency: 659, duration: 0.1, type: 'sine', volume: 0.2, delay: 0.16 });
  playTone({ frequency: 784, duration: 0.15, type: 'sine', volume: 0.25, delay: 0.26 });
}

/** Soft shimmer — Drink omaggio riscattato */
export function playGiftDrinkSound() {
  playTone({ frequency: 880, duration: 0.08, type: 'sine', volume: 0.2 });
  playTone({ frequency: 1046, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.1 });
  playTone({ frequency: 1318, duration: 0.12, type: 'sine', volume: 0.2, delay: 0.2 });
}

/** Harsh buzz — Frode / QR già usato */
export function playFraudAlertSound() {
  playTone({ frequency: 120, duration: 0.4, type: 'sawtooth', volume: 0.3 });
  playTone({ frequency: 90, duration: 0.3, type: 'sawtooth', volume: 0.25, delay: 0.45 });
}

/** Coin drop — Punti Bamboo guadagnati */
export function playCoinSound() {
  playTone({ frequency: 1200, duration: 0.06, type: 'sine', volume: 0.2 });
  playTone({ frequency: 1600, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.07 });
}

/** New order notification — Standard staff ping */
export function playNotificationSound() {
  playTone({ frequency: 880, duration: 0.1, type: 'sine', volume: 0.2 });
  playTone({ frequency: 1320, duration: 0.15, type: 'sine', volume: 0.2, delay: 0.08 });
}

/** Urgent VIP alarm — High-value order (€1000+) */
export function playVIPAlertSound() {
  // Urgent tri-tone sequence
  playTone({ frequency: 1046, duration: 0.15, type: 'square', volume: 0.2 });
  playTone({ frequency: 880, duration: 0.15, type: 'square', volume: 0.2, delay: 0.16 });
  playTone({ frequency: 1046, duration: 0.25, type: 'square', volume: 0.25, delay: 0.32 });
  // Repeat for urgency
  playTone({ frequency: 1046, duration: 0.15, type: 'square', volume: 0.15, delay: 0.6 });
}
