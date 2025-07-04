const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const stepDisplay = document.getElementById('stepDisplay');
const backgroundMusic = document.getElementById('backgroundMusic');

const GRID_SIZE = 10;
const CELL_SIZE = 50;
const GAME_OFFSET_X = 500;
let grid = [];
let start = { x: 0, y: 0 };
let end = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
let optimalPath = [];
let userPath = [start];
let gameStarted = false;
let gameOver = false;
let stepCount = 0;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let treasureImage = new Image();
treasureImage.src = '/assets/treasure.png'; // Pastikan path gambar benar

function playSound(frequency, type = 'sine', duration = 0.1) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration);
}

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

function drawExplanationGrid() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, 500, 500);
  ctx.strokeStyle = '#f68c11';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 500, 500);

  if (explanationImage.complete) {
    ctx.drawImage(explanationImage, 50, 50, 400, 400);
  }

  ctx.fillStyle = '#f68c11';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Penjelasan', 250, 30);
}

function drawGameGrid() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(GAME_OFFSET_X, 0, 500, 500);
  ctx.strokeStyle = '#f68c11';
  ctx.lineWidth = 2;
  ctx.strokeRect(GAME_OFFSET_X, 0, 500, 500);

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
      ctx.stroke();
      if (grid[y][x].weight !== Infinity) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(grid[y][x].weight, GAME_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 5);
      }
    }
  }

  // Animasi jalur pengguna
  ctx.strokeStyle = '#ff9f1c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < userPath.length - 1; i++) {
    const progress = Math.min((Date.now() - (i * 200)) / 200, 1);
    if (progress < 1) {
      const x = userPath[i].x * CELL_SIZE + (userPath[i + 1].x - userPath[i].x) * progress * CELL_SIZE;
      const y = userPath[i].y * CELL_SIZE + (userPath[i + 1].y - userPath[i].y) * progress * CELL_SIZE;
      ctx.lineTo(GAME_OFFSET_X + x + CELL_SIZE / 2, y + CELL_SIZE / 2);
    } else {
      ctx.moveTo(GAME_OFFSET_X + userPath[i].x * CELL_SIZE + CELL_SIZE / 2, userPath[i].y * CELL_SIZE + CELL_SIZE / 2);
      ctx.lineTo(GAME_OFFSET_X + userPath[i + 1].x * CELL_SIZE + CELL_SIZE / 2, userPath[i + 1].y * CELL_SIZE + CELL_SIZE / 2);
    }
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

  // Tampilkan harta karun saat menang
  if (gameOver && userPath[userPath.length - 1].x === end.x && userPath[userPath.length - 1].y === end.y && treasureImage.complete) {
    ctx.drawImage(treasureImage, GAME_OFFSET_X + end.x * CELL_SIZE + 5, end.y * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);
  }

  // Tampilkan Game Over atau Menang
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(GAME_OFFSET_X, 0, 500, 500);
    ctx.fillStyle = userPath[userPath.length - 1].x === end.x && userPath[userPath.length - 1].y === end.y ? '#00ff00' : '#f68c11';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(userPath[userPath.length - 1].x === end.x && userPath[userPath.length - 1].y === end.y ? 'YOU WIN!' : 'GAME OVER', GAME_OFFSET_X + 250, 250);
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;
    p.size *= 0.95;
    p.life -= 0.02;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawExplanationGrid();
  drawGameGrid();
  drawParticles();
  if (!gameOver) requestAnimationFrame(draw);
}

function isValidMove(current, next) {
  const dx = Math.abs(next.x - current.x);
  const dy = Math.abs(next.y - current.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function isOnOptimalPath(next) {
  return optimalPath.some(point => point.x === next.x && point.y === next.y);
}

canvas.addEventListener('click', (e) => {
  if (!gameStarted || gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  if (canvasX < GAME_OFFSET_X) return;

  const x = Math.floor((canvasX - GAME_OFFSET_X) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  const next = { x, y };
  const current = userPath[userPath.length - 1];

  if (grid[y][x].weight === Infinity) {
    gameOver = true;
    playSound(200, 'square', 0.3);
    for (let i = 0; i < 20; i++) particles.push({ x: GAME_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2, vx: Math.random() * 4 - 2, vy: Math.random() * 4 - 2, size: 5, life: 1, color: '#ff0000' });
    draw();
    setTimeout(() => alert('Kamu menabrak rintangan! Game Over! Jalur terpendek ditampilkan.'), 100);
    return;
  }

  if (!isValidMove(current, next)) return;

  if (!isOnOptimalPath(next)) {
    gameOver = true;
    playSound(200, 'square', 0.3);
    for (let i = 0; i < 20; i++) particles.push({ x: GAME_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2, vx: Math.random() * 4 - 2, vy: Math.random() * 4 - 2, size: 5, life: 1, color: '#ff0000' });
    draw();
    setTimeout(() => alert('Jalur salah! Game Over! Jalur terpendek ditampilkan.'), 100);
    return;
  }

  userPath.push(next);
  stepCount++;
  stepDisplay.textContent = `Langkah: ${stepCount}`;
  playSound(400, 'triangle', 0.1);
  for (let i = 0; i < 10; i++) particles.push({ x: GAME_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1, size: 3, life: 1, color: '#ff9f1c' });
  draw();

  if (next.x === end.x && next.y === end.y) {
    gameOver = true;
    playSound(800, 'sine', 0.5);
    for (let i = 0; i < 30; i++) particles.push({ x: GAME_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2, vx: Math.random() * 3 - 1.5, vy: Math.random() * 3 - 1.5, size: 5, life: 1, color: '#00ff00' });
    draw();
    setTimeout(() => alert('Selamat! Kamu mencapai harta karun!'), 100);
  }
});

startButton.addEventListener('click', () => {
  if (!gameStarted) {
    if (dijkstra(start, end)) {
      gameStarted = true;
      userPath = [start];
      stepCount = 0;
      stepDisplay.textContent = `Langkah: ${stepCount}`;
      startButton.textContent = 'Sedang Bermain...';
      backgroundMusic.play();
      playSound(600, 'sine', 0.3);
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
  stepCount = 0;
  stepDisplay.textContent = `Langkah: ${stepCount}`;
  startButton.textContent = 'Mulai Main';
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  playSound(500, 'triangle', 0.2);
  draw();
});

const explanationImage = new Image();
explanationImage.src = '/assets/People flying-bro.png';
let particles = [];

explanationImage.onload = () => {
  initGrid();
  draw();
};
explanationImage.onerror = () => {
  console.error('Gagal memuat gambar. Pastikan file "People flying-bro.png" ada di direktori proyek.');
  initGrid();
  draw();
};