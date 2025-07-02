document.addEventListener('DOMContentLoaded', () => {
    // --- CANVAS & CONTEXT ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // --- GAME CONSTANTS ---
    const TILE_SIZE = 32;
    const PLAYER_SPEED = 2;
    const GARDEN_SIZE = 15; // 5x3 grid

    // --- GAME DATA ---
    const PLANT_DATA = {
        carrot: { name: 'Carrot', icon: '🥕', cost: 10, growthTime: 10, sellValue: 25, xp: 15, growthStages: ['🌱', '🌿', '🥕'] },
        potato: { name: 'Potato', icon: '🥔', cost: 25, growthTime: 30, sellValue: 60, xp: 40, growthStages: ['🌱', '🌿', '🥔'] },
        tomato: { name: 'Tomato', icon: '🍅', cost: 50, growthTime: 60, sellValue: 120, xp: 90, growthStages: ['🌱', '🌿', '🍅'], unlockLevel: 2 },
        eggplant: { name: 'Eggplant', icon: '🍆', cost: 100, growthTime: 120, sellValue: 250, xp: 200, growthStages: ['🌱', '🌿', '🍆'], unlockLevel: 3 },
    };

    // 0 = Grass, 1 = Wall, 2 = Shop Zone, 3 = Garden Zone
    const map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 3, 1],
        [1, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 3, 3, 3, 1, 0, 0, 3, 1],
        [1, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 3, 3, 3, 3, 1, 0, 0, 3, 1],
        [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 3, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    canvas.width = map[0].length * TILE_SIZE;
    canvas.height = map.length * TILE_SIZE;

    // --- GAME STATE ---
    let gameState = {
        player: { x: TILE_SIZE * 2, y: TILE_SIZE * 2, money: 20, level: 1, xp: 0 },
        garden: [],
        selectedSeed: null,
        isModalOpen: false,
    };

    // --- DOM ELEMENTS ---
    const moneyEl = document.getElementById('money');
    const levelEl = document.getElementById('level');
    const xpEl = document.getElementById('xp');
    const nextLevelXpEl = document.getElementById('next-level-xp');
    const interactionPromptEl = document.getElementById('interaction-prompt');
    const shopModalEl = document.getElementById('shop-modal');
    const gardenModalEl = document.getElementById('garden-modal');
    const shopItemsEl = document.getElementById('shop-items');
    const gardenPlotEl = document.getElementById('garden-plot');
    const selectedSeedShopEl = document.getElementById('selected-seed-shop');
    const selectedSeedGardenEl = document.getElementById('selected-seed-garden');

    // --- CONTROLS ---
    const keys = { w: false, a: false, s: false, d: false };
    let joyDirection = { x: 0, y: 0 };
    let currentInteraction = null;

    // --- GAME LOOP ---
    function gameLoop() {
        if (!gameState.isModalOpen) {
            update();
        }
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    function update() {
        movePlayer();
        checkInteractionZones();
        renderStats();
    }
    
    // Plant growth happens on a separate, slower timer
    function gameTick() {
        let hasChanged = false;
        gameState.garden.forEach(plot => {
            if (plot.plant && plot.growth < plot.plant.growthTime) {
                plot.growth++;
                hasChanged = true;
            }
        });
        if (hasChanged) {
            if (gameState.isModalOpen && !gardenModalEl.classList.contains('hidden')) {
                renderGarden();
            }
        }
    }

    // --- DRAWING ---
    function draw() {
        ctx.fillStyle = '#3a5941';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawMap();
        ctx.fillStyle = 'blue';
        ctx.fillRect(gameState.player.x, gameState.player.y, TILE_SIZE, TILE_SIZE);
    }

    function drawMap() {
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                const tile = map[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                if (tile === 1) { ctx.fillStyle = '#6b4f3b'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
                else if (tile === 2) { ctx.fillStyle = '#ffde7a'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
                else if (tile === 3) { ctx.fillStyle = '#a0522d'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
            }
        }
    }

    // --- MOVEMENT & COLLISION ---
    function movePlayer() {
        let dx = (joyDirection.x * PLAYER_SPEED) || (keys.d ? PLAYER_SPEED : 0) - (keys.a ? PLAYER_SPEED : 0);
        let dy = (-joyDirection.y * PLAYER_SPEED) || (keys.s ? PLAYER_SPEED : 0) - (keys.w ? PLAYER_SPEED : 0);
        
        if (!isColliding(gameState.player.x + dx, gameState.player.y)) gameState.player.x += dx;
        if (!isColliding(gameState.player.x, gameState.player.y + dy)) gameState.player.y += dy;
    }

    function isColliding(x, y) {
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                if (map[r][c] === 1) { // 1 is a wall
                    const tileX = c * TILE_SIZE, tileY = r * TILE_SIZE;
                    if (x < tileX + TILE_SIZE && x + TILE_SIZE > tileX && y < tileY + TILE_SIZE && y + TILE_SIZE > tileY) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // --- INTERACTIONS ---
    function checkInteractionZones() {
        const pCol = Math.floor((gameState.player.x + TILE_SIZE / 2) / TILE_SIZE);
        const pRow = Math.floor((gameState.player.y + TILE_SIZE / 2) / TILE_SIZE);
        const tile = map[pRow]?.[pCol];
        
        if (tile === 2) { currentInteraction = 'shop'; }
        else if (tile === 3) { currentInteraction = 'garden'; }
        else { currentInteraction = null; }
        
        interactionPromptEl.classList.toggle('hidden', !currentInteraction || gameState.isModalOpen);
    }

    function handleInteraction() {
        if (gameState.isModalOpen) return;
        if (currentInteraction === 'shop') openModal(shopModalEl);
        else if (currentInteraction === 'garden') openModal(gardenModalEl);
    }

    // --- MODALS & UI ---
    function openModal(modalEl) {
        gameState.isModalOpen = true;
        modalEl.classList.remove('hidden');
        if (modalEl === shopModalEl) renderShop();
        if (modalEl === gardenModalEl) renderGarden();
    }

    function closeModal() {
        gameState.isModalOpen = false;
        shopModalEl.classList.add('hidden');
        gardenModalEl.classList.add('hidden');
        saveGame();
    }

    // --- GARDEN & SHOP LOGIC ---
    function createGarden() {
        if (gameState.garden.length === 0) {
            for (let i = 0; i < GARDEN_SIZE; i++) {
                gameState.garden.push({ plant: null, growth: 0 });
            }
        }
        gardenPlotEl.innerHTML = '';
        gameState.garden.forEach((_, index) => {
            const cell = document.createElement('div');
            cell.classList.add('garden-cell');
            cell.dataset.index = index;
            cell.addEventListener('click', () => onPlotClick(index));
            gardenPlotEl.appendChild(cell);
        });
    }

    function createShop() {
        shopItemsEl.innerHTML = '';
        for (const seedId in PLANT_DATA) {
            const plant = PLANT_DATA[seedId];
            const item = document.createElement('div');
            item.classList.add('shop-item');
            item.dataset.seed = seedId;
            item.innerHTML = `<div class="shop-icon">${plant.icon}</div><div>${plant.name}</div><div>$${plant.cost}</div>${plant.unlockLevel > 1 ? `<div>Lvl ${plant.unlockLevel}</div>` : ''}`;
            item.addEventListener('click', () => onSeedSelect(seedId));
            shopItemsEl.appendChild(item);
        }
    }

    function onPlotClick(index) {
        const plot = gameState.garden[index];
        if (!plot.plant && gameState.selectedSeed) { // Plant
            const seedInfo = PLANT_DATA[gameState.selectedSeed];
            if (gameState.player.money >= seedInfo.cost) {
                gameState.player.money -= seedInfo.cost;
                plot.plant = seedInfo;
                plot.growth = 0;
            } else { alert("Not enough money!"); }
        } else if (plot.plant && plot.growth >= plot.plant.growthTime) { // Harvest
            gameState.player.money += plot.plant.sellValue;
            addXp(plot.plant.xp);
            plot.plant = null;
            plot.growth = 0;
        }
        renderGarden();
        renderStats();
    }

    function onSeedSelect(seedId) {
        const plant = PLANT_DATA[seedId];
        if (plant.unlockLevel && plant.unlockLevel > gameState.player.level) {
            alert(`You must be level ${plant.unlockLevel} to buy this!`);
            return;
        }
        gameState.selectedSeed = seedId;
        renderShop();
    }

    function addXp(amount) {
        gameState.player.xp += amount;
        const xpForNextLevel = getXpForNextLevel();
        if (gameState.player.xp >= xpForNextLevel) {
            gameState.player.level++;
            gameState.player.xp -= xpForNextLevel;
            alert(`Congratulations! You've reached Level ${gameState.player.level}!`);
        }
    }

    function getXpForNextLevel() {
        return Math.floor(100 * Math.pow(1.5, gameState.player.level - 1));
    }

    // --- RENDER FUNCTIONS ---
    function renderStats() {
        moneyEl.textContent = gameState.player.money;
        levelEl.textContent = gameState.player.level;
        xpEl.textContent = gameState.player.xp;
        nextLevelXpEl.textContent = getXpForNextLevel();
    }
    
    function renderGarden() {
        document.querySelectorAll('.garden-cell').forEach((cell, index) => {
            const plot = gameState.garden[index];
            cell.classList.remove('ready');
            if (plot.plant) {
                const progress = plot.growth / plot.plant.growthTime;
                if (progress >= 1) { cell.textContent = plot.plant.icon; cell.classList.add('ready'); }
                else if (progress >= 0.5) { cell.textContent = plot.plant.growthStages[1]; }
                else { cell.textContent = plot.plant.growthStages[0]; }
            } else { cell.textContent = ''; }
        });
        selectedSeedGardenEl.textContent = gameState.selectedSeed ? PLANT_DATA[gameState.selectedSeed].name : 'None';
    }

    function renderShop() {
        document.querySelectorAll('.shop-item').forEach(item => {
            const seedId = item.dataset.seed;
            const plant = PLANT_DATA[seedId];
            item.classList.toggle('selected', seedId === gameState.selectedSeed);
            item.classList.toggle('disabled', (plant.unlockLevel && plant.unlockLevel > gameState.player.level) || gameState.player.money < plant.cost);
        });
        selectedSeedShopEl.textContent = gameState.selectedSeed ? PLANT_DATA[gameState.selectedSeed].name : 'None';
    }

    // --- DATA PERSISTENCE ---
    function saveGame() { localStorage.setItem('gardenRpgSave2D', JSON.stringify(gameState)); }
    function loadGame() {
        const savedData = localStorage.getItem('gardenRpgSave2D');
        if (savedData) {
            const loadedState = JSON.parse(savedData);
            // Re-link plant data from PLANT_DATA to avoid stale/incomplete objects in save file
            loadedState.garden.forEach(plot => {
                if (plot.plant) { plot.plant = PLANT_DATA[plot.plant.name.toLowerCase()]; }
            });
            gameState = loadedState;
        }
    }

    // --- INITIALIZATION ---
    function init() {
        loadGame();
        createGarden();
        createShop();

        // Input Listeners
        window.addEventListener('keydown', e => { if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === 'e') handleInteraction(); });
        window.addEventListener('keyup', e => { if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });
        document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', closeModal));

        // Joystick
        const joyManager = nipplejs.create({ zone: document.getElementById('joystick-zone'), mode: 'static', position: { left: '50%', top: '50%' }, color: 'white' });
        joyManager.on('move', (_, data) => { if (data.vector) { joyDirection.x = data.vector.x; joyDirection.y = data.vector.y; } });
        joyManager.on('end', () => { joyDirection = { x: 0, y: 0 }; });

        // Start loops
        setInterval(gameTick, 1000);
        gameLoop();
    }
    
    init();
});
