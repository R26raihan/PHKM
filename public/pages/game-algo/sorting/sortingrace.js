// Konfigurasi
const algorithms = {
  bubble: {
    name: "Bubble Sort",
    explanation: "Bubble Sort bekerja dengan berulang kali menukar elemen yang berdekatan jika mereka dalam urutan yang salah. Proses ini diulang sampai tidak ada lagi pertukaran yang diperlukan, yang berarti array sudah terurut. Kompleksitas waktu: O(n²) dalam kasus terburuk."
  },
  selection: {
    name: "Selection Sort",
    explanation: "Selection Sort membagi array menjadi dua bagian: bagian yang sudah terurut dan bagian yang belum. Pada setiap iterasi, algoritma menemukan elemen terkecil (atau terbesar) dari bagian yang belum terurut dan memindahkannya ke akhir bagian yang sudah terurut. Kompleksitas waktu: O(n²)."
  },
  insertion: {
    name: "Insertion Sort",
    explanation: "Insertion Sort bekerja seperti cara orang mengurutkan kartu di tangan. Array dibagi menjadi bagian yang terurut dan tidak terurut. Nilai dari bagian tidak terurut diambil dan ditempatkan pada posisi yang benar di bagian terurut. Kompleksitas waktu: O(n²)."
  },
  merge: {
    name: "Merge Sort",
    explanation: "Merge Sort adalah algoritma divide-and-conquer yang membagi array menjadi dua bagian, mengurutkan masing-masing bagian secara rekursif, dan kemudian menggabungkan dua bagian yang sudah terurut. Kompleksitas waktu: O(n log n)."
  },
  quick: {
    name: "Quick Sort",
    explanation: "Quick Sort juga merupakan algoritma divide-and-conquer. Ia memilih elemen 'pivot' dan mempartisi array menjadi dua bagian - elemen yang lebih kecil dari pivot dan yang lebih besar. Kedua bagian kemudian diurutkan secara rekursif. Kompleksitas waktu: O(n log n) rata-rata, O(n²) kasus terburuk."
  }
};

// State aplikasi
let state = {
  array: [],
  sorting: false,
  paused: false,
  speed: 5,
  algorithm: 'bubble',
  stats: {
    comparisons: 0,
    swaps: 0,
    time: 0
  }
};

// Audio Context
let audioContext;
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
  console.warn('Web Audio API tidak didukung. Efek suara akan dinonaktifkan.');
}

// Elemen DOM
const visualizer = document.getElementById('visualizer');
const sizeSlider = document.getElementById('array-size');
const sizeValue = document.getElementById('size-value');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speed-value');
const algorithmSelect = document.getElementById('algorithm');
const generateBtn = document.getElementById('generate-btn');
const sortBtn = document.getElementById('sort-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const comparisonsEl = document.getElementById('comparisons');
const swapsEl = document.getElementById('swaps');
const timeEl = document.getElementById('time');
const explanationEl = document.getElementById('algorithm-explanation');

// Fungsi untuk memainkan suara
function playSound(type) {
  if (!audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Setel parameter suara berdasarkan jenis aksi
    switch (type) {
      case 'compare':
        oscillator.type = 'sine';
        oscillator.frequency.value = 440 + Math.random() * 100; // A4 dengan variasi
        gainNode.gain.value = 0.2;
        break;
      case 'swap':
        oscillator.type = 'square';
        oscillator.frequency.value = 220 + Math.random() * 50; // A3 dengan variasi
        gainNode.gain.value = 0.3;
        break;
      case 'complete':
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 880; // A5
        gainNode.gain.value = 0.5;
        break;
      default:
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.1;
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Atur envelope suara
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.error('Error playing sound:', e);
  }
}

// Event listeners
sizeSlider.addEventListener('input', () => {
  sizeValue.textContent = sizeSlider.value;
});

speedSlider.addEventListener('input', () => {
  speedValue.textContent = speedSlider.value;
  state.speed = parseInt(speedSlider.value);
});

algorithmSelect.addEventListener('change', () => {
  state.algorithm = algorithmSelect.value;
  updateAlgorithmExplanation();
});

generateBtn.addEventListener('click', generateArray);
sortBtn.addEventListener('click', startSorting);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', reset);

// Inisialisasi
function init() {
  updateAlgorithmExplanation();
  generateArray();
}

// Generate array acak
function generateArray() {
  if (state.sorting) return;
  
  const size = parseInt(sizeSlider.value);
  state.array = [];
  
  for (let i = 0; i < size; i++) {
    state.array.push(Math.floor(Math.random() * 90) + 10); // Nilai antara 10-100
  }
  
  resetStats();
  renderBars();
}

// Render bars
function renderBars(highlightIndices = [], swapIndices = [], sortedIndices = []) {
  visualizer.innerHTML = '';
  const maxValue = Math.max(...state.array);
  
  state.array.forEach((value, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${(value / maxValue) * 100}%`;
    bar.setAttribute('data-value', value);
    
    if (sortedIndices.includes(i)) {
      bar.classList.add('sorted');
    } else if (highlightIndices.includes(i)) {
      bar.classList.add('comparing');
    } else if (swapIndices.includes(i)) {
      bar.classList.add('swapping');
    }
    
    visualizer.appendChild(bar);
  });
}

// Update stats
function updateStats() {
  comparisonsEl.textContent = state.stats.comparisons;
  swapsEl.textContent = state.stats.swaps;
  timeEl.textContent = state.stats.time;
}

// Reset stats
function resetStats() {
  state.stats = {
    comparisons: 0,
    swaps: 0,
    time: 0
  };
  updateStats();
}

// Update algorithm explanation
function updateAlgorithmExplanation() {
  const algo = algorithms[state.algorithm];
  explanationEl.innerHTML = `
    <h3>${algo.name}</h3>
    <p>${algo.explanation}</p>
  `;
}

// Start sorting
function startSorting() {
  if (state.sorting || state.array.length === 0) return;
  
  state.sorting = true;
  state.paused = false;
  sortBtn.disabled = true;
  generateBtn.disabled = true;
  pauseBtn.disabled = false;
  
  resetStats();
  const startTime = performance.now();
  
  // Pilih algoritma
  let sortPromise;
  switch (state.algorithm) {
    case 'bubble':
      sortPromise = bubbleSort();
      break;
    case 'selection':
      sortPromise = selectionSort();
      break;
    case 'insertion':
      sortPromise = insertionSort();
      break;
    case 'merge':
      sortPromise = mergeSort();
      break;
    case 'quick':
      sortPromise = quickSort();
      break;
    default:
      sortPromise = bubbleSort();
  }
  
  sortPromise.then(() => {
    const endTime = performance.now();
    state.stats.time = Math.round(endTime - startTime);
    updateStats();
    
    state.sorting = false;
    sortBtn.disabled = false;
    generateBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Tandai semua sebagai sorted
    renderBars([], [], [...Array(state.array.length).keys()]);
    playSound('complete');
  });
}

// Toggle pause
function togglePause() {
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
}

// Reset
function reset() {
  state.sorting = false;
  state.paused = false;
  sortBtn.disabled = false;
  generateBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = 'Pause';
  generateArray();
}

// Delay untuk animasi
function delay() {
  return new Promise(resolve => {
    const speed = 110 - (state.speed * 10); // 10-100ms
    setTimeout(() => {
      if (!state.paused) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (!state.paused) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    }, speed);
  });
}

// Algoritma sorting dengan efek suara
async function bubbleSort() {
  let arr = [...state.array];
  let n = arr.length;
  let swapped;
  
  do {
    swapped = false;
    for (let i = 0; i < n - 1; i++) {
      state.stats.comparisons++;
      updateStats();
      
      renderBars([i, i+1]);
      playSound('compare');
      await delay();
      
      if (arr[i] > arr[i+1]) {
        [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
        swapped = true;
        state.stats.swaps++;
        updateStats();
        
        renderBars([], [i, i+1]);
        playSound('swap');
        await delay();
      }
    }
    n--;
  } while (swapped && !state.paused);
  
  state.array = arr;
}

async function selectionSort() {
  let arr = [...state.array];
  let n = arr.length;
  
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    
    for (let j = i + 1; j < n; j++) {
      state.stats.comparisons++;
      updateStats();
      
      renderBars([minIdx, j]);
      playSound('compare');
      await delay();
      
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      state.stats.swaps++;
      updateStats();
      
      renderBars([], [i, minIdx]);
      playSound('swap');
      await delay();
    }
  }
  
  state.array = arr;
  playSound('complete');
}

async function insertionSort() {
  let arr = [...state.array];
  let n = arr.length;
  
  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    
    while (j >= 0 && arr[j] > key) {
      state.stats.comparisons++;
      updateStats();
      
      renderBars([j, j+1]);
      playSound('compare');
      await delay();
      
      arr[j + 1] = arr[j];
      state.stats.swaps++;
      updateStats();
      
      renderBars([], [j, j+1]);
      playSound('swap');
      await delay();
      
      j--;
    }
    arr[j + 1] = key;
  }
  
  state.array = arr;
  playSound('complete');
}

async function mergeSort() {
  state.array = await mergeSortHelper([...state.array], 0);
  playSound('complete');
}

async function mergeSortHelper(arr, startIdx) {
  if (arr.length <= 1) {
    return arr;
  }
  
  const mid = Math.floor(arr.length / 2);
  const left = await mergeSortHelper(arr.slice(0, mid), startIdx);
  const right = await mergeSortHelper(arr.slice(mid), startIdx + mid);
  
  return merge(left, right, startIdx);
}

async function merge(left, right, startIdx) {
  let result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    state.stats.comparisons++;
    updateStats();
    
    renderBars([startIdx + i, startIdx + left.length + j]);
    playSound('compare');
    await delay();
    
    if (left[i] < right[j]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
      state.stats.swaps++;
      updateStats();
      
      renderBars([], [startIdx + i, startIdx + left.length + j - 1]);
      playSound('swap');
      await delay();
    }
  }
  
  result = result.concat(left.slice(i)).concat(right.slice(j));
  
  // Update visualisasi
  const tempArray = [...state.array];
  for (let k = 0; k < result.length; k++) {
    tempArray[startIdx + k] = result[k];
  }
  state.array = tempArray;
  renderBars();
  await delay();
  
  return result;
}

async function quickSort() {
  await quickSortHelper([...state.array], 0, state.array.length - 1);
  playSound('complete');
}

async function quickSortHelper(arr, low, high) {
  if (low < high) {
    const pi = await partition(arr, low, high);
    
    await quickSortHelper(arr, low, pi - 1);
    await quickSortHelper(arr, pi + 1, high);
  }
}

async function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    state.stats.comparisons++;
    updateStats();
    
    renderBars([j, high]);
    playSound('compare');
    await delay();
    
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      state.stats.swaps++;
      updateStats();
      
      renderBars([], [i, j]);
      playSound('swap');
      await delay();
    }
  }
  
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  state.stats.swaps++;
  updateStats();
  
  renderBars([], [i + 1, high]);
  playSound('swap');
  await delay();
  
  // Update array state
  const tempArray = [...state.array];
  for (let k = low; k <= high; k++) {
    tempArray[k] = arr[k];
  }
  state.array = tempArray;
  
  return i + 1;
}

// Initialize
init();