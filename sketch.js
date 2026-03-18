let playerImg, bgMusic;
let player;
let platforms = [];
let clouds = [];
let particles = [];
let lives = 3;
let timer = 40;
let gameState = "START"; 
let scrollX = 0;
let levelWidth = 15000;
let onGround = false;

let btnStart, btnFS, btnRetry, btnJumpOverlay;

function preload() {
  playerImg = loadImage('brawler.png');
  bgMusic = loadSound('musik.mp3');
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  
  btnStart = createButton('START GAME');
  styleButton(btnStart, height/2 + 20, '#32CD32');
  btnStart.mousePressed(startGame);

  btnFS = createButton('FULLSCREEN');
  styleButton(btnFS, height/2 + 85, '#888');
  btnFS.mousePressed(toggleFS);

  btnRetry = createButton('RETRY');
  styleButton(btnRetry, height/2 + 40, '#FF4500');
  btnRetry.mousePressed(resetToStart);

  btnJumpOverlay = createButton('');
  btnJumpOverlay.position(0, 0);
  btnJumpOverlay.size(windowWidth, windowHeight);
  btnJumpOverlay.style('background', 'transparent');
  btnJumpOverlay.style('border', 'none');
  btnJumpOverlay.style('z-index', '10');
  btnJumpOverlay.elt.addEventListener('touchstart', (e) => { e.preventDefault(); doJump(); }, {passive: false});
  btnJumpOverlay.mousePressed(doJump);

  updateUIState();
  resetGame();
  // Wolken weiter nach oben für mehr Tiefe
  for(let i=0; i<25; i++) clouds.push({x: random(0, levelWidth), y: random(10, 80), s: random(0.6, 1.2)});
}

function styleButton(btn, yPos, col) {
  btn.position(windowWidth/2 - 90, yPos);
  btn.size(180, 45);
  btn.style('background-color', col);
  btn.style('color', 'white');
  btn.style('font-size', '16px');
  btn.style('font-weight', 'bold');
  btn.style('border-radius', '10px');
  btn.style('border', '3px solid #000');
  btn.style('z-index', '20');
}

function updateUIState() {
  if (gameState === "START") {
    btnStart.show(); btnFS.show(); btnRetry.hide(); btnJumpOverlay.hide();
  } else if (gameState === "PLAY") {
    btnStart.hide(); btnFS.hide(); btnRetry.hide(); btnJumpOverlay.show();
  } else {
    btnStart.hide(); btnFS.hide(); btnRetry.show(); btnJumpOverlay.hide();
  }
}

function startGame() { 
  gameState = "PLAY"; 
  updateUIState(); 
  if (bgMusic && !bgMusic.isPlaying()) { bgMusic.loop(); bgMusic.setVolume(0.4); }
}

function resetToStart() { resetGame(); gameState = "START"; updateUIState(); }

function doJump() {
  if (gameState === "PLAY" && onGround) {
    player.velocity = player.jumpStrength;
    onGround = false;
  }
}

function toggleFS() {
  let isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!isIOS) { fullscreen(!fullscreen()); } 
  else { alert("Safari: 'Teilen' -> 'Zum Home-Bildschirm'!"); }
}

function resetGame() {
  // player.y etwas tiefer starten, jumpStrength leicht erhöht für "Luft"
  player = { x: 100, y: height - 120, w: 60, h: 60, velocity: 0, gravity: 0.85, jumpStrength: -18.5, speed: 7.8 };
  platforms = []; particles = [];
  generateLevel();
  timer = 40; scrollX = 0; lives = 3;
}

function generateLevel() {
  // Start-Boden tiefer gesetzt
  platforms.push({x: 0, y: height - 110, w: 1000, h: 60});
  
  let currentX = 1100;
  let currentY = height - 150;
  
  while (currentX < levelWidth - 1800) {
    let pWidth = random(280, 500);
    // Plattformen deutlich tiefer begrenzen (max Höhe ist jetzt 150px vom Boden weg)
    currentY = constrain(currentY + random(-90, 90), height - 250, height - 120);
    platforms.push({x: currentX, y: currentY, w: pWidth, h: 35});
    currentX += pWidth + random(180, 260);
  }
  
  // FINALE: Eine Brücke, die den Sprung zum Ziel garantiert
  let bridgeX = currentX + 50;
  platforms.push({x: bridgeX, y: height - 160, w: 600, h: 40});
  
  let finalX = bridgeX + 750; // Kleiner, sicherer Sprung
  platforms.push({x: finalX, y: height - 180, w: 1200, h: 60});
  platforms.push({x: finalX + 700, y: height - 390, w: 90, h: 210, isPortal: true});
  
  levelWidth = finalX + 1300;
}

function draw() {
  background(40, 150, 255); 
  if (gameState === "START") { drawMenu(); } else {
    if (gameState === "PLAY") updateGame();
    push();
    translate(-scrollX, 0); 
    drawClouds(); drawSpikes();
    for (let p of platforms) {
      if (p.isPortal) drawPortal(p.x, p.y);
      else { 
        fill(139, 69, 19); rect(p.x, p.y, p.w, p.h, 8); 
        fill(124, 252, 0); rect(p.x, p.y, p.w, 10, 8); 
      }
    }
    if (playerImg) image(playerImg, player.x, player.y, player.w, player.h);
    drawConfetti();
    pop();
    drawUI();
    if (gameState === "GAMEOVER" || gameState === "WIN") updateUIState();
  }
}

function updateGame() {
  timer -= 1/60;
  if (timer <= 0) gameState = "GAMEOVER";
  player.x += player.speed;
  scrollX = player.x - 150; 
  player.velocity += player.gravity;
  player.y += player.velocity;
  onGround = false;
  for (let p of platforms) {
    if (player.x + player.w*0.6 > p.x && player.x + player.w*0.4 < p.x + p.w &&
        player.y + player.h > p.y && player.y + player.h < p.y + p.h + player.velocity) {
      if (p.isPortal) { gameState = "WIN"; createConfetti(p.x + 45, p.y + 100); }
      player.y = p.y - player.h; player.velocity = 0; onGround = true;
    }
  }
  if (player.y > height) {
    lives--;
    if (lives <= 0) { gameState = "GAMEOVER"; updateUIState(); }
    else { player.x = 100; player.y = height - 200; player.velocity = 0; scrollX = 0; timer = 40; }
  }
}

function drawMenu() {
  fill(0, 180); rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  fill(200); textSize(16); text("Noa Productions präsentiert:", width/2, height/2 - 100);
  fill(255, 204, 0); stroke(0); strokeWeight(3); textSize(40); textStyle(BOLD); 
  text("BLOCK SPRINGER", width/2, height/2 - 55);
}

function drawUI() {
  textAlign(LEFT, TOP);
  let hearts = "";
  for(let i=0; i<lives; i++) hearts += "❤️";
  // UI ohne Blase, dafür mit Schatten für bessere Sichtbarkeit
  fill(0, 100); text(hearts, 22, 17);
  fill(255); textSize(24); text(hearts, 20, 15);
  fill(0, 100); text("TIME: " + ceil(timer) + "s", 22, 47);
  fill(255); textSize(18); text("TIME: " + ceil(timer) + "s", 20, 45);
  
  if (gameState === "GAMEOVER") drawEndScreen("GAME OVER", color(255, 50, 50));
  if (gameState === "WIN") drawEndScreen("LEVEL COMPLETE!", color(50, 255, 50));
}

function drawEndScreen(txt, col) {
  fill(0, 200); rect(0, 0, width, height);
  textAlign(CENTER, CENTER); textSize(40); fill(col); text(txt, width/2, height/2 - 40);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  btnStart.position(windowWidth/2 - 90, height/2 + 20);
  btnFS.position(windowWidth/2 - 90, height/2 + 85);
  btnRetry.position(windowWidth/2 - 90, height/2 + 40);
  btnJumpOverlay.size(windowWidth, windowHeight);
}

// Noch flachere Stacheln (30px) und tiefer am Rand
function drawSpikes() { 
  fill(60); 
  for (let i = scrollX - 100; i < scrollX + width + 100; i += 40) {
    triangle(i, height, i + 20, height - 30, i + 40, height);
  } 
}

function drawClouds() { fill(255, 255, 255, 150); noStroke(); for(let c of clouds) ellipse(c.x, c.y, 70 * c.s, 40 * c.s); }
function drawPortal(x, y) { fill(75, 0, 130); stroke(255, 0, 255); strokeWeight(4); ellipse(x + 45, y + 105, 90, 200); noStroke(); fill(255,0,255,100); ellipse(x + 45, y + 105, 60 + sin(frameCount*0.1)*10, 170); }
function createConfetti(x, y) { for(let i=0; i<150; i++) particles.push({x: x, y: y, vx: random(-6, 6), vy: random(-10, -3), color: color(random(255), random(255), random(255))}); }
function drawConfetti() { for (let part of particles) { fill(part.color); noStroke(); rect(part.x, part.y, 7, 7); part.x += part.vx; part.y += part.vy; part.vy += 0.15; } }
