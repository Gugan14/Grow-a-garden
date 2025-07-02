// Wait for the entire page to load before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- SETUP ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // =================================================================
    // --- WORLD & MAP DATA (Layout has been changed to match the image) ---
    // =================================================================
    const world = {
        plots: [],
        shops: [] 
        // --- REMOVED: No more fences ---
    };

    // --- CHANGED: New constants for the 3x2 layout ---
    const PLOT_WIDTH = 220;
    const PLOT_HEIGHT = 120;
    const PLOT_ROWS = 3; 
    const PLOT_COLS = 2;
    const VERTICAL_PADDING = 50; // Space between plots vertically
    const AISLE_WIDTH = 200;     // Wide central aisle
    const PLOT_SOIL_COLOR = '#8b5a2b';
    
    function setupWorld() {
        // --- Make sure to clear old data when resizing ---
        world.plots = [];
        world.shops = [];

        // --- UPDATED: Plot position calculation for the new layout ---
        const totalPlotsWidth = (PLOT_COLS * PLOT_WIDTH) + AISLE_WIDTH;
        const totalPlotsHeight = (PLOT_ROWS * PLOT_HEIGHT) + ((PLOT_ROWS - 1) * VERTICAL_PADDING);
        const plotsStartX = (canvas.width - totalPlotsWidth) / 2;
        const plotsStartY = (canvas.height - totalPlotsHeight) / 2;

        for (let row = 0; row < PLOT_ROWS; row++) {
            for (let col = 0; col < PLOT_COLS; col++) {
                world.plots.push({
                    x: plotsStartX + col * (PLOT_WIDTH + AISLE_WIDTH),
                    y: plotsStartY + row * (PLOT_HEIGHT + VERTICAL_PADDING),
                    width: PLOT_WIDTH,
                    height: PLOT_HEIGHT,
                    subdivisions: 4 
                });
            }
        }
        
        // --- REMOVED: All fence calculation logic is gone ---

        // --- UPDATED: Shop positions to match new layout ---
        const shopY = plotsStartY - 100; // Position shops above the plots
        const firstColX = plotsStartX;
        const secondColX = plotsStartX + PLOT_WIDTH + AISLE_WIDTH;

        // Seed Shop (top-left)
        world.shops.push({
            x: firstColX + (PLOT_WIDTH / 2) - 60, // Center the shop over the plot
            y: shopY,
            label: "Seed Shop",
            awningColor1: '#ffffff',
            awningColor2: '#4a90e2' // Blue
        });
        // Sell Place (top-right)
        world.shops.push({
            x: secondColX + (PLOT_WIDTH / 2) - 60, // Center the shop over the plot
            y: shopY,
            label: "Sell Here",
            awningColor1: '#ffffff',
            awningColor2: '#e24a4a' // Red
        });
    }

    // --- PLAYER ---
    const player = {
        // --- UPDATED: Player starts in the middle of the aisle ---
        x: canvas.width / 2,
        y: canvas.height - 100, // Start near the bottom of the screen
        speed: 4,
        torso: { width: 30, height: 45 },
        head: { radius: 12 },
        arm: { width: 10, height: 40 },
        leg: { width: 12, height: 50 },
        colors: {
            skin: '#E0AC69', shirt: '#2a52be', pants: '#3d2b1f',
        }
    };

    // --- JOYSTICK (unchanged) ---
    let isJoystickActive = false;
    let joystick = { x: 0, y: 0 };
    let joystickCenterX, joystickCenterY, joystickRadius;
    function setupJoystick() {
        const rect = joystickContainer.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width / 2;
        joystickCenterY = rect.top + rect.height / 2;
        joystickRadius = joystickContainer.offsetWidth / 2;
    }
    
    // --- EVENT LISTENERS (unchanged) ---
    joystickContainer.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    joystickContainer.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
    function onPointerDown(e) { isJoystickActive = true; e.preventDefault(); setupJoystick(); }
    function onPointerUp() { isJoystickActive = false; joystick = { x: 0, y: 0 }; joystickStick.style.transform = `translate(0px, 0px)`; }
    function onPointerMove(e) {
        if (!isJoystickActive) return;
        const pointerX = e.touches ? e.touches[0].clientX : e.clientX;
        const pointerY = e.touches ? e.touches[0].clientY : e.clientY;
        let dx = pointerX - joystickCenterX; let dy = pointerY - joystickCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) { joystick.x = 0; joystick.y = 0; return; }
        const normalizedX = dx / distance; const normalizedY = dy / distance;
        joystick.x = normalizedX; joystick.y = normalizedY;
        const stickMoveDistance = Math.min(distance, joystickRadius);
        const stickX = normalizedX * stickMoveDistance; const stickY = normalizedY * stickMoveDistance;
        joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;
    }

    // --- WORLD DRAWING FUNCTIONS ---

    function drawPlots() {
        ctx.strokeStyle = '#6b4423'; 
        ctx.lineWidth = 8;
        
        world.plots.forEach(plot => {
            ctx.fillStyle = PLOT_SOIL_COLOR;
            ctx.fillRect(plot.x, plot.y, plot.width, plot.height);
            ctx.strokeRect(plot.x, plot.y, plot.width, plot.height);

            const subHeight = plot.height / plot.subdivisions;
            ctx.lineWidth = 4;
            for (let i = 1; i < plot.subdivisions; i++) {
                ctx.beginPath();
                ctx.moveTo(plot.x, plot.y + i * subHeight);
                ctx.lineTo(plot.x + plot.width, plot.y + i * subHeight);
                ctx.stroke();
            }
        });
    }
    
    // --- REMOVED: The drawFences() function is no longer needed. ---

    function drawShops() {
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        
        world.shops.forEach(shop => {
            const counterWidth = 120; const counterHeight = 40;
            const poleWidth = 10; const poleHeight = 60;
            const awningHeight = 30;

            ctx.fillStyle = '#6b4423';
            ctx.fillRect(shop.x, shop.y, counterWidth, counterHeight);
            ctx.fillRect(shop.x + poleWidth, shop.y - poleHeight, poleWidth, poleHeight);
            ctx.fillRect(shop.x + counterWidth - (poleWidth*2), shop.y - poleHeight, poleWidth, poleHeight);
            
            const awningY = shop.y - poleHeight - awningHeight;
            ctx.fillStyle = shop.awningColor1;
            ctx.fillRect(shop.x, awningY, counterWidth, awningHeight);
            ctx.fillStyle = shop.awningColor2;
            for(let i = 0; i < counterWidth; i += 20) {
                 ctx.fillRect(shop.x + i, awningY, 10, awningHeight);
            }
            
            ctx.fillStyle = "#000000";
            ctx.fillText(shop.label, shop.x + counterWidth / 2, shop.y - poleHeight - awningHeight - 10);
        });
    }

    // --- PLAYER DRAWING FUNCTION (unchanged) ---
    function drawPlayer() {
        const p = player;
        const torsoX = p.x - p.torso.width / 2;
        const torsoY = p.y - p.torso.height / 2;
        ctx.fillStyle = p.colors.pants;
        ctx.fillRect(torsoX, torsoY + p.torso.height, p.leg.width, p.leg.height);
        ctx.fillRect(torsoX + p.torso.width - p.leg.width, torsoY + p.torso.height, p.leg.width, p.leg.height);
        ctx.fillStyle = p.colors.skin;
        ctx.fillRect(torsoX - p.arm.width, torsoY, p.arm.width, p.arm.height);
        ctx.fillRect(torsoX + p.torso.width, torsoY, p.arm.width, p.arm.height);
        ctx.fillStyle = p.colors.shirt;
        ctx.fillRect(torsoX, torsoY, p.torso.width, p.torso.height);
        ctx.fillStyle = p.colors.skin;
        ctx.beginPath();
        ctx.arc(p.x, torsoY - p.head.radius, p.head.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- UPDATED GAME LOOP ---
    function gameLoop() {
        // 1. UPDATE player position
        if (isJoystickActive) {
            player.x += joystick.x * player.speed;
            player.y += joystick.y * player.speed;
        }

        // 2. PREVENT player from going off-screen
        const characterLeftEdge = player.x - player.torso.width / 2 - player.arm.width;
        const characterRightEdge = player.x + player.torso.width / 2 + player.arm.width;
        const characterTopEdge = player.y - player.torso.height / 2 - player.head.radius * 2;
        const characterBottomEdge = player.y + player.torso.height / 2 + player.leg.height;
        if (characterLeftEdge < 0) player.x = player.torso.width / 2 + player.arm.width;
        if (characterRightEdge > canvas.width) player.x = canvas.width - player.torso.width / 2 - player.arm.width;
        if (characterTopEdge < 0) player.y = player.torso.height / 2 + player.head.radius * 2;
        if (characterBottomEdge > canvas.height) player.y = canvas.height - player.torso.height / 2 - player.leg.height;
        
        // 3. DRAW everything
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the world elements
        drawPlots();
        drawShops();
        // --- REMOVED: drawFences() call is gone ---

        drawPlayer();

        // 4. REQUEST the next frame
        requestAnimationFrame(gameLoop);
    }

    // --- WINDOW RESIZE ---
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        setupWorld(); 
        setupJoystick();
    });

    // --- START THE GAME ---
    setupWorld(); 
    setupJoystick(); 
    gameLoop();
});
