// Wait for the entire page to load before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- SETUP ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    // ** NEW: Get the game container to move the background **
    const gameContainer = document.getElementById('game-container'); 

    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // --- PLAYER ---
    // ** CHANGE: 'x' and 'y' are now 'worldX' and 'worldY' to represent position in the game world **
    // The player will start at the center of our world (0,0)
    const player = {
        worldX: 0,
        worldY: 0,
        speed: 4,
        torso: { width: 30, height: 45 },
        head: { radius: 12 },
        arm: { width: 10, height: 40 },
        leg: { width: 12, height: 50 },
        colors: {
            skin: '#E0AC69',
            shirt: '#2a52be',
            pants: '#3d2b1f',
        }
    };

    // ** NEW: The Camera object **
    // This will track the top-left corner of the visible area of the world.
    const camera = {
        x: 0,
        y: 0
    };

    // --- JOYSTICK (This section remains unchanged) ---
    let isJoystickActive = false;
    let joystick = { x: 0, y: 0 };
    let joystickCenterX, joystickCenterY, joystickRadius;

    function setupJoystick() {
        const rect = joystickContainer.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width / 2;
        joystickCenterY = rect.top + rect.height / 2;
        joystickRadius = joystickContainer.offsetWidth / 2;
    }
    
    // --- EVENT LISTENERS (This section remains unchanged) ---
    joystickContainer.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    joystickContainer.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    function onPointerDown(e) {
        isJoystickActive = true;
        e.preventDefault(); 
        setupJoystick(); 
    }

    function onPointerUp() {
        if (!isJoystickActive) return;
        isJoystickActive = false;
        joystick = { x: 0, y: 0 };
        joystickStick.style.transform = `translate(0px, 0px)`;
    }

    function onPointerMove(e) {
        if (!isJoystickActive) return;
        
        const pointerX = e.touches ? e.touches[0].clientX : e.clientX;
        const pointerY = e.touches ? e.touches[0].clientY : e.clientY;

        let dx = pointerX - joystickCenterX;
        let dy = pointerY - joystickCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) {
            joystick.x = 0;
            joystick.y = 0;
            return;
        }

        const normalizedX = dx / distance;
        const normalizedY = dy / distance;
        joystick.x = normalizedX;
        joystick.y = normalizedY;

        const stickMoveDistance = Math.min(distance, joystickRadius);
        const stickX = normalizedX * stickMoveDistance;
        const stickY = normalizedY * stickMoveDistance;
        joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;
    }

    // --- DRAWING FUNCTION ---
    // ** CHANGE: The player is now always drawn in the center of the screen. **
    function drawPlayer() {
        // The player's position on the SCREEN is always the center
        const screenX = canvas.width / 2;
        const screenY = canvas.height / 2;

        const p = player;
        const torsoX = screenX - p.torso.width / 2;
        const torsoY = screenY - p.torso.height / 2;

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
        // ** CHANGE: Head is drawn relative to the screen center **
        ctx.arc(screenX, torsoY - p.head.radius, p.head.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- GAME LOOP ---
    function gameLoop() {
        // 1. UPDATE player's WORLD position based on joystick input
        if (isJoystickActive) {
            player.worldX += joystick.x * player.speed;
            player.worldY += joystick.y * player.speed;
        }

        // 2. ** NEW: Update the camera to follow the player **
        // The camera's top-left corner is positioned so the player is in the center.
        camera.x = player.worldX - canvas.width / 2;
        camera.y = player.worldY - canvas.height / 2;

        // 3. ** NEW: Move the background to simulate camera movement **
        // We move the background in the opposite direction of the camera.
        gameContainer.style.backgroundPosition = `-${camera.x}px -${camera.y}px`;

        // 4. DRAW everything
        // Clear the canvas. The player is the only thing on the canvas for now.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the player (who will always be in the center of the canvas)
        drawPlayer();
        
        // 5. REQUEST the next frame
        requestAnimationFrame(gameLoop);
    }

    // --- WINDOW RESIZE (unchanged) ---
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        setupJoystick(); 
    });

    // --- START THE GAME ---
    setupJoystick(); 
    gameLoop();

});
