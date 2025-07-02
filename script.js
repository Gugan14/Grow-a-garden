document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // =================================================================
    // --- NEW: Camera Object ---
    // The camera stores the top-left coordinate of our "view" into the world.
    // =================================================================
    const camera = {
        x: 0,
        y: 0
    };

    const world = { plots: [], shops: [] };

    // --- CHANGED: Plot dimensions are 10x larger ---
    const PLOT_WIDTH = 2800;  // Was 280
    const PLOT_HEIGHT = 1600; // Was 160
    const PLOT_ROWS = 3, PLOT_COLS = 2;
    const VERTICAL_PADDING = 800; // Was 80
    const AISLE_WIDTH = 2500;     // Was 250
    const PLOT_SOIL_COLOR = '#8b5a2b';

    const FENCE_COLOR = '#6b4423';
    const FENCE_LINE_WIDTH = 80;   // Was 8
    const FENCE_PADDING = 200;    // Was 20
    const FENCE_OPENING_WIDTH = 700; // Was 70
    
    function setupWorld() {
        world.plots = [];
        world.shops = [];

        // The world is now centered around coordinate (0,0)
        const totalPlotsWidth = (PLOT_COLS * PLOT_WIDTH) + AISLE_WIDTH;
        const plotsStartX = -totalPlotsWidth / 2;
        const plotsStartY = -1200; // A fixed starting point for the top plots

        for (let row = 0; row < PLOT_ROWS; row++) {
            for (let col = 0; col < PLOT_COLS; col++) {
                world.plots.push({
                    x: plotsStartX + col * (PLOT_WIDTH + AISLE_WIDTH),
                    y: plotsStartY + row * (PLOT_HEIGHT + VERTICAL_PADDING),
                    width: PLOT_WIDTH, height: PLOT_HEIGHT, subdivisions: 4,
                });
            }
        }
        
        const shopY = plotsStartY - 800; 
        const shopWidth = 1200; // Larger shops
        const shopHeight = 400;
        world.shops.push({
            x: -shopWidth / 2, // Center the shops horizontally
            y: shopY, label: "Seed Shop", awningColor1: '#ffffff', awningColor2: '#4a90e2'
        });
        world.shops.push({
            x: -shopWidth / 2,
            y: shopY - shopHeight * 2, label: "Sell Here", awningColor1: '#ffffff', awningColor2: '#e24a4a'
        });
    }

    const player = {
        // Player starts at the center of the world
        x: 0, y: 1000,
        speed: 15, // Speed needs to be much higher in a large world
        torso: { width: 22, height: 32 }, head: { radius: 9 },
        arm: { width: 8, height: 30 }, leg: { width: 9, height: 35 },
        colors: { skin: '#E0AC69', shirt: '#2a52be', pants: '#3d2b1f' }
    };

    // --- Unchanged Joystick & Event Listener code ---
    let isJoystickActive = false, joystick = { x: 0, y: 0 };
    let joystickCenterX, joystickCenterY, joystickRadius;
    function setupJoystick() { /* ... */ }
    // ... all the joystick functions are the same ...
    function setupJoystick() {
        const rect = joystickContainer.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width / 2;
        joystickCenterY = rect.top + rect.height / 2;
        joystickRadius = joystickContainer.offsetWidth / 2;
    }
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


    // --- CHANGED: ALL DRAWING FUNCTIONS NOW USE THE CAMERA OFFSET ---

    function drawPlots() {
        ctx.strokeStyle = '#6b4423'; 
        world.plots.forEach(plot => {
            // We subtract the camera's position from the plot's world position
            const screenX = plot.x - camera.x;
            const screenY = plot.y - camera.y;

            ctx.fillStyle = PLOT_SOIL_COLOR; 
            ctx.fillRect(screenX, screenY, plot.width, plot.height);
            ctx.lineWidth = 60; // Thicker border for bigger plot
            ctx.strokeRect(screenX, screenY, plot.width, plot.height);
            const subHeight = plot.height / plot.subdivisions;
            ctx.lineWidth = 30;
            for (let i = 1; i < plot.subdivisions; i++) {
                ctx.beginPath(); 
                ctx.moveTo(screenX, screenY + i * subHeight);
                ctx.lineTo(screenX + plot.width, screenY + i * subHeight); 
                ctx.stroke();
            }
        });
    }

    function drawFences() {
        ctx.strokeStyle = FENCE_COLOR;
        ctx.lineWidth = FENCE_LINE_WIDTH;
        
        world.plots.forEach((plot, index) => {
            const col = index % PLOT_COLS;
            const fx = plot.x - FENCE_PADDING;
            const fy = plot.y - FENCE_PADDING;
            const fw = plot.width + (FENCE_PADDING * 2);
            const fh = plot.height + (FENCE_PADDING * 2);
            const openingStartY = fy + (fh / 2) - (FENCE_OPENING_WIDTH / 2);
            const openingEndY = openingStartY + FENCE_OPENING_WIDTH;
            
            // Draw all lines relative to the camera
            ctx.beginPath();
            ctx.moveTo(fx - camera.x, fy - camera.y);
            ctx.lineTo(fx + fw - camera.x, fy - camera.y);
            ctx.moveTo(fx - camera.x, fy + fh - camera.y);
            ctx.lineTo(fx + fw - camera.x, fy + fh - camera.y);

            if (col === 0) {
                ctx.moveTo(fx - camera.x, fy - camera.y);
                ctx.lineTo(fx - camera.x, fy + fh - camera.y);
                ctx.moveTo(fx + fw - camera.x, fy - camera.y);
                ctx.lineTo(fx + fw - camera.x, openingStartY - camera.y);
                ctx.moveTo(fx + fw - camera.x, openingEndY - camera.y);
                ctx.lineTo(fx + fw - camera.x, fy + fh - camera.y);
            } else {
                ctx.moveTo(fx + fw - camera.x, fy - camera.y);
                ctx.lineTo(fx + fw - camera.x, fy + fh - camera.y);
                ctx.moveTo(fx - camera.x, fy - camera.y);
                ctx.lineTo(fx - camera.x, openingStartY - camera.y);
                ctx.moveTo(fx - camera.x, openingEndY - camera.y);
                ctx.lineTo(fx - camera.x, fy + fh - camera.y);
            }
            ctx.stroke();
        });
    }

    function drawShops() { /* Shop drawing also needs camera offset */ }
    
    // Player is now ALWAYS drawn in the center of the screen
    function drawPlayer() {
        const p = player;
        const playerScreenX = canvas.width / 2;
        const playerScreenY = canvas.height / 2;

        const torsoX = playerScreenX - p.torso.width / 2; 
        const torsoY = playerScreenY - p.torso.height / 2;
        ctx.fillStyle = p.colors.pants; ctx.fillRect(torsoX, torsoY + p.torso.height, p.leg.width, p.leg.height);
        ctx.fillRect(torsoX + p.torso.width - p.leg.width, torsoY + p.torso.height, p.leg.width, p.leg.height);
        ctx.fillStyle = p.colors.skin; ctx.fillRect(torsoX - p.arm.width, torsoY, p.arm.width, p.arm.height);
        ctx.fillRect(torsoX + p.torso.width, torsoY, p.arm.width, p.arm.height);
        ctx.fillStyle = p.colors.shirt; ctx.fillRect(torsoX, torsoY, p.torso.width, p.torso.height);
        ctx.fillStyle = p.colors.skin; ctx.beginPath();
        ctx.arc(playerScreenX, torsoY - p.head.radius, p.head.radius, 0, Math.PI * 2); ctx.fill();
    }


    function gameLoop() {
        // 1. UPDATE player's WORLD position
        if (isJoystickActive) {
            player.x += joystick.x * player.speed;
            player.y += joystick.y * player.speed;
        }

        // 2. UPDATE camera position to center on the player
        camera.x = player.x - canvas.width / 2;
        camera.y = player.y - canvas.height / 2;
        
        // 3. DRAW everything
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the world elements using the camera
        drawPlots();
        drawFences();
        // We will skip drawing shops for now as they might be far away

        // Draw the player last, in a fixed screen position
        drawPlayer();

        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // No need to re-run setup, camera handles resizing
        setupJoystick();
    });

    setupWorld(); 
    setupJoystick(); 
    gameLoop();
});
