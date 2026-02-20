// --- DEBUGGING ---
console.log("Script loaded successfully! v2.3 - Persistence");
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
    return false;
};

// --- CONFIGURATION ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LINE_SPACING = 30; // Spacing between lines in a group
const GROUP_SPACING = 300; // Spacing between the tens and units groups

// Bright Palette
const COLORS = {
    lineA: '#a855f7', // Purple-500 (Horizontal)
    lineB: '#ec4899', // Pink-500 (Vertical)
    intersection: '#64748b', // Slate-500
    intersectionHighlight: '#0ea5e9', // Sky-500
    text: '#1e293b', // Slate-800
    zone: 'rgba(14, 165, 233, 0.1)', // Sky-500/10
    zoneBorder: '#0ea5e9', // Sky-500
    correct: '#10b981', // Emerald-500
    wrong: '#ef4444' // Red-500
};

// Google Apps Script URL (Placeholder - User must replace this)
const GAS_URL = '';

// Sound Effects
const SOUNDS = {
    start: new Audio('./sounds/start.wav'),
    correct: new Audio('./sounds/chime.wav'),
    wrong: new Audio('./sounds/alert.wav'),
    levelUp: new Audio('./sounds/end.wav')
};

// Level Configuration
const LEVEL_CONFIG = [
    {
        id: 1,
        title: "Level 1: Dasar",
        description: "Perkalian Belasan (Tanpa Simpan)",
        targetXP: 100,
        tutorialProblem: { n1: 12, n2: 13 },
        problemRange: { min1: 11, max1: 14, min2: 11, max2: 14 },
        tutorialSteps: [
            { text: "Kita akan menghitung 12 × 13.", action: () => {} },
            { text: "1. Gambar garis 12 (Horizontal/Ungu). Atas: 1 (Puluhan), Bawah: 2 (Satuan).", action: () => {} },
            { text: "2. Gambar garis 13 (Vertikal/Pink). Kiri: 1 (Puluhan), Kanan: 3 (Satuan).", action: () => {} },
            { text: "3. Perhatikan titik-titik potongnya.", action: () => {} },
            { text: "4. KANAN-BAWAH (Satuan): Ada 6 titik.", action: () => {} },
            { text: "5. TENGAH (Puluhan): Ada (1x2) + (1x3) = 2 + 3 = 5 titik.", action: () => {} },
            { text: "6. KIRI-ATAS (Ratusan): Ada 1 titik.", action: () => {} },
            { text: "Hasilnya: 1 (Ratusan), 5 (Puluhan), 6 (Satuan). Jawabannya 156!", action: () => {} }
        ]
    },
    {
        id: 2,
        title: "Level 2: Teknik Simpan",
        description: "Perkalian Belasan (Dengan Simpan)",
        targetXP: 250,
        tutorialProblem: { n1: 14, n2: 13 },
        problemRange: { min1: 14, max1: 19, min2: 13, max2: 19 },
        tutorialSteps: [
            { text: "Kita akan menghitung 14 × 13 (Teknik Simpan).", action: () => {} },
            { text: "1. Gambar garis 14 (Horizontal). Atas: 1, Bawah: 4.", action: () => {} },
            { text: "2. Gambar garis 13 (Vertikal). Kiri: 1, Kanan: 3.", action: () => {} },
            { text: "3. Perhatikan titik-titik potongnya.", action: () => {} },
            { text: "4. KANAN-BAWAH (Satuan): Ada 12 titik! Tulis 2, SIMPAN 1 ke Puluhan.", action: () => {} },
            { text: "5. TENGAH (Puluhan): Ada 4 + 3 = 7 titik. Tambah 1 simpanan = 8.", action: () => {} },
            { text: "6. KIRI-ATAS (Ratusan): Ada 1 titik.", action: () => {} },
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
            { text: "1. Gambar garis 21 (Horizontal). Atas: 2, Bawah: 1.", action: () => {} },
            { text: "2. Gambar garis 23 (Vertikal). Kiri: 2, Kanan: 3.", action: () => {} },
            { text: "3. Perhatikan titik potongnya.", action: () => {} },
            { text: "4. KANAN-BAWAH (Satuan): 1x3 = 3 titik.", action: () => {} },
            { text: "5. TENGAH (Puluhan): (2x1) + (2x3) = 2 + 6 = 8 titik.", action: () => {} },
            { text: "6. KIRI-ATAS (Ratusan): 2x2 = 4 titik.", action: () => {} },
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
        unlockedLevels: [1]
    },
    currentLevelId: 1,
    mode: 'tutorial',
    problem: { n1: 12, n2: 13 },
    tutorialStep: 0,
    geometry: { linesA: [], linesB: [], intersections: [] }
};

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        initEvents();
        Object.values(SOUNDS).forEach(s => s.load());
    } catch (e) {
        console.error("Initialization failed:", e);
    }
});

function initEvents() {
    const startBtn = document.getElementById('btn-start-game');
    if(startBtn) startBtn.addEventListener('click', handleLogin);

    document.getElementById('btn-back-levels').addEventListener('click', showLevelSelection);

    document.getElementById('btn-tutorial').addEventListener('click', () => setMode('tutorial'));
    document.getElementById('btn-practice').addEventListener('click', () => setMode('practice'));

    document.getElementById('btn-next-step').addEventListener('click', nextTutorialStep);
    document.getElementById('btn-prev-step').addEventListener('click', prevTutorialStep);
    document.getElementById('btn-restart-tutorial').addEventListener('click', resetTutorial);

    document.getElementById('btn-check').addEventListener('click', checkAnswer);
    document.getElementById('btn-new-problem').addEventListener('click', newPracticeProblem);

    document.getElementById('answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
}

// --- USER SYSTEM & NAVIGATION ---

async function handleLogin() {
    const input = document.getElementById('username-input');
    const startBtn = document.getElementById('btn-start-game');
    const username = input.value.trim() || 'Player';
    gameState.user.username = username;

    // UI Loading state
    startBtn.disabled = true;
    startBtn.innerText = "Loading...";

    try {
        // Fetch User Data if GAS_URL is configured
        if (GAS_URL) {
            await fetchUserData(username);
        }
    } catch (e) {
        console.error("Failed to fetch user data:", e);
    } finally {
        startBtn.disabled = false;
        startBtn.innerText = "Mulai!";
    }

    document.getElementById('hud-username').innerText = username;
    document.getElementById('avatar-initial').innerText = username.charAt(0).toUpperCase();

    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('login-overlay').style.display = 'none';

    playSound('start');

    // Update HUD with loaded data
    updateHUD();

    showLevelSelection();
}

async function fetchUserData(username) {
    console.log("Fetching user data for:", username);
    try {
        const response = await fetch(`${GAS_URL}?action=login&username=${encodeURIComponent(username)}`, {
            method: 'GET',
            mode: 'cors', // Standard CORS request
            redirect: 'follow'
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        console.log("User data received:", data);

        if (data.status === 'success') {
            // Update local state
            gameState.user.xp = Number(data.xp) || 0;
            gameState.user.score = Number(data.score) || 0;
            const maxLevel = Number(data.level) || 1;

            // Rebuild unlocked levels array [1, 2, ..., maxLevel]
            gameState.user.unlockedLevels = [];
            for (let i = 1; i <= maxLevel; i++) {
                if (LEVEL_CONFIG.find(l => l.id === i)) {
                    gameState.user.unlockedLevels.push(i);
                }
            }
        }
    } catch (error) {
        console.warn("Could not load user data (Offline or new user):", error);
    }
}

function showLevelSelection() {
    document.getElementById('game-interface').classList.add('hidden');
    document.getElementById('level-selection-screen').classList.remove('hidden');
    renderLevelMap();
}

function renderLevelMap() {
    const container = document.querySelector('#level-selection-screen .level-grid');
    if (!container) return;
    container.innerHTML = '';

    LEVEL_CONFIG.forEach(level => {
        const isUnlocked = gameState.user.unlockedLevels.includes(level.id);
        const btn = document.createElement('button');
        btn.className = "level-btn";
        if (isUnlocked) btn.onclick = () => selectLevel(level.id);
        else btn.disabled = true;

        let content = `<h3>Level ${level.id}</h3><p><strong>${level.title}</strong></p><p>${level.description}</p>`;
        if (!isUnlocked) content += `<div class="locked-overlay">🔒</div>`;
        btn.innerHTML = content;
        container.appendChild(btn);
    });
}

function selectLevel(levelId) {
    gameState.currentLevelId = levelId;
    document.getElementById('level-selection-screen').classList.add('hidden');
    document.getElementById('game-interface').classList.remove('hidden');
    document.getElementById('hud-level-indicator').innerText = levelId;
    setMode('tutorial');
}

function updateHUD() {
    const user = gameState.user;
    const maxUnlocked = Math.max(...user.unlockedLevels);
    const nextLevelConfig = LEVEL_CONFIG.find(l => l.id === maxUnlocked + 1);
    const currentLevelConfig = LEVEL_CONFIG.find(l => l.id === maxUnlocked);

    let xpTarget = nextLevelConfig ? nextLevelConfig.targetXP : (currentLevelConfig.targetXP * 1.5);

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
    const nextLevel = LEVEL_CONFIG.find(l => l.id === maxUnlocked + 1);

    if (nextLevel && user.xp >= nextLevel.targetXP) {
        if (!user.unlockedLevels.includes(nextLevel.id)) {
            user.unlockedLevels.push(nextLevel.id);
            playSound('levelUp');
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
        level: Math.max(...gameState.user.unlockedLevels),
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
    const btnTut = document.getElementById('btn-tutorial');
    const btnPrac = document.getElementById('btn-practice');
    const title = document.getElementById('current-mode-title');

    if (mode === 'tutorial') {
        btnTut.className = "mode-btn active";
        btnPrac.className = "mode-btn";
        document.getElementById('tutorial-controls').classList.remove('hidden');
        document.getElementById('practice-controls').classList.add('hidden');
        title.innerText = "Mode: Tutorial";
        title.style.color = "var(--primary)";
        resetTutorial();
    } else {
        btnTut.className = "mode-btn";
        btnPrac.className = "mode-btn active";
        document.getElementById('tutorial-controls').classList.add('hidden');
        document.getElementById('practice-controls').classList.remove('hidden');
        title.innerText = "Mode: Latihan";
        title.style.color = "var(--secondary)";
        document.getElementById('instruction-text').innerText = "Hitung titik potongnya dan masukkan jawabanmu!";
        newPracticeProblem();
    }
}

function getCurrentLevelConfig() {
    return LEVEL_CONFIG.find(l => l.id === gameState.currentLevelId);
}

// --- GEOMETRY & MATH (UPDATED FOR GRID LAYOUT) ---

function calculateGeometry(n1, n2) {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    
    const d1 = String(n1).split('').map(Number); // Horizontal lines (Top: Tens, Bottom: Units)
    const d2 = String(n2).split('').map(Number); // Vertical lines (Left: Tens, Right: Units)

    let linesA = []; // Horizontal
    let linesB = []; // Vertical
    let intersections = [];

    // Calculate Centers
    // We want the whole grid to be centered.
    // Width of grid = (d2.length - 1) * GROUP_SPACING + (max_lines_in_group - 1) * LINE_SPACING ??
    // Actually, center is middle of the bounds.

    // Generate Lines A (Horizontal) relative to 0
    // Group 0 is Top, Group 1 is Bottom.
    // To center vertically:
    let totalHeight = (d1.length - 1) * GROUP_SPACING;
    d1.forEach((count, groupIdx) => {
        let groupY = (groupIdx * GROUP_SPACING) - (totalHeight / 2);
        // Center the lines within the group
        let groupHeight = (count - 1) * LINE_SPACING;
        let startY = groupY - (groupHeight / 2);

        for(let i=0; i<count; i++) {
            linesA.push({
                type: 'A',
                group: groupIdx, // 0=Tens(Top), 1=Units(Bottom)
                y: startY + (i * LINE_SPACING)
            });
        }
    });

    // Generate Lines B (Vertical) relative to 0
    // Group 0 is Left, Group 1 is Right.
    let totalWidth = (d2.length - 1) * GROUP_SPACING;
    d2.forEach((count, groupIdx) => {
        let groupX = (groupIdx * GROUP_SPACING) - (totalWidth / 2);
        // Center lines within group
        let groupWidth = (count - 1) * LINE_SPACING;
        let startX = groupX - (groupWidth / 2);

        for(let i=0; i<count; i++) {
            linesB.push({
                type: 'B',
                group: groupIdx, // 0=Tens(Left), 1=Units(Right)
                x: startX + (i * LINE_SPACING)
            });
        }
    });

    // Calculate Intersections
    linesA.forEach(lA => {
        linesB.forEach(lB => {
            // Zone Logic:
            // Tens (High Power) is Index 0. Units (Low Power) is Index 1.
            // Zone 2 (Hundreds) = Tens x Tens = 0 + 0 = 0
            // Zone 1 (Tens) = Tens x Units (0+1) or Units x Tens (1+0) = 1
            // Zone 0 (Units) = Units x Units = 1 + 1 = 2
            // Note: My zone ID mapping is reversed from Japanese logic (Right to Left).
            // Let's force:
            // Zone 0 (Units) -> lA.group=1, lB.group=1
            // Zone 1 (Tens) -> Mixed
            // Zone 2 (Hundreds) -> lA.group=0, lB.group=0

            let zoneId = -1;
            if (lA.group === 0 && lB.group === 0) zoneId = 2; // Hundreds (Top-Left)
            else if (lA.group === 1 && lB.group === 1) zoneId = 0; // Units (Bottom-Right)
            else zoneId = 1; // Tens (Top-Right / Bottom-Left)

            intersections.push({
                x: cx + lB.x, // Vertical line defines X
                y: cy + lA.y, // Horizontal line defines Y
                groupA: lA.group,
                groupB: lB.group,
                zone: zoneId
            });
        });
    });

    // Shift lines to absolute canvas coordinates for rendering
    linesA = linesA.map(l => ({ ...l, y: cy + l.y }));
    linesB = linesB.map(l => ({ ...l, x: cx + l.x }));

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

    // Calculate Center
    let sumX = 0, sumY = 0;
    intersections.forEach(p => { sumX += p.x; sumY += p.y; });
    let cx = sumX / intersections.length;
    let cy = sumY / intersections.length;

    if (isActive) {
        // Find bounds to draw a nice circle/ellipse
        // Simple approach: Circle with fixed radius or bounding box
        // Better: Convex hull? Overkill.
        // Let's use a large circle covering the center.
        // If "Tens" (Zone 1), it might be split. Check variance.

        let isSplit = false;
        // Check if points are clustered far apart
        if (intersections.length > 1) {
             let xs = intersections.map(p => p.x);
             let ys = intersections.map(p => p.y);
             let rangeX = Math.max(...xs) - Math.min(...xs);
             let rangeY = Math.max(...ys) - Math.min(...ys);
             if (rangeX > 200 || rangeY > 200) isSplit = true;
        }

        ctx.strokeStyle = overrideColor || COLORS.zoneBorder;
        ctx.lineWidth = 2;
        ctx.fillStyle = COLORS.zone;
        ctx.font = "bold 40px 'Poppins'";
        ctx.textAlign = 'center';

        if (isSplit) {
            // Draw two circles
            // Cluster 1: Top-Right (High X, Low Y) -> GroupA=0, GroupB=1
            // Cluster 2: Bottom-Left (Low X, High Y) -> GroupA=1, GroupB=0
            let cluster1 = intersections.filter(p => p.groupA === 0);
            let cluster2 = intersections.filter(p => p.groupA === 1);

            [cluster1, cluster2].forEach(c => {
                if(c.length === 0) return;
                let sx = c.reduce((a,b)=>a+b.x,0)/c.length;
                let sy = c.reduce((a,b)=>a+b.y,0)/c.length;
                ctx.beginPath();
                ctx.arc(sx, sy, 60, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            });

            // Draw label in the visual center (middle of empty space)
            ctx.fillStyle = '#1e293b';
            ctx.fillText(label, cx, cy);

        } else {
            ctx.beginPath();
            ctx.arc(cx, cy, 70, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1e293b';
            // Adjust label position based on zone
            // Zone 0 (Bottom Right) -> Label below
            // Zone 2 (Top Left) -> Label above
            let labelOffset = -80;
            if (cy > CANVAS_HEIGHT/2 + 50) labelOffset = 80; // Bottom area

            ctx.fillText(label, cx, cy + labelOffset);
        }
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
        else if (s === 4) { activeZone = 0; } // Units (Bottom Right)
        else if (s === 5) { activeZone = 1; } // Tens (Middle)
        else if (s === 6) { activeZone = 2; } // Hundreds (Top Left)
        else if (s === 7) { showFinal = true; }

        if (gameState.currentLevelId === 2) {
             if (s === 4) labelOverride = "12 (Simpan 1)";
             if (s === 5) labelOverride = "7 + 1 = 8";
             if (s === 6) labelOverride = "1";
        }
        if (gameState.currentLevelId === 1) {
             if (s === 4) labelOverride = "6";
             if (s === 5) labelOverride = "5";
             if (s === 6) labelOverride = "1";
        }
    }

    // Draw Horizontal Lines (A)
    if (showA) {
        linesA.forEach(l => {
            drawLine(0, l.y, CANVAS_WIDTH, l.y, COLORS.lineA);
        });
    }

    // Draw Vertical Lines (B)
    if (showB) {
        linesB.forEach(l => {
            drawLine(l.x, 0, l.x, CANVAS_HEIGHT, COLORS.lineB);
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
            ctx.fillText(`= ${n1 * n2}`, cx, cy + 250); // Move result lower
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
        feedback.className = "text-success";
        playSound('correct');
        addXP(25);

        document.getElementById('btn-check').classList.add('hidden');
        document.getElementById('btn-new-problem').classList.remove('hidden');
    } else {
        feedback.innerText = "Salah, coba lagi!";
        feedback.className = "text-danger";
        playSound('wrong');
    }
}

function playSound(name) {
    if (SOUNDS[name]) {
        SOUNDS[name].currentTime = 0;
        SOUNDS[name].play().catch(() => {});
    }
}
