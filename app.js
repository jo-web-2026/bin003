const screens = {
  home: document.querySelector('[data-screen="home"]'),
  game: document.querySelector('[data-screen="game"]'),
  how: document.querySelector('[data-screen="how"]'),
  over: document.querySelector('[data-screen="over"]'),
};

const scoreValue = document.getElementById("scoreValue");
const livesValue = document.getElementById("livesValue");
const finalScore = document.getElementById("finalScore");
const rankLine = document.getElementById("rankLine");
const itemVisual = document.getElementById("itemVisual");
const itemName = document.getElementById("itemName");
const itemHint = document.getElementById("itemHint");
const wasteCard = document.getElementById("wasteCard");
const samoMessage = document.getElementById("samoMessage");
const gameSpeech = document.getElementById("gameSpeech");
const comboValue = document.getElementById("comboValue");
const soundToggle = document.getElementById("soundToggle");
const binButtons = [...document.querySelectorAll("[data-bin]")];

const samoLines = [
  "Ehm… kam s tým?",
  "Dobre vieš!",
  "Skoro. Skús znova.",
  "Triediš ako profík.",
];

// Every item contains its correct bin, quick hint, and an offline SVG visual.
const wasteItems = [
  { name: "Kelímok", bin: "plastic", kind: "cup", color: "#f4f5f0", hint: "Obal patrí do plastu." },
  { name: "Pizza krabica", bin: "paper", kind: "box", color: "#c98745", hint: "Patrí do modrého kontajnera." },
  { name: "Noviny", bin: "paper", kind: "paper", color: "#f0eee6", hint: "Suchý papier ide do papiera." },
  { name: "PET fľaša", bin: "plastic", kind: "bottle", color: "#b9f4ff", hint: "Zošliapnuť a do žltého." },
  { name: "Sklenený pohár", bin: "glass", kind: "glass", color: "#97f0b3", hint: "Čisté sklo patrí do zeleného." },
  { name: "Fľaša od džúsu", bin: "glass", kind: "bottle", color: "#c8ffe0", hint: "Sklenená fľaša ide do skla." },
  { name: "Šupka z banánu", bin: "bio", kind: "bio", color: "#ffe16a", hint: "Zvyšky jedla patria do bio." },
  { name: "Jablčný ohryzok", bin: "bio", kind: "apple", color: "#8ee35a", hint: "Kompostovateľné patrí do bio." },
  { name: "Použitá vreckovka", bin: "mixed", kind: "tissue", color: "#d9d3c8", hint: "Znečistený odpad ide do zmesi." },
  { name: "Rozbité zrkadlo", bin: "mixed", kind: "shard", color: "#d8e5ea", hint: "Nepatrí do sklenených obalov." },
];

let score = 0;
let lives = 3;
let streak = 0;
let currentItem = null;
let currentIndex = -1;
let locked = false;
let dragState = null;
let audioContext = null;
let soundEnabled = readSoundPreference();

// Delay decorative animation startup to prevent iPhone PWA launch flicker.
window.addEventListener("load", () => {
  window.setTimeout(() => document.body.classList.add("is-ready"), 160);
});

syncSoundToggle();

// iPhone Safari only allows sound after a real gesture, so the first tap unlocks audio.
document.addEventListener("pointerdown", () => {
  if (soundEnabled) unlockAudio();
}, { passive: true });

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
}

function startGame() {
  playSound("start");
  score = 0;
  lives = 3;
  streak = 0;
  locked = false;
  updateHud();
  showScreen("game");
  nextItem(true);
}

function updateHud() {
  scoreValue.textContent = score.toString();
  livesValue.textContent = lives.toString();
  comboValue.textContent = Math.max(2, streak + 2).toString();
}

function nextItem(forceHeroItem = false) {
  locked = false;
  wasteCard.classList.remove("is-correct", "is-wrong");
  wasteCard.style.transform = "";
  wasteCard.style.opacity = "";

  let nextIndex = forceHeroItem ? 0 : Math.floor(Math.random() * wasteItems.length);
  if (!forceHeroItem && wasteItems.length > 1) {
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * wasteItems.length);
    }
  }

  currentIndex = nextIndex;
  currentItem = wasteItems[currentIndex];
  itemName.textContent = currentItem.name;
  itemHint.textContent = "kam s tým?";
  itemVisual.innerHTML = renderWasteVisual(currentItem);
  setNeutralSamo();
}

function renderWasteVisual(item) {
  const label = item.name.replace(/"/g, "&quot;");
  const object = renderObjectSvg(item);

  return `
    <svg viewBox="0 0 240 230" width="100%" height="100%" role="img" aria-label="${label}">
      <defs>
        <filter id="objectShadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="24" stdDeviation="12" flood-color="#000" flood-opacity="0.44"/>
        </filter>
        <radialGradient id="stageGlow" cx="50%" cy="72%" r="42%">
          <stop offset="0" stop-color="#d8ff1f" stop-opacity=".56"/>
          <stop offset=".42" stop-color="#76ff34" stop-opacity=".24"/>
          <stop offset="1" stop-color="#76ff34" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="itemSkin" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#fff"/>
          <stop offset=".52" stop-color="${item.color}"/>
          <stop offset="1" stop-color="#bfc5c0"/>
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="177" rx="78" ry="28" fill="url(#stageGlow)"/>
      <ellipse cx="120" cy="190" rx="58" ry="10" fill="#000" opacity=".28"/>
      <g class="floating-object" filter="url(#objectShadow)">
        ${object}
      </g>
      <g stroke="#d8ff1f" stroke-width="9" stroke-linecap="round" opacity=".95">
        <path d="M174 58l4-24"/>
        <path d="M194 72l19-17"/>
        <path d="M201 96l25-5"/>
      </g>
    </svg>
  `;
}

function renderObjectSvg(item) {
  if (item.kind === "cup") {
    return `
      <g transform="translate(47 26) rotate(-10 80 86)">
        <path d="M19 55c5 74 18 111 61 116 43-5 57-42 62-116z" fill="url(#itemSkin)"/>
        <path d="M19 55c7 17 114 17 123 0 5-15-7-28-61-31-52 3-67 16-62 31z" fill="#f8fbff"/>
        <path d="M32 55c6 9 91 9 99 0 5-9-5-17-50-19-43 2-54 10-49 19z" fill="#cfe4f6"/>
        <path d="M47 58c20-16 52-23 86-19 10 6 15 12 13 20-36-9-70-1-99 20z" fill="#ffffff" opacity=".92"/>
        <path d="M30 112c26 10 75 10 101 0" fill="none" stroke="#c7cbc8" stroke-width="4" opacity=".58"/>
        <path d="M46 166c18 9 51 9 69 0" fill="none" stroke="#afb4b3" stroke-width="5" opacity=".5"/>
      </g>`;
  }

  if (item.kind === "bottle") {
    return `
      <g transform="translate(82 23) rotate(7 38 90)">
        <rect x="22" y="4" width="34" height="42" rx="10" fill="url(#itemSkin)"/>
        <path d="M13 47c0-13 52-13 52 0l9 112c0 16-70 16-70 0z" fill="url(#itemSkin)"/>
        <path d="M13 72c17 8 44 8 61 0" fill="none" stroke="#fff" stroke-width="7" opacity=".45"/>
        <rect x="15" y="103" width="58" height="34" rx="8" fill="#fff" opacity=".34"/>
      </g>`;
  }

  if (item.kind === "box") {
    return `
      <g transform="translate(45 50) rotate(8 80 70)">
        <path d="M20 45h120v90H20z" fill="#c98745"/>
        <path d="M20 45l33-32h95l-8 32z" fill="#daa15f"/>
        <path d="M140 45l-33-32" fill="none" stroke="#8a582e" stroke-width="5"/>
        <path d="M43 88c18-13 49-10 67 4" fill="none" stroke="#7c4d27" stroke-width="9" opacity=".28"/>
      </g>`;
  }

  if (item.kind === "glass") {
    return `
      <g transform="translate(72 30) rotate(-6 48 86)">
        <path d="M10 18h78l-11 154H21z" fill="url(#itemSkin)" opacity=".72"/>
        <path d="M21 172c17 8 39 8 56 0" fill="none" stroke="#fff" stroke-width="7" opacity=".5"/>
        <path d="M20 52h58" stroke="#fff" stroke-width="8" opacity=".38"/>
      </g>`;
  }

  if (item.kind === "bio" || item.kind === "apple") {
    return `
      <g transform="translate(58 52) rotate(-8 70 68)">
        <path d="M26 78c32-62 75-75 105-42-25 50-61 70-105 42z" fill="url(#itemSkin)"/>
        <path d="M44 74c20-24 42-36 66-36" fill="none" stroke="#fff" stroke-width="8" opacity=".35"/>
        <path d="M102 31c9-17 20-23 34-18" fill="none" stroke="#54751e" stroke-width="9" stroke-linecap="round"/>
      </g>`;
  }

  if (item.kind === "shard") {
    return `
      <g transform="translate(65 36) rotate(7 64 80)">
        <path d="M64 0l58 54-27 111-87-31 18-92z" fill="url(#itemSkin)" opacity=".82"/>
        <path d="M40 50l50 35M28 104l65-18" stroke="#fff" stroke-width="7" opacity=".42"/>
      </g>`;
  }

  return `
    <g transform="translate(62 48) rotate(-7 64 74)">
      <path d="M11 40c28-28 84-38 117-6-10 59-40 93-91 89-31-3-40-35-26-83z" fill="url(#itemSkin)"/>
      <path d="M31 54c23-13 48-17 75-12" fill="none" stroke="#fff" stroke-width="8" opacity=".35"/>
    </g>`;
}

function classify(selectedBin) {
  if (locked || !currentItem) return;
  locked = true;

  clearTargetBins();
  const correct = selectedBin === currentItem.bin;

  if (correct) {
    playSound("correct");
    streak += 1;
    score += 100 + Math.min(streak * 20, 100);
    wasteCard.classList.add("is-correct");
    itemHint.textContent = currentItem.hint;
    setSamo(streak >= 3 ? "Triediš ako profík." : "Dobre vieš!");
    buzz(35);
    setTimeout(nextItem, 520);
  } else {
    playSound("wrong");
    streak = 0;
    lives -= 1;
    wasteCard.classList.add("is-wrong");
    setSamo("Skoro. Skús znova.");
    buzz([30, 45, 30]);

    if (lives <= 0) {
      updateHud();
      setTimeout(endGame, 620);
    } else {
      setTimeout(() => {
        locked = false;
        wasteCard.classList.remove("is-wrong");
        wasteCard.style.transform = "";
      }, 460);
    }
  }

  updateHud();
}

function setSamo(text) {
  samoMessage.textContent = text;
  gameSpeech.textContent = text;
  samoMessage.animate(
    [
      { transform: "scale(0.98)", opacity: 0.7 },
      { transform: "scale(1.02)", opacity: 1 },
      { transform: "scale(1)", opacity: 1 },
    ],
    { duration: 260, easing: "ease-out" },
  );
}

function setNeutralSamo() {
  gameSpeech.textContent = samoLines[0];
  samoMessage.textContent = "Rozhodni bez nápovedy.";
}

function getSlovakiaPercent(currentScore) {
  if (currentScore <= 0) return 0;
  return Math.min(99, Math.round((currentScore / (currentScore + 580)) * 100));
}

function endGame() {
  const percent = getSlovakiaPercent(score);
  playSound("gameOver");
  finalScore.textContent = score.toString();
  rankLine.innerHTML = `Triediš lepšie než <strong>${percent}&nbsp;%</strong> Slovenska!`;
  showScreen("over");
}

async function shareScore() {
  const percent = getSlovakiaPercent(score);
  const text = `V SWIPE BIN som získal/a ${score} bodov. Triedim lepšie než ${percent} % Slovenska!`;
  playSound("tap");

  if (navigator.share) {
    await navigator.share({ title: "SWIPE BIN", text }).catch(() => {});
    return;
  }

  await navigator.clipboard?.writeText(text).catch(() => {});
  setSamo("Triediš ako profík.");
}

function buzz(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function readSoundPreference() {
  try {
    return localStorage.getItem("swipeBinSound") !== "off";
  } catch {
    return true;
  }
}

function saveSoundPreference() {
  try {
    localStorage.setItem("swipeBinSound", soundEnabled ? "on" : "off");
  } catch {
    // Local file privacy settings can block storage; sound still works for this session.
  }
}

function syncSoundToggle() {
  if (!soundToggle) return;
  soundToggle.classList.toggle("is-muted", !soundEnabled);
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute("aria-label", soundEnabled ? "Zvuk zapnutý" : "Zvuk vypnutý");
  soundToggle.querySelector("span").textContent = soundEnabled ? "♪" : "×";
}

function toggleSound() {
  const nextSoundEnabled = !soundEnabled;

  if (!nextSoundEnabled) {
    playSound("toggleOff");
  }

  soundEnabled = nextSoundEnabled;
  saveSoundPreference();
  syncSoundToggle();
  if (soundEnabled) playSound("toggleOn");
}

function unlockAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return Promise.resolve(null);

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    return audioContext.resume().then(() => audioContext).catch(() => null);
  }

  return Promise.resolve(audioContext);
}

function playTone(ctx, { freq, endFreq = freq, start = 0, duration = 0.12, type = "sine", gain = 0.03 }) {
  const now = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.014);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.03);
}

function playSound(name) {
  if (!soundEnabled) return;

  unlockAudio().then((ctx) => {
    if (!ctx) return;

    if (name === "tap") {
      playTone(ctx, { freq: 330, endFreq: 460, duration: 0.07, type: "triangle", gain: 0.018 });
    }

    if (name === "start") {
      playTone(ctx, { freq: 392, duration: 0.08, type: "triangle", gain: 0.026 });
      playTone(ctx, { freq: 523, start: 0.075, duration: 0.08, type: "triangle", gain: 0.026 });
      playTone(ctx, { freq: 784, start: 0.15, duration: 0.14, type: "sine", gain: 0.028 });
    }

    if (name === "correct") {
      playTone(ctx, { freq: 520, duration: 0.08, type: "triangle", gain: 0.026 });
      playTone(ctx, { freq: 660, start: 0.07, duration: 0.08, type: "triangle", gain: 0.026 });
      playTone(ctx, { freq: 990, start: 0.14, duration: 0.13, type: "sine", gain: 0.03 });
    }

    if (name === "wrong") {
      playTone(ctx, { freq: 190, endFreq: 92, duration: 0.2, type: "sawtooth", gain: 0.025 });
      playTone(ctx, { freq: 130, endFreq: 78, start: 0.08, duration: 0.18, type: "square", gain: 0.016 });
    }

    if (name === "gameOver") {
      playTone(ctx, { freq: 330, endFreq: 247, duration: 0.16, type: "triangle", gain: 0.026 });
      playTone(ctx, { freq: 247, endFreq: 196, start: 0.15, duration: 0.18, type: "triangle", gain: 0.024 });
      playTone(ctx, { freq: 523, start: 0.36, duration: 0.14, type: "sine", gain: 0.02 });
    }

    if (name === "toggleOn") {
      playTone(ctx, { freq: 660, duration: 0.06, type: "triangle", gain: 0.022 });
      playTone(ctx, { freq: 880, start: 0.06, duration: 0.08, type: "sine", gain: 0.024 });
    }

    if (name === "toggleOff") {
      playTone(ctx, { freq: 300, endFreq: 160, duration: 0.12, type: "triangle", gain: 0.02 });
    }
  });
}

function clearTargetBins() {
  binButtons.forEach((bin) => bin.classList.remove("is-target"));
}

function getBinUnderPoint(x, y) {
  return binButtons.find((bin) => {
    const rect = bin.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  });
}

function getBinFromSwipe(deltaX) {
  const width = wasteCard.getBoundingClientRect().width;
  const bins = ["paper", "plastic", "glass", "bio", "mixed"];
  const normalized = Math.max(-1, Math.min(1, deltaX / width));
  const index = Math.round(((normalized + 1) / 2) * (bins.length - 1));
  return bins[index];
}

function onPointerDown(event) {
  if (locked) return;
  wasteCard.setPointerCapture(event.pointerId);
  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: 0,
    y: 0,
  };
  wasteCard.classList.add("is-dragging");
}

function onPointerMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;

  dragState.x = event.clientX - dragState.startX;
  dragState.y = event.clientY - dragState.startY;

  const rotate = dragState.x / 18;
  wasteCard.style.transform = `translate(${dragState.x}px, ${dragState.y}px) rotate(${rotate}deg)`;

  clearTargetBins();
  getBinUnderPoint(event.clientX, event.clientY)?.classList.add("is-target");
}

function onPointerUp(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;

  const moved = Math.hypot(dragState.x, dragState.y);
  const targetBin = getBinUnderPoint(event.clientX, event.clientY);
  wasteCard.classList.remove("is-dragging");

  if (targetBin) {
    classify(targetBin.dataset.bin);
  } else if (moved > 74) {
    classify(getBinFromSwipe(dragState.x));
  } else {
    wasteCard.style.transform = "";
    clearTargetBins();
  }

  dragState = null;
}

document.addEventListener("click", (event) => {
  if (soundEnabled) unlockAudio();
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;

    if (action === "sound") toggleSound();
    if (action === "start" || action === "restart") startGame();
    if (action === "how") {
      playSound("tap");
      showScreen("how");
    }
    if (action === "home") {
      playSound("tap");
      showScreen("home");
    }
    if (action === "share") shareScore();
  }

  const bin = event.target.closest("[data-bin]");
  if (bin) classify(bin.dataset.bin);
});

document.addEventListener("keydown", (event) => {
  const keyMap = {
    1: "paper",
    2: "plastic",
    3: "glass",
    4: "bio",
    5: "mixed",
    ArrowLeft: "paper",
    ArrowUp: "plastic",
    ArrowRight: "glass",
    ArrowDown: "bio",
  };

  if (screens.game.classList.contains("is-active") && keyMap[event.key]) {
    if (soundEnabled) unlockAudio();
    classify(keyMap[event.key]);
  }
});

wasteCard.addEventListener("pointerdown", onPointerDown);
wasteCard.addEventListener("pointermove", onPointerMove);
wasteCard.addEventListener("pointerup", onPointerUp);
wasteCard.addEventListener("pointercancel", onPointerUp);

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
