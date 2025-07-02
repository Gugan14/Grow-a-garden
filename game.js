const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const tileSize = 60;
const rows = 10;
const cols = 10;
let coins = 0;
let currentTool = 'seed';

document.getElementById("coins").textContent = coins;

let garden = Array(rows).fill().map(() =>
  Array(cols).fill().map(() => ({
    state: 'empty',
    growTimer: 0
  }))
);

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / tileSize);
  const y = Math.floor((e.clientY - rect.top) / tileSize);
  const tile = garden[y][x];

  if (currentTool === 'seed' && tile.state === 'empty') {
    tile.state = 'planted';
  } else if (currentTool === 'water' && tile.state === 'planted') {
    tile.state = 'watered';
    tile.growTimer = 0;
  } else if (currentTool === 'harvest' && tile.state === 'grown') {
    tile.state = 'empty';
    coins += 5;
    document.getElementById("coins").textContent = coins;
  }
});

function drawTile(x, y, tile) {
  if (tile.state === 'empty') ctx.fillStyle = '#b6e388';
  else if (tile.state === 'planted') ctx.fillStyle = '#d4a373';
  else if (tile.state === 'watered') ctx.fillStyle = '#6495ED';
  else if (tile.state === 'grown') ctx.fillStyle = '#228B22';
  ctx.fillRect(x * tileSize, y * tileSize, tileSize - 2, tileSize - 2);
}

function update() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let tile = garden[y][x];
      if (tile.state === 'watered') {
        tile.growTimer++;
        if (tile.growTimer > 120) {
          tile.state = 'grown';
        }
      }
    }
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      drawTile(x, y, garden[y][x]);
    }
  }
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();
