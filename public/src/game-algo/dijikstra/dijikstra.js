// main.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');

const GRID_SIZE = 10;
const CELL_SIZE = 50; // 500px / 10 = 50px per sel
const GAME_OFFSET_X = 500; // Grid permainan mulai dari x = 500
let grid = [];
let start = { x: 0, y: 0 };
let end = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
let optimalPath = [];
let userPath = [start];
let gameStarted = false;
let gameOver = false;

// Muat gambar untuk grid kiri
const explanationImage = new Image();
explanationImage.src = '/src/assets/People flying-bro.png'; // Pastikan path gambar benar

// Inisialisasi grid permainan
function initGrid() {
  grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const isObstacle = Math.random() < 0.2 && !(x === 0 && y === 0) && !(x === GRID_SIZE - 1 && y === GRID_SIZE - 1);
      row.push({ weight: isObstacle ? Infinity : Math.floor(Math.random() * 5) + 1, visited: false });
    }
    grid.push(row);
  }
}

// Algoritma Dijkstra untuk menghitung jalur optimal
function dijkstra(start, end) {
  const distances = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(Infinity));
  const previous = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
  const queue = [{ x: start.x, y: start.y, dist: 0 }];
  distances[start.y][start.x] = 0;

  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  while (queue.length) {
    queue.sort((a, b) => a.dist - b.dist);
    const { x, y } = queue.shift();
    if (grid[y][x].visited) continue;
    grid[y][x].visited = true;

    if (x === end.x && y === end.y) break;

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && grid[newY][newX].weight !== Infinity) {
        const alt = distances[y][x] + grid[newY][newX].weight;
        if (alt < distances[newY][newX]) {
          distances[newY][newX] = alt;
          previous[newY][newX] = { x, y };
          queue.push({ x: newX, y: newY, dist: alt });
        }
      }
    }
  }

  optimalPath = [];
  let current = { x: end.x, y: end.y };
  while (current) {
    optimalPath.unshift(current);
    current = previous[current.y][current.x];
  }
  return optimalPath.length > 1;
}

// Gambar grid penjelasan (kiri)
function drawExplanationGrid() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, 500, 500);
  ctx.strokeStyle = '#f68c11';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 500, 500);

  if (explanationImage.complete) {
    ctx.drawImage(explanationImage, 50, 50, 400, 400); // Gambar di tengah grid kiri
  }

  ctx.fillStyle = '#f68c11';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Penjelasan', 250, 30);
}

// Gambar grid permainan (kanan)
function drawGameGrid() {
  ctx.clearRect(GAME_OFFSET_X, 0, 500, 500);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.rect(GAME_OFFSET_X + x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      if (grid[y][x].weight === Infinity) {
        ctx.fillStyle = '#000';
      } else if (x === start.x && y === start.y) {
        ctx.fillStyle = '#00ff00';
      } else if (x === end.x && y === end.y) {
        ctx.fillStyle = '#ff0000';
      } else {
        ctx.fillStyle = `rgba(246, 140, 17, ${grid[y][x].weight / 6})`;
      }
      ctx.fill();
      ctx.strokeStyle = '#f68c11';
      ctx.stroke();
      if (grid[y][x].weight !== Infinity) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(grid[y][x].weight, GAME_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 5);
      }
    }
  }

  // Gambar jalur pengguna
  ctx.strokeStyle = '#ff9f1c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < userPath.length - 1; i++) {
    ctx.moveTo(GAME_OFFSET_X + userPath[i].x * CELL_SIZE + CELL_SIZE / 2, userPath[i].y * CELL_SIZE + CELL_SIZE / 2);
    ctx.lineTo(GAME_OFFSET_X + userPath[i + 1].x * CELL_SIZE + CELL_SIZE / 2, userPath[i + 1].y * CELL_SIZE + CELL_SIZE / 2);
  }
  ctx.stroke();

  // Tampilkan jalur optimal saat game over (kecuali menang)
  if (gameOver && !(userPath[userPath.length - 1].x === end.x && userPath[userPath.length - 1].y === end.y)) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < optimalPath.length - 1; i++) {
      ctx.moveTo(GAME_OFFSET_X + optimalPath[i].x * CELL_SIZE + CELL_SIZE / 2, optimalPath[i].y * CELL_SIZE + CELL_SIZE / 2);
      ctx.lineTo(GAME_OFFSET_X + optimalPath[i + 1].x * CELL_SIZE + CELL_SIZE / 2, optimalPath[i + 1].y * CELL_SIZE + CELL_SIZE / 2);
    }
    ctx.stroke();
  }

  // Tampilkan Game Over atau Menang
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(GAME_OFFSET_X, 0, 500, 500);
    ctx.fillStyle = '#f68c11';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';
    if (userPath[userPath.length - 1].x === end.x && userPath[userPath.length - 1].y === end.y) {
      ctx.fillText('YOU WIN!', GAME_OFFSET_X + 250, 250);
    } else {
      ctx.fillText('GAME OVER', GAME_OFFSET_X + 250, 250);
    }
  }
}

// Gambar kedua grid
function draw() {
  drawExplanationGrid();
  drawGameGrid();
}

// Periksa apakah langkah valid
function isValidMove(current, next) {
  const dx = Math.abs(next.x - current.x);
  const dy = Math.abs(next.y - current.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function isOnOptimalPath(next) {
  return optimalPath.some(point => point.x === next.x && point.y === next.y);
}

// Event klik untuk memilih jalur (hanya di grid kanan)
canvas.addEventListener('click', (e) => {
  if (!gameStarted || gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  if (canvasX < GAME_OFFSET_X) return; // Klik di grid kiri diabaikan

  const x = Math.floor((canvasX - GAME_OFFSET_X) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  const next = { x, y };
  const current = userPath[userPath.length - 1];

  if (grid[y][x].weight === Infinity) {
    gameOver = true;
    draw();
    alert('Kamu menabrak rintangan! Game Over! Jalur terpendek ditampilkan.');
    return;
  }

  if (!isValidMove(current, next)) return;

  if (!isOnOptimalPath(next)) {
    gameOver = true;
    draw();
    alert('Jalur salah! Game Over! Jalur terpendek ditampilkan.');
    return;
  }

  userPath.push(next);
  draw();

  if (next.x === end.x && next.y === end.y) {
    gameOver = true;
    draw();
    alert('Selamat! Kamu mencapai harta karun!');
  }
});

// Event tombol
startButton.addEventListener('click', () => {
  if (!gameStarted) {
    if (dijkstra(start, end)) {
      gameStarted = true;
      userPath = [start];
      startButton.textContent = 'Sedang Bermain...';
      draw();
    } else {
      alert('Tidak ada jalur yang mungkin! Reset untuk mencoba lagi.');
    }
  }
});

resetButton.addEventListener('click', () => {
  initGrid();
  start = { x: 0, y: 0 };
  end = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
  userPath = [start];
  optimalPath = [];
  gameStarted = false;
  gameOver = false;
  startButton.textContent = 'Mulai Main';
  draw();
});

// Inisialisasi
explanationImage.onload = () => {
  initGrid();
  draw();
};
explanationImage.onerror = () => {
  console.error('Gagal memuat gambar. Pastikan file "People flying-bro.png" ada di direktori proyek.');
  initGrid();
  draw();
};