/**
 * 🎙️ NOX Audio-TTS Service
 * Uses Web Speech API to provide voice feedback for staff notifications.
 */

let speechEnabled = false;

export const enableSpeech = () => {
  speechEnabled = true;
  // Pre-warming the engine (some browsers require interaction)
  const utterance = new SpeechSynthesisUtterance('');
  window.speechSynthesis.speak(utterance);
  console.log("🎙️ NOX TTS Enabled");
};

export const speak = (text) => {
  if (!speechEnabled || !window.speechSynthesis) return;

  // Cancel current speech to prevent queue build-up in fast-paced environments
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'it-IT';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
};
