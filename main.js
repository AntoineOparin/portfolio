// Page interactions: nav state, scroll reveals, counters, card spotlight,
// the ToneBridge keyboard and copy-to-clipboard.
(() => {
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Nav picks up a backdrop once the page leaves the very top.
  const nav = document.querySelector('[data-nav]');
  const sentinel = document.createElement('div');
  sentinel.style.cssText =
    'position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    nav.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(sentinel);

  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    const setOpen = (open) => {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.ph-list').hidden = open;
      toggle.querySelector('.ph-x').hidden = !open;
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(menu.hidden));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  // Highlight the nav link for the section in the middle of the viewport.
  const links = [...document.querySelectorAll('.nav-link[href^="#"]')];
  if (links.length) {
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.removeAttribute('aria-current'));
          byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ['home', ...byId.keys()].forEach((id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  // Split headings into letters so they can assemble on load.
  document.querySelectorAll('[data-split]').forEach((heading) => {
    let i = 0;
    heading.querySelectorAll('.line').forEach((line) => {
      const text = line.textContent;
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      for (const ch of text) {
        const span = document.createElement('span');
        span.className = 'ch';
        span.style.setProperty('--i', i++);
        span.textContent = ch;
        line.append(span);
      }
    });
  });

  // Each word of the statement gets its own slice of the scroll range.
  document.querySelectorAll('[data-words]').forEach((statement) => {
    const words = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      const start = 8 + (i / words.length) * 36;
      span.style.animationRange = `cover ${start}% cover ${start + 7}%`;
      statement.append(span, ' ');
    });
  });

  const countUp = (el) => {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 1400);
      el.textContent = Math.round(end * (1 - (1 - p) ** 4)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion) {
    counters.forEach((el) => {
      el.textContent = `0${el.dataset.suffix || ''}`;
    });
  }

  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        if (!reduceMotion) {
          entry.target.querySelectorAll('[data-count]').forEach(countUp);
        }
        revealer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );
  document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

  document.querySelectorAll('.spot').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });

  if (!reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  document.querySelectorAll('[data-copy]').forEach((button) => {
    const copyIcon = button.querySelector('.ph-copy');
    const checkIcon = button.querySelector('.ph-check');
    const label = button.querySelector('span');
    const original = label.textContent;
    let timer = 0;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
      } catch {
        window.location.href = `mailto:${button.dataset.copy}`;
        return;
      }
      label.textContent = 'Copied';
      copyIcon.hidden = true;
      checkIcon.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(() => {
        label.textContent = original;
        copyIcon.hidden = false;
        checkIcon.hidden = true;
      }, 2000);
    });
  });

  // A one-octave keyboard, a small taste of ToneBridge.
  const piano = document.querySelector('[data-piano]');
  if (piano) {
    const noteEl = document.querySelector('[data-note]');
    const hzEl = document.querySelector('[data-hz]');
    let audio = null;

    const play = (key) => {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const freq = Number(key.dataset.freq);
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 1.7);

      noteEl.textContent = key.dataset.note;
      noteEl.classList.replace('text-muted', 'text-fg');
      hzEl.textContent = `${freq.toFixed(freq % 1 ? 2 : 0)} Hz`;
      key.classList.add('is-down');
      setTimeout(() => key.classList.remove('is-down'), 180);
    };

    piano.addEventListener('pointerdown', (event) => {
      const key = event.target.closest('[data-freq]');
      if (!key) return;
      event.preventDefault();
      play(key);
    });
    // Mouse users can glide across the keys while holding the button.
    piano.addEventListener('pointerover', (event) => {
      const key = event.target.closest('[data-freq]');
      if (key && event.pointerType === 'mouse' && event.buttons === 1) play(key);
    });
    piano.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!event.target.matches('[data-freq]')) return;
      event.preventDefault();
      play(event.target);
    });
  }
})();
