let playerImg, bgMusic, portalImg;
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
  portalImg = loadImage('noa_portal.png'); // Das Gesicht von Noa
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
  // START-POSITION FIX: Direkt auf die erste Plattform setzen
  // Erste Plattform ist bei height - 110, Brawler ist 60 hoch
  let startY = height - 110 - 60;
  player = { x: 100, y: startY, w: 60, h: 60, velocity: 0, gravity: 0.85, jumpStrength: -18.5, speed: 7.8 };
  platforms = []; particles = [];
  generateLevel();
  timer = 40; scrollX = 0; lives = 3;
  onGround = true; // Damit er am Anfang nicht zuckt
}

function generateLevel() {
  platforms.push({x: 0, y: height - 110, w: 1000, h: 60});
  let currentX = 1100;
  let currentY = height - 150;
  while (currentX < levelWidth - 1800) {
    let pWidth = random(280, 500);
    currentY = constrain(currentY + random(-90, 90), height - 250, height - 120);
    platforms.push({x: currentX, y: currentY, w: pWidth, h: 35});
    currentX += pWidth + random(180, 260);
  }
  let bridgeX = currentX + 50;
  platforms.push({x: bridgeX, y: height - 160, w: 600, h: 40});
  let finalX = bridgeX + 750; 
  platforms.push({x: finalX, y: height - 180, w: 1200, h: 60});
  platforms.push({x: finalX + 700, y: height - 380, w: 200, h: 200, isPortal: true});
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
        fill(139, 69, 19); noStroke(); rect(p.x, p.y, p.w, p.h, 8); 
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
      if (p.isPortal) { gameState = "WIN"; createConfetti(p.x + 100, p.y + 100); }
      player.y = p.y - player.h; player.velocity = 0; onGround = true;
    }
  }
  if (player.y > height) {
    lives--;
    if (lives <= 0) { gameState = "GAMEOVER"; updateUIState(); }
    else { 
      player.x = 100; 
      player.y = height - 110 - 60; // RESPAWN-FIX
      player.velocity = 0; scrollX = 0; timer = 40; onGround = true;
    }
  }
}

function drawMenu() {
  fill(0, 180); noStroke(); rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  fill(200); textSize(16); text("Noa Productions präsentiert:", width/2, height/2 - 100);
  fill(255, 204, 0); stroke(0); strokeWeight(3); textSize(40); textStyle(BOLD); 
  text("BLOCK SPRINGER", width/2, height/2 - 55);
}

function drawUI() {
  textAlign(LEFT, TOP);
  let hearts = "";
  for(let i=0; i<lives; i++) hearts += "❤️";
  noStroke(); // UI-FIX: Alle Ränder weg
  fill(255); 
  textSize(24); text(hearts, 20, 15);
  textSize(18); text("TIME: " + ceil(timer) + "s", 20, 45);
  
  if (gameState === "GAMEOVER") drawEndScreen("GAME OVER", color(255, 50, 50));
  if (gameState === "WIN") drawEndScreen("LEVEL COMPLETE!", color(50, 255, 50));
}

function drawEndScreen(txt, col) {
  fill(0, 200); noStroke(); rect(0, 0, width, height);
  textAlign(CENTER, CENTER); textSize(40); fill(col); text(txt, width/2, height/2 - 40);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  btnStart.position(windowWidth/2 - 90, height/2 + 20);
  btnFS.position(windowWidth/2 - 90, height/2 + 85);
  btnRetry.position(windowWidth/2 - 90, height/2 + 40);
  btnJumpOverlay.size(windowWidth, windowHeight);
}

function drawSpikes() { 
  fill(60); noStroke();
  for (let i = scrollX - 100; i < scrollX + width + 100; i += 40) {
    triangle(i, height, i + 20, height - 30, i + 40, height);
  } 
}

function drawClouds() { fill(255, 255, 255, 150); noStroke(); for(let c of clouds) ellipse(c.x, c.y, 70 * c.s, 40 * c.s); }

function drawPortal(x, y) {
  if (portalImg) {
    image(portalImg, x, y, 200, 200);
    
    // 1. Dunkler Mund-Hintergrund
    fill(40, 0, 0); noStroke();
    ellipse(x + 100, y + 155, 50, 25);
    
    // 2. Zungen-Animation (Rosa Zunge fährt aus dem Mund)
    let tongueLen = map(sin(frameCount * 0.12), -1, 1, 10, 55);
    fill(255, 120, 150); // Schönes Zungen-Rosa
    rect(x + 85, y + 155, 30, tongueLen, 15);
    
    // 3. Kleiner Strich in der Mitte der Zunge
    stroke(200, 80, 100); strokeWeight(2);
    line(x + 100, y + 158, x + 100, y + 153 + tongueLen);
    noStroke();
  }
}

function createConfetti(x, y) { for(let i=0; i<150; i++) particles.push({x: x, y: y, vx: random(-6, 6), vy: random(-10, -3), color: color(random(255), random(255), random(255))}); }
function drawConfetti() { for (let part of particles) { fill(part.color); noStroke(); rect(part.x, part.y, 7, 7); part.x += part.vx; part.y += part.vy; part.vy += 0.15; } }
