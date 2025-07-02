// --- SETUP ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const joystickContainer = document.getElementById('joystick-container');
const joystickStick = document.getElementById('joystick-stick');

// Set canvas to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- PLAYER ---
// We've expanded the player object to be a character instead of a square.
// The x and y coordinates now represent the CENTER of the player's torso.
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    speed: 4,
    // Character dimensions
    torso: { width: 30, height: 45 },
    head: { radius: 12 },
    arm: { width: 10, height: 40 },
    leg: { width: 12, height: 50 },
    // Character colors
    colors: {
        skin: '#E0AC69',
        shirt: '#2a52be', // A nice blue
        pants: '#3d2b1f', // Dark brown
    }
};

// --- JOYSTICK (This section remains unchanged) ---
let isJoystickActive = false;
let joystick = { x: 0, y: 0 };

const joystickCenterX = joystickContainer.offsetLeft + joystickContainer.offsetWidth / 2;
const joystickCenterY = joystickContainer.offsetTop + joystickContainer.offsetHeight / 2;
const joystickRadius = joystickContainer.offsetWidth / 2;

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
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;
    joystick.x = normalizedX;
    joystick.y = normalizedY;
    const stickMoveDistance = Math.min(distance, joystickRadius);
    const stickX = normalizedX * stickMoveDistance;
    const stickY = normalizedY * stickMoveDistance;
    joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;
}

// --- NEW DRAWING FUNCTION ---
function drawPlayer() {
    const p = player;
    const torsoX = p.x - p.torso.width / 2;
    const torsoY = p.y - p.torso.height / 2;

    // Draw Left Leg (drawn first to be 'behind' the torso)
    ctx.fillStyle = p.colors.pants;
    ctx.fillRect(
        torsoX, 
        torsoY + p.torso.height, 
        p.leg.width, 
        p.leg.height
    );

    // Draw Right Leg
    ctx.fillRect(
        torsoX + p.torso.width - p.leg.width, 
        torsoY + p.torso.height, 
        p.leg.width, 
        p.leg.height
    );

    // Draw Left Arm (drawn 'behind' the torso)
    ctx.fillStyle = p.colors.skin;
    ctx.fillRect(
        torsoX - p.arm.width, 
        torsoY, 
        p.arm.width, 
        p.arm.height
    );

    // Draw Right Arm
    ctx.fillRect(
        torsoX + p.torso.width, 
        torsoY, 
        p.arm.width, 
        p.arm.height
    );

    // Draw Torso (the shirt)
    ctx.fillStyle = p.colors.shirt;
    ctx.fillRect(torsoX, torsoY, p.torso.width, p.torso.height);
    
    // Draw Head
    ctx.fillStyle = p.colors.skin;
    ctx.beginPath();
    ctx.arc(
        p.x, // Center of the head aligns with the center of the torso
        torsoY - p.head.radius, // Position head on top of the torso
        p.head.radius, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
}


// --- GAME LOOP ---
function gameLoop() {
    // 1. UPDATE player position based on joystick input
    if (isJoystickActive) {
        player.x += joystick.x * player.speed;
        player.y += joystick.y * player.speed;
    }

    // 2. PREVENT player from going off-screen (updated for the new character)
    const characterLeftEdge = player.x - player.torso.width / 2 - player.arm.width;
    const characterRightEdge = player.x + player.torso.width / 2 + player.arm.width;
    const characterTopEdge = player.y - player.torso.height / 2 - player.head.radius * 2;
    const characterBottomEdge = player.y + player.torso.height / 2 + player.leg.height;

    if (characterLeftEdge < 0) player.x = player.torso.width / 2 + player.arm.width;
    if (characterRightEdge > canvas.width) player.x = canvas.width - player.torso.width / 2 - player.arm.width;
    if (characterTopEdge < 0) player.y = player.torso.height / 2 + player.head.radius * 2;
    if (characterBottomEdge > canvas.height) player.y = canvas.height - player.torso.height / 2 - player.leg.height;
    
    // 3. DRAW everything
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the player using our new function
    drawPlayer();

    // 4. REQUEST the next frame to create the animation loop
    requestAnimationFrame(gameLoop);
}

// Handle window resizing (unchanged)
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Start the game!
gameLoop();
