// Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LINE_SPACING = 30;
const GROUP_SPACING = 150;
const LINE_COLOR_A = '#6c5ce7'; // Purple (Num1)
const LINE_COLOR_B = '#fd79a8'; // Pink (Num2)
const INTERSECTION_COLOR = '#2d3436';
const INTERSECTION_RADIUS = 6;
const TEXT_COLOR = '#2d3436';
const HIGHLIGHT_COLOR = '#00cec9';

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tutorialBtn = document.getElementById('btn-tutorial');
const practiceBtn = document.getElementById('btn-practice');
const modeTitle = document.getElementById('current-mode');
const instruction = document.getElementById('instruction');
const tutorialControls = document.getElementById('tutorial-controls');
const practiceControls = document.getElementById('practice-controls');
const nextStepBtn = document.getElementById('btn-next-step');
const restartTutorialBtn = document.getElementById('btn-restart-tutorial');
const checkBtn = document.getElementById('btn-check');
const newProblemBtn = document.getElementById('btn-new-problem');
const answerInput = document.getElementById('answer-input');
const feedbackMsg = document.getElementById('feedback-msg');

// State
let linesA = []; 
let linesB = [];
let intersections = [];
let currentMode = 'tutorial';
let tutorialStep = 0;
let currentProblem = { n1: 12, n2: 13 };

// --- Utility Functions ---

function clearCanvas() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawLine(x1, y1, x2, y2, color, width = 3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}

function drawDot(x, y, color = INTERSECTION_COLOR, radius = INTERSECTION_RADIUS) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawText(text, x, y, size = "24px", color = TEXT_COLOR) {
    ctx.font = `bold ${size} 'Segoe UI'`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
}

function drawZoneCircle(x, y, radius = 40, color = 'rgba(0, 206, 201, 0.2)') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color.replace('0.2', '1');
    ctx.lineWidth = 2;
    ctx.stroke();
}

// --- Core Logic ---

function calculateGeometry(n1, n2) {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    
    const d1 = String(n1).split('').map(Number);
    const d2 = String(n2).split('').map(Number);

    linesA = [];
    linesB = [];
    intersections = [];

    // Lines A (Slope -1, y = -x + C)
    d1.forEach((count, groupIdx) => {
        let groupBaseC = (d1.length === 2 && groupIdx === 0) ? -GROUP_SPACING/2 : GROUP_SPACING/2;
        if (d1.length === 1) groupBaseC = 0;
        
        let startC = groupBaseC - ((count - 1) * LINE_SPACING) / 2;
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
        let groupBaseC = (d2.length === 2 && groupIdx === 0) ? GROUP_SPACING/2 : -GROUP_SPACING/2;
        if (d2.length === 1) groupBaseC = 0;

        let startC = groupBaseC - ((count - 1) * LINE_SPACING) / 2;
        for (let i = 0; i < count; i++) {
            linesB.push({
                type: 'B',
                group: groupIdx,
                C: startC + (i * LINE_SPACING)
            });
        }
    });

    // Intersections
    linesA.forEach(lA => {
        linesB.forEach(lB => {
            let x = (lA.C - lB.C) / 2;
            let y = (lA.C + lB.C) / 2;
            intersections.push({
                x: cx + x,
                y: cy + y,
                groupA: lA.group,
                groupB: lB.group,
                zone: lA.group + lB.group // 0=Hundreds, 1=Tens, 2=Units
            });
        });
    });
}

// --- Rendering ---

function render() {
    clearCanvas();
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const len = 600;

    // Draw Problem Text
    if (currentMode === 'tutorial') {
        drawText(`${currentProblem.n1} × ${currentProblem.n2} = ?`, cx, 50, "30px");
    } else {
        drawText(`${currentProblem.n1} × ${currentProblem.n2}`, cx, 50, "30px");
    }

    // Determine what to draw based on step (if tutorial)
    let drawA = true;
    let drawB = true;
    let drawInter = true;
    let highlightZone = -1; // -1 none, 0 left, 1 middle, 2 right

    if (currentMode === 'tutorial') {
        if (tutorialStep === 0) { drawA = false; drawB = false; drawInter = false; }
        else if (tutorialStep === 1) { drawA = true; drawB = false; drawInter = false; } 
        else if (tutorialStep === 2) { drawA = true; drawB = true; drawInter = false; } 
        else if (tutorialStep === 3) { drawInter = true; } 
        else if (tutorialStep === 4) { highlightZone = 2; } // Units (Right)
        else if (tutorialStep === 5) { highlightZone = 1; } // Tens (Middle)
        else if (tutorialStep === 6) { highlightZone = 0; } // Hundreds (Left)
        else if (tutorialStep === 7) { highlightZone = 3; } // Result
    }

    // Draw Lines A
    if (drawA) {
        linesA.forEach(l => {
            let x1 = -len; let y1 = -x1 + l.C;
            let x2 = len; let y2 = -x2 + l.C;
            drawLine(cx + x1, cy + y1, cx + x2, cy + y2, LINE_COLOR_A);
        });
    }

    // Draw Lines B
    if (drawB) {
        linesB.forEach(l => {
            let x1 = -len; let y1 = x1 + l.C;
            let x2 = len; let y2 = x2 + l.C;
            drawLine(cx + x1, cy + y1, cx + x2, cy + y2, LINE_COLOR_B);
        });
    }

    // Draw Intersections & Zones
    if (drawInter) {
        intersections.forEach(p => {
             drawDot(p.x, p.y, INTERSECTION_COLOR, 4);
        });

        if (highlightZone >= 0 && highlightZone <= 2) {
            let targetZone = highlightZone;
            
            const zonePts = intersections.filter(p => p.zone === targetZone);
            if (zonePts.length > 0) {
                 let avgX = zonePts.reduce((sum, p) => sum + p.x, 0) / zonePts.length;
                 let avgY = zonePts.reduce((sum, p) => sum + p.y, 0) / zonePts.length;
                 
                 drawZoneCircle(avgX, avgY, 60);
                 zonePts.forEach(p => drawDot(p.x, p.y, HIGHLIGHT_COLOR, 8));
                 drawText(zonePts.length.toString(), avgX, avgY - 80, "40px", HIGHLIGHT_COLOR);
            }
        }
        
        if (tutorialStep === 7 && currentMode === 'tutorial') {
             drawText("Jawaban: " + (currentProblem.n1 * currentProblem.n2), cx, cy + 250, "40px", "#00b894");
        }
    }
}

function updateTutorialText() {
    const steps = [
        "Kita akan menghitung 12 x 13.",
        "Pertama, gambar garis untuk angka 12 (Ungu). 1 garis untuk puluhan, 2 garis untuk satuan.",
        "Kedua, gambar garis untuk angka 13 (Pink). 1 garis untuk puluhan, 3 garis untuk satuan.",
        "Lihat titik-titik potongnya.",
        "Hitung titik di bagian Kanan (Satuan): Ada 6 titik.",
        "Hitung titik di bagian Tengah (Puluhan): Ada 2 + 3 = 5 titik.",
        "Hitung titik di bagian Kiri (Ratusan): Ada 1 titik.",
        "Gabungkan angkanya: 1, 5, 6. Hasilnya 156!"
    ];
    
    if (tutorialStep < steps.length) {
        instruction.innerText = steps[tutorialStep];
    }
}

// --- Event Handlers ---

tutorialBtn.addEventListener('click', () => {
    setMode('tutorial');
});

practiceBtn.addEventListener('click', () => {
    setMode('practice');
});

function setMode(mode) {
    currentMode = mode;
    tutorialBtn.classList.toggle('active', mode === 'tutorial');
    practiceBtn.classList.toggle('active', mode === 'practice');
    
    if (mode === 'tutorial') {
        modeTitle.innerText = "Mode: Tutorial";
        tutorialControls.classList.remove('hidden');
        practiceControls.classList.add('hidden');
        resetTutorial();
    } else {
        modeTitle.innerText = "Mode: Latihan";
        tutorialControls.classList.add('hidden');
        practiceControls.classList.remove('hidden');
        instruction.innerText = "Hitung titik potongnya dan masukkan jawaban!";
        newProblem();
    }
}

nextStepBtn.addEventListener('click', () => {
    if (tutorialStep < 7) {
        tutorialStep++;
        updateTutorialText();
        render();
    } else {
        instruction.innerText = "Tutorial Selesai! Coba mode Latihan.";
    }
});

restartTutorialBtn.addEventListener('click', resetTutorial);

checkBtn.addEventListener('click', () => {
    const val = parseInt(answerInput.value);
    if (isNaN(val)) return;
    
    const correct = currentProblem.n1 * currentProblem.n2;
    if (val === correct) {
        feedbackMsg.innerText = "Benar! 🎉";
        feedbackMsg.style.color = "#00b894";
    } else {
        feedbackMsg.innerText = "Coba lagi ya!";
        feedbackMsg.style.color = "#d63031";
    }
});

newProblemBtn.addEventListener('click', newProblem);

function resetTutorial() {
    currentProblem = { n1: 12, n2: 13 };
    tutorialStep = 0;
    calculateGeometry(12, 13);
    updateTutorialText();
    render();
}

function newProblem() {
    const n1 = Math.floor(Math.random() * 4) + 11; 
    const n2 = Math.floor(Math.random() * 4) + 11;
    currentProblem = { n1, n2 };
    
    calculateGeometry(n1, n2);
    
    answerInput.value = '';
    feedbackMsg.innerText = '';
    render();
}

// Initial Setup
resetTutorial();