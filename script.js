// --- CONFIGURATION ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LINE_SPACING = 30;
const GROUP_SPACING = 150;

// Neon Palette
const COLORS = {
    lineA: '#bc13fe', // Purple
    lineB: '#ff00ff', // Pink
    intersection: '#2d3436', // Dark Grey for dots base
    intersectionHighlight: '#00f3ff', // Cyan
    text: '#2d3436',
    zone: 'rgba(0, 243, 255, 0.15)',
    zoneBorder: '#00f3ff',
    correct: '#0aff00',
    wrong: '#ff0000'
};

// Google Apps Script URL (Placeholder - User must replace this)
const GAS_URL = ''; // TODO: Paste your Web App URL here

// Sound Effects
const SOUNDS = {
    start: new Audio('sounds/start.wav'),
    correct: new Audio('sounds/chime.wav'),
    wrong: new Audio('sounds/alert.wav'), // Using alert as wrong sound
    levelUp: new Audio('sounds/end.wav')
};

// --- STATE ---
let gameState = {
    user: {
        username: 'Player',
        level: 1,
        xp: 0,
        score: 0,
        xpToNext: 100
    },
    mode: 'tutorial', // 'tutorial' | 'practice'
    problem: { n1: 14, n2: 13 }, // Default tutorial problem
    tutorialStep: 0,
    geometry: { linesA: [], linesB: [], intersections: [] }
};

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    // Preload sounds
    Object.values(SOUNDS).forEach(s => s.load());
});

function initEvents() {
    // Login
    document.getElementById('btn-start-game').addEventListener('click', handleLogin);

    // Mode Switching
    document.getElementById('btn-tutorial').addEventListener('click', () => setMode('tutorial'));
    document.getElementById('btn-practice').addEventListener('click', () => setMode('practice'));

    // Tutorial Controls
    document.getElementById('btn-next-step').addEventListener('click', nextTutorialStep);
    document.getElementById('btn-prev-step').addEventListener('click', prevTutorialStep);
    document.getElementById('btn-restart-tutorial').addEventListener('click', resetTutorial);

    // Practice Controls
    document.getElementById('btn-check').addEventListener('click', checkAnswer);
    document.getElementById('btn-new-problem').addEventListener('click', newPracticeProblem);

    // Input Enter Key
    document.getElementById('answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
}

// --- USER SYSTEM ---

function handleLogin() {
    const input = document.getElementById('username-input');
    const username = input.value.trim() || 'Player';

    gameState.user.username = username;

    // Update UI
    document.getElementById('hud-username').innerText = username;
    document.getElementById('avatar-initial').innerText = username.charAt(0).toUpperCase();
    document.getElementById('login-overlay').classList.add('opacity-0', 'pointer-events-none');

    playSound('start');

    // Start in Tutorial Mode
    setMode('tutorial');
}

function updateHUD() {
    const user = gameState.user;
    document.getElementById('hud-level').innerText = user.level;
    document.getElementById('hud-xp-current').innerText = user.xp;
    document.getElementById('hud-xp-next').innerText = user.xpToNext;
    document.getElementById('hud-score').innerText = user.score;

    const percent = Math.min(100, (user.xp / user.xpToNext) * 100);
    document.getElementById('xp-bar').style.width = `${percent}%`;
    document.getElementById('hud-xp-percent').innerText = `${Math.floor(percent)}%`;
}

function addXP(amount) {
    gameState.user.xp += amount;
    gameState.user.score += amount; // Score is cumulative XP

    if (gameState.user.xp >= gameState.user.xpToNext) {
        levelUp();
    }

    updateHUD();
    saveData();
}

function levelUp() {
    gameState.user.level++;
    gameState.user.xp = 0; // Reset current XP or carry over? Let's reset for simplicity
    gameState.user.xpToNext = Math.floor(gameState.user.xpToNext * 1.5);

    playSound('levelUp');
    alert(`LEVEL UP! Kamu sekarang Level ${gameState.user.level}!`);
}

function saveData() {
    if (!GAS_URL) return;

    const payload = {
        username: gameState.user.username,
        level: gameState.user.level,
        xp: gameState.user.xp,
        score: gameState.user.score,
        lastUpdated: new Date().toISOString()
    };

    fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for GAS
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).catch(err => console.error('Error saving data:', err));
}

// --- GAME LOGIC ---

function setMode(mode) {
    gameState.mode = mode;

    // UI Toggles
    document.getElementById('btn-tutorial').className = mode === 'tutorial'
        ? "flex-1 py-3 rounded-xl font-bold transition-all duration-300 border-2 border-neonBlue bg-neonBlue/10 text-neonBlue hover:bg-neonBlue hover:text-black shadow-[0_0_10px_rgba(0,243,255,0.2)] active-mode"
        : "flex-1 py-3 rounded-xl font-bold transition-all duration-300 border-2 border-gray-700 text-gray-400 hover:border-neonPink hover:text-neonPink hover:bg-neonPink/10";

    document.getElementById('btn-practice').className = mode === 'practice'
        ? "flex-1 py-3 rounded-xl font-bold transition-all duration-300 border-2 border-neonPink bg-neonPink/10 text-neonPink hover:bg-neonPink hover:text-black shadow-[0_0_10px_rgba(255,0,255,0.2)] active-mode"
        : "flex-1 py-3 rounded-xl font-bold transition-all duration-300 border-2 border-gray-700 text-gray-400 hover:border-neonBlue hover:text-neonBlue hover:bg-neonBlue/10";

    const title = document.getElementById('current-mode-title');
    const instruction = document.getElementById('instruction-text');
    const tutorialControls = document.getElementById('tutorial-controls');
    const practiceControls = document.getElementById('practice-controls');

    if (mode === 'tutorial') {
        title.innerText = "Mode: Tutorial";
        title.className = "text-2xl font-orbitron text-neonBlue";
        instruction.innerText = "Ayo belajar cara menghitung perkalian dengan garis!";
        tutorialControls.classList.remove('hidden');
        practiceControls.classList.add('hidden');
        resetTutorial();
    } else {
        title.innerText = "Mode: Latihan";
        title.className = "text-2xl font-orbitron text-neonPink";
        instruction.innerText = "Hitung titik potongnya dan masukkan jawabanmu!";
        tutorialControls.classList.add('hidden');
        practiceControls.classList.remove('hidden');
        newPracticeProblem();
    }
}

function generateProblem(level) {
    let min1, max1, min2, max2;

    // Difficulty logic
    if (level === 1) {
        // Teen x Teen (11-19 x 11-19)
        min1 = 11; max1 = 19;
        min2 = 11; max2 = 19;
    } else if (level === 2) {
        // Teen x Twenties
        min1 = 11; max1 = 19;
        min2 = 20; max2 = 29;
    } else if (level === 3) {
        // Twenties x Thirties
        min1 = 20; max1 = 29;
        min2 = 30; max2 = 39;
    } else {
        // Harder
        min1 = 20 + (level * 2); max1 = 40 + (level * 2);
        min2 = 20 + (level * 2); max2 = 40 + (level * 2);
    }

    const n1 = Math.floor(Math.random() * (max1 - min1 + 1)) + min1;
    const n2 = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;

    return { n1, n2 };
}

function calculateGeometry(n1, n2) {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    
    const d1 = String(n1).split('').map(Number);
    const d2 = String(n2).split('').map(Number);

    let linesA = [];
    let linesB = [];
    let intersections = [];

    // Lines A (Slope -1, y = -x + C)
    // Group 0: Tens (Left), Group 1: Units (Right)
    // Actually visual placement depends on index.

    // Determine offsets to center the whole shape roughly
    // This is a simplified placement logic

    d1.forEach((count, groupIdx) => {
        // GroupIdx 0 (Tens) -> Top-Leftish
        // GroupIdx 1 (Units) -> Bottom-Rightish

        // Let's use specific offsets from center
        let groupOffset = (groupIdx === 0) ? -GROUP_SPACING/2 : GROUP_SPACING/2;
        if (d1.length === 1) groupOffset = 0;

        // Center the lines within the group
        let startC = groupOffset - ((count - 1) * LINE_SPACING) / 2;
        
        for (let i = 0; i < count; i++) {
            linesA.push({
                type: 'A',
                group: groupIdx, 
                C: startC + (i * LINE_SPACING)
            });
        }
    });

    // Lines B (Slope 1, y = x + C)
    d2.forEach((count, groupIdx) => {
        let groupOffset = (groupIdx === 0) ? GROUP_SPACING/2 : -GROUP_SPACING/2;
        if (d2.length === 1) groupOffset = 0;

        let startC = groupOffset - ((count - 1) * LINE_SPACING) / 2;

        for (let i = 0; i < count; i++) {
            linesB.push({
                type: 'B',
                group: groupIdx,
                C: startC + (i * LINE_SPACING)
            });
        }
    });

    // Calculate Intersections
    // Line A: y = -x + Ca
    // Line B: y = x + Cb
    // -x + Ca = x + Cb => 2x = Ca - Cb => x = (Ca - Cb)/2
    // y = (Ca - Cb)/2 + Cb = (Ca + Cb)/2

    linesA.forEach(lA => {
        linesB.forEach(lB => {
            let x = (lA.C - lB.C) / 2;
            let y = (lA.C + lB.C) / 2;

            // Determine Zone
            // d1 has 2 digits (idx 0, 1), d2 has 2 digits (idx 0, 1)
            // Intersections:
            // A0 x B0 -> Hundreds (Left) -> Zone 0
            // A0 x B1 -> Tens (Middle)   -> Zone 1
            // A1 x B0 -> Tens (Middle)   -> Zone 1
            // A1 x B1 -> Units (Right)   -> Zone 2

            // General Formula: Zone = IndexA + IndexB
            let zone = lA.group + lB.group;

            intersections.push({
                x: cx + x,
                y: cy + y,
                groupA: lA.group,
                groupB: lB.group,
                zone: zone
            });
        });
    });

    return { linesA, linesB, intersections };
}

// --- RENDERER ---

function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawLine(x1, y1, x2, y2, color, width = 3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function drawDot(x, y, color, radius = 5) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawZone(intersections, label, isActive = false, overrideColor = null) {
    if (intersections.length === 0) return;

    // Calculate centroid
    let sumX = 0, sumY = 0;
    intersections.forEach(p => { sumX += p.x; sumY += p.y; });
    let cx = sumX / intersections.length;
    let cy = sumY / intersections.length;

    // Draw Zone Circle
    if (isActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.zone;
        ctx.fill();
        ctx.strokeStyle = overrideColor || COLORS.zoneBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Count
        ctx.font = "bold 40px 'Orbitron'";
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        // Draw a background for text for readability
        ctx.fillText(label, cx, cy - 80);
    }

    // Draw dots
    intersections.forEach(p => {
        drawDot(p.x, p.y, isActive ? (overrideColor || COLORS.intersectionHighlight) : COLORS.intersection, isActive ? 7 : 5);
    });
}

function render() {
    clearCanvas();
    const { n1, n2 } = gameState.problem;
    const { linesA, linesB, intersections } = gameState.geometry;

    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const len = 600;

    // Draw Title/Problem
    ctx.font = "bold 30px 'Orbitron'";
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(`${n1} × ${n2} = ?`, cx, 50);

    // Determine visibility based on Tutorial Step
    let showA = true;
    let showB = true;
    let showDots = true;
    let activeZone = -1; // 0=Hundreds, 1=Tens, 2=Units
    let labelOverride = null;
    let showFinal = false;

    if (gameState.mode === 'tutorial') {
        const s = gameState.tutorialStep;
        if (s === 0) { showA = false; showB = false; showDots = false; }
        else if (s === 1) { showA = true; showB = false; showDots = false; }
        else if (s === 2) { showA = true; showB = true; showDots = false; }
        else if (s === 3) { showDots = true; } // Show dots
        else if (s === 4) {
            activeZone = 2; // Units (Right)
            labelOverride = "12 (Simpan 1)";
        }
        else if (s === 5) {
            activeZone = 1; // Tens (Middle)
            labelOverride = "7 + 1 = 8";
        }
        else if (s === 6) {
            activeZone = 0; // Hundreds (Left)
            labelOverride = "1";
        }
        else if (s === 7) {
            showFinal = true;
        }
    }

    // Draw Lines A
    if (showA) {
        linesA.forEach(l => {
            let x1 = -len; let y1 = -x1 + l.C;
            let x2 = len; let y2 = -x2 + l.C;
            drawLine(cx + x1, cy + y1, cx + x2, cy + y2, COLORS.lineA);
        });
    }

    // Draw Lines B
    if (showB) {
        linesB.forEach(l => {
            let x1 = -len; let y1 = x1 + l.C;
            let x2 = len; let y2 = x2 + l.C;
            drawLine(cx + x1, cy + y1, cx + x2, cy + y2, COLORS.lineB);
        });
    }

    // Draw Zones & Dots
    if (showDots) {
        // Group points by zone
        const zones = {};
        intersections.forEach(p => {
            if (!zones[p.zone]) zones[p.zone] = [];
            zones[p.zone].push(p);
        });

        // Draw inactive dots first
        intersections.forEach(p => {
             drawDot(p.x, p.y, COLORS.intersection, 5);
        });

        // Draw Active Zone
        if (activeZone !== -1 && zones[activeZone]) {
            let label = labelOverride || zones[activeZone].length.toString();
            drawZone(zones[activeZone], label, true);
        }
        
        if (showFinal) {
            ctx.font = "bold 60px 'Orbitron'";
            ctx.fillStyle = '#0aff00';
            ctx.textAlign = 'center';
            ctx.shadowColor = "rgba(0, 255, 0, 0.5)";
            ctx.shadowBlur = 10;
            ctx.fillText("= 182", cx, cy + 250);
            ctx.shadowBlur = 0;
        }
    }
}

// --- TUTORIAL LOGIC ---

const TUTORIAL_STEPS = [
    { text: "Kita akan menghitung 14 × 13.", action: () => {} },
    { text: "1. Gambar garis untuk 14 (Ungu). 1 garis puluhan, 4 garis satuan.", action: () => {} },
    { text: "2. Gambar garis untuk 13 (Pink). 1 garis puluhan, 3 garis satuan.", action: () => {} },
    { text: "3. Perhatikan titik-titik potongnya.", action: () => {} },
    { text: "4. KANAN (Satuan): Ada 12 titik. Tulis 2, simpan 1 ke kiri.", action: () => {} },
    { text: "5. TENGAH (Puluhan): Ada 7 titik. Ditambah 1 simpanan = 8.", action: () => {} },
    { text: "6. KIRI (Ratusan): Ada 1 titik.", action: () => {} },
    { text: "Hasilnya: 1 (Ratusan), 8 (Puluhan), 2 (Satuan). Jawabannya 182!", action: () => {} }
];

function resetTutorial() {
    gameState.problem = { n1: 14, n2: 13 };
    gameState.geometry = calculateGeometry(14, 13);
    gameState.tutorialStep = 0;
    updateTutorialUI();
    render();
}

function nextTutorialStep() {
    if (gameState.tutorialStep < TUTORIAL_STEPS.length - 1) {
        gameState.tutorialStep++;
        updateTutorialUI();
        render();
    } else {
        // If they click next on the last step, go to practice
        setMode('practice');
    }
}

function prevTutorialStep() {
    if (gameState.tutorialStep > 0) {
        gameState.tutorialStep--;
        updateTutorialUI();
        render();
    }
}

function updateTutorialUI() {
    const step = TUTORIAL_STEPS[gameState.tutorialStep];
    document.getElementById('instruction-text').innerText = step.text;
    
    // Update Carry Over Visualization explicitly for Step 4
    if (gameState.tutorialStep === 4) {
        // We handle the drawing in render(), but we can add extra DOM text if needed
    }

    // Toggle Buttons
    document.getElementById('btn-prev-step').classList.toggle('hidden', gameState.tutorialStep === 0);
    const nextBtn = document.getElementById('btn-next-step');
    if (gameState.tutorialStep === TUTORIAL_STEPS.length - 1) {
        nextBtn.innerText = "Selesai";
    } else {
        nextBtn.innerText = "Lanjut";
    }
}

// --- PRACTICE LOGIC ---

function newPracticeProblem() {
    const p = generateProblem(gameState.user.level);
    gameState.problem = p;
    gameState.geometry = calculateGeometry(p.n1, p.n2);

    document.getElementById('answer-input').value = '';
    document.getElementById('feedback-msg').innerText = '';
    document.getElementById('btn-new-problem').classList.add('hidden');
    document.getElementById('btn-check').classList.remove('hidden');

    render();
}

function checkAnswer() {
    const input = document.getElementById('answer-input');
    const val = parseInt(input.value);
    
    if (isNaN(val)) return;
    
    const correct = gameState.problem.n1 * gameState.problem.n2;
    const feedback = document.getElementById('feedback-msg');

    if (val === correct) {
        feedback.innerText = "BENAR! 🎉 +20 XP";
        feedback.className = "text-xl font-bold h-8 mb-4 text-neonGreen";
        playSound('correct');
        addXP(20);

        document.getElementById('btn-check').classList.add('hidden');
        document.getElementById('btn-new-problem').classList.remove('hidden');
    } else {
        feedback.innerText = "Salah, coba lagi!";
        feedback.className = "text-xl font-bold h-8 mb-4 text-red-500";
        playSound('wrong');
    }
}

// --- UTILS ---

function playSound(name) {
    if (SOUNDS[name]) {
        SOUNDS[name].currentTime = 0;
        SOUNDS[name].play().catch(e => console.log("Sound error: ", e));
    }
}
