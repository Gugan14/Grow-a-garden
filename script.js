// --- FIX: Wait for the entire page to load before running the script ---
document.addEventListener('DOMContentLoaded', () => {

    // --- SETUP ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');

    // Set canvas to fill the screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // --- PLAYER ---
    const player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
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

    // --- JOYSTICK ---
    let isJoystickActive = false;
    let joystick = { x: 0, y: 0 };
    let joystickCenterX, joystickCenterY, joystickRadius;

    // --- FIX: Function to calculate joystick position reliably ---
    // We call this on load and on resize to make sure it's always correct.
    function setupJoystick() {
        const rect = joystickContainer.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width / 2;
        joystickCenterY = rect.top + rect.height / 2;
        joystickRadius = joystickContainer.offsetWidth / 2;
    }
    
    // --- EVENT LISTENERS ---
    joystickContainer.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    joystickContainer.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    function onPointerDown(e) {
        isJoystickActive = true;
        e.preventDefault(); 
        // We can update the joystick position here in case it moved
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

        // This can be NaN if distance is 0, handle that
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

    // --- GAME LOOP ---
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
        drawPlayer();
        requestAnimationFrame(gameLoop);
    }

    // --- WINDOW RESIZE ---
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Recalculate joystick position on resize
        setupJoystick(); 
    });

    // --- START THE GAME ---
    setupJoystick(); // Initial setup
    gameLoop(); // Start the loop

}); // End of the DOMContentLoaded wrapper
