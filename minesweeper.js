let ROWS = 9;
let COLS = 9;
let MINE_COUNT = 10;

let grid = [];
let firstClick = true;
let gameOver = false;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const mineCountEl = document.getElementById("mine-count");
const resetBtn = document.getElementById("reset");

function initGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            row.push({
                isMine: false,
                revealed: false,
                flagged: false,
                adjacent: 0
            });
        }
        grid.push(row);
    }
}

function renderBoard() {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, 28px)`;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cellEl = document.createElement("div");
            cellEl.className = "cell";
            cellEl.dataset.row = r;
            cellEl.dataset.col = c;

            cellEl.addEventListener("click", () => handleLeftClick(r, c));
            cellEl.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                handleRightClick(r, c);
            });
            
            let touchTimer = null;
            let longPressed = false;

            cellEl.addEventListener("touchstart", (e) => {
                e.preventDefault();
                longPressed = false;
                touchTimer = setTimeout(() => {
                    longPressed = true;
                    handleRightClick(r, c);
                }, 500);
            });

            cellEl.addEventListener("touchend", (e) => {
                e.preventDefault();
                clearTimeout(touchTimer);
                if (longPressed) {
                    handleLeftClick(r, c);
                }
            });

            boardEl.appendChild(cellEl);
        }
    }
}
function placeMines(excludeRow, excludeCol) {
    let placed = 0;
    while (placed < MINE_COUNT) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);

        if (r === excludeRow && c === excludeCol) continue;
        if (grid[r][c].isMine) continue;

        grid[r][c].isMine = true;
        placed++;
    }
}

function calculateAdjacents() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c].isMine) continue;

            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                    if (grid[nr][nc].isMine) count++;
                }
            }
            grid[r][c].adjacent = count;
        }
    }
}

function handleLeftClick(row, col) {
    if (gameOver) return;

    if (firstClick) {
        placeMines(row, col);
        calculateAdjacents();
        firstClick = false;
    }

    const cell = grid[row][col];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;

    if (cell.isMine) {
        revealAllMines();
        updateCellDisplay(row, col);
        endGame(false);
        return;
    }

    updateCellDisplay(row, col);

    if (cell.adjacent === 0) {
        revealAdjacentCells(row, col);
    }

    checkWinCondition();
}

function revealAdjacentCells(row, col) {
    const queue = [[row, col]];

    while (queue.length > 0) {
        const [r, c] = queue.shift();

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;

                const neighbor = grid[nr][nc];
                if (neighbor.revealed || neighbor.flagged || neighbor.isMine) continue;

                neighbor.revealed = true;
                updateCellDisplay(nr, nc);

                if (neighbor.adjacent === 0) {
                    queue.push([nr, nc]);
                }
            }
        }
    }
}
function handleRightClick(row, col) {
    if (gameOver) return;

    const cell = grid[row][col];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;
    updateCellDisplay(row, col);

    const flaggedCount = grid.flat().filter(c => c.flagged).length;
    mineCountEl.textContent = MINE_COUNT - flaggedCount;
}

function updateCellDisplay(row, col) {
    const cell = grid[row][col];
    const el = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!el) return;

    el.className = "cell";
    el.textContent = "";

    if (cell.flagged) {
        el.classList.add("flagged");
        el.textContent = "🚩"
        return;
    }

    if (!cell.revealed) return;

    el.classList.add("revealed");

    if (cell.isMine) {
        el.classList.add("mine");
        el.textContent = "💣";
    } else if (cell.adjacent > 0) {
        el.classList.add(`n${cell.adjacent}`);
        el.textContent = cell.adjacent;
    }
}

function revealAllMines() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c].isMine) {
                grid[r][c].revealed = true;
                updateCellDisplay(r, c);
            }
        }
    }
}

function checkWinCondition() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = grid[r][c];
            if (!cell.isMine && !cell.revealed) return;
        }
    }
    endGame(true);
}

function endGame(won) {
    gameOver = true;
    statusEl.textContent = won ? "🎉 You win! " : "💥 You lose : (";
}

function resetGame() {
    firstClick = true;
    gameOver = false;
    statusEl.textContent = "ready to start";
    mineCountEl.textContent = MINE_COUNT;
    initGrid();
    renderBoard();
}

document.querySelectorAll("#difficulty button").forEach(btn => {
  btn.addEventListener("click", () => {
    ROWS = parseInt(btn.dataset.rows);
    COLS = parseInt(btn.dataset.cols);
    MINE_COUNT = parseInt(btn.dataset.mines);
    resetGame();
  });
});

resetBtn.addEventListener("click", resetGame);
resetGame();
