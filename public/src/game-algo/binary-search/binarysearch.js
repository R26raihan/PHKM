// main.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const guessButton = document.getElementById('guessButton');
const resetButton = document.getElementById('resetButton');
const guessInput = document.getElementById('guessInput');

const GAME_OFFSET_X = 500;
const MAX_ATTEMPTS = 7;
let secretNumber = Math.floor(Math.random() * 100) + 1;
let attemptsLeft = MAX_ATTEMPTS;
let gameOver = false;
let guesses = [];
let particles = [];

const explanationImage = new Image();
explanationImage.src = '/src/assets/Select player-bro.png';

// Algoritma Binary Search untuk petunjuk
function binarySearchHint(guess, min, max) {
  const mid = Math.floor((min + max) / 2);
  if (guess === secretNumber) return 'benar';
  if (guess < secretNumber) return { hint: 'terlalu rendah', newMin: guess + 1, newMax: max };
  return { hint: 'terlalu tinggi', newMin: min, newMax: guess - 1 };
}

// Kelas Partikel untuk efek visual
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 + 5;
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
    this.life = 1;
    this.color = gameOver && attemptsLeft > 0 ? '#00ff00' : '#f68c11';
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

// Gambar grid penjelasan (kiri)
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

// Gambar grid permainan (kanan)
function drawGameGrid() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(GAME_OFFSET_X, 0, 500, 500);
  ctx.strokeStyle = '#f68c11';
  ctx.strokeRect(GAME_OFFSET_X, 0, 500, 500);

  ctx.fillStyle = '#f68c11';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Tebak Angka', GAME_OFFSET_X + 250, 50);
  ctx.fillText(`Sisa Percobaan: ${attemptsLeft}`, GAME_OFFSET_X + 250, 100);

  // Animasi tebakan sebelumnya dengan transisi warna
  guesses.forEach((guess, index) => {
    const yPos = 150 + index * 30;
    ctx.fillStyle = guess.hint === 'Tepat!' ? '#00ff00' : guess.hint === 'terlalu rendah' ? '#ff5555' : '#5555ff';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(`Tebakan ${index + 1}: ${guess.value} - ${guess.hint}`, GAME_OFFSET_X + 250, yPos);

    // Efek fade-in untuk tebakan baru
    if (index === guesses.length - 1 && !gameOver) {
      const fade = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(246, 140, 17, ${fade})`;
      ctx.fillText(`Tebakan ${index + 1}: ${guess.value} - ${guess.hint}`, GAME_OFFSET_X + 250, yPos);
    }
  });

  // Tampilkan status game over atau menang
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(GAME_OFFSET_X, 0, 500, 500);
    ctx.fillStyle = attemptsLeft > 0 ? '#00ff00' : '#f68c11';
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText(attemptsLeft === 0 ? 'GAME OVER' : 'YOU WIN!', GAME_OFFSET_X + 250, 250);
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(`Angka Rahasia: ${secretNumber}`, GAME_OFFSET_X + 250, 300);

    // Tambahkan partikel saat game over
    if (particles.length < 50) {
      for (let i = 0; i < 10; i++) {
        particles.push(new Particle(GAME_OFFSET_X + 250, 250));
      }
    }
  }

  // Update dan gambar partikel
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawExplanationGrid();
  drawGameGrid();
  if (!gameOver) requestAnimationFrame(draw); // Loop animasi hanya saat game aktif
}

// Event tebakan
guessButton.addEventListener('click', () => {
  if (gameOver) return;

  const guess = parseInt(guessInput.value);
  if (isNaN(guess) || guess < 1 || guess > 100) {
    alert('Masukkan angka antara 1 dan 100!');
    return;
  }

  attemptsLeft--;
  const result = binarySearchHint(guess, 1, 100);
  if (result === 'benar') {
    guesses.push({ value: guess, hint: 'Tepat!' });
    gameOver = true;
  } else {
    guesses.push({ value: guess, hint: result.hint });
    if (attemptsLeft === 0) gameOver = true;
  }

  guessInput.value = '';
  draw();

  if (gameOver) {
    setTimeout(() => draw(), 100); // Pastikan partikel terus bergerak setelah game over
  }
});

// Event reset
resetButton.addEventListener('click', () => {
  secretNumber = Math.floor(Math.random() * 100) + 1;
  attemptsLeft = MAX_ATTEMPTS;
  gameOver = false;
  guesses = [];
  particles = [];
  guessInput.value = '';
  draw();
  requestAnimationFrame(draw); // Mulai ulang animasi
});

// Inisialisasi
explanationImage.onload = () => {
  draw();
  requestAnimationFrame(draw);
};
explanationImage.onerror = () => {
  console.error('Gagal memuat gambar. Pastikan file "People flying-bro.png" ada di direktori proyek.');
  draw();
  requestAnimationFrame(draw);
};