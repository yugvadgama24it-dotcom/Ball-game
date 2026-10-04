const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let rightPressed = false;
let leftPressed = false;

// --- Event Listeners for Interaction ---
document.addEventListener("keydown", (e) => {
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
});

document.addEventListener("keyup", (e) => {
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

canvas.addEventListener("mousedown", (e) => {
    // Spawn particles on click
    createParticles(e.clientX, e.clientY, 15);
});

// --- Game Objects ---

// 1. The Paddle (Demonstrates Translation)
const paddle = {
    width: 150,
    height: 20,
    x: (canvas.width - 150) / 2,
    y: canvas.height - 40,
    speed: 7,
    color: '#00ffcc',
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
    },
    update() {
        if(rightPressed && this.x < canvas.width - this.width) {
            this.x += this.speed; // Translation right
        }
        else if(leftPressed && this.x > 0) {
            this.x -= this.speed; // Translation left
        }
    }
};

// 2. The Ball (Demonstrates Translation & Dynamic Coloring)
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 70,
    radius: 15,
    dx: 5,
    dy: -5,
    color: '#ff0066',
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Radial Gradient for 3D sphere effect
        let gradient = ctx.createRadialGradient(this.x - 5, this.y - 5, 2, this.x, this.y, this.radius);
        gradient.addColorStop(0, "white");
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, "darkred");
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
    },
    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Wall collisions
        if(this.x + this.dx > canvas.width - this.radius || this.x + this.dx < this.radius) {
            this.dx = -this.dx;
        }
        if(this.y + this.dy < this.radius) {
            this.dy = -this.dy;
        } 
        // Paddle collision
        else if(this.y + this.dy > canvas.height - this.radius - paddle.height - 20) {
            if(this.x > paddle.x && this.x < paddle.x + paddle.width) {
                this.dy = -this.dy;
                score += 10;
                document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
                createParticles(this.x, this.y + this.radius, 10);
                
                // Increase speed slightly
                this.dy -= (this.dy > 0 ? 0.2 : -0.2);
                this.dx += (this.dx > 0 ? 0.2 : -0.2);
            }
        }
        
        // Bottom wall (Game Over reset)
        if(this.y + this.dy > canvas.height) {
            this.x = canvas.width / 2;
            this.y = canvas.height - 70;
            this.dx = 5;
            this.dy = -5;
            score = 0;
            document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
        }
    }
};

// 3. Central Star (Demonstrates Rotation and Scaling)
let angle = 0;
let scalePhase = 0;

function drawRotatingScalingStar() {
    ctx.save(); // Save the unrotated/unscaled context
    
    // Translate to the center of the screen
    ctx.translate(canvas.width / 2, canvas.height / 3);
    
    // Apply Rotation
    angle += 0.02;
    ctx.rotate(angle);
    
    // Apply Scaling (pulsing effect using sine wave)
    scalePhase += 0.05;
    let scaleFactor = 1 + Math.sin(scalePhase) * 0.3; // Scales between 0.7 and 1.3
    ctx.scale(scaleFactor, scaleFactor);
    
    // Draw Star (Polygon mapping)
    ctx.beginPath();
    let spikes = 5;
    let outerRadius = 50;
    let innerRadius = 25;
    let rot = Math.PI / 2 * 3;
    let x = 0, y = 0;
    let step = Math.PI / spikes;

    ctx.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerRadius;
        y = Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = Math.cos(rot) * innerRadius;
        y = Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(0, -outerRadius);
    ctx.closePath();
    
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.fill();
    
    ctx.restore(); // Restore context to original state so other objects aren't rotated
}

// 4. Particles (Demonstrates simple physics and alpha fading)
let particles = [];
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.size = Math.random() * 5 + 2;
        this.life = 1.0;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02; // Fade out
    }
    draw() {
        ctx.globalAlpha = Math.max(this.life, 0);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
    }
}

function createParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
    }
}

// --- Main Animation Loop ---
function drawBackground() {
    // Linear Gradient Background
    let bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, "#000428"); // Dark Blue
    bgGradient.addColorStop(1, "#004e92"); // Lighter Blue
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear screen

    drawBackground();
    
    drawRotatingScalingStar();

    paddle.update();
    paddle.draw();

    ball.update();
    ball.draw();

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles.splice(i, 1); // Remove dead particles
        }
    }

    requestAnimationFrame(animate); // Loop the animation
}

// Adjust canvas on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    paddle.y = canvas.height - 40;
});

// Start game
animate();
