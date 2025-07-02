document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const world = { plots: [], shops: [] };

    const PLOT_WIDTH = 220, PLOT_HEIGHT = 120, PLOT_ROWS = 3, PLOT_COLS = 2;
    const VERTICAL_PADDING = 50, AISLE_WIDTH = 200, PLOT_SOIL_COLOR = '#8b5a2b';
    
    function setupWorld() {
        // --- CRITICAL FIX: Clear old world data before recalculating ---
        // This was the source of the bug. Without this, resizing the window
        // would create duplicate plots and shops on top of the old ones.
        world.plots = [];
        world.shops = [];

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
        
        const shopY = plotsStartY - 100; 
        const shopCenterDistance = 200;
        const shopWidth = 120;

        world.shops.push({
            x: (canvas.width / 2) - (shopCenterDistance / 2) - (shopWidth / 2),
            y: shopY, label: "Seed Shop", awningColor1: '#ffffff', awningColor2: '#4a90e2'
        });
        world.shops.push({
            x: (canvas.width / 2) + (shopCenterDistance / 2) - (shopWidth / 2),
            y: shopY, label: "Sell Here", awningColor1: '#ffffff', awningColor2: '#e24a4a'
        });
    }

    const player = {
        x: canvas.width / 2, y: canvas.height - 100, speed: 4,
        torso: { width: 30, height: 45 }, head: { radius: 12 },
        arm: { width: 10, height: 40 }, leg: { width: 12, height: 50 },
        colors: { skin: '#E0AC69', shirt: '#2a52be', pants: '#3d2b1f' }
    };

    let isJoystickActive = false;
    let joystick = { x: 0, y: 0 };
    let joystickCenterX, joystickCenterY, joystickRadius;

    function setupJoystick() {
        const rect = joystickContainer.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width / 2;
        joystickCenterY = rect.top + rect.height / 2;
        joystickRadius = joystickContainer.offsetWidth / 2;
    }
    
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

    joystickContainer.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    joystickContainer.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    function drawPlots() {
        ctx.strokeStyle = '#6b4423'; 
        world.plots.forEach(plot => {
            ctx.fillStyle = PLOT_SOIL_COLOR;
            ctx.fillRect(plot.x, plot.y, plot.width, plot.height);
            ctx.lineWidth = 6;
            ctx.strokeRect(plot.x, plot.y, plot.width, plot.height);
            const subHeight = plot.height / plot.subdivisions;
            ctx.lineWidth = 3; 
            for (let i = 1; i < plot.subdivisions; i++) {
                ctx.beginPath();
                ctx.moveTo(plot.x, plot.y + i * subHeight);
                ctx.lineTo(plot.x + plot.width, plot.y + i * subHeight);
                ctx.stroke();
            }
        });
    }

    function drawShops() {
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        world.shops.forEach(shop => {
            const counterWidth = 120, counterHeight = 40, poleWidth = 10, poleHeight = 60, awningHeight = 30;
            ctx.fillStyle = '#6b4423';
            ctx.fillRect(shop.x, shop.y, counterWidth, counterHeight);
            ctx.fillRect(shop.x + poleWidth, shop.y - poleHeight, poleWidth, poleHeight);
            ctx.fillRect(shop.x + counterWidth - (poleWidth*2), shop.y - poleHeight, poleWidth, poleHeight);
            const awningY = shop.y - poleHeight - awningHeight;
            ctx.fillStyle = shop.awningColor1;
            ctx.fillRect(shop.x, awningY, counterWidth, awningHeight);
            ctx.fillStyle = shop.awningColor2;
            for(let i = 0; i < counterWidth; i += 20) { ctx.fillRect(shop.x + i, awningY, 10, awningHeight); }
            ctx.fillStyle = "#000000";
            ctx.fillText(shop.label, shop.x + counterWidth / 2, shop.y - poleHeight - awningHeight - 10);
        });
    }

    function drawPlayer() {
        const p = player;
        const torsoX = p.x - p.torso.width / 2; const torsoY = p.y - p.torso.height / 2;
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

    function gameLoop() {
        if (isJoystickActive) {
            player.x += joystick.x * player.speed;
            player.y += joystick.y * player.speed;
        }
        const characterLeftEdge = player.x - player.torso.width / 2 - player.arm.width;
        const characterRightEdge = player.x + player.torso.width / 2 + player.arm.width;
        const characterTopEdge = player.y - player.torso.height / 2 - player.head.radius * 2;
        const characterBottomEdge = player.y + player.torso.height / 2 + player.leg.height;
        if (characterLeftEdge < 0) player.x = player.torso.width / 2 + player.arm.width;
        if (characterRightEdge > canvas.width) player.x = canvas.width - player.torso.width / 2 - player.arm.width;
        if (characterTopEdge < 0) player.y = player.torso.height / 2 + player.head.radius * 2;
        if (characterBottomEdge > canvas.height) player.y = canvas.height - player.torso.height / 2 - player.leg.height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlots();
        drawShops();
        drawPlayer();
        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        setupWorld(); 
        setupJoystick();
    });

    setupWorld(); 
    setupJoystick(); 
    gameLoop();
});
