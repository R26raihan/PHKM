const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pushButton = document.getElementById('pushButton');
const popButton = document.getElementById('popButton');
const resetButton = document.getElementById('resetButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const backgroundMusic = document.getElementById('backgroundMusic');

const GAME_OFFSET_X = 500;
const MAX_STACK_SIZE = 5;
const TARGET_SCORE = 50;
const TIME_LIMIT = 60;

class Stack {
  constructor() {
    this.items = [];
  }
  push(size) {
    this.items.push({ size, animProgress: 0 });
  }
  pop() {
    return this.items.pop();
  }
  peek() {
    return this.items.length > 0 ? this.items[this.items.length - 1].size : null;
  }
  isEmpty() {
    return this.items.length === 0;
  }
  isFull() {
    return this.items.length >= MAX_STACK_SIZE;
  }
  getItems() {
    return this.items;
  }
}

let stack = new Stack();
let currentBoxSize = generateRandomSize(1);
let score = 0;
let level = 1;
let timeLeft = TIME_LIMIT;
let gameOver = false;
let particles = [];
let message = '';
let lastTime = Date.now();

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, type = 'sine', duration = 0.2) {
  if (!audioContext) return;
  try {
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
  } catch (e) {
    console.error('Error playing sound:', e);
  }
}

class Particle {
  constructor(x, y, color = '#f68c11') {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 + 5;
    this.speedX = Math.random() * 6 - 3;
    this.speedY = Math.random() * 6 - 3;
    this.life = 1;
    this.color = color;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 0.05;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function generateRandomSize(level) {
  const maxSize = Math.max(100 - level * 10, 80);
  const minSize = 50;
  const newSize = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  console.log(`Level: ${level}, Generated size: ${newSize}, Range: ${minSize}-${maxSize}`);
  return newSize;
}

function getBoxColor(size) {
  const hue = (size - 50) / 100 * 120;
  return `hsl(${hue}, 70%, 50%)`;
}

function drawExplanationGrid() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, 500, 500);
  ctx.strokeStyle = '#f68c11';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 500, 500);

  ctx.fillStyle = '#f68c11';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Kotak Saat Ini', 250, 30);

  ctx.fillStyle = getBoxColor(currentBoxSize);
  ctx.fillRect(200, 400, currentBoxSize, 50);
  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText(`Ukuran: ${currentBoxSize}`, 250, 430);
}

function drawGameGrid() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(GAME_OFFSET_X, 0, 500, 500);
  ctx.strokeStyle = '#f68c11';
  ctx.strokeRect(GAME_OFFSET_X, 0, 500, 500);

  ctx.fillStyle = '#f68c11';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Tumpukan', GAME_OFFSET_X + 250, 50);

  const items = stack.getItems().slice().reverse();
  items.forEach((item, index) => {
    const yPos = 450 - (index + 1) * 60;
    const animOffset = item.animProgress < 1 ? (1 - item.animProgress) * 100 : 0;
    ctx.fillStyle = getBoxColor(item.size);
    ctx.fillRect(GAME_OFFSET_X + 250 - item.size / 2, yPos + animOffset, item.size, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`Ukuran: ${item.size}`, GAME_OFFSET_X + 250, yPos + animOffset + 30);
    item.animProgress = Math.min(item.animProgress + 0.05, 1);
  });

  if (message) {
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Press Start 2P"';
    const fade = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${fade})`;
    ctx.fillText(message, GAME_OFFSET_X + 250, 200);
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(GAME_OFFSET_X, 0, 500, 500);
    ctx.fillStyle = score >= TARGET_SCORE ? '#00ff00' : '#f68c11';
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText(score >= TARGET_SCORE ? 'YOU WIN!' : 'GAME OVER', GAME_OFFSET_X + 250, 250);
    if (particles.length < 100) {
      for (let i = 0; i < 20; i++) {
        particles.push(new Particle(GAME_OFFSET_X + 250, 250, score >= TARGET_SCORE ? '#00ff00' : '#f68c11'));
      }
    }
  }

  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
}

function updateTimer() {
  if (gameOver) return;
  const currentTime = Date.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  timeLeft = Math.max(timeLeft - deltaTime, 0);
  timeDisplay.textContent = `Waktu: ${Math.ceil(timeLeft)}`;
  if (timeLeft <= 0) {
    message = 'Waktu habis!';
    gameOver = true;
    playSound(200, 'square', 0.5);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateTimer();
  drawExplanationGrid();
  drawGameGrid();
  if (!gameOver) requestAnimationFrame(draw);
}

pushButton.addEventListener('click', () => {
  if (gameOver) return;
  const topSize = stack.peek();
  if (stack.isFull()) {
    message = 'Tumpukan penuh!';
    gameOver = true;
    playSound(200, 'square', 0.5);
  } else if (!topSize || currentBoxSize < topSize) {
    stack.push(currentBoxSize);
    score += 10;
    message = 'Kotak ditumpuk!';
    for (let i = 0; i < 10; i++) {
      particles.push(new Particle(GAME_OFFSET_X + 250, 450 - stack.getItems().length * 60));
    }
    playSound(500, 'sine', 0.2);
    level = Math.floor(score / 20) + 1;
    currentBoxSize = generateRandomSize(level);
    scoreDisplay.textContent = `Skor: ${score}`;
    levelDisplay.textContent = `Level: ${level}`;
    scoreDisplay.style.animation = 'pulse 0.5s';
    setTimeout(() => scoreDisplay.style.animation = '', 500);
    if (score >= TARGET_SCORE) {
      gameOver = true;
      playSound(800, 'sine', 0.5);
    }
  } else {
    message = 'Kotak terlalu besar!';
    gameOver = true;
    playSound(200, 'square', 0.5);
  }
  draw();
});

popButton.addEventListener('click', () => {
  if (gameOver) return;
  if (!stack.isEmpty()) {
    stack.pop();
    message = 'Kotak dihapus!';
    for (let i = 0; i < 10; i++) {
      particles.push(new Particle(GAME_OFFSET_X + 250, 450 - (stack.getItems().length + 1) * 60));
    }
    playSound(400, 'sine', 0.2);
    currentBoxSize = generateRandomSize(level);
  } else {
    message = 'Tumpukan kosong!';
    playSound(300, 'square', 0.2);
  }
  draw();
});

resetButton.addEventListener('click', () => {
  stack = new Stack();
  score = 0;
  level = 1;
  timeLeft = TIME_LIMIT;
  gameOver = false;
  particles = [];
  currentBoxSize = generateRandomSize(level);
  message = '';
  scoreDisplay.textContent = `Skor: ${score}`;
  levelDisplay.textContent = `Level: ${level}`;
  timeDisplay.textContent = `Waktu: ${Math.ceil(timeLeft)}`;
  lastTime = Date.now();
  draw();
  requestAnimationFrame(draw);
  playSound(600, 'sine', 0.3);
  if (backgroundMusic) {
    backgroundMusic.play().catch(e => console.log('Autoplay blocked:', e));
  }
});

draw();
requestAnimationFrame(draw);

if (backgroundMusic) {
  backgroundMusic.play().catch(e => console.log('Autoplay blocked:', e));
}

if (!audioContext) {
  console.warn('Web Audio API tidak didukung. Efek suara akan dinonaktifkan.');
}