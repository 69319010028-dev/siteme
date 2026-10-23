/**
 * Interactive Visual Effects & Dynamic Polish for Pakawat Portfolio
 * Features:
 *  1. Floating Gold Sand & Starlight Particles (Interactive Canvas)
 *  2. 3D Parallax Tilt with Dynamic Specular Glare on Cards
 *  3. Dynamic Typing Effect (Typewriter) on Hero Subtitle
 *  4. Smooth Number CountUp Animation for Stats
 *  5. Luxury Ambient Cursor Glow Torchlight
 *  6. Web Audio API Interactive Sound Effects (Synthesized, Zero External Files)
 *  7. Live Status & Real-Time Digital Clock Widget
 *  8. Celebratory Canvas Confetti Burst
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    enableSound: localStorage.getItem('pakawat_sound_pref') !== 'false',
    enableParticles: true,
    enableTilt: true,
    enableCursorGlow: window.matchMedia('(pointer: fine)').matches,
    typewriterPhrases: [
      'ยินดีต้อนรับสู่พื้นที่รวมงานออนไลน์ ✨',
      'นักศึกษา ปวส. สาขาเทคโนโลยีสารสนเทศ 💻',
      'Web Developer & UI/UX Designer 🎨',
      'IoT & Microcontrollers Innovation ⚡',
      'เกรดเฉลี่ยสะสม 3.88 • มุ่งมั่นพัฒนาตนเอง 🏆'
    ]
  };

  /* ==========================================================================
     1. WEB AUDIO API SYNTHESIZED SOUND EFFECTS (Zero External Files)
     ========================================================================== */
  const SoundFX = (function () {
    let ctx = null;

    function getContext() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    }

    // Play a gentle UI click pop
    function playClick() {
      if (!CONFIG.enableSound) return;
      try {
        const c = getContext();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, c.currentTime + 0.04);

        gain.gain.setValueAtTime(0.04, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start();
        osc.stop(c.currentTime + 0.04);
      } catch (e) {}
    }

    // Play a soft airy whoosh for theme or modal toggle
    function playWhoosh() {
      if (!CONFIG.enableSound) return;
      try {
        const c = getContext();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.08);

        gain.gain.setValueAtTime(0.03, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start();
        osc.stop(c.currentTime + 0.09);
      } catch (e) {}
    }

    // Play a sweet celebratory arpeggio chime
    function playChime() {
      if (!CONFIG.enableSound) return;
      try {
        const c = getContext();
        if (!c) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.06);

          gain.gain.setValueAtTime(0.05, c.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.06 + 0.28);

          osc.connect(gain);
          gain.connect(c.destination);

          osc.start(c.currentTime + idx * 0.06);
          osc.stop(c.currentTime + idx * 0.06 + 0.3);
        });
      } catch (e) {}
    }

    return {
      playClick,
      playWhoosh,
      playChime,
      toggleSound: function () {
        CONFIG.enableSound = !CONFIG.enableSound;
        localStorage.setItem('pakawat_sound_pref', CONFIG.enableSound ? 'true' : 'false');
        if (CONFIG.enableSound) playClick();
        return CONFIG.enableSound;
      },
      isEnabled: () => CONFIG.enableSound
    };
  })();

  window.SoundFX = SoundFX;

  /* ==========================================================================
     2. AMBIENT PARTICLES (INTERACTIVE GOLD SAND & STARLIGHT)
     ========================================================================== */
  function initAmbientParticles() {
    const canvas = document.getElementById('ambient-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2, active: false };

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });

    document.addEventListener('mouseleave', () => {
      mouse.active = false;
    });

    const PARTICLE_COUNT = Math.min(45, Math.floor(width / 30));
    const particles = [];

    class Particle {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 10;
        this.size = Math.random() * 2 + 0.8;
        this.speedY = -(Math.random() * 0.45 + 0.15);
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.55 + 0.2;
        this.fadeSpeed = Math.random() * 0.008 + 0.003;
        this.growing = Math.random() > 0.5;
        this.hue = Math.random() > 0.3 ? 38 : 28; // Warm golden caramel & terracotta tones
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Subtle repulsion from cursor
        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            this.x += (dx / dist) * force * 1.5;
            this.y += (dy / dist) * force * 1.5;
          }
        }

        // Twinkle
        if (this.growing) {
          this.opacity += this.fadeSpeed;
          if (this.opacity >= 0.75) this.growing = false;
        } else {
          this.opacity -= this.fadeSpeed;
          if (this.opacity <= 0.15) this.growing = true;
        }

        if (this.y < -10 || this.x < -10 || this.x > width + 10) {
          this.reset(false);
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 65%, 68%, ${this.opacity})`;
        ctx.shadowBlur = this.size * 3;
        ctx.shadowColor = `hsla(${this.hue}, 75%, 60%, ${this.opacity * 0.6})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    function animate() {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
          particles[i].draw();
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ==========================================================================
     3. 3D PARALLAX TILT WITH SPECULAR GLARE
     ========================================================================== */
  function init3DTiltEffect() {
    if (!CONFIG.enableTilt || !window.matchMedia('(pointer: fine)').matches) return;

    const tiltSelector = '.hero-card, .worksheet-card, .feature-box, .profile-card, .admin-stat-card';

    function attachTilt(el) {
      if (el.dataset.tiltAttached) return;
      el.dataset.tiltAttached = 'true';

      // Inject specular glare element if not exists
      let glare = el.querySelector('.tilt-card-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'tilt-card-glare';
        el.style.position = 'relative';
        el.style.overflow = 'hidden';
        el.appendChild(glare);
      }

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6.5; // Max 6.5deg
        const rotateY = ((x - centerX) / centerX) * 6.5;

        el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
        el.style.transition = 'transform 0.08s ease-out';

        // Glare position
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(212, 163, 115, 0.18) 0%, transparent 65%)`;
        glare.style.opacity = '1';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        glare.style.opacity = '0';
      });
    }

    document.querySelectorAll(tiltSelector).forEach(attachTilt);

    // Watch for dynamically added cards
    const observer = new MutationObserver(() => {
      document.querySelectorAll(tiltSelector).forEach(attachTilt);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ==========================================================================
     4. DYNAMIC TYPEWRITER EFFECT IN HERO SUBTITLE
     ========================================================================== */
  let typewriterTimeout = null;
  let typewriterState = {
    phraseIdx: 0,
    charIdx: 0,
    isDeleting: false
  };

  function getActiveTypewriterPhrases() {
    // 1. Try window.profileData
    if (window.profileData && Array.isArray(window.profileData.typewriterPhrases) && window.profileData.typewriterPhrases.length > 0) {
      return window.profileData.typewriterPhrases;
    }
    // 2. Try localStorage
    try {
      const stored = localStorage.getItem('pakawat_profile_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.typewriterPhrases) && parsed.typewriterPhrases.length > 0) {
          return parsed.typewriterPhrases;
        }
      }
    } catch (e) {}
    // 3. Try DEFAULT_PROFILE
    if (typeof DEFAULT_PROFILE !== 'undefined' && Array.isArray(DEFAULT_PROFILE.typewriterPhrases) && DEFAULT_PROFILE.typewriterPhrases.length > 0) {
      return DEFAULT_PROFILE.typewriterPhrases;
    }
    return CONFIG.typewriterPhrases;
  }

  function initTypewriter() {
    const el = document.getElementById('hero-sub-text');
    if (!el) return;

    if (typewriterTimeout) {
      clearTimeout(typewriterTimeout);
      typewriterTimeout = null;
    }

    typewriterState.phraseIdx = 0;
    typewriterState.charIdx = 0;
    typewriterState.isDeleting = false;

    function typeLoop() {
      const phrases = getActiveTypewriterPhrases();
      if (!phrases || phrases.length === 0) return;

      if (typewriterState.phraseIdx >= phrases.length) {
        typewriterState.phraseIdx = 0;
      }
      const currentPhrase = phrases[typewriterState.phraseIdx] || '';

      if (typewriterState.isDeleting) {
        typewriterState.charIdx--;
        el.textContent = currentPhrase.substring(0, typewriterState.charIdx);
      } else {
        typewriterState.charIdx++;
        el.textContent = currentPhrase.substring(0, typewriterState.charIdx);
      }

      let speed = typewriterState.isDeleting ? 30 : 65;

      if (!typewriterState.isDeleting && typewriterState.charIdx === currentPhrase.length) {
        speed = 2200; // Pause at full phrase
        typewriterState.isDeleting = true;
      } else if (typewriterState.isDeleting && typewriterState.charIdx === 0) {
        typewriterState.isDeleting = false;
        typewriterState.phraseIdx = (typewriterState.phraseIdx + 1) % phrases.length;
        speed = 450;
      }

      typewriterTimeout = setTimeout(typeLoop, speed);
    }

    typewriterTimeout = setTimeout(typeLoop, 600);
  }

  window.reloadTypewriter = initTypewriter;

  /* ==========================================================================
     5. ANIMATED NUMBER COUNTUP FOR STATS
     ========================================================================== */
  function initCountUp() {
    const statSelectors = ['#stat-total-works', '#stat-gpa-val', '#stat-commit-val'];

    function animateValue(obj, start, end, duration, isFloat = false, suffix = '') {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const currentVal = start + (end - start) * easeProgress;

        obj.textContent = (isFloat ? currentVal.toFixed(2) : Math.floor(currentVal)) + suffix;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          obj.textContent = (isFloat ? end.toFixed(2) : end) + suffix;
        }
      };
      window.requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          if (target.dataset.counted) return;
          target.dataset.counted = 'true';

          const text = target.textContent.trim();
          if (text.includes('%')) {
            const num = parseFloat(text) || 100;
            animateValue(target, 0, num, 1200, false, '%');
          } else if (text.includes('.')) {
            const num = parseFloat(text) || 3.88;
            animateValue(target, 0, num, 1400, true);
          } else {
            const num = parseInt(text, 10) || 3;
            animateValue(target, 0, num, 1000, false);
          }
        }
      });
    }, { threshold: 0.3 });

    statSelectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) observer.observe(el);
    });
  }

  /* ==========================================================================
     6. LUXURY AMBIENT CURSOR GLOW (TORCHLIGHT)
     ========================================================================== */
  function initCursorGlow() {
    if (!CONFIG.enableCursorGlow) return;

    let orb = document.getElementById('cursor-glow-orb');
    if (!orb) {
      orb = document.createElement('div');
      orb.id = 'cursor-glow-orb';
      orb.className = 'cursor-glow-orb';
      document.body.appendChild(orb);
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      orb.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
      orb.style.opacity = '0';
    });

    function renderGlow() {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      orb.style.left = `${currentX}px`;
      orb.style.top = `${currentY}px`;
      requestAnimationFrame(renderGlow);
    }
    renderGlow();
  }

  /* ==========================================================================
     7. LIVE STATUS & REAL-TIME DIGITAL CLOCK WIDGET
     ========================================================================== */
  function initLiveClock() {
    const clockText = document.getElementById('live-clock-text');
    if (!clockText) return;

    function updateTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      clockText.textContent = `${hours}:${mins}:${secs} น.`;
    }

    updateTime();
    setInterval(updateTime, 1000);
  }

  /* ==========================================================================
     8. CELEBRATORY CONFETTI BURST
     ========================================================================== */
  function fireConfetti(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#c59b6d', '#d4a373', '#e09f3e', '#5b8266', '#c86d51', '#38bdf8', '#ffd8a8'];
    const particles = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        gravity: 0.18
      });
    }

    SoundFX.playChime();

    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.015;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          ctx.restore();
        }
      });

      if (alive) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    renderConfetti();
  }

  window.fireConfetti = fireConfetti;

  /* ==========================================================================
     9. UI EVENT BINDINGS (SOUND FX ON CLICKS & TOGGLES)
     ========================================================================== */
  function setupInteractiveListeners() {
    // Buttons and links click sound
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, .btn, .nav-item, .link-arrow, .admin-tab-btn');
      if (btn) {
        SoundFX.playClick();
      }
    });

    // Theme toggle whoosh sound
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        SoundFX.playWhoosh();
      });
    }

    // Sound toggle button click
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const enabled = SoundFX.toggleSound();
        updateSoundButtonUI(enabled);
      });
      updateSoundButtonUI(SoundFX.isEnabled());
    }

    // Trigger celebratory confetti when clicking avatar or copy share
    const avatar = document.getElementById('hero-avatar-wrapper');
    if (avatar) {
      avatar.addEventListener('click', (e) => {
        fireConfetti(e.clientX, e.clientY);
      });
      avatar.style.cursor = 'pointer';
      avatar.setAttribute('title', 'คลิกเพื่อเฉลิมฉลอง! 🎉');
    }
  }

  function updateSoundButtonUI(enabled) {
    const soundBtn = document.getElementById('sound-toggle-btn');
    const soundIcon = document.getElementById('sound-icon');
    if (!soundBtn) return;
    if (enabled) {
      if (soundIcon) soundIcon.textContent = '🔊';
      soundBtn.setAttribute('title', 'เสียงปฏิสัมพันธ์: เปิดอยู่ (คลิกเพื่อปิด)');
      soundBtn.style.color = 'var(--accent-cyan)';
    } else {
      if (soundIcon) soundIcon.textContent = '🔇';
      soundBtn.setAttribute('title', 'เสียงปฏิสัมพันธ์: ปิดอยู่ (คลิกเพื่อเปิด)');
      soundBtn.style.color = 'var(--text-dim)';
    }
  }

  /* ==========================================================================
     INITIALIZATION ON DOM READY
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initAmbientParticles();
    init3DTiltEffect();
    initTypewriter();
    initCountUp();
    initCursorGlow();
    initLiveClock();
    setupInteractiveListeners();
  });
})();
