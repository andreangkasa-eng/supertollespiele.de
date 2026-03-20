let playerImg, portalImg, portal2Img, ufoImg, bgMusic1, bgMusic2;
let player, platforms = [], clouds = [], particles = [], bullets = [];
let lives = 3, timer = 40, gameState = "START", currentLevel = 1;
let scrollX = 0, levelWidth = 15000, onGround = false, playerScale = 1.0, goalX = 0;

let btnStart, btnFS, btnRetry, btnJumpOverlay;
let ufoY = 300;

function preload() {
  // Assets Level 1 & 2
  playerImg = loadImage('brawler.png');
  portalImg = loadImage('noa_portal.png');
  portal2Img = loadImage('portal2.png');
  ufoImg = loadImage('ufo.png');
  
  // Musik laden
  bgMusic1 = loadSound('musik.mp3');
  bgMusic2 = loadSound('musik2.mp3');
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  
  // Mobile Fix CSS
  createElement('style', `canvas, button { touch-action: none !important; user-select: none !important; -webkit-tap-highlight-color: rgba(0,0,0,0); }`);

  // HTML Buttons (Einmalige Erstellung)
  btnStart = createButton('SPIEL STARTEN'); styleButton(btnStart, height/2 + 20, '#32CD32');
  btnStart.mousePressed(startGame);

  btnFS = createButton('FULLSCREEN'); styleButton(btnFS, height/2 + 85, '#888');
  btnFS.mousePressed(toggleFS);

  btnRetry = createButton('RETRY'); styleButton(btnRetry, height/2 + 40, '#FF4500');
  btnRetry.mousePressed(resetToStart);

  btnJumpOverlay = createButton('');
  btnJumpOverlay.position(0, 0); btnJumpOverlay.size(windowWidth, windowHeight);
  btnJumpOverlay.style('background', 'transparent'); btnJumpOverlay.style('border', 'none'); btnJumpOverlay.style('z-index', '10');
  btnJumpOverlay.elt.addEventListener('touchstart', (e) => { e.preventDefault(); doAction(); }, {passive: false});
  btnJumpOverlay.mousePressed(doAction);

  initLevel(1); 
  updateUIState();
}

function styleButton(btn, yPos, col) {
  btn.position(windowWidth/2 - 90, yPos);
  btn.size(180, 45);
  btn.style('background-color', col); btn.style('color', 'white'); btn.style('font-size', '16px'); btn.style('font-weight', 'bold');
  btn.style('border-radius', '10px'); btn.style('border', '3px solid #000'); btn.style('z-index', '20');
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
  playMusic();
}

function playMusic() {
  if (bgMusic1) bgMusic1.stop();
  if (bgMusic2) bgMusic2.stop();
  if (currentLevel === 1 && bgMusic1) { bgMusic1.loop(); bgMusic1.setVolume(0.4); }
  if (currentLevel === 2 && bgMusic2) { bgMusic2.loop(); bgMusic2.setVolume(0.4); }
}

function resetToStart() { 
  initLevel(currentLevel); 
  gameState = "START"; 
  updateUIState(); 
}

function doAction() {
  if (gameState === "PLAY") {
    if (currentLevel === 1 && onGround) {
      player.velocity = player.jumpStrength;
      onGround = false;
    } else if (currentLevel === 2) {
      player.velocity = player.jumpStrength;
    }
  }
}

function toggleFS() {
  let isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!isIOS) { fullscreen(!fullscreen()); } 
  else { alert("Safari: 'Teilen' -> 'Zum Home-Bildschirm'!"); }
}

// --- LEVEL INITIALISIERUNG ---
function initLevel(lvl) {
  currentLevel = lvl;
  playerScale = 1.0;
  platforms = []; bullets = []; clouds = []; particles = [];
  scrollX = 0; timer = 40; lives = 3;
  
  if (lvl === 1) {
    player = { x: 100, y: height - 170, w: 60, h: 60, velocity: 0, gravity: 0.85, jumpStrength: -18.5, speed: 7.8 };
    generateLevel1();
    for(let i=0; i<25; i++) clouds.push({x: random(0, 15000), y: random(10, 80), s: random(0.6, 1.2)});
  } else {
    player = { x: 100, y: height/2, w: 60, h: 60, velocity: 0, gravity: 0.4, jumpStrength: -9.5, speed: 7.2 };
    levelWidth = 16000;
    goalX = levelWidth;
  }
}

function generateLevel1() {
  platforms.push({x: 0, y: height - 110, w: 1000, h: 60});
  let currentX = 1100;
  let currentY = height - 150;
  while (currentX < 12000) {
    let pWidth = random(300, 550);
    currentY = constrain(currentY + random(-80, 80), height - 250, height - 120);
    platforms.push({x: currentX, y: currentY, w: pWidth, h: 35});
    currentX += pWidth + random(140, 200); 
  }
  let finalRunwayX = currentX;
  platforms.push({x: finalRunwayX, y: height - 180, w: 4000, h: 60});
  goalX = finalRunwayX + 1000;
}

function draw() {
  background(currentLevel === 1 ? color(40, 150, 255) : color(5, 10, 35)); 

  if (gameState === "PLAY") {
    updateGame();
    if (player.x > goalX) handleWin();
  }
  
  if (gameState === "WIN") { playerScale = lerp(playerScale, 0, 0.1); }

  push();
  translate(-scrollX, 0); 
  
  if (currentLevel === 1) {
    drawLevel1Assets();
  } else {
    drawLevel2Assets();
  }

  // Brawler zeichnen
  if (playerImg && playerScale > 0.01) {
    push(); translate(player.x + player.w/2, player.y + player.h/2); scale(playerScale);
    image(playerImg, -player.w/2, -player.h/2, player.w, player.h); pop();
  }
  
  drawConfetti();
  pop();
  drawUI();
}

function updateGame() {
  timer -= 1/60;
  if (timer <= 0) { gameState = "GAMEOVER"; updateUIState(); return; }
  
  player.x += player.speed;
  scrollX = player.x - 150; 
  player.velocity += player.gravity;
  player.y += player.velocity;

  if (currentLevel === 1) {
    // Level 1 Logik
    onGround = false;
    for (let p of platforms) {
      if (player.x + player.w*0.6 > p.x && player.x + player.w*0.4 < p.x + p.w &&
          player.y + player.h > p.y && player.y + player.h < p.y + p.h + player.velocity) {
        player.y = p.y - player.h; player.velocity = 0; onGround = true;
      }
    }
    if (player.y > height) die();
  } else {
    // Level 2 Logik
    if (player.y < 0) { player.y = 0; player.velocity = 0; }
    ufoY = height/2 + sin(frameCount * 0.04) * (height * 0.35);
    
    // Schuss-Logik
    if (frameCount % 80 === 0) {
      bullets.push({ x: player.x + width, y: ufoY + 20, speed: 5.5, offset: random(-15, 15) });
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].x -= bullets[i].speed;
      let bY = bullets[i].y + bullets[i].offset; // Der Zufalls-Offset
      if (bullets[i].x < player.x + player.w && bullets[i].x + 35 > player.x &&
          bY < player.y + player.h && bY + 6 > player.y) {
        bullets.splice(i, 1); die();
      } else if (bullets[i].x < player.x - 500) { bullets.splice(i, 1); }
    }
    if (player.y > height) die();
  }
}

function die() {
  lives--;
  if (lives <= 0) { gameState = "GAMEOVER"; updateUIState(); }
  else { 
    player.x = 100; 
    player.y = (currentLevel === 1) ? height - 170 : height/2;
    player.velocity = 0; scrollX = 0; timer = 40;
  }
}

function handleWin() {
  if (gameState !== "WIN") {
    gameState = "WIN";
    player.speed = 0; player.velocity = 0;
    createConfetti(player.x + 50, player.y + 30);
    updateUIState();
    setTimeout(() => {
      if (currentLevel === 1) { initLevel(2); gameState = "START"; updateUIState(); playMusic(); }
      else { initLevel(1); gameState = "START"; updateUIState(); playMusic(); }
    }, 3000);
  }
}

function drawLevel1Assets() {
  drawClouds();
  // Spikes
  fill(60); noStroke(); for (let i = scrollX - 100; i < scrollX + width + 100; i += 40) triangle(i, height, i + 20, height - 30, i + 40, height);
  // Plattformen
  for (let p of platforms) {
    fill(139, 69, 19); rect(p.x, p.y, p.w, p.h, 8); 
    fill(124, 252, 0); rect(p.x, p.y, p.w, 10, 8); 
  }
  // Portal
  if (portalImg) image(portalImg, goalX - 100, height - 380, 200, 200);
}

function drawLevel2Assets() {
  // Sterne
  fill(255); noStroke();
  for (let i = 0; i < 60; i++) {
    let starX = floor((scrollX + i * 400) / 20000) * 20000 + (i * 337) % 2500;
    ellipse(starX, (i * 157) % height, 2, 2);
  }
  // UFO
  let ufoX = player.x + width - 250;
  if (ufoImg) image(ufoImg, ufoX, ufoY - 60, 180, 120);
  // Bullets
  fill(255, 255, 0);
  for (let b of bullets) rect(b.x, b.y + b.offset, 35, 6, 3);
  // Portal
  if (portal2Img) image(portal2Img, levelWidth, height/2 - 120, 240, 240);
}

function drawUI() {
  textAlign(LEFT, TOP);
  let hearts = ""; for(let i=0; i<lives; i++) hearts += "❤️";
  fill(255); noStroke(); 
  textSize(24); text(hearts, 20, 15);
  textSize(18); text("TIME: " + ceil(timer) + "s", 20, 45);
  textAlign(RIGHT, TOP); text("LEVEL " + currentLevel, width - 20, 15);

  if (gameState === "START") {
    fill(0, 180); rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    fill(200); textSize(16); text("Noa Productions präsentiert:", width/2, height/2 - 100);
    fill(255, 204, 0); textSize(40); textStyle(BOLD); text("BLOCK SPRINGER", width/2, height/2 - 55);
  }
  if (gameState === "GAMEOVER") {
    fill(0, 200); rect(0, 0, width, height);
    textAlign(CENTER, CENTER); textSize(40); fill(255, 50, 50); text("GAME OVER", width/2, height/2 - 40);
  }
  if (gameState === "WIN") {
    fill(0, 200); rect(0, 0, width, height);
    textAlign(CENTER, CENTER); textSize(40); fill(50, 255, 50); text("LEVEL COMPLETE!", width/2, height/2 - 40);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function drawClouds() { fill(255, 255, 255, 150); noStroke(); for(let c of clouds) ellipse(c.x, c.y, 70 * c.s, 40 * c.s); }
function createConfetti(x, y) { for(let i=0; i<150; i++) particles.push({x: x, y: y, vx: random(-6, 6), vy: random(-10, -3), color: color(random(255), random(255), random(255))}); }
function drawConfetti() { for (let part of particles) { fill(part.color); noStroke(); rect(part.x, part.y, 7, 7); part.x += part.vx; part.y += part.vy; part.vy += 0.15; } }
