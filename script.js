// --- CONFIGURATION ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LINE_SPACING = 30;
const GROUP_SPACING = 100;

// Bright Palette
const COLORS = {
    lineA: '#a855f7', // Purple-500
    lineB: '#ec4899', // Pink-500
    intersection: '#64748b', // Slate-500
    intersectionHighlight: '#0ea5e9', // Sky-500
    text: '#1e293b', // Slate-800
    zone: 'rgba(14, 165, 233, 0.1)', // Sky-500/10
    zoneBorder: '#0ea5e9', // Sky-500
    correct: '#10b981', // Emerald-500
    wrong: '#ef4444' // Red-500
};

// Google Apps Script URL (Placeholder - User must replace this)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxA1xFg1SBrSvx_CmOTtPIIXt-ouYrEkyvswkmHOHmXsfLz7_HIlr60o0VJvcxIAPYk/exec'; // TODO: Paste your Web App URL here

// Sound Effects
const SOUNDS = {
    start: new Audio('sounds/start.wav'),
    correct: new Audio('sounds/chime.wav'),
    wrong: new Audio('sounds/alert.wav'),
    levelUp: new Audio('sounds/end.wav')
};

// Level Configuration
const LEVEL_CONFIG = [
    {
        id: 1,
        title: "Level 1: Dasar",
        description: "Perkalian Belasan (Tanpa Simpan)",
        targetXP: 100,
        tutorialProblem: { n1: 12, n2: 13 },
        problemRange: { min1: 11, max1: 14, min2: 11, max2: 14 }, // Easy teens
        tutorialSteps: [
            { text: "Kita akan menghitung 12 × 13.", action: () => {} },
            { text: "1. Gambar garis untuk 12 (Ungu). 1 garis puluhan, 2 garis satuan.", action: () => {} },
            { text: "2. Gambar garis untuk 13 (Pink). 1 garis puluhan, 3 garis satuan.", action: () => {} },
            { text: "3. Perhatikan titik-titik potongnya.", action: () => {} },
            { text: "4. KANAN (Satuan): Ada 6 titik.", action: () => {} },
            { text: "5. TENGAH (Puluhan): Ada 2 + 3 = 5 titik.", action: () => {} },
            { text: "6. KIRI (Ratusan): Ada 1 titik.", action: () => {} },
            { text: "Hasilnya: 1 (Ratusan), 5 (Puluhan), 6 (Satuan). Jawabannya 156!", action: () => {} }
        ]
    },
    {
        id: 2,
        title: "Level 2: Teknik Simpan",
        description: "Perkalian Belasan (Dengan Simpan)",
        targetXP: 250,
        tutorialProblem: { n1: 14, n2: 13 },
        problemRange: { min1: 14, max1: 19, min2: 13, max2: 19 }, // Teens needing carry over likely
        tutorialSteps: [
            { text: "Kita akan menghitung 14 × 13 (Teknik Simpan).", action: () => {} },
            { text: "1. Gambar garis untuk 14 (Ungu). 1 garis puluhan, 4 garis satuan.", action: () => {} },
            { text: "2. Gambar garis untuk 13 (Pink). 1 garis puluhan, 3 garis satuan.", action: () => {} },
            { text: "3. Perhatikan titik-titik potongnya.", action: () => {} },
            { text: "4. KANAN (Satuan): Ada 12 titik! Tulis 2, SIMPAN 1 ke kiri.", action: () => {} },
            { text: "5. TENGAH (Puluhan): Ada 7 titik. Tambah 1 simpanan = 8.", action: () => {} },
            { text: "6. KIRI (Ratusan): Ada 1 titik.", action: () => {} },
            { text: "Hasilnya: 1 (Ratusan), 8 (Puluhan), 2 (Satuan). Jawabannya 182!", action: () => {} }
        ]
    },
    {
        id: 3,
        title: "Level 3: Angka Besar",
        description: "Perkalian 20-an",
        targetXP: 500,
        tutorialProblem: { n1: 21, n2: 23 },
        problemRange: { min1: 20, max1: 29, min2: 20, max2: 29 },
        tutorialSteps: [
            { text: "Kita akan menghitung 21 × 23.", action: () => {} },
            { text: "1. Gambar garis untuk 21 (Ungu). 2 garis puluhan, 1 garis satuan.", action: () => {} },
            { text: "2. Gambar garis untuk 23 (Pink). 2 garis puluhan, 3 garis satuan.", action: () => {} },
            { text: "3. Perhatikan titik potongnya. Hati-hati dengan jumlah garis!", action: () => {} },
            { text: "4. KANAN (Satuan): 1x3 = 3 titik.", action: () => {} },
            { text: "5. TENGAH (Puluhan): (2x3) + (1x2) = 6 + 2 = 8 titik.", action: () => {} },
            { text: "6. KIRI (Ratusan): 2x2 = 4 titik.", action: () => {} },
            { text: "Hasilnya: 4 (Ratusan), 8 (Puluhan), 3 (Satuan). Jawabannya 483!", action: () => {} }
        ]
    }
];

// --- STATE ---
let gameState = {
    user: {
        username: 'Player',
        xp: 0,
        score: 0,
        unlockedLevels: [1] // Start with Level 1 unlocked
    },
    currentLevelId: 1, // Currently selected level
    mode: 'tutorial', // 'tutorial' | 'practice'
    problem: { n1: 12, n2: 13 }, 
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
    
    // Navigation
    document.getElementById('btn-back-levels').addEventListener('click', showLevelSelection);
    
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

// --- USER SYSTEM & NAVIGATION ---

function handleLogin() {
    const input = document.getElementById('username-input');
    const username = input.value.trim() || 'Player';
    
    gameState.user.username = username;
    
    // Update UI
    document.getElementById('hud-username').innerText = username;
    document.getElementById('avatar-initial').innerText = username.charAt(0).toUpperCase();
    document.getElementById('login-overlay').classList.add('opacity-0', 'pointer-events-none');
    
    playSound('start');
    
    // Go to Level Selection
    showLevelSelection();
}

function showLevelSelection() {
    // Hide Game, Show Level Select
    document.getElementById('game-interface').classList.add('hidden');
    document.getElementById('level-selection-screen').classList.remove('hidden');
    
    renderLevelMap();
}

function renderLevelMap() {
    const container = document.querySelector('#level-selection-screen .grid');
    container.innerHTML = ''; // Clear existing
    
    LEVEL_CONFIG.forEach(level => {
        const isUnlocked = gameState.user.unlockedLevels.includes(level.id);
        const btn = document.createElement('button');
        
        // Base classes
        let classes = "level-btn p-6 rounded-xl shadow-md border-2 flex flex-col items-center justify-center h-48 w-full relative group transition-all duration-300 ";
        
        if (isUnlocked) {
            classes += "bg-white border-primary cursor-pointer hover:border-secondary";
            btn.onclick = () => selectLevel(level.id);
        } else {
            classes += "level-locked border-slate-300";
            btn.disabled = true;
        }
        
        btn.className = classes;
        
        // Content
        let content = `
            <span class="text-3xl font-bold ${isUnlocked ? 'text-primary' : 'text-slate-400'} mb-2">Level ${level.id}</span>
            <span class="text-sm ${isUnlocked ? 'text-slate-600' : 'text-slate-400'} font-semibold">${level.title}</span>
            <p class="text-xs ${isUnlocked ? 'text-slate-400' : 'text-slate-400'} mt-2 px-2">${level.description}</p>
        `;
        
        // Lock Icon if locked
        if (!isUnlocked) {
            content += `
                <div class="absolute inset-0 flex items-center justify-center bg-slate-200/50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            `;
        } else {
             content += `<div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 rounded-xl transition-all"></div>`;
        }
        
        btn.innerHTML = content;
        container.appendChild(btn);
    });
}

function selectLevel(levelId) {
    gameState.currentLevelId = levelId;
    
    // Hide Level Select, Show Game
    document.getElementById('level-selection-screen').classList.add('hidden');
    document.getElementById('game-interface').classList.remove('hidden');
    
    // Update HUD Level Indicator
    document.getElementById('hud-level-indicator').innerText = levelId;
    
    // Start Tutorial for this level
    setMode('tutorial');
}

function updateHUD() {
    const user = gameState.user;
    
    // Find next level target
    // We assume levels are sequential. Current Level Target is the one we are working towards.
    // Actually, XP is global. Let's find the max target of the highest unlocked level + 1?
    // Simplified: Just show global XP and next target based on LEVEL_CONFIG.
    
    // Determine current target based on highest unlocked level
    const maxUnlocked = Math.max(...user.unlockedLevels);
    const nextLevelConfig = LEVEL_CONFIG.find(l => l.id === maxUnlocked + 1);
    const currentLevelConfig = LEVEL_CONFIG.find(l => l.id === maxUnlocked);
    
    let xpTarget = nextLevelConfig ? nextLevelConfig.targetXP : (currentLevelConfig.targetXP * 1.5); // Fallback if max level
    
    document.getElementById('hud-xp-current').innerText = user.xp;
    document.getElementById('hud-xp-next').innerText = xpTarget;
    document.getElementById('hud-score').innerText = user.score;
    
    const percent = Math.min(100, (user.xp / xpTarget) * 100);
    document.getElementById('xp-bar').style.width = `${percent}%`;
    document.getElementById('hud-xp-percent').innerText = `${Math.floor(percent)}%`;
}

function addXP(amount) {
    gameState.user.xp += amount;
    gameState.user.score += amount;
    
    checkLevelUp();
    updateHUD();
    saveData();
}

function checkLevelUp() {
    const user = gameState.user;
    const maxUnlocked = Math.max(...user.unlockedLevels);
    
    // Check if there is a next level
    const nextLevel = LEVEL_CONFIG.find(l => l.id === maxUnlocked + 1);
    
    if (nextLevel && user.xp >= nextLevel.targetXP) {
        // Unlock!
        if (!user.unlockedLevels.includes(nextLevel.id)) {
            user.unlockedLevels.push(nextLevel.id);
            playSound('levelUp');
            
            // Show Modal or Alert
            setTimeout(() => {
                alert(`SELAMAT! Level ${nextLevel.id} Terbuka! 🎉\nKamu bisa lanjut ke level berikutnya di menu.`);
            }, 500);
        }
    }
}

function saveData() {
    if (!GAS_URL) return;
    
    const payload = {
        username: gameState.user.username,
        level: Math.max(...gameState.user.unlockedLevels), // Highest level
        xp: gameState.user.xp,
        score: gameState.user.score,
        lastUpdated: new Date().toISOString()
    };
    
    fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error('Error saving data:', err));
}

// --- GAME LOGIC ---

function setMode(mode) {
    gameState.mode = mode;
    
    // UI Styling update
    const btnTut = document.getElementById('btn-tutorial');
    const btnPrac = document.getElementById('btn-practice');
    
    if (mode === 'tutorial') {
        btnTut.className = "flex-1 py-3 rounded-xl font-bold transition-all duration-300 bg-primary/10 text-primary border border-primary active-mode hover:bg-primary hover:text-white";
        btnPrac.className = "flex-1 py-3 rounded-xl font-bold transition-all duration-300 text-textMuted hover:text-secondary hover:bg-secondary/10 border border-transparent hover:border-secondary";
        
        document.getElementById('tutorial-controls').classList.remove('hidden');
        document.getElementById('practice-controls').classList.add('hidden');
        
        document.getElementById('current-mode-title').innerText = "Mode: Tutorial";
        document.getElementById('current-mode-title').className = "text-3xl font-poppins font-bold text-primary";
        
        resetTutorial();
    } else {
        btnTut.className = "flex-1 py-3 rounded-xl font-bold transition-all duration-300 text-textMuted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary";
        btnPrac.className = "flex-1 py-3 rounded-xl font-bold transition-all duration-300 bg-secondary/10 text-secondary border border-secondary active-mode hover:bg-secondary hover:text-white";
        
        document.getElementById('tutorial-controls').classList.add('hidden');
        document.getElementById('practice-controls').classList.remove('hidden');
        
        document.getElementById('current-mode-title').innerText = "Mode: Latihan";
        document.getElementById('current-mode-title').className = "text-3xl font-poppins font-bold text-secondary";
        document.getElementById('instruction-text').innerText = "Hitung titik potongnya dan masukkan jawabanmu!";
        
        newPracticeProblem();
    }
}

function getCurrentLevelConfig() {
    return LEVEL_CONFIG.find(l => l.id === gameState.currentLevelId);
}

// --- GEOMETRY & MATH ---

function calculateGeometry(n1, n2) {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    
    const d1 = String(n1).split('').map(Number);
    const d2 = String(n2).split('').map(Number);

    let linesA = [];
    let linesB = [];
    let intersections = [];

    // --- CENTERING FIX ---
    // We first generate lines relative to an arbitrary center, then calculate the 
    // bounding box center of all intersections, and finally shift everything.

    // 1. Generate Raw Lines (Centered relative to group structure)
    // Use the same logic as before to generate relative positions.
    
    let rawLinesA = [];
    let rawLinesB = [];
    
    // Lines A (Slope -1): Tens (Left/Top) -> Units (Right/Bottom)
    let groupOffsetA = ((d1.length - 1) * GROUP_SPACING) / 2;
    d1.forEach((count, idx) => {
        let groupBase = -groupOffsetA + (idx * GROUP_SPACING);
        let startC = groupBase - ((count - 1) * LINE_SPACING) / 2;
        for (let i = 0; i < count; i++) {
            rawLinesA.push({ type: 'A', group: idx, C: startC + (i * LINE_SPACING) });
        }
    });

    // Lines B (Slope 1): Tens (Top/Right) -> Units (Bottom/Left)
    // Note: To cross A correctly, B groups usually go in reverse visual order or opposite offset.
    // Previous working logic: Tens (+Offset), Units (-Offset).
    let groupOffsetB = ((d2.length - 1) * GROUP_SPACING) / 2;
    d2.forEach((count, idx) => {
        let groupBase = groupOffsetB - (idx * GROUP_SPACING);
        let startC = groupBase - ((count - 1) * LINE_SPACING) / 2;
        for (let i = 0; i < count; i++) {
            rawLinesB.push({ type: 'B', group: idx, C: startC + (i * LINE_SPACING) });
        }
    });

    // 2. Calculate Raw Intersections to find the Center of Mass
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    // Temporary calculation to find bounds
    rawLinesA.forEach(lA => {
        rawLinesB.forEach(lB => {
            // Intersection of y = -x + Ca and y = x + Cb
            let x = (lA.C - lB.C) / 2;
            let y = (lA.C + lB.C) / 2;
            
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });
    });
    
    // Calculate the center of the bounding box of all intersections
    let centerX = (minX + maxX) / 2;
    let centerY = (minY + maxY) / 2;
    
    // 3. Apply Shift to Center on Canvas (cx, cy)
    // We want (centerX, centerY) to be at (cx, cy).
    // So we shift every point by (cx - centerX, cy - centerY).
    // For lines defined by C, shifting x by dx and y by dy changes C.
    // Line A (y = -x + C): New Y = -New X + New C
    // (y - dy) = -(x - dx) + C => y = -x + dx + dy + C. New C = C + dx + dy.
    // Line B (y = x + C): New Y = New X + New C
    // (y - dy) = (x - dx) + C => y = x - dx + dy + C. New C = C - dx + dy.
    
    let shiftX = -centerX; // We shift relative to 0,0 first
    let shiftY = -centerY;
    
    // Apply shifts to get final lines relative to (0,0) center
    linesA = rawLinesA.map(l => ({
        ...l,
        C: l.C + shiftX + shiftY
    }));
    
    linesB = rawLinesB.map(l => ({
        ...l,
        C: l.C - shiftX + shiftY
    }));
    
    // 4. Calculate Final Intersections
    linesA.forEach(lA => {
        linesB.forEach(lB => {
            let x = (lA.C - lB.C) / 2;
            let y = (lA.C + lB.C) / 2;
            let zone = lA.group + lB.group;
            intersections.push({ 
                x: cx + x, // Add canvas center offset finally
                y: cy + y, 
                groupA: lA.group, 
                groupB: lB.group, 
                zone: zone 
            });
        });
    });
    
    return { linesA, linesB, intersections };
}

// --- RENDERING ---

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
    
    let sumX = 0, sumY = 0;
    intersections.forEach(p => { sumX += p.x; sumY += p.y; });
    let cx = sumX / intersections.length;
    let cy = sumY / intersections.length;
    
    if (isActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.zone;
        ctx.fill();
        ctx.strokeStyle = overrideColor || COLORS.zoneBorder;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.font = "bold 40px 'Poppins'";
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy - 80);
    }
    
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
    const len = 1000; // Increased length to ensure lines span screen

    // Draw Title
    ctx.font = "bold 40px 'Poppins'";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.fillText(`${n1} × ${n2} = ?`, cx, 60);

    let showA = true, showB = true, showDots = true;
    let activeZone = -1;
    let labelOverride = null;
    let showFinal = false;

    if (gameState.mode === 'tutorial') {
        const s = gameState.tutorialStep;
        if (s === 0) { showA = false; showB = false; showDots = false; }
        else if (s === 1) { showA = true; showB = false; showDots = false; }
        else if (s === 2) { showA = true; showB = true; showDots = false; }
        else if (s === 3) { showDots = true; }
        else if (s === 4) { activeZone = 2; }
        else if (s === 5) { activeZone = 1; }
        else if (s === 6) { activeZone = 0; }
        else if (s === 7) { showFinal = true; }

        // Specific overrides for Level 2 (Carry Over)
        if (gameState.currentLevelId === 2) {
             if (s === 4) labelOverride = "12 (Simpan 1)";
             if (s === 5) labelOverride = "7 + 1 = 8";
             if (s === 6) labelOverride = "1";
        }
        // Specific overrides for Level 1 (No Carry Over)
        if (gameState.currentLevelId === 1) {
             if (s === 4) labelOverride = "6";
             if (s === 5) labelOverride = "5";
             if (s === 6) labelOverride = "1";
        }
    }

    // DRAW LINES FIX: 
    // l.C is relative to mathematical (0,0).
    // Canvas center is (cx, cy).
    // Line A (y_rel = -x_rel + C_rel):
    // Screen Y = -Screen X + (cy + cx + C_rel)
    if (showA) {
        linesA.forEach(l => {
            let offset = cy + cx + l.C;
            // x1 = cx - len -> y1 = -(cx - len) + offset
            let y1 = -(cx - len) + offset;
            let y2 = -(cx + len) + offset;
            drawLine(cx - len, y1, cx + len, y2, COLORS.lineA);
        });
    }

    // Line B (y_rel = x_rel + C_rel):
    // Screen Y = Screen X + (cy - cx + C_rel)
    if (showB) {
        linesB.forEach(l => {
            let offset = cy - cx + l.C;
            // x1 = cx - len -> y1 = (cx - len) + offset
            let y1 = (cx - len) + offset;
            let y2 = (cx + len) + offset;
            drawLine(cx - len, y1, cx + len, y2, COLORS.lineB);
        });
    }

    if (showDots) {
        const zones = {};
        intersections.forEach(p => {
            if (!zones[p.zone]) zones[p.zone] = [];
            zones[p.zone].push(p);
        });
        
        intersections.forEach(p => drawDot(p.x, p.y, COLORS.intersection, 5));

        if (activeZone !== -1 && zones[activeZone]) {
            let label = labelOverride || zones[activeZone].length.toString();
            drawZone(zones[activeZone], label, true);
        }
        
        if (showFinal) {
            ctx.font = "bold 60px 'Poppins'";
            ctx.fillStyle = COLORS.correct;
            ctx.fillText(`= ${n1 * n2}`, cx, cy + 250);
        }
    }
}

// --- TUTORIAL ---

function resetTutorial() {
    const config = getCurrentLevelConfig();
    gameState.problem = config.tutorialProblem;
    gameState.geometry = calculateGeometry(config.tutorialProblem.n1, config.tutorialProblem.n2);
    gameState.tutorialStep = 0;
    updateTutorialUI();
    render();
}

function nextTutorialStep() {
    const config = getCurrentLevelConfig();
    if (gameState.tutorialStep < config.tutorialSteps.length - 1) {
        gameState.tutorialStep++;
        updateTutorialUI();
        render();
    } else {
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
    const config = getCurrentLevelConfig();
    const step = config.tutorialSteps[gameState.tutorialStep];
    
    document.getElementById('instruction-text').innerText = step.text;
    document.getElementById('btn-prev-step').classList.toggle('hidden', gameState.tutorialStep === 0);
    
    const nextBtn = document.getElementById('btn-next-step');
    if (gameState.tutorialStep === config.tutorialSteps.length - 1) {
        nextBtn.innerText = "Mulai Latihan";
    } else {
        nextBtn.innerText = "Lanjut";
    }
}

// --- PRACTICE ---

function newPracticeProblem() {
    const config = getCurrentLevelConfig();
    const range = config.problemRange;
    
    const n1 = Math.floor(Math.random() * (range.max1 - range.min1 + 1)) + range.min1;
    const n2 = Math.floor(Math.random() * (range.max2 - range.min2 + 1)) + range.min2;
    
    gameState.problem = { n1, n2 };
    gameState.geometry = calculateGeometry(n1, n2);
    
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
        feedback.innerText = "BENAR! 🎉 +25 XP";
        feedback.className = "text-xl font-bold h-8 mb-4 text-center w-full text-success";
        playSound('correct');
        addXP(25);
        
        document.getElementById('btn-check').classList.add('hidden');
        document.getElementById('btn-new-problem').classList.remove('hidden');
    } else {
        feedback.innerText = "Salah, coba lagi!";
        feedback.className = "text-xl font-bold h-8 mb-4 text-center w-full text-danger";
        playSound('wrong');
    }
}

function playSound(name) {
    if (SOUNDS[name]) {
        SOUNDS[name].currentTime = 0;
        SOUNDS[name].play().catch(() => {});
    }
}
