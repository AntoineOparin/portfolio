// Living crossword behind the hero: words cross like a puzzle grid, a slow light
// drifts over the tiles, the pointer lifts what it passes and a click sends a ripple.
(() => {
  const canvas = document.querySelector('[data-field]');
  if (!canvas) return;

  const host = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  const words = canvas.dataset.words.split(/\s+/).filter(Boolean);

  const H = 0;
  const V = 1;
  const REACH = 200;
  const RIPPLE_SPEED = 0.85;
  const RIPPLE_BAND = 70;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let cell = 48;
  let gap = 6;
  let cols = 0;
  let rows = 0;
  let region = null;
  let letters = [];
  let dirs, lift, appear, letterAt, glowAt, solvedAt;
  let cellEntries = [];
  let entries = [];
  let origin = 0;
  let nextSolve = 0;
  let lastSolved = -1;
  let raf = 0;
  let inView = true;
  let colors = {};
  const pointer = { x: 0, y: 0, active: false };
  const ripples = [];

  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const easeOut = (v) => 1 - (1 - v) ** 3;
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const at = (r, c) =>
    r < 0 || c < 0 || r >= rows || c >= cols ? '' : letters[r * cols + c];

  function readColors() {
    const style = getComputedStyle(document.documentElement);
    const rgb = (name) =>
      `rgb(${style.getPropertyValue(name).trim().split(/\s+/).join(', ')})`;
    colors = {
      tile: rgb('--field-tile'),
      fg: rgb('--field-fg'),
      accent: rgb('--field-accent'),
    };
  }

  // Words live on the right half on wide screens and the top band on phones,
  // leaving the hero copy on a quiet part of the grid.
  function getRegion() {
    return width >= 768
      ? { c0: Math.floor(cols * 0.5), c1: cols - 2, r0: 2, r1: rows - 3 }
      : { c0: 1, c1: cols - 2, r0: 2, r1: Math.floor(rows * 0.38) };
  }

  // Returns the number of crossings, or -1 if the word cannot go there.
  function fits(word, r, c, dir) {
    const dr = dir === V ? 1 : 0;
    const dc = dir === H ? 1 : 0;
    const er = r + dr * (word.length - 1);
    const ec = c + dc * (word.length - 1);
    if (r < region.r0 || c < region.c0 || er > region.r1 || ec > region.c1) {
      return -1;
    }
    if (at(r - dr, c - dc) || at(er + dr, ec + dc)) return -1;

    let crossings = 0;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const existing = at(rr, cc);
      if (existing) {
        if (existing !== word[i] || dirs[rr * cols + cc] & (1 << dir)) {
          return -1;
        }
        crossings++;
      } else if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) {
        return -1;
      }
    }
    return crossings;
  }

  function commit(word, r, c, dir) {
    const dr = dir === V ? 1 : 0;
    const dc = dir === H ? 1 : 0;
    const cells = [];
    for (let i = 0; i < word.length; i++) {
      const idx = (r + dr * i) * cols + c + dc * i;
      letters[idx] = word[i];
      dirs[idx] |= 1 << dir;
      (cellEntries[idx] ||= []).push(entries.length);
      cells.push(idx);
    }
    entries.push(cells);
  }

  function placeWords() {
    const pool = words.map((word) => word.toUpperCase());
    pool.sort((a, b) => b.length - a.length);

    // Seed with the longest word that fits, laid across the middle of the region.
    const seedIndex = pool.findIndex(
      (word) => word.length <= region.c1 - region.c0 + 1,
    );
    if (seedIndex < 0) return;
    const [seed] = pool.splice(seedIndex, 1);
    commit(
      seed,
      Math.round((region.r0 + region.r1) / 2),
      region.c0 + Math.floor((region.c1 - region.c0 + 1 - seed.length) / 2),
      H,
    );

    shuffle(pool);
    for (let pass = 0; pass < 2; pass++) {
      for (let k = pool.length - 1; k >= 0; k--) {
        const word = pool[k];
        const options = [];
        for (let idx = 0; idx < letters.length; idx++) {
          const ch = letters[idx];
          if (!ch) continue;
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          for (let i = 0; i < word.length; i++) {
            if (word[i] !== ch) continue;
            if (fits(word, r, c - i, H) > 0) options.push([r, c - i, H]);
            if (fits(word, r - i, c, V) > 0) options.push([r - i, c, V]);
          }
        }
        if (options.length) {
          const [r, c, dir] =
            options[Math.floor(Math.random() * options.length)];
          commit(word, r, c, dir);
          pool.splice(k, 1);
        }
      }
    }
  }

  // Tiles bloom outward from the word cluster, then each word types itself in.
  function scheduleIntro() {
    const fx = ((region.c0 + region.c1) / 2 + 0.5) * cell;
    const fy = ((region.r0 + region.r1) / 2 + 0.5) * cell;
    for (let idx = 0; idx < letters.length; idx++) {
      const x = ((idx % cols) + 0.5) * cell;
      const y = (Math.floor(idx / cols) + 0.5) * cell;
      appear[idx] = Math.hypot(x - fx, y - fy) * 0.7 + Math.random() * 180;
      letterAt[idx] = Infinity;
    }
    entries.forEach((cells, k) => {
      cells.forEach((idx, j) => {
        letterAt[idx] = Math.min(letterAt[idx], 700 + k * 120 + j * 45);
      });
    });
    nextSolve = 1900 + entries.length * 120;
  }

  function layout() {
    const rect = host.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    cell = width < 640 ? 34 : width < 1024 ? 40 : 48;
    gap = Math.round(cell * 0.13);
    cols = Math.ceil(width / cell);
    rows = Math.ceil(height / cell);
    const n = cols * rows;

    letters = new Array(n).fill('');
    cellEntries = new Array(n);
    dirs = new Uint8Array(n);
    lift = new Float32Array(n);
    appear = new Float64Array(n);
    letterAt = new Float64Array(n);
    glowAt = new Float64Array(n).fill(-1e9);
    entries = [];
    region = getRegion();

    placeWords();
    solvedAt = new Float64Array(entries.length).fill(-1e9);
    scheduleIntro();
    origin = performance.now();
  }

  function solve(k, t) {
    lastSolved = k;
    solvedAt[k] = t;
    entries[k].forEach((idx, j) => {
      glowAt[idx] = t + j * 70;
    });
  }

  const glowValue = (dt) =>
    dt < 0 ? 0 : dt < 140 ? dt / 140 : Math.exp(-(dt - 140) / 900);

  // Slow interference of waves plus rings pulsing out of the word cluster.
  function drift(c, r, t, cr, cc) {
    const v =
      Math.sin(c * 0.21 + t * 0.00041) +
      Math.sin(r * 0.27 - t * 0.00033) +
      Math.sin((c + r) * 0.12 - t * 0.00052) +
      Math.sin(Math.hypot(c - cc, r - cr) * 0.42 - t * 0.0011);
    const n = (v + 4) / 8;
    return n * n * n;
  }

  function frame(now) {
    raf = 0;
    const t = reduceMotion ? 1e5 : now - origin;

    if (!reduceMotion && entries.length && t > nextSolve) {
      let k = Math.floor(Math.random() * entries.length);
      if (k === lastSolved) k = (k + 1) % entries.length;
      solve(k, t);
      nextSolve = t + 2200 + Math.random() * 1800;
    }

    const maxRipple = Math.hypot(width, height) + RIPPLE_BAND;
    for (let i = ripples.length - 1; i >= 0; i--) {
      if ((t - ripples[i].t) * RIPPLE_SPEED > maxRipple) ripples.splice(i, 1);
    }

    const size = cell - gap;
    const half = size / 2;
    const cr = (region.r0 + region.r1) / 2;
    const cc = (region.c0 + region.c1) / 2;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `500 ${Math.round(size * 0.42)}px "Geist Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const shown = clamp((t - appear[idx]) / 800);
        if (shown <= 0) continue;
        const a = easeOut(shown);

        const x = (c + 0.5) * cell;
        const y = (r + 0.5) * cell;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const dist = Math.hypot(dx, dy);
        const target =
          pointer.active && dist < REACH ? (1 - dist / REACH) ** 2 : 0;
        lift[idx] += (target - lift[idx]) * 0.14;
        const L = lift[idx];

        let wave = 0;
        for (const ripple of ripples) {
          const off = Math.abs(
            Math.hypot(x - ripple.x, y - ripple.y) -
              (t - ripple.t) * RIPPLE_SPEED,
          );
          if (off < RIPPLE_BAND) wave = Math.max(wave, 1 - off / RIPPLE_BAND);
        }

        const n = drift(c, r, t, cr, cc);
        const ch = letters[idx];
        const glow = ch ? glowValue(t - glowAt[idx]) : 0;
        const scale = (0.6 + 0.4 * a) * (1 + L * 0.18 + glow * 0.06);
        const push = dist > 0 ? (L * 8) / dist : 0;

        // Squashing the tile vertically reads as a flip as the ripple passes.
        ctx.setTransform(
          dpr * scale,
          0,
          0,
          dpr * scale * (1 - wave * 0.8),
          dpr * (x + dx * push),
          dpr * (y + dy * push),
        );

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-half, -half, size, size, 6);
        else ctx.rect(-half, -half, size, size);

        ctx.fillStyle = colors.tile;
        ctx.globalAlpha =
          a *
          (ch
            ? 0.06 + n * 0.05 + L * 0.1 + glow * 0.08
            : 0.018 + n * 0.07 + L * 0.06);
        ctx.fill();

        ctx.strokeStyle = colors.tile;
        ctx.globalAlpha = a * (ch ? 0.12 : 0.035 + n * 0.05);
        ctx.stroke();

        const accent = Math.max(glow, wave * 0.9, ch ? L * 0.7 : L * 0.3);
        if (accent > 0.01) {
          ctx.strokeStyle = colors.accent;
          ctx.globalAlpha = a * accent;
          ctx.stroke();
        }

        if (ch) {
          const typed = clamp(
            (t - Math.max(letterAt[idx], appear[idx] + 250)) / 350,
          );
          if (typed > 0) {
            const ty = (1 - typed) * 6 + size * 0.03;
            ctx.fillStyle = colors.fg;
            ctx.globalAlpha = typed * Math.min(1, 0.32 + n * 0.25 + L * 0.6);
            ctx.fillText(ch, 0, ty);
            if (glow > 0.01) {
              ctx.fillStyle = colors.accent;
              ctx.globalAlpha = typed * glow;
              ctx.fillText(ch, 0, ty);
            }
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    if (!reduceMotion && inView && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  }

  function draw() {
    if (reduceMotion) frame(0);
    else if (!raf) raf = requestAnimationFrame(frame);
  }

  readColors();
  layout();
  draw();
  document.fonts?.ready.then(() => reduceMotion && draw());

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      readColors();
      draw();
    });

  let resizeTimer = 0;
  new ResizeObserver(() => {
    const rect = host.getBoundingClientRect();
    if (rect.width === width && rect.height === height) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      layout();
      draw();
    }, 150);
  }).observe(host);

  if (reduceMotion) return;

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) draw();
  }).observe(host);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) draw();
  });

  host.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;

    // Hovering a word lights it up like a solved clue.
    const c = Math.floor(pointer.x / cell);
    const r = Math.floor(pointer.y / cell);
    const hit = r >= 0 && c >= 0 && r < rows && c < cols && cellEntries[r * cols + c];
    if (!hit) return;
    const t = performance.now() - origin;
    hit.forEach((k) => {
      if (t - solvedAt[k] > 1600) solve(k, t);
    });
  });

  host.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  host.addEventListener('pointerdown', (event) => {
    if (event.target.closest('a, button')) return;
    const rect = canvas.getBoundingClientRect();
    ripples.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      t: performance.now() - origin,
    });
    if (ripples.length > 4) ripples.shift();
  });
})();
