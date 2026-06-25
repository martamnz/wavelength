// Game State
// ZONE CONFIGURATION (Edit points or degrees here)
const SCORING_ZONES = {
    bullseye: { deg: 3, points: 5, message: "PERFECT!" },
    inner: { deg: 9, points: 3, message: "Close!" },
    middle: { deg: 15, points: 2, message: "Not Bad" },
    outer: { deg: 21, points: 1, message: "Edge Hit" }
};

const state = {
    round: 0,
    targetAngle: 0,
    guessAngle: 0,
    isDragging: false,
    leftTopic: "",
    rightTopic: "",

    // Multi-Team State
    teams: [
        { name: "Team 1", score: 0 },
        { name: "Team 2", score: 0 }
    ],
    currentTurn: 0 // 0 or 1
};

const dom = {
    startBtn: document.getElementById('start-btn'),
    readyBtn: document.getElementById('ready-btn'),
    lockInBtn: document.getElementById('lock-in-btn'),
    nextRoundBtn: document.getElementById('next-round-btn'),

    // Team Inputs
    team1Input: document.getElementById('team1-input'),
    team2Input: document.getElementById('team2-input'),

    // Scoreboard
    scoreboard: document.getElementById('scoreboard'),
    team1Name: document.getElementById('team1-name'),
    team1Score: document.getElementById('team1-score'),
    team1Display: document.getElementById('team1-score-display'),

    team2Name: document.getElementById('team2-name'),
    team2Score: document.getElementById('team2-score'),
    team2Display: document.getElementById('team2-score-display'),

    // Topic Inputs (Psychic Phase)
    topicLeftInput: document.getElementById('topic-left-input'),
    topicRightInput: document.getElementById('topic-right-input'),

    // Topic Displays
    topicLeftG: document.getElementById('topic-left-g'),
    topicRightG: document.getElementById('topic-right-g'),
    topicLeftR: document.getElementById('topic-left-r'),
    topicRightR: document.getElementById('topic-right-r'),

    dialInteraction: document.getElementById('dial-interaction-zone'),
    dialPointer: document.getElementById('dial-pointer'),
    dialPointerResult: document.getElementById('dial-pointer-result'),
    targetWedges: [
        document.getElementById('target-wedge'),
        document.getElementById('target-wedge-hidden'),
        document.getElementById('target-wedge-result')
    ],
    screenCover: document.getElementById('screen-cover'),
    screenCoverResult: document.getElementById('screen-cover-result'),
    scoreValue: document.getElementById('score-value'),
    scoreMessage: document.getElementById('score-message')
};

const screens = {
    start: document.getElementById('start-screen'),
    psychic: document.getElementById('psychic-phase'),
    guessing: document.getElementById('guessing-phase'),
    result: document.getElementById('result-phase')
};

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function updateScoreboard() {
    // Update Names
    dom.team1Name.textContent = state.teams[0].name;
    dom.team2Name.textContent = state.teams[1].name;

    // Update Scores
    dom.team1Score.textContent = state.teams[0].score;
    dom.team2Score.textContent = state.teams[1].score;

    // Highlight Active Team
    dom.team1Display.classList.toggle('active', state.currentTurn === 0);
    dom.team2Display.classList.toggle('active', state.currentTurn === 1);
}

function initGame() {
    // Capture Team Names
    state.teams[0].name = dom.team1Input.value || "Team 1";
    state.teams[1].name = dom.team2Input.value || "Team 2";
    state.teams[0].score = 0;
    state.teams[1].score = 0;
    state.currentTurn = 0;

    dom.scoreboard.classList.remove('hidden');
    updateScoreboard();

    startRound();
}

function startRound() {
    state.guessAngle = 0;
    state.targetAngle = Math.random() * 160 - 80;

    // Inputs persist, no random set

    dom.dialPointer.style.transform = `rotate(0deg)`;
    dom.screenCover.classList.remove('open');
    dom.screenCover.classList.add('closed');
    dom.screenCoverResult.classList.remove('open');

    dom.targetWedges.forEach(el => el.style.transform = `rotate(${state.targetAngle}deg)`);

    updateScoreboard(); // Ensure correct turn is highlighted
    switchScreen('psychic');
}

// Event Listeners
if (dom.startBtn) dom.startBtn.addEventListener('click', initGame);

dom.readyBtn.addEventListener('click', () => {
    state.leftTopic = dom.topicLeftInput.value || "Left";
    state.rightTopic = dom.topicRightInput.value || "Right";

    dom.topicLeftG.textContent = state.leftTopic;
    dom.topicRightG.textContent = state.rightTopic;
    dom.topicLeftR.textContent = state.leftTopic;
    dom.topicRightR.textContent = state.rightTopic;

    switchScreen('guessing');
});

dom.lockInBtn.addEventListener('click', revealResult);

dom.nextRoundBtn.addEventListener('click', () => {
    // Switch Turn
    state.currentTurn = (state.currentTurn + 1) % 2;
    startRound();
});

// Dial Physics
function updateDial(x, y) {
    const rect = dom.dialInteraction.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const bottomY = rect.top + rect.height;

    let angleDeg = Math.atan2(y - bottomY, x - centerX) * (180 / Math.PI) + 90;
    if (angleDeg > 90) angleDeg = 90;
    if (angleDeg < -90) angleDeg = -90;

    state.guessAngle = angleDeg;
    dom.dialPointer.style.transform = `rotate(${state.guessAngle}deg)`;
}

dom.dialInteraction.addEventListener('mousedown', (e) => { state.isDragging = true; updateDial(e.clientX, e.clientY); });
window.addEventListener('mousemove', (e) => { if (state.isDragging) updateDial(e.clientX, e.clientY); });
window.addEventListener('mouseup', () => { state.isDragging = false; });

dom.dialInteraction.addEventListener('touchstart', (e) => {
    state.isDragging = true;
    updateDial(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
}, { passive: false });
window.addEventListener('touchmove', (e) => {
    if (state.isDragging) updateDial(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
window.addEventListener('touchend', () => { state.isDragging = false; });

// Scoring Logic (7 Zones)
function revealResult() {
    const diff = Math.abs(state.targetAngle - state.guessAngle);
    let points = 0, message = "Miss!";

    if (diff <= SCORING_ZONES.bullseye.deg) {
        points = SCORING_ZONES.bullseye.points;
        message = SCORING_ZONES.bullseye.message;
    } else if (diff <= SCORING_ZONES.inner.deg) {
        points = SCORING_ZONES.inner.points;
        message = SCORING_ZONES.inner.message;
    } else if (diff <= SCORING_ZONES.middle.deg) {
        points = SCORING_ZONES.middle.points;
        message = SCORING_ZONES.middle.message;
    } else if (diff <= SCORING_ZONES.outer.deg) {
        points = SCORING_ZONES.outer.points;
        message = SCORING_ZONES.outer.message;
    }

    // Add points to current team
    state.teams[state.currentTurn].score += points;
    updateScoreboard();

    dom.dialPointerResult.style.transform = `rotate(${state.guessAngle}deg)`;
    dom.scoreValue.textContent = points;
    dom.scoreMessage.textContent = `${message} (${state.teams[state.currentTurn].name} scores)`;

    switchScreen('result');
    setTimeout(() => { dom.screenCoverResult.classList.add('open'); }, 100);
}
