document.addEventListener('DOMContentLoaded', () => {
    // --- GAME DATA ---
    const PLANT_DATA = {
        carrot: {
            name: 'Carrot',
            icon: '🥕',
            cost: 10,
            growthTime: 10, // in seconds
            sellValue: 25,
            xp: 15,
            growthStages: ['🌱', '🌿', '🥕']
        },
        potato: {
            name: 'Potato',
            icon: '🥔',
            cost: 25,
            growthTime: 30,
            sellValue: 60,
            xp: 40,
            growthStages: ['🌱', '🌿', '🥔']
        },
        tomato: {
            name: 'Tomato',
            icon: '🍅',
            cost: 50,
            growthTime: 60,
            sellValue: 120,
            xp: 90,
            growthStages: ['🌱', '🌿', '🍅'],
            unlockLevel: 2
        }
    };

    const GARDEN_SIZE = 15; // 5x3 grid

    // --- GAME STATE ---
    let gameState = {
        player: {
            money: 20,
            level: 1,
            xp: 0
        },
        garden: [], // Array to hold the state of each plot
        selectedSeed: null
    };

    // --- DOM ELEMENTS ---
    const moneyEl = document.getElementById('money');
    const levelEl = document.getElementById('level');
    const xpEl = document.getElementById('xp');
    const nextLevelXpEl = document.getElementById('next-level-xp');
    const gardenPlotEl = document.getElementById('garden-plot');
    const shopItemsEl = document.getElementById('shop-items');
    const selectedSeedEl = document.getElementById('selected-seed');

    // --- INITIALIZATION ---
    function init() {
        loadGame(); // Try to load saved data first
        createGarden();
        createShop();
        renderUI();
        setInterval(gameTick, 1000); // Main game loop runs every second
    }

    // --- GAME LOOP ---
    function gameTick() {
        let hasChanged = false;
        gameState.garden.forEach(plot => {
            if (plot.plant && plot.growth < plot.plant.growthTime) {
                plot.growth++;
                hasChanged = true;
            }
        });

        if (hasChanged) {
            renderGarden();
            saveGame();
        }
    }

    // --- CORE LOGIC ---
    function createGarden() {
        if (gameState.garden.length === 0) { // Only create if not loaded from save
            for (let i = 0; i < GARDEN_SIZE; i++) {
                gameState.garden.push({ plant: null, growth: 0 });
            }
        }

        gardenPlotEl.innerHTML = ''; // Clear existing plot
        gameState.garden.forEach((plot, index) => {
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
            item.innerHTML = `
                <div class="shop-icon">${plant.icon}</div>
                <div>${plant.name}</div>
                <div>$${plant.cost}</div>
                ${plant.unlockLevel > 1 ? `<div>Lvl ${plant.unlockLevel}</div>` : ''}
            `;
            item.addEventListener('click', () => onSeedSelect(seedId));
            shopItemsEl.appendChild(item);
        }
    }
    
    function onPlotClick(index) {
        const plot = gameState.garden[index];

        if (!plot.plant && gameState.selectedSeed) { // Plant a seed
            const seedInfo = PLANT_DATA[gameState.selectedSeed];
            if (gameState.player.money >= seedInfo.cost) {
                gameState.player.money -= seedInfo.cost;
                plot.plant = seedInfo;
                plot.growth = 0;
            } else {
                alert("Not enough money!");
            }
        } else if (plot.plant && plot.growth >= plot.plant.growthTime) { // Harvest
            gameState.player.money += plot.plant.sellValue;
            addXp(plot.plant.xp);
            
            plot.plant = null;
            plot.growth = 0;
        }
        renderUI();
        saveGame();
    }

    function onSeedSelect(seedId) {
        const plant = PLANT_DATA[seedId];
        if (plant.unlockLevel && plant.unlockLevel > gameState.player.level) {
            alert(`You must be level ${plant.unlockLevel} to select this seed!`);
            return;
        }

        gameState.selectedSeed = seedId;
        renderUI();
    }

    function addXp(amount) {
        gameState.player.xp += amount;
        const xpForNextLevel = getXpForNextLevel();
        if (gameState.player.xp >= xpForNextLevel) {
            levelUp(xpForNextLevel);
        }
    }

    function levelUp(xpForPreviousLevel) {
        gameState.player.level++;
        gameState.player.xp -= xpForPreviousLevel;
        alert(`Congratulations! You've reached Level ${gameState.player.level}!`);
        // The shop will automatically unlock new items in renderUI
    }

    function getXpForNextLevel() {
        return Math.floor(100 * Math.pow(1.5, gameState.player.level - 1));
    }

    // --- RENDERING / UI UPDATES ---
    function renderUI() {
        renderStats();
        renderGarden();
        renderShop();
    }

    function renderStats() {
        moneyEl.textContent = gameState.player.money;
        levelEl.textContent = gameState.player.level;
        xpEl.textContent = gameState.player.xp;
        nextLevelXpEl.textContent = getXpForNextLevel();
    }

    function renderGarden() {
        const cells = document.querySelectorAll('.garden-cell');
        cells.forEach((cell, index) => {
            const plot = gameState.garden[index];
            if (plot.plant) {
                const progress = plot.growth / plot.plant.growthTime;
                if (progress >= 1) {
                    cell.textContent = plot.plant.icon;
                    cell.classList.add('ready');
                } else if (progress >= 0.5) {
                    cell.textContent = plot.plant.growthStages[1];
                    cell.classList.remove('ready');
                } else {
                    cell.textContent = plot.plant.growthStages[0];
                    cell.classList.remove('ready');
                }
            } else {
                cell.textContent = ''; // Empty plot
                cell.classList.remove('ready');
            }
        });
    }

    function renderShop() {
        const items = document.querySelectorAll('.shop-item');
        items.forEach(item => {
            const seedId = item.dataset.seed;
            const plant = PLANT_DATA[seedId];

            // Handle selected state
            if (seedId === gameState.selectedSeed) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }

            // Handle disabled/locked state
            if ((plant.unlockLevel && plant.unlockLevel > gameState.player.level) || gameState.player.money < plant.cost) {
                item.classList.add('disabled');
            } else {
                item.classList.remove('disabled');
            }
        });
        selectedSeedEl.textContent = gameState.selectedSeed ? PLANT_DATA[gameState.selectedSeed].name : 'None';
    }


    // --- DATA PERSISTENCE ---
    function saveGame() {
        localStorage.setItem('gardenRpgSave', JSON.stringify(gameState));
    }

    function loadGame() {
        const savedData = localStorage.getItem('gardenRpgSave');
        if (savedData) {
            gameState = JSON.parse(savedData);
            // We need to ensure loaded plants have the full object data, not just what was saved
            gameState.garden.forEach(plot => {
                if (plot.plant) {
                    plot.plant = PLANT_DATA[plot.plant.name.toLowerCase()];
                }
            });
        }
    }

    // --- START THE GAME ---
    init();
});
