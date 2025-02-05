// Initialize three.js components
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Set camera position and rotation
camera.position.set(0, 15, 20); // Adjust position as needed
camera.rotation.set(-Math.PI / 8, 0, 0); // Adjust rotation as needed

const textureLoader = new THREE.TextureLoader();

const loss = new Audio('gameOver.wav');
const win = new Audio('win.mp3')
const music = new Audio('music.mp3');

// Create a fog shader material
let fogColor = new THREE.Color(0x000000); // Set the fog color
const fogDensity = 0.007; // Set the initial fog density
const fogNear = 5; // Near distance of the fog
const fogFar = 100; // Far distance of the fog

// Create fog and add it to the scene
const fog = new THREE.FogExp2(fogColor, fogDensity);
fog.near = fogNear;
fog.far = fogFar;
scene.fog = fog;

function startPulseEffect() {
    pulseInterval = setInterval(() => {
        // Set the fog color to the random color
        let color = getRandomColor();
        fogColor.set(color);
        renderer.setClearColor(color);


        // Fade the fog color back to black quickly
        setTimeout(() => {
            fogColor = new THREE.Color(0x000000);
            renderer.setClearColor(0x000000);
        }, 200); // Adjust the fade duration as needed
    }, 400); // Adjust the pulse interval as needed
}

function updateFog() {
    const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
    const fogDensityFactor = Math.abs(cameraDirection.z); // Adjust the factor as needed

    fog.density = fogDensity * fogDensityFactor;
}

// Call updateFog() in the render loop or when the camera is moved/rotated


// Create a WebGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Add ambient light
const ambientLight = new THREE.AmbientLight(0xbff2f0, 2); // Default ambient light color
scene.add(ambientLight);

// Create directional lights

const light1 = new THREE.DirectionalLight(0xbff2f0, 11);
light1.position.set(60, 50, -20);
light1.castShadow = true;
scene.add(light1);
// Adjust shadow camera properties
light1.shadow.camera.left = -100;
light1.shadow.camera.right = 100;
light1.shadow.camera.top = 100;
light1.shadow.camera.bottom = -100;

const light2 = new THREE.DirectionalLight(0xff00ff, 6);
light2.position.set(-55, 35, 20);
light2.castShadow = false;
scene.add(light2);

const light3 = new THREE.DirectionalLight(0x0099ff, 3);
light3.position.set(30, 20, 25);
light3.castShadow = false;
scene.add(light3);

let slopeHeight = 1;
let ballRadius = 0.5
let ball = null;

const loader = new THREE.GLTFLoader();

loader.load('rock.glb', (gltf) => {
    const model = gltf.scene;
    ball = model.children[0];

    // Traverse through the model's children to access the materials
    ball.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            // Check if the material has texture coordinates for displacement
            if (node.material.displacementMap) {
                node.material.displacementScale = 0.1; // Adjust the displacement scale as needed
            }

            // Check if the material has roughness property
            if (node.material.roughness !== undefined) {
                node.material.roughness = 0.7; // Adjust the roughness value as needed
            }
        }
    });
    const scale = new THREE.Vector3(2, 2, 2); // Scale factor of 3 in all directions
    ball.scale.copy(scale);
    scene.add(ball);
});

const slopeGeometry = new THREE.PlaneGeometry(25, 999, slopeHeight);

// Load the texture image
const texture = textureLoader.load('slopeTexture.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, 80);

// Create a material with the image texture
const material = new THREE.MeshLambertMaterial({
    map: texture, // Use your texture here
    transparent: true, // Enable transparency
    opacity: 0.5, // Set the desired opacity value (0.0 - fully transparent, 1.0 - fully opaque)
});
const slope = new THREE.Mesh(slopeGeometry, material);

// Set initial offset values
let offsetX = 0;
let offsetY = 0;

// Define the speed of movement
let speed = 0.02; // Adjust as needed

// Rotate the slope
slope.rotation.x = Math.PI / -2; // Rotate 90 degrees counter-clockwise
slope.castShadow = false;
slope.receiveShadow = true;
scene.add(slope);

function updateTextureOffset() {
    offsetY += speed;

    // Update the texture offset
    slope.material.map.offset.set(offsetX, offsetY);

    // Request the next animation frame
    requestAnimationFrame(updateTextureOffset);
}

// Start updating the texture offset
updateTextureOffset();


const ballSpeed = 0.25; // Adjust the speed as needed
const gravity = new THREE.Vector3(0, -0.02, 0);
const ballVelocity = new THREE.Vector3(0, 0, 0);

let falling = false;

function updateBallPosition() {
    // Apply gravity to the ball's velocity
    ballVelocity.add(gravity);

    // Update ball position based on velocity
    if (ball) {
        ball.position.x += ballVelocity.x;
        ball.position.y += ballVelocity.y;
        ball.position.z += ballVelocity.z;
    }

    // Ensure the ball stays on the slope
    if (ball && (ball.position.x < -12.5 || ball.position.x > 12.25) && ball.position.y < slopeHeight + ballRadius) {
        falling = true;
    } else if (ball && ball.position.y < slopeHeight + ballRadius && !falling){
        ball.position.y = slopeHeight + ballRadius;
        ballVelocity.y = 0; // Reset vertical velocity when the ball touches the slope
    }
    if (ball.position.y < -50) {
        stopGame();
    }
}

let obstacleSpeed = 0.5; // Adjust the initial speed of the obstacles as needed
let obstacleObjects = []; // Array to store the obstacle objects

function createObstacle() {
    loader.load(
      'obstacle.glb', // Replace with the path to your glb file
      function (gltf) {
        const obstacle = gltf.scene; // Get the root scene object from the loaded glb
        obstacle.position.x = getRandomXPosition(); // Set a random x position for the obstacle
        obstacle.position.y = slopeHeight + ballRadius + 0.8; // Set the initial y position of the obstacle
        obstacle.position.z = -210;
        const scale = new THREE.Vector3(3, 3, 3); // Scale factor of 3 in all directions
        obstacle.scale.copy(scale);
        obstacle.traverse(function (child) {
          // Traverse the child objects of the obstacle to apply material changes
          if (child.isMesh) {
            child.material = child.material.clone(); // Clone the material to modify individual color
            child.material.color.set(getRandomColor()); // Set a random color for the obstacle
          }
        });
        scene.add(obstacle); // Add the obstacle to the scene
        obstacleObjects.push(obstacle); // Add the obstacle to the obstacleObjects array
      },
      undefined,
      function (error) {
        console.error('Error loading obstacle:', error);
      }
    );
  }

function getRandomXPosition() {
    const min = -12.5; // Adjust the minimum x position as needed
    const max = 12.5; // Adjust the maximum x position as needed
    return Math.random() * (max - min) + min;
}

function getRandomColor() {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Add or modify colors as needed
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}

function updateObstacles() {
    for (let i = obstacleObjects.length - 1; i >= 0; i--) {
        const obstacle = obstacleObjects[i];
        obstacle.position.z += obstacleSpeed;

        // Check for collision with the ball
        if (ball && ball.position.distanceTo(obstacle.position) < ballRadius + ballRadius + 2.9) {
            stopGame();
            break;
        }

        // Remove obstacles that are out of the scene
        if (obstacle.position.y < -10) {
            scene.remove(obstacle);
            obstacleObjects.splice(i, 1);
        }
    }
}
let spawnFac = 0.01;
function increaseObstacleSpeed() {
    obstacleSpeed += 0.0012; // Adjust the speed increment as needed
    ballRotate += 0.00007;
    speed += 0.00007;
    spawnFac += 0.00002;
}

let gameEnded = false;

function stopGame() {
    if (gameEnded) return;
    music.pause();
    gameEnded = true;
    stopTimer();
    updateLongestTime();
    initGameOverScreen();
    isGameRunning = false;

    // Show the game over screen
    gameOverScreen.style.display = "block";
}

let gameOverScreen;
let recordUpdated = false;
let playerName, nameInput, submitButton, highScore;

function initGameOverScreen() {
    // Create a container for the game over screen
    gameOverScreen = document.createElement("div");
    gameOverScreen.id = "game-over-screen";

    // Create an image element
    const endImage = document.createElement("img");
    endImage.src = "gameOver.png"; // Replace with your start screen image
    endImage.classList.add("end-image");
    if (recordUpdated) {
        win.play();
        // Create a paragraph element for the longest time value
        highScore = document.createElement("p");
        highScore.textContent = 'New Longest Time!'
        highScore.classList.add('high-score');

        // Create a text input element
        nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "Player Name";
        nameInput.classList.add("name-input");

        // Create a button element
        submitButton = document.createElement("button");
        submitButton.innerText = "Submit";
        submitButton.addEventListener("click", function () {
            playerName = nameInput.value;
            localStorage.setItem("playerName", playerName);
            location.reload();
        });
        submitButton.classList.add("submit-button");
    } else {
        loss.play();
        // Create a button element
        playAgain = document.createElement("button");
        playAgain.innerText = "Play Again";
        playAgain.addEventListener("click", function () {
            location.reload();
        });
        playAgain.classList.add("play-again");
    }

    // Append elements to the game over screen container
    gameOverScreen.appendChild(endImage);
    if (recordUpdated) {
        gameOverScreen.appendChild(highScore);
        gameOverScreen.appendChild(nameInput);
        gameOverScreen.appendChild(submitButton);
    } else {
        gameOverScreen.appendChild(playAgain);
    }

    // Hide the game over screen initially
    gameOverScreen.style.display = "none";

    // Append the game over screen to the document body
    document.body.appendChild(gameOverScreen);
}

let controller;
let jumpFlag = false;

function connectController() {
    function checkGamepadConnection() {
        const gamepads = navigator.getGamepads();
        controller = gamepads[0]; // Assuming only one controller is connected

        if (controller) {
            // Start polling for controller state updates
            setInterval(updateControllerState, 16); // Adjust the interval as needed
        } else {
            // Controller disconnected
            controller = null;
        }
    }

    window.addEventListener("gamepadconnected", checkGamepadConnection);
    window.addEventListener("gamepaddisconnected", () => {
        controller = null;
    });
}

function updateControllerState() {
    const gamepads = navigator.getGamepads();
    controller = gamepads[0]; // Assuming only one controller is connected

    if (controller) {
        handleControllerInput();
    }
}

function handleControllerInput() {
    if (!controller) return; // No connected controller found

    const stickThreshold = 0.1; // Adjust the threshold for stick sensitivity

    // Move left or right - CONTROLLER
    const stickX = controller.axes[0];
    if (Math.abs(stickX) > stickThreshold) {
        ballVelocity.x = stickX * ballSpeed;
    } else {
        ballVelocity.x = 0; // Stop the ball if stickX value is below the threshold
    }

    // Jump
    const jumpButtonIndex = 0;
    const jumpButtonPressed = controller.buttons[jumpButtonIndex]?.pressed;
    const jumpButtonJustPressed = jumpButtonPressed && !jumpFlag;
    if (jumpButtonJustPressed && ball.position.y <= slopeHeight + ballRadius && !falling) {
        ballVelocity.y = 0.49; // Adjust the jump velocity as needed
        jumpFlag = true;
    }
    else if (!jumpButtonPressed) {
        jumpFlag = false;
    }
}

function handleKeyboardInput() {
    // Keyboard movement
    const jumpButtonPressed = false;
    const jumpFlag = false;
    window.addEventListener("keydown", (event) => {
        if (event.code === "KeyA") {
            ballVelocity.x = -1 * ballSpeed;
        } else if (event.code === "KeyD") {
            ballVelocity.x = ballSpeed;
        } else if (event.code === "KeyW") {
            if (!jumpFlag) {
                jumpButtonPressed = true;
            }
            if (jumpButtonPressed && ball.position.y <= slopeHeight + ballRadius && !falling) {
                ballVelocity.y = 0.49; // Adjust the jump velocity as needed
                jumpFlag = true;
            } else if (!jumpButtonPressed) {
                jumpFlag = false;
            }
        }
    });

    window.addEventListener("keyup", (event) => {
        
    });
}

let ballRotate = 0.08;

function updateBallRotation() {
    if (ball) {
        ball.rotation.x -= ballRotate; // Adjust the rotation speed as needed
    }
}

let timerInterval; // Interval for updating the timer
let minutes = 0; // Initial minutes value
let seconds = 0; // Initial seconds value
let isGameRunning = false; // Flag to indicate if the game is running

function startTimer() {
    timerInterval = setInterval(updateTimer, 1000); // Update the timer every second (1000ms)
}

function updateTimer() {
    seconds++;
    if (seconds === 60) {
        seconds = 0;
        minutes++;
    }

    // Update the timer display
    const minutesDisplay = document.getElementById("minutes");
    const secondsDisplay = document.getElementById("seconds");
    minutesDisplay.textContent = minutes.toString().padStart(2, "0");
    secondsDisplay.textContent = seconds.toString().padStart(2, "0");
}

function stopTimer() {
    clearInterval(timerInterval);
    isGameRunning = false;
}


let startScreen;
let startButton;

function initStartScreen() {
    // Create a container for the start screen
    startScreen = document.createElement("div");
    startScreen.id = "start-screen";

    // Create an image element
    const image = document.createElement("img");
    image.src = "title.png"; // Replace with your start screen image
    image.classList.add("start-image");

    // Create a paragraph element for the longest time value
    const longestTime = document.createElement("p");
    const previousLongestTime = localStorage.getItem("longestTime") || 0;
    longestTime.textContent = `Longest Time | ${localStorage.getItem("playerName")}: ${previousLongestTime}s`;
    longestTime.classList.add("longest-time");

    // Create a start button
    startButton = document.createElement("button");
    startButton.textContent = "Start Game";
    startButton.classList.add("start-button");
    startButton.addEventListener("click", startGame);


    // Append elements to the start screen container
    startScreen.appendChild(image);
    startScreen.appendChild(longestTime);
    startScreen.appendChild(startButton);

    // Append the start screen to the document body
    document.body.appendChild(startScreen);
}

function updateLongestTime() {
    const previousLongestTime = parseInt(localStorage.getItem("longestTime")) || 0;
    const currentGameTime = minutes * 60 + seconds;

    if (currentGameTime > previousLongestTime) {
        localStorage.setItem("longestTime", currentGameTime);
        const longestTime = document.querySelector(".longest-time");
        longestTime.textContent = `Longest Time: ${currentGameTime}s`;
        recordUpdated = true;
    }
}

function startGame() {
    // Hide the start screen
    startScreen.style.display = "none";
    setTimeout(startPulseEffect, 30000); // Wait for 30 seconds

    // Start the game loop
    gameLoop();
    music.play();
    isGameRunning = true;
    obstacleSpeed = 0.5; // Reset the obstacle speed
    obstacleObjects = []; // Reset the obstacle array

    // Start the timer
    startTimer();

    // Set the game running flag
    isGameRunning = true;
}

function gameLoop() {
    requestAnimationFrame(gameLoop);

    handleControllerInput();
    handleKeyboardInput();

    updateBallPosition();
    updateBallRotation();
    fog.color = fogColor;
    if (isGameRunning) {
        if (Math.random() < spawnFac) {
            createObstacle();
        }
        updateObstacles();
        increaseObstacleSpeed();
    }
    renderer.render(scene, camera);
}

connectController();
initStartScreen();
