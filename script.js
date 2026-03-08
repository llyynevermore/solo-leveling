/**
 * ============================================
 *  HABIT TRACKER — SOLO LEVELING SYSTEM THEME
 *  JavaScript Logic
 * ============================================
 */

// ---- CONSTANTS ----
const EXP_PER_HABIT = 20; // exp earned per completed habit
const EXP_TO_LEVEL = 100; // exp needed per level

// ---- STATE ----
let habits = []; // { id, text, completed }
let playerLevel = 1;
let currentExp = 0;

// ---- STORAGE KEYS ----
const STORAGE_KEYS = {
  habits: "slHabits",
  level: "slLevel",
  exp: "slExp",
};

// ---- DOM REFERENCES ----
const questList = document.getElementById("quest-list");
const newQuestInput = document.getElementById("new-quest-input");
const addQuestBtn = document.getElementById("add-quest-btn");
const expFill = document.getElementById("exp-fill");
const expText = document.getElementById("exp-text");
const playerLevelEl = document.getElementById("player-level");
const questStatusEl = document.getElementById("quest-status");
const notification = document.getElementById("system-notification");

// ---- INIT ----
function init() {
  loadFromStorage();
  renderAll();
}

// ---- STORAGE ----
function saveToStorage() {
  localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(habits));
  localStorage.setItem(STORAGE_KEYS.level, playerLevel);
  localStorage.setItem(STORAGE_KEYS.exp, currentExp);
}

function loadFromStorage() {
  const savedHabits = localStorage.getItem(STORAGE_KEYS.habits);
  const savedLevel = localStorage.getItem(STORAGE_KEYS.level);
  const savedExp = localStorage.getItem(STORAGE_KEYS.exp);

  if (savedHabits) habits = JSON.parse(savedHabits);
  if (savedLevel) playerLevel = parseInt(savedLevel, 10);
  if (savedExp) currentExp = parseInt(savedExp, 10);
}

// ---- RENDER ----
function renderAll() {
  renderHabits();
  updateStatusBar();
  updateQuestStatus();
}

function renderHabits() {
  questList.innerHTML = "";

  if (habits.length === 0) {
    questList.innerHTML = `
            <p style="color: var(--text-secondary); font-size: 0.85rem; letter-spacing: 0.1em; text-align: center; padding: 16px 0;">
                — No active quests. Add your first training quest! —
            </p>`;
    return;
  }

  habits.forEach((habit) => {
    const item = createQuestElement(habit);
    questList.appendChild(item);
  });
}

function createQuestElement(habit) {
  const item = document.createElement("div");
  item.classList.add("quest-item");
  if (habit.completed) item.classList.add("completed");
  item.dataset.id = habit.id;

  item.innerHTML = `
        <div class="quest-checkbox"></div>
        <div class="quest-info">
            <div class="quest-label">DAILY QUEST</div>
            <div class="quest-text">${escapeHTML(habit.text)}</div>
        </div>
        <div class="quest-exp">+${EXP_PER_HABIT} EXP</div>
        <button class="quest-delete" title="Remove quest">✕</button>
    `;

  // Toggle complete on click (excluding delete button)
  item.addEventListener("click", (e) => {
    if (e.target.classList.contains("quest-delete")) return;
    toggleHabit(habit.id);
  });

  // Delete
  item.querySelector(".quest-delete").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteHabit(habit.id);
  });

  return item;
}

// ---- HABIT ACTIONS ----
function addHabit(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const newHabit = {
    id: Date.now(),
    text: trimmed,
    completed: false,
  };

  habits.push(newHabit);
  saveToStorage();
  renderAll();
  newQuestInput.value = "";
  newQuestInput.focus();
}

function toggleHabit(id) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;

  habit.completed = !habit.completed;

  if (habit.completed) {
    gainExp(EXP_PER_HABIT);
  } else {
    loseExp(EXP_PER_HABIT);
  }

  saveToStorage();
  renderAll();
}

function deleteHabit(id) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;

  // If it was completed, refund exp
  if (habit.completed) {
    loseExp(EXP_PER_HABIT);
  }

  habits = habits.filter((h) => h.id !== id);
  saveToStorage();
  renderAll();
}

// ---- EXP & LEVEL ----
function gainExp(amount) {
  currentExp += amount;

  // Level up loop
  while (currentExp >= EXP_TO_LEVEL) {
    currentExp -= EXP_TO_LEVEL;
    playerLevel++;
    showNotification(`[SYSTEM] Level Up! You are now Level ${playerLevel}!`);
  }
}

function loseExp(amount) {
  currentExp -= amount;

  // Level down loop (can't go below 0 on level 1)
  while (currentExp < 0 && playerLevel > 1) {
    playerLevel--;
    currentExp += EXP_TO_LEVEL;
    showNotification(`[SYSTEM] Level decreased. Now Level ${playerLevel}.`);
  }

  if (currentExp < 0) currentExp = 0;
}

function updateStatusBar() {
  const pct = Math.min((currentExp / EXP_TO_LEVEL) * 100, 100);
  expFill.style.width = pct + "%";
  expText.textContent = `${currentExp}/${EXP_TO_LEVEL}`;
  playerLevelEl.textContent = playerLevel;
}

// ---- QUEST STATUS ----
function updateQuestStatus() {
  if (habits.length === 0) {
    questStatusEl.textContent = "No Quests";
    questStatusEl.style.color = "var(--text-secondary)";
    return;
  }

  const total = habits.length;
  const completed = habits.filter((h) => h.completed).length;

  questStatusEl.textContent = `${completed}/${total} Completed`;

  if (completed === total) {
    questStatusEl.textContent = "ALL QUESTS COMPLETE ✓";
    questStatusEl.style.color = "var(--completed-color)";
    if (completed > 0) showNotification("[SYSTEM] All Daily Quests Complete! Outstanding performance!");
  } else {
    questStatusEl.style.color = "var(--accent-cyan)";
  }
}

// ---- NOTIFICATION ----
let notifTimeout = null;

function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("show");

  if (notifTimeout) clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// ---- UTILITY ----
function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---- EVENT LISTENERS ----
addQuestBtn.addEventListener("click", () => {
  addHabit(newQuestInput.value);
});

newQuestInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addHabit(newQuestInput.value);
});

// ---- START ----
init();


