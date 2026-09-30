// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = "sudokuLeaderboard";

let puzzle = [];
let selectedCell = null;
let hintsUsed = 0;
let entrySavedForGame = false;
let elapsedSeconds = 0;
let timerInterval = null;

function updateTimer() {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timer = document.getElementById("timer");

  if (timer) {
    timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}

function startTimer() {
  clearInterval(timerInterval);
  elapsedSeconds = 0;
  updateTimer();
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function getLeaderboardEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function timeToSeconds(time) {
  const parts = String(time).split(":").map(Number);
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
    return Number.MAX_SAFE_INTEGER;
  }
  return parts[0] * 60 + parts[1];
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboard");
  if (!container) return;

  const entries = getLeaderboardEntries()
    .sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time))
    .slice(0, 10);

  const table = document.createElement("table");
  table.className = "leaderboard-table";
  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  ["Rank", "Name", "Time", "Difficulty", "Hints"].forEach((label) => {
    const header = document.createElement("th");
    header.textContent = label;
    headerRow.appendChild(header);
  });

  const tbody = table.createTBody();
  entries.forEach((entry, index) => {
    const row = tbody.insertRow();
    [
      index + 1,
      entry.name,
      entry.time,
      entry.difficulty,
      entry.hintsUsed,
    ].forEach((value) => {
      row.insertCell().textContent = String(value);
    });
  });

  container.replaceChildren(table);
}

function saveSolvedGameToLeaderboard() {
  if (entrySavedForGame) return;

  const name = window.prompt("You solved the Sudoku! Enter your name:");
  if (!name || !name.trim()) return;

  const entry = {
    name: name.trim(),
    time: document.getElementById("timer")?.textContent || "00:00",
    difficulty: document.getElementById("difficulty")?.value || "Medium",
    hintsUsed,
  };

  try {
    const entries = getLeaderboardEntries();
    entries.push(entry);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
    entrySavedForGame = true;
    renderLeaderboard();
  } catch (error) {
    console.error("Could not save the leaderboard entry:", error);
  }
}

// Real-time standard Sudoku rule validation
function validateBoardRealTime() {
  const inputs = [...document.querySelectorAll("#sudoku-board input")];

  // Clear previous conflicts
  inputs.forEach((input) => input.classList.remove("conflict-error"));

  // Build a 2D array of the DOM elements
  const board = [];
  for (let r = 0; r < SIZE; r++) {
    board.push(inputs.slice(r * SIZE, (r + 1) * SIZE));
  }

  const conflicts = new Set();

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c].value;
      if (!val) continue;

      // Check row for duplicates
      for (let i = 0; i < SIZE; i++) {
        if (i !== c && board[r][i].value === val) {
          conflicts.add(board[r][c]);
          conflicts.add(board[r][i]);
        }
      }
      // Check column for duplicates
      for (let i = 0; i < SIZE; i++) {
        if (i !== r && board[i][c].value === val) {
          conflicts.add(board[r][c]);
          conflicts.add(board[i][c]);
        }
      }
      // Check 3x3 box for duplicates
      const boxR = Math.floor(r / 3) * 3;
      const boxC = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const currR = boxR + i;
          const currC = boxC + j;
          if (
            (currR !== r || currC !== c) &&
            board[currR][currC].value === val
          ) {
            conflicts.add(board[r][c]);
            conflicts.add(board[currR][currC]);
          }
        }
      }
    }
  }

  // Apply the conflict class to all violators
  conflicts.forEach((input) => input.classList.add("conflict-error"));
}

function createBoardElement() {
  selectedCell = null;
  const boardDiv = document.getElementById("sudoku-board");
  boardDiv.innerHTML = ""; // Clear existing grid

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.className = "sudoku-cell";
      input.dataset.row = row;
      input.dataset.col = col;

      // Assign alternating shading using JS as requested by the reviewer
      const boxRow = Math.floor(row / 3);
      const boxCol = Math.floor(col / 3);
      const isShaded = (boxRow + boxCol) % 2 === 0;
      input.classList.add(isShaded ? "box-shade" : "box-plain");

      // Validate inputs and check rules in real-time
      input.addEventListener("input", (event) => {
        event.target.value = event.target.value.replace(/[^1-9]/g, "");
        validateBoardRealTime();
      });

      // Append directly to the 9x9 CSS Grid container
      boardDiv.appendChild(input);
    }
  }
}

function renderPuzzle(newPuzzle) {
  puzzle = newPuzzle;
  createBoardElement();

  const inputs = document.querySelectorAll("#sudoku-board input");

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const input = inputs[row * SIZE + col];
      const value = puzzle[row][col];

      if (value !== 0) {
        input.value = value;
        input.disabled = true;
        input.classList.add("prefilled");
      }
    }
  }
}

async function newGame() {
  const message = document.getElementById("message");
  if (message) message.textContent = "";

  const diffSelect = document.getElementById("difficulty");
  const diff = diffSelect ? diffSelect.value : "medium";

  hintsUsed = 0;
  entrySavedForGame = false;
  startTimer();

  try {
    const response = await fetch(`/new?difficulty=${diff}`);
    const data = await response.json();

    if (!response.ok || !data.puzzle) {
      throw new Error(data.error || "Could not start a new game.");
    }

    renderPuzzle(data.puzzle);
  } catch (error) {
    stopTimer();
    if (message)
      message.textContent = error.message || "Could not start a new game.";
  }
}

async function getHint() {
  const message = document.getElementById("message");

  if (!selectedCell || selectedCell.disabled || selectedCell.value.trim()) {
    if (message) message.textContent = "Select an empty cell first.";
    return;
  }

  try {
    const response = await fetch("/api/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        row: Number(selectedCell.dataset.row),
        col: Number(selectedCell.dataset.col),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (message) message.textContent = data.error || "Could not get a hint.";
      return;
    }

    selectedCell.value = String(data.value);
    selectedCell.disabled = true;
    selectedCell.classList.add("hinted");

    // Clear any conflicts since we just populated a correct cell
    selectedCell.classList.remove("incorrect", "conflict-error");
    validateBoardRealTime();

    hintsUsed += 1;
    if (message) message.textContent = "Hint applied; the cell is locked.";
    selectedCell = null;
  } catch {
    if (message) message.textContent = "Could not reach the server.";
  }
}

async function checkSolution() {
  const inputs = [...document.querySelectorAll("#sudoku-board input")];
  const message = document.getElementById("message");

  if (inputs.length !== SIZE * SIZE) {
    if (message) message.textContent = "Start a new game first.";
    return;
  }

  const board = [];
  for (let row = 0; row < SIZE; row++) {
    board.push(
      inputs
        .slice(row * SIZE, (row + 1) * SIZE)
        .map((input) => parseInt(input.value.trim(), 10) || 0),
    );
  }

  try {
    const response = await fetch("/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board }),
    });
    const incorrect = await response.json();

    if (!response.ok || !Array.isArray(incorrect)) {
      if (message) {
        message.style.color = "#d32f2f";
        message.textContent =
          incorrect.error || "Could not check the solution.";
      }
      return;
    }

    // Clear previous error states
    inputs.forEach((input) => {
      input.classList.remove("incorrect");
    });

    // Re-run real-time validation to ensure row/col conflicts stay highlighted
    validateBoardRealTime();

    // Highlight all empty/wrong cells based on backend true solution
    incorrect.forEach(({ row, col }) => {
      const input = inputs[row * SIZE + col];
      if (input) input.classList.add("incorrect");
    });

    if (incorrect.length === 0) {
      if (message) {
        message.style.color = "#388e3c";
        message.textContent = "Congratulations! You solved it!";
      }
      stopTimer();
      saveSolvedGameToLeaderboard();
    } else {
      if (message) {
        message.style.color = "#d32f2f";
        message.textContent = "Some cells are incorrect or missing.";
      }
    }
  } catch {
    if (message) {
      message.style.color = "#d32f2f";
      message.textContent = "Could not reach the server.";
    }
  }
}

window.addEventListener("load", () => {
  const board = document.getElementById("sudoku-board");
  const themeToggle = document.getElementById("theme-toggle");
  const darkModeEnabled = localStorage.getItem("sudoku-theme") === "dark";

  document.body.classList.toggle("dark-mode", darkModeEnabled);
  if (themeToggle) {
    themeToggle.checked = darkModeEnabled;
    themeToggle.addEventListener("change", () => {
      const enabled = themeToggle.checked;
      document.body.classList.toggle("dark-mode", enabled);
      localStorage.setItem("sudoku-theme", enabled ? "dark" : "light");
    });
  }

  if (board) {
    board.addEventListener("focusin", (event) => {
      if (event.target.matches("input[data-row][data-col]")) {
        selectedCell = event.target;
      }
    });
  }

  const hintBtn = document.getElementById("hint-btn");
  if (hintBtn) hintBtn.addEventListener("click", getHint);

  const newGameBtn = document.getElementById("new-game");
  if (newGameBtn) newGameBtn.addEventListener("click", newGame);

  // Bind Check function to relevant buttons
  const checkBtn = document.getElementById("check-btn");
  if (checkBtn) checkBtn.addEventListener("click", checkSolution);

  const checkSolBtn = document.getElementById("check-solution");
  if (checkSolBtn) checkSolBtn.addEventListener("click", checkSolution);

  renderLeaderboard();
  newGame(); // Auto-start game on load
});
