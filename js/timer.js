// Practice Focus Timer with Web Audio API chime
class FocusTimer {
  constructor() {
    this.totalSeconds = 25 * 60;
    this.remainingSeconds = 25 * 60;
    this.timerId = null;
    this.isRunning = false;
    this.audioCtx = null;
    this.mode = '25'; // '25', '30', '40', '45'

    this.onTick = null;
    this.onComplete = null;
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  playChime() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  setMode(minutes) {
    this.pause();
    this.mode = minutes.toString();
    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.triggerTick();
  }

  setCustomSeconds(sec) {
    this.pause();
    this.totalSeconds = sec;
    this.remainingSeconds = sec;
    this.triggerTick();
  }

  start() {
    if (this.isRunning) return;
    this.initAudio();
    this.isRunning = true;
    this.timerId = setInterval(() => {
      this.remainingSeconds--;
      this.triggerTick();

      if (this.remainingSeconds <= 0) {
        this.pause();
        this.playChime();
        if (this.onComplete) this.onComplete(this.mode);
        if (window.showToast) {
          window.showToast('⏰ Time is up! Review approach or note solution.');
        }
      }
    }, 1000);
  }

  pause() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.triggerTick();
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.totalSeconds;
    this.triggerTick();
  }

  triggerTick() {
    if (this.onTick) {
      this.onTick({
        remaining: this.remainingSeconds,
        total: this.totalSeconds,
        formatted: this.formatTime(this.remainingSeconds),
        isRunning: this.isRunning
      });
    }
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

window.appTimer = new FocusTimer();
