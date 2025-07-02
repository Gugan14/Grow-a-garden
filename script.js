document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const camera = { x: 0, y: 0 };
    const world = { plots: [], shops: [] };

    // --- CHANGED: All world dimensions are now 5x the original size ---
    const PLOT_WIDTH = 1400;  // Was 2800 (Original: 280)
    const PLOT_HEIGHT = 800;   // Was 1600 (Original: 160)
    const PLOT_ROWS = 3, PLOT_COLS = 2;
    const VERTICAL_PADDING = 400; // Was 800 (Original: 80)
    const AISLE_WIDTH = 1250;     // Was 2500 (Original: 250)
    const PLOT_SOIL_COLOR = '#8b5a2b';

    const FENCE_COLOR = '#6b4423';
    const FENCE_LINE_WIDTH = 40;   // Was 80 (Original: 8)
    const FENCE_PADDING = 100;    // Was 200 (Original: 20)
    const FENCE_OPENING_WIDTH = 350; // Was 700 (Original: 70)
    
    function setupWorld() {
        world.plots = [];
        world.shops = [];

        const totalPlotsWidth = (PLOT_COLS * PLOT_WIDTH) + AISLE_WIDTH;
        const plotsStartX = -totalPlotsWidth / 2;
        const plotsStartY = -800; // Adjusted for new scale

        for (let row = 0; row < PLOT_ROWS; row++) {
            for (let col = 0; col < PLOT_COLS; col++) {
                world.plots.push({
                    x: plotsStartX + col * (PLOT_WIDTH + AISLE_WIDTH),
                    y: plotsStartY + row * (PLOT_HEIGHT + VERTICAL_PADDING),
                    width: PLOT_WIDTH, height: PLOT_HEIGHT, subdivisions: 4,
                });
            }
        }
        
        const shopY = plotsStartY - 600; 
        const shopWidth = 600; // 5x scale
        const shopCenterDistance = 800;

        world.shops.push({
            x: -shopCenterDistance,
            y: shopY, label: "Seed Shop", awningColor1: '#ffffff', awningColor2: '#4a90e2'
        });
        world.shops.push({
            x: shopCenterDistance - shopWidth,
            y: shopY, label: "Sell Here", awningColor1: '#ffffff', awningColor2: '#e24a4a'
        });
    }

    const player = {
        x: 0, y: 500, // Adjusted starting position
        // --- CHANGED: Player speed adjusted for 5x scale ---
        speed: 9, 
        torso: { width: 22, height: 32 }, head: { radius: 9 },
        arm: { width: 8, height: 30 }, leg: { width: 9, height: 35 },
        colors: { skin: '#E0AC69', shirt: '#2a52be', pants: '#3d2b1f' }
    };

    // --- Unchanged Joystick & Event Listener code ---
    let isJoystickActive = false, joystick = { x: 0, y: 0 };
    let joystickCenterX, joystickCenterY, joystickRadius;
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

    // --- All Drawing Functions now use the Camera Offset ---

    function drawPlots() {
        ctx.strokeStyle = '#6b4423'; 
        world.plots.forEach(plot => {
            const screenX = plot.x - camera.x;
            const screenY = plot.y - camera.y;
            ctx.fillStyle = PLOT_SOIL_COLOR; 
            ctx.fillRect(screenX, screenY, plot.width, plot.height);
            ctx.lineWidth = 30; // 5x scale border
            ctx.strokeRect(screenX, screenY, plot.width, plot.height);
            const subHeight = plot.height / plot.subdivisions;
            ctx.lineWidth = 15; // 5x scale inner lines
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
            ctx.beginPath();
            ctx.moveTo(fx - camera.x, fy - camera.y);
            ctx.lineTo(fx + fw - camera.x, fy - camera.y);
            ctx.moveTo(fx - camera.x, fy + fh - camera.y);
            ctx.lineTo(fx + fw - camera.x, fy + fh - camera.y);
            if (col === 0) {
                ctx.moveTo(fx - camera.x, fy - camera.y); ctx.lineTo(fx - camera.x, fy + fh - camera.y);
                ctx.moveTo(fx + fw - camera.x, fy - camera.y); ctx.lineTo(fx + fw - camera.x, openingStartY - camera.y);
                ctx.moveTo(fx + fw - camera.x, openingEndY - camera.y); ctx.lineTo(fx + fw - camera.x, fy + fh - camera.y);
            } else {
                ctx.moveTo(fx + fw - camera.x, fy - camera.y); ctx.lineTo(fx + fw - camera.x, fy + fh - camera.y);
                ctx.moveTo(fx - camera.x, fy - camera.y); ctx.lineTo(fx - camera.x, openingStartY - camera.y);
                ctx.moveTo(fx - camera.x, openingEndY - camera.y); ctx.lineTo(fx - camera.x, fy + fh - camera.y);
            }
            ctx.stroke();
        });
    }

    function drawShops() {
        ctx.font = "bold 80px Arial"; // Larger font for larger shops
        ctx.textAlign = "center";
        world.shops.forEach(shop => {
            const screenX = shop.x - camera.x;
            const screenY = shop.y - camera.y;
            const counterWidth = 600, counterHeight = 200, poleWidth = 50, poleHeight = 300, awningHeight = 150;
            ctx.fillStyle = '#6b4423';
            ctx.fillRect(screenX, screenY, counterWidth, counterHeight);
            ctx.fillRect(screenX + poleWidth, screenY - poleHeight, poleWidth, poleHeight);
            ctx.fillRect(screenX + counterWidth - (poleWidth*2), screenY - poleHeight, poleWidth, poleHeight);
            const awningY = screenY - poleHeight - awningHeight;
            ctx.fillStyle = shop.awningColor1;
            ctx.fillRect(screenX, awningY, counterWidth, awningHeight);
            ctx.fillStyle = shop.awningColor2;
            for(let i = 0; i < counterWidth; i += 100) {
                 ctx.fillRect(screenX + i, awningY, 50, awningHeight);
            }
            ctx.fillStyle = "#000000";
            ctx.fillText(shop.label, screenX + counterWidth / 2, screenY - poleHeight - awningHeight - 50);
        });
    }
    
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
        if (isJoystickActive) { player.x += joystick.x * player.speed; player.y += joystick.y * player.speed; }
        camera.x = player.x - canvas.width / 2;
        camera.y = player.y - canvas.height / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlots();
        drawFences();
        drawShops();
        drawPlayer();
        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        setupJoystick();
    });

    setupWorld(); 
    setupJoystick(); 
    gameLoop();
});
