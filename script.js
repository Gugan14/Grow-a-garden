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
    size: 40,
    speed: 4, // Pixels per frame
    color: '#ff5733' // A bright color for the player
};

// --- JOYSTICK ---
let isJoystickActive = false;
let joystick = { x: 0, y: 0 }; // Normalized direction (-1 to 1)

// Get the center of the joystick container for calculations
const joystickCenterX = joystickContainer.offsetLeft + joystickContainer.offsetWidth / 2;
const joystickCenterY = joystickContainer.offsetTop + joystickContainer.offsetHeight / 2;
const joystickRadius = joystickContainer.offsetWidth / 2;

// --- EVENT LISTENERS ---

// For Desktop (Mouse)
joystickContainer.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

// For Mobile (Touch)
joystickContainer.addEventListener('touchstart', onPointerDown, { passive: false });
window.addEventListener('touchmove', onPointerMove, { passive: false });
window.addEventListener('touchend', onPointerUp);

function onPointerDown(e) {
    isJoystickActive = true;
    // Prevent default actions like scrolling on mobile
    e.preventDefault(); 
}

function onPointerUp() {
    if (!isJoystickActive) return;
    isJoystickActive = false;
    // Reset joystick direction and stick position
    joystick = { x: 0, y: 0 };
    joystickStick.style.transform = `translate(0px, 0px)`;
}

function onPointerMove(e) {
    if (!isJoystickActive) return;

    // Get the correct pointer position for both mouse and touch events
    const pointerX = e.touches ? e.touches[0].clientX : e.clientX;
    const pointerY = e.touches ? e.touches[0].clientY : e.clientY;

    // Calculate the vector from the joystick center to the pointer
    let dx = pointerX - joystickCenterX;
    let dy = pointerY - joystickCenterY;

    // Calculate the distance (magnitude) of the vector
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize the vector (get the direction)
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;

    // Store the normalized direction for player movement
    joystick.x = normalizedX;
    joystick.y = normalizedY;

    // Clamp the stick's movement within the joystick's outer circle
    const stickMoveDistance = Math.min(distance, joystickRadius);

    // Move the visual stick element
    const stickX = normalizedX * stickMoveDistance;
    const stickY = normalizedY * stickMoveDistance;
    joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;
}


// --- GAME LOOP ---
function gameLoop() {
    // 1. UPDATE player position based on joystick input
    if (isJoystickActive) {
        player.x += joystick.x * player.speed;
        player.y += joystick.y * player.speed;
    }

    // 2. PREVENT player from going off-screen
    if (player.x < 0) player.x = 0;
    if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
    if (player.y < 0) player.y = 0;
    if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;

    // 3. DRAW everything
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the player (a simple square for now)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // 4. REQUEST the next frame to create the animation loop
    requestAnimationFrame(gameLoop);
}

// Handle window resizing
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recenter player if you want, or just let them stay
});

// Start the game!
gameLoop();
