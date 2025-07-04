// Neural Network Simulation (Improved for clarity)
class NeuralNetwork {
  constructor(architecture) {
    this.architecture = architecture;
    this.layers = []; // Menyimpan nilai aktivasi neuron di setiap lapisan
    this.weights = []; // Menyimpan bobot koneksi antar neuron
    this.initializeNetwork();
  }

  // Menginisialisasi struktur jaringan dengan bobot acak
  initializeNetwork() {
    // Membuat lapisan neuron
    for (let i = 0; i < this.architecture.length; i++) {
      this.layers.push(new Array(this.architecture[i]).fill(0));
    }

    // Menginisialisasi bobot dengan inisialisasi Xavier/Glorot
    // Ini membantu pelatihan agar lebih stabil
    for (let i = 0; i < this.architecture.length - 1; i++) {
      const rows = this.architecture[i + 1]; // Jumlah neuron di lapisan berikutnya
      const cols = this.architecture[i]; // Jumlah neuron di lapisan saat ini
      const scale = Math.sqrt(2 / (rows + cols)); // Skala untuk inisialisasi
      this.weights.push(this.randomMatrix(rows, cols, scale));
    }
  }

  // Membuat matriks bobot acak
  randomMatrix(rows, cols, scale = 0.1) {
    return Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => (Math.random() * 2 - 1) * scale)
    );
  }

  // Melakukan 'forward pass' (menghitung output jaringan)
  forward(input) {
    // Input dimasukkan ke lapisan pertama
    this.layers[0] = [...input];
    
    // Iterasi melalui setiap lapisan (kecuali lapisan output terakhir)
    for (let i = 0; i < this.weights.length; i++) {
      // Untuk setiap neuron di lapisan berikutnya (lapisan i+1)
      for (let j = 0; j < this.weights[i].length; j++) {
        let sum = 0;
        // Hitung jumlah tertimbang dari aktivasi neuron di lapisan sebelumnya
        for (let k = 0; k < this.weights[i][j].length; k++) {
          sum += this.layers[i][k] * this.weights[i][j][k];
        }
        // Terapkan fungsi aktivasi ReLU untuk lapisan tersembunyi
        this.layers[i + 1][j] = this.relu(sum); 
      }
    }
    
    // Terapkan fungsi aktivasi Sigmoid untuk lapisan output terakhir
    // Sigmoid mengompres output antara 0 dan 1, cocok untuk klasifikasi biner
    const outputLayerIdx = this.layers.length - 1;
    for (let j = 0; j < this.layers[outputLayerIdx].length; j++) {
      this.layers[outputLayerIdx][j] = this.sigmoid(this.layers[outputLayerIdx][j]);
    }
    
    return this.layers[outputLayerIdx];
  }

  // Fungsi aktivasi Sigmoid
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  // Fungsi aktivasi ReLU (Rectified Linear Unit)
  relu(x) {
    return Math.max(0, x);
  }

  // Melatih jaringan saraf menggunakan backpropagation
  async train(inputs, targets, learningRate, epochs, updateCallback) {
    const history = {
      loss: [], // Menyimpan nilai kerugian (loss) di setiap epoch
      weights: [] // Menyimpan salinan bobot di setiap epoch
    };

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      // Array untuk menyimpan perubahan bobot yang diakumulasikan
      const weightChanges = Array(this.weights.length).fill().map(() => []);

      for (let n = 0; n < inputs.length; n++) {
        // 1. Forward Pass: Hitung output jaringan
        const output = this.forward(inputs[n]);
        
        // 2. Hitung Kerugian (Loss) dan Error Output
        let loss = 0;
        const outputErrors = [];
        for (let i = 0; i < output.length; i++) {
          const error = targets[n][i] - output[i]; // Target - Prediksi
          outputErrors.push(error);
          loss += error * error; // Mean Squared Error (MSE)
        }
        totalLoss += loss / output.length;

        // 3. Backward Pass (Backpropagation): Hitung gradien dan perubahan bobot
        // Iterasi mundur dari lapisan output ke lapisan input
        for (let l = this.weights.length - 1; l >= 0; l--) {
          for (let i = 0; i < this.weights[l].length; i++) { // Neuron di lapisan berikutnya
            for (let j = 0; j < this.weights[l][i].length; j++) { // Neuron di lapisan saat ini
              let delta;
              if (l === this.weights.length - 1) {
                // Untuk lapisan output (menggunakan turunan Sigmoid)
                delta = outputErrors[i] * this.layers[l + 1][i] * (1 - this.layers[l + 1][i]);
              } else {
                // Untuk lapisan tersembunyi (menggunakan turunan ReLU)
                delta = this.layers[l + 1][i] > 0 ? outputErrors[i] : 0;
              }
              // Kalikan delta dengan aktivasi neuron di lapisan sebelumnya
              delta *= this.layers[l][j];
              
              // Hitung perubahan bobot
              const change = learningRate * delta;
              
              // Akumulasikan perubahan bobot
              weightChanges[l][i] = weightChanges[l][i] || [];
              weightChanges[l][i][j] = (weightChanges[l][i][j] || 0) + change;
            }
          }
        }
      }

      // 4. Perbarui Bobot
      // Rata-ratakan perubahan bobot dari semua input dan terapkan
      for (let l = 0; l < this.weights.length; l++) {
        for (let i = 0; i < this.weights[l].length; i++) {
          for (let j = 0; j < this.weights[l][i].length; j++) {
            this.weights[l][i][j] += weightChanges[l][i][j] / inputs.length;
          }
        }
      }

      // Simpan riwayat kerugian dan bobot
      history.loss.push(totalLoss / inputs.length);
      history.weights.push(JSON.parse(JSON.stringify(this.weights))); // Salinan mendalam

      // Panggil callback untuk memperbarui visualisasi
      if (updateCallback) {
        await updateCallback(epoch, history);
      }
    }

    return history;
  }
}

// Kelas untuk memvisualisasikan struktur jaringan dan aktivitasnya
class NetworkVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.connections = []; // Menyimpan elemen koneksi untuk animasi
    this.neuronElements = []; // Menyimpan elemen neuron
  }

  // Merender (menggambar) jaringan saraf
  render(network, activeNeurons = [], activeConnections = []) {
    this.container.innerHTML = ''; // Bersihkan konten sebelumnya
    this.connections = [];
    this.neuronElements = [];

    // Buat div bagian dalam untuk menampung struktur jaringan (lapisan dan koneksi)
    const networkStructureInnerDiv = document.createElement('div');
    networkStructureInnerDiv.className = 'network-structure-inner'; // Tambahkan kelas ini untuk styling
    networkStructureInnerDiv.style.position = 'relative'; // Pastikan memiliki posisi relatif untuk koneksi absolut

    // Buat container untuk koneksi agar berada di belakang neuron
    const connectionsContainer = document.createElement('div');
    connectionsContainer.className = 'connections-container';
    networkStructureInnerDiv.appendChild(connectionsContainer); // Koneksi masuk ke dalam div bagian dalam
    
    // Buat lapisan
    for (let layerIdx = 0; layerIdx < network.layers.length; layerIdx++) {
      const layerDiv = document.createElement('div');
      layerDiv.className = 'layer';
      
      const currentLayerNeurons = [];
      // Buat neuron
      for (let neuronIdx = 0; neuronIdx < network.layers[layerIdx].length; neuronIdx++) {
        const neuron = document.createElement('div');
        neuron.className = 'neuron';
        // Tambahkan kelas 'active' jika neuron aktif
        if (activeNeurons.some(n => n.layer === layerIdx && n.neuron === neuronIdx)) {
          neuron.classList.add('active');
        }
        neuron.textContent = neuronIdx + 1; // Tampilkan nomor neuron
        
        // Hitung warna neuron berdasarkan aktivasinya
        // Warna neuron akan lebih cerah jika aktivasinya lebih tinggi
        const activation = network.layers[layerIdx][neuronIdx];
        // Warna input (biru), hidden (kuning), output (merah)
        const hue = layerIdx === 0 ? 200 : layerIdx === network.layers.length - 1 ? 0 : 40;
        const saturation = 80;
        const lightness = 30 + Math.min(activation * 40, 40); // Sesuaikan kecerahan
        neuron.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        layerDiv.appendChild(neuron);
        currentLayerNeurons.push(neuron);
      }
      this.neuronElements.push(currentLayerNeurons);
      networkStructureInnerDiv.appendChild(layerDiv); // Lapisan masuk ke dalam div bagian dalam
    }
    
    this.container.appendChild(networkStructureInnerDiv); // Tambahkan div bagian dalam ke container utama

    // Buat koneksi antar lapisan setelah semua neuron dirender dan diposisikan
    // Gunakan setTimeout untuk memastikan elemen dirender di DOM
    setTimeout(() => {
        for (let layerIdx = 0; layerIdx < network.layers.length - 1; layerIdx++) {
            const fromNeurons = this.neuronElements[layerIdx];
            const toNeurons = this.neuronElements[layerIdx + 1];
            // Lewatkan networkStructureInnerDiv sebagai container referensi untuk getBoundingClientRect
            this.createConnections(fromNeurons, toNeurons, network.weights[layerIdx], activeConnections, connectionsContainer, layerIdx, networkStructureInnerDiv);
        }
        this.animateConnections();
    }, 0); // Penundaan kecil untuk memastikan posisi elemen sudah benar
  }

  // Membuat elemen koneksi (garis) antar neuron
  createConnections(fromNeurons, toNeurons, weights, activeConnections, connectionsContainer, fromLayerIdx, referenceContainer) {
    fromNeurons.forEach((fromNeuron, fromNeuronIdx) => {
      toNeurons.forEach((toNeuron, toNeuronIdx) => {
        const connection = document.createElement('div');
        connection.className = 'connection';
        
        // Dapatkan posisi neuron di layar
        const fromRect = fromNeuron.getBoundingClientRect();
        const toRect = toNeuron.getBoundingClientRect();
        // Gunakan bounding rect dari referenceContainer
        const containerRect = referenceContainer.getBoundingClientRect();
        
        // Hitung koordinat relatif terhadap container visualizer
        const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
        const x2 = toRect.left + toRect.width / 2 - containerRect.left;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top;
        
        // Hitung panjang dan sudut koneksi
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        connection.style.width = `${length}px`;
        connection.style.left = `${x1}px`;
        connection.style.top = `${y1}px`;
        connection.style.transform = `rotate(${angle}deg)`;
        
        // Atur gaya koneksi berdasarkan bobot
        const weight = weights[toNeuronIdx][fromNeuronIdx]; // Bobot dari fromNeuron ke toNeuron
        const opacity = Math.min(0.2 + Math.abs(weight), 0.8); // Opasitas berdasarkan kekuatan bobot
        
        // Tambahkan kelas 'active' jika koneksi aktif (sedang berubah)
        const isActive = activeConnections.some(c => 
          c.fromLayer === fromLayerIdx &&
          c.fromNeuron === fromNeuronIdx && 
          c.toNeuron === toNeuronIdx
        );
        
        if (isActive) {
          connection.classList.add('active');
        }
        
        // Warna koneksi: hijau untuk bobot positif, merah untuk bobot negatif
        if (weight >= 0) {
          connection.style.backgroundColor = `rgba(76, 175, 80, ${opacity})`; // Hijau
        } else {
          connection.style.backgroundColor = `rgba(244, 67, 54, ${opacity})`; // Merah
        }
        
        // Ketebalan koneksi berdasarkan kekuatan bobot
        connection.style.height = `${2 + Math.abs(weight) * 5}px`; // Ketebalan
        
        this.connections.push({
          element: connection,
          weight: weight
        });
        
        connectionsContainer.appendChild(connection);
      });
    });
  }

  // Animasi koneksi saat pertama kali dirender
  animateConnections() {
    this.connections.forEach(conn => {
      anime({
        targets: conn.element,
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutQuad'
      });
    });
  }

  // Animasi aktivasi neuron
  animateNeuronActivation(layerIdx, neuronIdx) {
    if (layerIdx >= this.neuronElements.length || neuronIdx >= this.neuronElements[layerIdx].length) return;
    
    const neuron = this.neuronElements[layerIdx][neuronIdx];
    
    anime({
      targets: neuron,
      scale: [1, 1.3, 1],
      backgroundColor: [
        neuron.style.backgroundColor,
        'hsl(60, 80%, 60%)', // Warna kuning cerah untuk highlight
        neuron.style.backgroundColor
      ],
      duration: 500,
      easing: 'easeInOutQuad'
    });
  }

  // Animasi perubahan bobot (saat bobot diperbarui)
  animateWeightChange(fromLayerIdx, fromNeuronIdx, toNeuronIdx, newWeight) {
    // Cari koneksi yang sesuai
    const connection = this.connections.find(conn => {
      // Ini mungkin perlu disesuaikan jika struktur koneksi disimpan berbeda
      // Saat ini, koneksi tidak menyimpan informasi from/to neuron secara langsung
      // Perlu cara untuk mengidentifikasi koneksi yang benar
      // Untuk tujuan demo, kita akan mengasumsikan render ulang akan menangani ini
    });
    
    // Jika ditemukan, bisa ditambahkan animasi perubahan lebar/warna
    if (connection) {
      anime({
        targets: connection.element,
        height: `${2 + Math.abs(newWeight) * 5}px`,
        backgroundColor: newWeight >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)',
        duration: 300,
        easing: 'easeInOutQuad'
      });
    }
  }
}

// Kelas untuk memvisualisasikan perubahan bobot di setiap epoch
class WeightChangeVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async render(epoch, weights, prevWeights) {
    const epochDiv = document.createElement('div');
    epochDiv.className = 'weight-change';
    epochDiv.style.opacity = '0';
    epochDiv.innerHTML = `<h3>Epoch ${epoch + 1}</h3>`;
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'weight-details';
    
    // Hanya tampilkan perubahan signifikan untuk kejelasan visualisasi
    const significantChanges = [];
    
    for (let l = 0; l < weights.length; l++) { // Iterasi lapisan
      for (let i = 0; i < weights[l].length; i++) { // Iterasi neuron tujuan di lapisan berikutnya
        for (let j = 0; j < weights[l][i].length; j++) { // Iterasi neuron sumber di lapisan saat ini
          const change = weights[l][i][j] - prevWeights[l][i][j];
          if (Math.abs(change) > 0.005) { // Hanya tampilkan perubahan > 0.005
            significantChanges.push({
              layer: l,
              fromNeuron: j, // Neuron sumber (kolom matriks bobot)
              toNeuron: i,   // Neuron tujuan (baris matriks bobot)
              weight: weights[l][i][j],
              change: change
            });
          }
        }
      }
    }
    
    // Urutkan berdasarkan perubahan absolut (menurun)
    significantChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    
    // Hanya tampilkan 10 perubahan teratas jika ada banyak
    const changesToShow = significantChanges.slice(0, 10);
    
    if (changesToShow.length === 0 && epoch > 0) {
        const noChangeMsg = document.createElement('div');
        noChangeMsg.textContent = "Tidak ada perubahan bobot signifikan di epoch ini.";
        noChangeMsg.style.color = "#888";
        detailsDiv.appendChild(noChangeMsg);
    }

    for (const change of changesToShow) {
      const weightValue = document.createElement('div');
      weightValue.className = `weight-value ${change.change >= 0 ? 'positive' : 'negative'}`;
      weightValue.title = `Lapisan ${change.layer+1} ke Lapisan ${change.layer+2}, Neuron ${change.fromNeuron+1} → Neuron ${change.toNeuron+1}`;
      weightValue.innerHTML = `
        <strong>W<sub>${change.layer+1},${change.toNeuron+1},${change.fromNeuron+1}</sub>:</strong> 
        ${change.weight.toFixed(4)} 
        <span>(${change.change >= 0 ? '+' : ''}${change.change.toFixed(4)})</span>
      `;
      weightValue.style.transform = 'scale(0.9)';
      weightValue.style.opacity = '0';
      detailsDiv.appendChild(weightValue);
    }
    
    epochDiv.appendChild(detailsDiv);
    this.container.prepend(epochDiv); // Tambahkan di bagian atas
    
    // Animasi kemunculan epochDiv
    await anime({
      targets: epochDiv,
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 600,
      easing: 'easeOutQuad'
    }).finished;
    
    // Animasi setiap perubahan bobot
    const weightValues = detailsDiv.querySelectorAll('.weight-value');
    await Promise.all(Array.from(weightValues).map((el, i) => {
      return anime({
        targets: el,
        opacity: [0, 1],
        scale: [0.9, 1],
        delay: i * 50,
        duration: 400,
        easing: 'easeOutBack'
      }).finished;
    }));
  }
}

// Aplikasi Utama dengan Peningkatan UI
document.addEventListener('DOMContentLoaded', async () => {
  // Elemen DOM
  const learningRateInput = document.getElementById('learning-rate');
  const learningRateValue = document.getElementById('learning-rate-value');
  const epochsInput = document.getElementById('epochs');
  const trainBtn = document.getElementById('train-btn');
  const resetBtn = document.getElementById('reset-btn');
  const addLayerBtn = document.getElementById('add-layer');
  const layerControls = document.getElementById('layer-controls');
  const trainingStatus = document.getElementById('training-status');
  const trainingProgress = document.getElementById('training-progress');
  
  // Inisialisasi visualizer
  const networkVisualizer = new NetworkVisualizer('network');
  const weightChangeVisualizer = new WeightChangeVisualizer('weight-changes');
  
  // Inisialisasi grafik kerugian (loss chart)
  const lossChart = new Chart(
    document.getElementById('loss-chart'),
    {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Kerugian Pelatihan (Training Loss)',
          data: [],
          borderColor: '#4a6fa5',
          backgroundColor: 'rgba(74, 111, 165, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Penting untuk responsivitas
        animation: {
          duration: 300
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Kerugian (Loss)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Epoch'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Kerugian: ${context.parsed.y.toFixed(4)}`;
              }
            }
          }
        }
      }
    }
  );
  
  // Arsitektur default: 2 input, 3 hidden, 1 output (untuk masalah XOR)
  let currentArchitecture = [2, 3, 1];
  
  // Membuat kontrol untuk mengubah jumlah neuron di setiap lapisan
  function createLayerControls() {
    layerControls.innerHTML = '';
    currentArchitecture.forEach((neurons, idx) => {
      const layerControl = document.createElement('div');
      layerControl.className = 'layer-control';
      
      const label = document.createElement('label');
      // Beri label yang jelas untuk lapisan input dan output
      if (idx === 0) {
        label.textContent = `Input (${neurons} neuron):`;
      } else if (idx === currentArchitecture.length - 1) {
        label.textContent = `Output (${neurons} neuron):`;
      } else {
        label.textContent = `Lapisan Tersembunyi ${idx} (${neurons} neuron):`;
      }
      
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '10'; // Batasi jumlah neuron untuk kejelasan visualisasi
      input.value = neurons;
      // Nonaktifkan input untuk lapisan input dan output agar tidak diubah
      if (idx === 0 || idx === currentArchitecture.length - 1) {
        input.disabled = true;
      }
      input.addEventListener('change', () => {
        currentArchitecture[idx] = parseInt(input.value);
        resetVisualization();
      });
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-layer';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Hapus lapisan ini';
      removeBtn.addEventListener('click', () => {
        // Izinkan penghapusan hanya untuk lapisan tersembunyi
        if (currentArchitecture.length > 2 && idx > 0 && idx < currentArchitecture.length - 1) {
          currentArchitecture.splice(idx, 1);
          createLayerControls();
          resetVisualization();
        } else {
          // Gunakan modal kustom sebagai pengganti alert()
          showCustomAlert('Jaringan saraf harus memiliki setidaknya 2 lapisan (input dan output) dan tidak dapat menghapus lapisan input/output.');
        }
      });
      
      layerControl.appendChild(label);
      layerControl.appendChild(input);
      // Tampilkan tombol hapus hanya untuk lapisan tersembunyi
      if (idx > 0 && idx < currentArchitecture.length - 1) {
        layerControl.appendChild(removeBtn);
      }
      
      layerControls.appendChild(layerControl);
    });
  }
  
  // Tombol tambah lapisan
  addLayerBtn.addEventListener('click', () => {
    if (currentArchitecture.length < 6) { // Batasi jumlah total lapisan
      // Tambahkan lapisan tersembunyi baru sebelum lapisan output
      currentArchitecture.splice(currentArchitecture.length - 1, 0, 3); // Default 3 neuron
      createLayerControls();
      resetVisualization();
    } else {
      showCustomAlert('Maksimal 6 lapisan diizinkan untuk kejelasan visualisasi.');
    }
  });
  
  // Reset visualisasi dan jaringan
  function resetVisualization() {
    const network = new NeuralNetwork(currentArchitecture);
    networkVisualizer.render(network);
    document.getElementById('weight-changes').innerHTML = ''; // Bersihkan log perubahan bobot
    lossChart.data.labels = [];
    lossChart.data.datasets[0].data = [];
    lossChart.update();
    trainingStatus.textContent = 'Siap untuk melatih';
    trainingProgress.style.width = '0%';
    trainBtn.disabled = false;
    addLayerBtn.disabled = false;
    learningRateInput.disabled = false;
    epochsInput.disabled = false;
  }
  
  // Event listener untuk input laju pembelajaran
  learningRateInput.addEventListener('input', () => {
    learningRateValue.textContent = learningRateInput.value;
  });
  
  // Event listener untuk tombol latih
  trainBtn.addEventListener('click', async () => {
    await trainNetwork();
  });
  
  // Event listener untuk tombol reset
  resetBtn.addEventListener('click', () => {
    resetVisualization();
  });

  // Fungsi untuk menampilkan modal kustom (pengganti alert)
  function showCustomAlert(message) {
      const alertModal = document.createElement('div');
      alertModal.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          z-index: 1000;
          text-align: center;
          max-width: 400px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: var(--text);
      `;
      alertModal.innerHTML = `
          <p>${message}</p>
          <button id="close-alert" style="margin-top: 15px; background-color: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Tutup</button>
      `;
      document.body.appendChild(alertModal);

      document.getElementById('close-alert').addEventListener('click', () => {
          document.body.removeChild(alertModal);
      });
  }
  
  // Fungsi pelatihan jaringan dengan animasi dan pembaruan visual
  async function trainNetwork() {
    const learningRate = parseFloat(learningRateInput.value);
    const epochs = parseInt(epochsInput.value);
    
    // Buat jaringan baru dengan arsitektur saat ini
    const network = new NeuralNetwork(currentArchitecture);
    networkVisualizer.render(network); // Render jaringan awal
    
    // Masalah XOR sederhana untuk demonstrasi
    // Jaringan akan belajar memprediksi output XOR berdasarkan input
    const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const targets = [[0], [1], [1], [0]];
    
    // Hapus data sebelumnya dari grafik dan log bobot
    document.getElementById('weight-changes').innerHTML = '';
    lossChart.data.labels = [];
    lossChart.data.datasets[0].data = [];
    lossChart.update();
    
    // Nonaktifkan kontrol selama pelatihan
    trainBtn.disabled = true;
    addLayerBtn.disabled = true;
    learningRateInput.disabled = true;
    epochsInput.disabled = true;
    
    // Perbarui status pelatihan
    trainingStatus.textContent = 'Pelatihan dimulai...';
    trainingProgress.style.width = '0%';
    
    // Latih jaringan dan perbarui visualisasi di setiap epoch
    await network.train(inputs, targets, learningRate, epochs, async (epoch, history) => {
      // Perbarui progress bar
      const progress = ((epoch + 1) / epochs) * 100;
      trainingProgress.style.width = `${progress}%`;
      trainingStatus.textContent = `Pelatihan... Epoch ${epoch + 1}/${epochs}`;
      
      // Perbarui grafik kerugian (loss chart)
      lossChart.data.labels.push(epoch + 1);
      lossChart.data.datasets[0].data.push(history.loss[epoch]);
      lossChart.update();
      
      // Visualisasikan aktivitas jaringan setiap beberapa epoch atau di akhir
      if (epoch % 5 === 0 || epoch === epochs - 1 || epoch === 0) { // Render di epoch 0, setiap 5, dan terakhir
        // Sorot neuron acak untuk menunjukkan aktivitas
        const activeNeurons = [];
        for (let l = 0; l < network.layers.length; l++) {
          for (let n = 0; n < network.layers[l].length; n++) {
            if (Math.random() < 0.3) { // 30% kemungkinan untuk mengaktifkan
              activeNeurons.push({ layer: l, neuron: n });
            }
          }
        }
        
        // Sorot beberapa perubahan bobot terbesar
        const activeConnections = [];
        if (epoch > 0) {
          const currentWeights = history.weights[epoch];
          const prevWeights = history.weights[epoch - 1];
          
          const allChanges = [];
          for (let l = 0; l < currentWeights.length; l++) {
            for (let i = 0; i < currentWeights[l].length; i++) {
              for (let j = 0; j < currentWeights[l][i].length; j++) {
                const change = currentWeights[l][i][j] - prevWeights[l][i][j];
                if (Math.abs(change) > 0.05) { // Hanya perubahan signifikan
                  allChanges.push({
                    fromLayer: l,
                    fromNeuron: j,
                    toNeuron: i,
                    change: change
                  });
                }
              }
            }
          }
          
          // Urutkan dan ambil 5 perubahan teratas
          allChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
          activeConnections.push(...allChanges.slice(0, 5));
        }
        
        // Render ulang visualisasi jaringan dengan neuron/koneksi aktif
        networkVisualizer.render(network, activeNeurons, activeConnections);
        
        // Tampilkan perubahan bobot untuk beberapa epoch awal dan akhir
        if (epoch < 5 || epoch >= epochs - 5) {
            const currentWeights = history.weights[epoch];
            const prevWeights = epoch > 0
                ? history.weights[epoch - 1]
                : currentWeights.map(layer =>
                    layer.map(neuron =>
                    neuron.map(() => 0)
                    )
                );
            await weightChangeVisualizer.render(epoch, currentWeights, prevWeights);
        }
      }
      
      // Penundaan kecil untuk memungkinkan animasi terlihat
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    // Pelatihan selesai
    trainingStatus.textContent = 'Pelatihan selesai!';
    trainBtn.disabled = false;
    addLayerBtn.disabled = false;
    learningRateInput.disabled = false;
    epochsInput.disabled = false;
    
    // Render akhir dengan semua neuron aktif (opsional, bisa dihapus)
    const activeNeurons = [];
    for (let l = 0; l < network.layers.length; l++) {
      for (let n = 0; n < network.layers[l].length; n++) {
        activeNeurons.push({ layer: l, neuron: n });
      }
    }
    networkVisualizer.render(network, activeNeurons);
    
    // Tampilkan prediksi akhir untuk masalah XOR
    await new Promise(resolve => setTimeout(resolve, 1000));
    trainingStatus.innerHTML = `Pelatihan selesai!<br>Prediksi akhir untuk masalah XOR:<br>
      [0,0] → ${network.forward([0,0])[0].toFixed(4)}<br>
      [0,1] → ${network.forward([0,1])[0].toFixed(4)}<br>
      [1,0] → ${network.forward([1,0])[0].toFixed(4)}<br>
      [1,1] → ${network.forward([1,1])[0].toFixed(4)}`;
  }
  
  // Inisialisasi aplikasi saat DOM dimuat
  createLayerControls();
  resetVisualization();
});
