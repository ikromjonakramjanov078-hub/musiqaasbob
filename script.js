
"use strict";

// ================================================
// KEYSYMPHONY — KLAVIATURA MUSIQA ASBOBI
// Muallif: AKRAMJONOVA JADRA MARATOVNA
// ================================================

const keyboard = document.getElementById("keyboard");
const volumeInput = document.getElementById("volume");
const volumeValue = document.getElementById("volumeValue");
const lastKeyLabel = document.getElementById("lastKey");
const statusText = document.getElementById("statusText");
const message = document.getElementById("message");
const soundIndicator = document.getElementById("soundIndicator");
const stopButton = document.getElementById("stopButton");
const modeCards = document.querySelectorAll(".mode-card");

let audioContext = null;
let masterGain = null;
let currentMode = "piano";
let activeSounds = new Set();
let activeKeys = new Map();
let volume = 0.65;
let soundCounter = 0;

// Pianino notalari: do, re, mi, sol, lya va hokazo.
const notes = [
    { name: "DO", freq: 261.63 },
    { name: "RE", freq: 293.66 },
    { name: "MI", freq: 329.63 },
    { name: "FA", freq: 349.23 },
    { name: "SOL", freq: 392.00 },
    { name: "LYA", freq: 440.00 },
    { name: "SI", freq: 493.88 },
    { name: "DO²", freq: 523.25 },
    { name: "RE²", freq: 587.33 },
    { name: "MI²", freq: 659.25 },
    { name: "FA²", freq: 698.46 },
    { name: "SOL²", freq: 783.99 },
    { name: "LYA²", freq: 880.00 },
    { name: "SI²", freq: 987.77 }
];

const keyRows = [
    "1234567890",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm"
];

const allKeys = keyRows.join("").split("");
const keyButtons = new Map();
const soundNames = {
    piano: "PIANINO",
    cat: "MUSHUK OVOZI",
    laser: "KOSMIK EFFEKT",
    boom: "PORTLASH EFFEKTI",
    mix: "ARALASH OVOZ"
};

// ================================================
// 1. AUDIO TIZIMINI ISHGA TUSHIRISH
// ================================================

function initAudio() {
    if (!audioContext) {
        const AudioCtx =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioCtx) {
            showMessage(
                "Brauzering audio tizimini qo‘llab-quvvatlamaydi."
            );
            return false;
        }

        audioContext = new AudioCtx();

        masterGain = audioContext.createGain();
        masterGain.gain.value = volume;

        masterGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {
            showMessage("Ovozni boshlash uchun yana bir marta tugmani bos.");
        });
    }

    statusText.textContent = "OVOZ TAYYOR";
    return true;
}

function setVolume() {
    volume = Number(volumeInput.value) / 100;
    volumeValue.textContent = volumeInput.value + "%";

    if (masterGain && audioContext) {
        masterGain.gain.setTargetAtTime(
            volume,
            audioContext.currentTime,
            0.025
        );
    }
}

volumeInput.addEventListener("input", setVolume);

// ================================================
// 2. VIRTUAL KLAVIATURANI YASASH
// ================================================

function buildKeyboard() {
    keyboard.innerHTML = "";

    let noteIndex = 0;

    keyRows.forEach((rowText) => {
        const row = document.createElement("div");
        row.className = "key-row";

        [...rowText].forEach((character) => {
            const key = document.createElement("button");

            key.type = "button";
            key.className = "key";
            key.dataset.key = character;

            const note = notes[noteIndex % notes.length];

            key.innerHTML = `
                <span class="key-letter">${character.toUpperCase()}</span>
                <span class="key-note">${note.name}</span>
            `;

            key.setAttribute(
                "aria-label",
                `${character.toUpperCase()} tugmasi, ${note.name} notasi`
            );

            key.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                playKey(character);
            });

            row.appendChild(key);
            keyButtons.set(character, key);

            noteIndex++;
        });

        keyboard.appendChild(row);
    });
}

buildKeyboard();

// ================================================
// 3. AUDIO YORDAMCHI FUNKSIYALARI
// ================================================

function createGain(value = 0.2) {
    const gain = audioContext.createGain();
    gain.gain.value = value;
    gain.connect(masterGain);
    return gain;
}

function playPiano(frequency) {
    const now = audioContext.currentTime;
    const output = createGain(0.0001);

    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.65, now + 0.012);
    output.gain.exponentialRampToValueAtTime(0.2, now + 0.12);
    output.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);

    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();

    osc1.type = "triangle";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(frequency, now);
    osc2.frequency.setValueAtTime(frequency * 2.01, now);

    const harmonic = audioContext.createGain();
    harmonic.gain.value = 0.16;

    osc1.connect(output);
    osc2.connect(harmonic);
    harmonic.connect(output);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 1.1);
    osc2.stop(now + 1.1);

    osc1.onended = () => {
        output.disconnect();
        harmonic.disconnect();
    };
}

function playCat() {
    const now = audioContext.currentTime;
    const output = createGain(0.0001);

    const osc = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();

    osc.type = "sawtooth";

    // Miyovga o‘xshash ohang yuqoridan pastga sirg‘aladi.
    const startFreq = 570 + Math.random() * 300;
    const endFreq = 240 + Math.random() * 110;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.24);
    osc.frequency.exponentialRampToValueAtTime(
        endFreq * 1.35,
        now + 0.42
    );

    filter.type = "lowpass";
    filter.frequency.value = 1250;
    filter.Q.value = 4;

    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.28, now + 0.025);
    output.gain.setValueAtTime(0.19, now + 0.16);
    output.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    osc.connect(filter);
    filter.connect(output);

    osc.start(now);
    osc.stop(now + 0.5);

    osc.onended = () => {
        output.disconnect();
        filter.disconnect();
    };
}

function playLaser(frequency) {
    const now = audioContext.currentTime;
    const output = createGain(0.0001);

    const osc = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();

    osc.type = "sawtooth";

    osc.frequency.setValueAtTime(
        Math.max(600, frequency * 3),
        now
    );

    osc.frequency.exponentialRampToValueAtTime(
        Math.max(65, frequency / 2),
        now + 0.36
    );

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(5000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.35);

    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.24, now + 0.012);
    output.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(filter);
    filter.connect(output);

    osc.start(now);
    osc.stop(now + 0.42);

    osc.onended = () => {
        output.disconnect();
        filter.disconnect();
    };
}

function makeNoiseBuffer(duration) {
    const sampleRate = audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(
        1,
        length,
        sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    return buffer;
}

function playBoom() {
    const now = audioContext.currentTime;

    // Past chast tovush.
    const bass = audioContext.createOscillator();
    const bassGain = createGain(0.0001);

    bass.type = "sine";
    bass.frequency.setValueAtTime(125, now);
    bass.frequency.exponentialRampToValueAtTime(38, now + 0.38);

    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.48, now + 0.014);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    bass.connect(bassGain);

    bass.start(now);
    bass.stop(now + 0.52);

    bass.onended = () => bassGain.disconnect();

    // Portlashga o‘xshash shovqin.
    const noise = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = createGain(0.0001);

    noise.buffer = makeNoiseBuffer(0.45);

    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(6500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(
        180,
        now + 0.42
    );

    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.32, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    noise.start(now);
    noise.stop(now + 0.46);

    noise.onended = () => {
        noiseFilter.disconnect();
        noiseGain.disconnect();
    };
}

// ================================================
// 4. OVOZ REJIMINI TANLASH
// ================================================

modeCards.forEach((card) => {
    card.addEventListener("click", () => {
        currentMode = card.dataset.mode;

        modeCards.forEach((item) => {
            item.classList.toggle("selected", item === card);
        });

        statusText.textContent = "REJIM: " + soundNames[currentMode];

        showMessage(
            `"${card.querySelector(".mode-title").textContent}" rejimi tanlandi!`
        );
    });
});

// ================================================
// 5. TUGMA BOSILGANDA OVOZ CHIQARISH
// ================================================

function playKey(character) {
    const key = character.toLowerCase();

    if (!allKeys.includes(key)) return;
    if (!initAudio()) return;

    const index = allKeys.indexOf(key);
    const note = notes[index % notes.length];

    let soundType = currentMode;

    // Aralash rejimda ovoz turini avtomatik almashtirish.
    if (currentMode === "mix") {
        const types = ["piano", "cat", "laser", "boom"];
        soundType = types[(index + soundCounter) % types.length];
        soundCounter++;
    }

    switch (soundType) {
        case "piano":
            playPiano(note.freq);
            break;

        case "cat":
            playCat();
            break;

        case "laser":
            playLaser(note.freq);
            break;

        case "boom":
            playBoom();
            break;
    }

    animateKey(key);
    showPlayedNote(key, note, soundType);

    soundIndicator.classList.add("playing");
    statusText.textContent = soundNames[currentMode];

    // Faollik indikatorini qisqa muddat ko‘rsatish.
    activeSounds.add(soundType);

    setTimeout(() => {
        activeSounds.delete(soundType);

        if (activeSounds.size === 0) {
            soundIndicator.classList.remove("playing");
        }
    }, 400);

    showMessage(
        `${key.toUpperCase()} tugmasi bosildi — ${getSoundLabel(soundType)}!`
    );
}

function getSoundLabel(type) {
    const labels = {
        piano: "pianino notasi",
        cat: "mushukka o‘xshash ovoz",
        laser: "kosmik effekt",
        boom: "zarba effekti"
    };

    return labels[type] || "ovoz";
}

// ================================================
// 6. EKRANDA TUGMANING HARAKATI
// ================================================

function animateKey(key) {
    const button = keyButtons.get(key);

    if (!button) return;

    button.classList.remove("pressed");
    void button.offsetWidth;
    button.classList.add("pressed");

    clearTimeout(activeKeys.get(key));

    const timeout = setTimeout(() => {
        button.classList.remove("pressed");
        activeKeys.delete(key);
    }, 160);

    activeKeys.set(key, timeout);
}

function showPlayedNote(key, note, type) {
    if (type === "piano") {
        lastKeyLabel.textContent =
            `${key.toUpperCase()} · ${note.name}`;
    } else {
        lastKeyLabel.textContent =
            `${key.toUpperCase()} · ${getSoundLabel(type).toUpperCase()}`;
    }
}

// ================================================
// 7. HAQIQIY KOMPYUTER KLAVIATURASINI TINGLASH
// ================================================

document.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    const target = event.target;

    // Rejim yoki ovoz boshqaruvini o‘zgartirayotganda
    // tasodifan musiqa chiqarilmaydi.
    if (
        target instanceof HTMLElement &&
        (
            target.matches("input, textarea, select") ||
            target.isContentEditable
        )
    ) {
        return;
    }

    const key = event.key.toLowerCase();

    if (allKeys.includes(key)) {
        event.preventDefault();
        playKey(key);
    }
});

// ================================================
// 8. OVOZNI TO‘XTATISH
// ================================================

stopButton.addEventListener("click", () => {
    activeSounds.clear();
    soundIndicator.classList.remove("playing");

    // Keyingi tugma bosilguncha audio kontekstni to‘xtatamiz.
    if (audioContext && audioContext.state === "running") {
        audioContext.suspend().then(() => {
            statusText.textContent = "OVOZ TO‘XTATILDI";
        }).catch(() => {
            statusText.textContent = "TAYYOR";
        });
    }

    keyButtons.forEach((button) => {
        button.classList.remove("pressed");
    });

    activeKeys.forEach((timeout) => clearTimeout(timeout));
    activeKeys.clear();

    lastKeyLabel.textContent = "TO‘XTATILDI";

    showMessage("Ovoz to‘xtatildi. Davom etish uchun tugmani bos!");
});

// ================================================
// 9. XABARLARNI KO‘RSATISH
// ================================================

let messageTimeout;

function showMessage(text) {
    message.textContent = text;
    message.classList.add("active-message");

    clearTimeout(messageTimeout);

    messageTimeout = setTimeout(() => {
        message.classList.remove("active-message");
    }, 1700);
}

// ================================================
// 10. DASTLABKI SOZLAMALAR
// ================================================

setVolume();

statusText.textContent = "OVOZGA TAYYOR";
lastKeyLabel.textContent = "TUGMANI BOS!";

showMessage("Pianino rejimi tayyor. Istalgan harfni bos!");
