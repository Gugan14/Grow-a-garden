const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const tileSize = 32;
const mapWidth = 10;
const mapHeight = 10;

let coins = 0;
document.getElementById('coins').textContent = coins;

const keysDown = {};

// Simple map legend:
// 0 = grass (walkable)
// 1 = tree (block)
// 2 = garden soil (plantable)
const map = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,2,2,0,0,0,1],
  [1,0,2,2,2,2,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1],
];

// Garden tile states:
// For tiles with soil (2), we track plant state:
// "empty", "planted", "watered", "grown"
const gardenState = [];
for(let y=0; y<mapHeight; y++) {
  gardenState[y] = [];
  for(let x=0; x<mapWidth; x++) {
    gardenState[y][x] = (map[y][x] === 2) ? { state: 'empty', growTimer: 0 } : null;
  }
}

let player = {
  x: 1,
  y: 1,
  size: tileSize - 4,
  color: '#004400',
};

function drawTile(x, y) {
  const tile = map[y][x];
  switch(tile) {
    case 0: // grass
      ctx.fillStyle = '#6ab04c';
      ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
      break;
    case 1: // tree
      ctx.fillStyle = '#1b4d3e';
      ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
      ctx.fillStyle = '#265d45';
      ctx.beginPath();
      ctx.moveTo(x*tileSize+tileSize/2, y*tileSize+4);
      ctx.lineTo(x*tileSize+4, y*tileSize+tileSize-4);
      ctx.lineTo(x*tileSize+tileSize-4, y*tileSize+tileSize-4);
      ctx.closePath();
      ctx.fill();
      break;
    case 2: // garden soil
      ctx.fillStyle = '#b97a56';
      ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
      // Draw plant based on state
      const g = gardenState[y][x];
      if(g.state === 'planted') {
        ctx.fillStyle = '#2f9e2f';
        ctx.fillRect(x*tileSize+tileSize/4, y*tileSize+tileSize/4, tileSize/2, tileSize/2);
      } else if(g.state === 'watered') {
        ctx.fillStyle = '#1471f2';
        ctx.fillRect(x*tileSize+tileSize/4, y*tileSize+tileSize/4, tileSize/2, tileSize/2);
      } else if(g.state === 'grown') {
        ctx.fillStyle = '#0b4a07';
        ctx.beginPath();
        ctx.arc(x*tileSize+tileSize/2, y*tileSize+tileSize/2, tileSize/3, 0, Math.PI*2);
        ctx.fill();
      }
      break;
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(
    player.x*tileSize + 2,
    player.y*tileSize + 2,
    player.size,
    player.size
  );
}

function canMove(x, y) {
  if(x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return false;
  return map[y][x] !== 1;
}

function updateGarden() {
  for(let y=0; y<mapHeight; y++) {
    for(let x=0; x<mapWidth; x++) {
      let g = gardenState[y][x];
      if(g && g.state === 'watered') {
        g.growTimer++;
        if(g.growTimer > 180) { // grow after ~3 seconds (at 60fps)
          g.state = 'grown';
          g.growTimer = 0;
        }
      }
    }
  }
}

function gameLoop() {
  // Movement
  if(keysDown['ArrowUp'] || keysDown['w']) {
    if(canMove(player.x, player.y-1)) player.y--;
    keysDown['ArrowUp'] = false; keysDown['w'] = false;
  }
  if(keysDown['ArrowDown'] || keysDown['s']) {
    if(canMove(player.x, player.y+1)) player.y++;
    keysDown['ArrowDown'] = false; keysDown['s'] = false;
  }
  if(keysDown['ArrowLeft'] || keysDown['a']) {
    if(canMove(player.x-1, player.y)) player.x--;
    keysDown['ArrowLeft'] = false; keysDown['a'] = false;
  }
  if(keysDown['ArrowRight'] || keysDown['d']) {
    if(canMove(player.x+1, player.y)) player.x++;
    keysDown['ArrowRight'] = false; keysDown['d'] = false;
  }

  updateGarden();

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let y=0; y<mapHeight; y++) {
    for(let x=0; x<mapWidth; x++) {
      drawTile(x, y);
    }
  }
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  keysDown[e.key] = true;

  if(e.key.toLowerCase() === 'z') {
    // Interact with garden tile player is on
    let g = gardenState[player.y][player.x];
    if(g) {
      if(g.state === 'empty') {
        g.state = 'planted';
      } else if(g.state === 'planted') {
        g.state = 'watered';
        g.growTimer = 0;
      } else if(g.state === 'grown') {
        g.state = 'empty';
        coins += 10;
        document.getElementById('coins').textContent = coins;
      }
    }
  }
});

gameLoop();
