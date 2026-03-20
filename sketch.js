let playerImg, portalImg, portal2Img, ufoImg, bgMusic1, bgMusic2;
let player, platforms = [], clouds = [], particles = [], bullets = [], stars = [];
let lives = 3, timer = 40, gameState = "START", currentLevel = 1;
let scrollX = 0, levelWidth = 15000, onGround = false, playerScale = 1.0, goalX = 0;
let btnStart, btnFS, btnRetry, btnNextLevel, btnJumpOverlay;
let ufoY = 300;

function preload() {
  playerImg = loadImage('brawler.png');
  portalImg = loadImage('noa_portal.png');
  portal2Img = loadImage('portal2.png');
  ufoImg = loadImage('ufo.png');
  bgMusic1 = loadSound('musik.mp3');
  bgMusic2 = loadSound('musik2.mp3');
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  createElement('style', `canvas, button { touch-action: none !important; user-select: none !important; -webkit-tap-highlight-color: rgba(0,0,0,0); }`);

  btnStart = createButton('LEVEL 1 STARTEN'); styleButton(btnStart, height/2 + 30, '#32CD32');
  btnStart.mousePressed(() => { startGame(); });

  btnNextLevel = createButton('STARTE LEVEL 2'); styleButton(btnNextLevel, height/2 + 30, '#00BFFF');
  btnNextLevel.mousePressed(() => { currentLevel = 2; resetToStart(); });

  btnFS = createButton('FULLSCREEN'); styleButton(btnFS, height/2 + 90, '#888');
  btnFS.mousePressed(toggleFS);

  btnRetry = createButton('NOCHMAL VERSUCHEN'); styleButton(btnRetry, height/2 + 30, '#FF4500');
  btnRetry.mousePressed(resetToStart);

  btnJumpOverlay = createButton('');
  btnJumpOverlay.position(0, 0); btnJumpOverlay.size(windowWidth, windowHeight);
  btnJumpOverlay.style('background', 'transparent'); btnJumpOverlay.style('border', 'none'); 
  btnJumpOverlay.style('z-index', '10'); // Jump-Overlay bleibt unten
  btnJumpOverlay.elt.addEventListener('touchstart', (e) => { e.preventDefault(); doAction(); }, {passive: false});
  btnJumpOverlay.mousePressed(doAction);

  for(let i=0; i<100; i++) stars.push({x: random(0, 2000), y: random(0, 1000), s: random(1, 3)});
  initLevel(1); 
  updateUIState();
}

function styleButton(btn, yPos, col) {
  btn.position(windowWidth/2 - 100, yPos);
  btn.size(200, 50);
  btn.style('background-color', col); btn.style('color', 'white'); btn.style('font-size', '16px'); btn.style('font-weight', 'bold');
  btn.style('border-radius', '10px'); btn.style('border', '3px solid #000'); 
  btn.style('z-index', '1000'); // FIX: Sehr hoher z-index für echte Klicks
  btn.hide();
}

function updateUIState() {
  // Zuerst ALLES verstecken
  btnStart.hide(); btnNextLevel.hide(); btnRetry.hide(); btnFS.hide(); btnJumpOverlay.hide();
  
  if (gameState === "START") {
    btnFS.show();
    if (currentLevel === 1) btnStart.show(); else btnNextLevel.show();
  } else if (gameState === "PLAY") {
    btnJumpOverlay.show();
  } else if (gameState === "GAMEOVER") {
    btnRetry.show();
  } else if (gameState === "WIN") {
    // Jump-Overlay explizit weg, damit Buttons klickbar werden
    btnJumpOverlay.hide(); 
    if (currentLevel === 1) btnNextLevel.show();
    else { btnRetry.show(); btnRetry.html("ZURÜCK ZU LEVEL 1"); }
  }
}

function startGame() { gameState = "PLAY"; updateUIState(); playMusic(); }

function playMusic() {
  if (bgMusic1) bgMusic1.stop(); if (bgMusic2) bgMusic2.stop();
  if (currentLevel === 1 && bgMusic1) { bgMusic1.loop(); bgMusic1.setVolume(0.4); }
  if (currentLevel === 2 && bgMusic2) { bgMusic2.loop(); bgMusic2.setVolume(0.4); }
}

function resetToStart() { 
  if (btnRetry.html() === "ZURÜCK ZU LEVEL 1") currentLevel = 1;
  initLevel(currentLevel); gameState = "START"; updateUIState(); 
}

function doAction() { if (gameState === "PLAY") { player.velocity = player.jumpStrength; if (currentLevel === 1) onGround = false; } }

function toggleFS() {
  let isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!isIOS) { fullscreen(!fullscreen()); } else { alert("Safari: 'Teilen' -> 'Zum Home-Bildschirm'!"); }
}

function initLevel(lvl) {
  currentLevel = lvl; playerScale = 1.0; platforms = []; bullets = []; clouds = []; particles = []; scrollX = 0; timer = 40; lives = 3;
  if (lvl === 1) {
    player = { x: 100, y: height - 170, w: 60, h: 60, velocity: 0, gravity: 0.85, jumpStrength: -18.5, speed: 7.8 };
    generateLevel1();
    for(let i=0; i<25; i++) clouds.push({x: random(0, 15000), y: random(10, 80), s: random(0.6, 1.2)});
  } else {
    player = { x: 100, y: height/2, w: 60, h: 60, velocity: 0, gravity: 0.4, jumpStrength: -9.5, speed: 7.5 };
    levelWidth = 16000; goalX = levelWidth;
  }
}

function generateLevel1() {
  platforms.push({x: 0, y: height - 110, w: 1000, h: 60});
  let currentX = 1100; let currentY = height - 150;
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
  if (currentLevel === 1) background(40, 150, 255); else drawSpaceBackground();
  if (gameState === "PLAY") { updateGame(); if (player.x > goalX) handleWin(); }
  if (gameState === "WIN") { playerScale = lerp(playerScale, 0, 0.1); player.speed = 0; player.velocity = 0; }
  push(); translate(-scrollX, 0); 
  if (currentLevel === 1) drawLevel1Assets(); else drawLevel2Assets();
  if (playerImg && playerScale > 0.01) { push(); translate(player.x + player.w/2, player.y + player.h/2); scale(playerScale); image(playerImg, -player.w/2, -player.h/2, player.w, player.h); pop(); }
  drawConfetti(); pop();
  drawUI();
}

function drawSpaceBackground() {
  background(5, 5, 20); noStroke(); fill(40, 0, 80, 40); ellipse(width/2 + sin(frameCount*0.01)*100, height/2, width*1.5, height);
  fill(255); for(let s of stars) { let sx = (s.x - scrollX*0.2) % width; if(sx < 0) sx += width; ellipse(sx, s.y, s.s, s.s); }
}

function updateGame() {
  timer -= 1/60; if (timer <= 0) { gameState = "GAMEOVER"; updateUIState(); return; }
  player.x += player.speed; scrollX = player.x - 150; player.velocity += player.gravity; player.y += player.velocity;
  if (currentLevel === 1) {
    onGround = false;
    for (let p of platforms) { if (player.x + player.w*0.6 > p.x && player.x + player.w*0.4 < p.x + p.w && player.y + player.h > p.y && player.y + player.h < p.y + p.h + player.velocity) { player.y = p.y - player.h; player.velocity = 0; onGround = true; } }
    if (player.y > height) die();
  } else {
    if (player.y < 0) { player.y = 0; player.velocity = 0; }
    ufoY = height/2 + sin(frameCount * 0.04) * (height * 0.35);
    if (frameCount % 50 === 0) bullets.push({ x: player.x + width, y: ufoY + 40, speed: 6.5, offset: random(-80, 80) });
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].x -= bullets[i].speed; let bY = bullets[i].y + bullets[i].offset;
      if (bullets[i].x < player.x + player.w && bullets[i].x + 35 > player.x && bY < player.y + player.h && bY + 6 > player.y) { bullets.splice(i, 1); die(); }
      else if (bullets[i].x < player.x - 500) { bullets.splice(i, 1); }
    }
    if (player.y > height) die();
  }
}

function die() { lives--; if (lives <= 0) { gameState = "GAMEOVER"; updateUIState(); } else { player.x = 100; player.y = (currentLevel === 1) ? height - 170 : height/2; player.velocity = 0; scrollX = 0; timer = 40; } }

function handleWin() { if (gameState !== "WIN") { gameState = "WIN"; createConfetti(player.x + 50, player.y + 30); updateUIState(); } }

function drawLevel1Assets() { drawClouds(); fill(60); noStroke(); for (let i = scrollX - 100; i < scrollX + width + 100; i += 40) triangle(i, height, i + 20, height - 30, i + 40, height); for (let p of platforms) { fill(139, 69, 19); rect(p.x, p.y, p.w, p.h, 8); fill(124, 252, 0); rect(p.x, p.y, p.w, 10, 8); } if (portalImg) drawPortal(goalX - 100, height - 380, portalImg); }

function drawLevel2Assets() { let ufoX = player.x + width - 400; if (ufoImg) image(ufoImg, ufoX, ufoY - 60, 180, 120); fill(255, 255, 0); for (let b of bullets) rect(b.x, b.y + b.offset, 35, 6, 3); if (portal2Img) drawPortal(levelWidth, height/2 - 120, portal2Img); }

function drawPortal(x, y, img) { image(img, x, y, 200, 200); fill(40, 0, 0); noStroke(); ellipse(x + 100, y + 155, 60, 30); let tongueLen = map(sin(frameCount * 0.12), -1, 1, 15, 65); fill(255, 100, 130); rect(x + 75 + sin(frameCount * 0.2) * 5, y + 155, 54, tongueLen, 20); }

function drawUI() {
  textAlign(LEFT, TOP); let hearts = ""; for(let i=0; i<lives; i++) hearts += "❤️";
  noStroke(); fill(255); textSize(24); text(hearts, 20, 15); textSize(18); text("TIME: " + ceil(timer) + "s", 20, 45); textAlign(RIGHT, TOP); text("LEVEL " + currentLevel, width - 20, 15);
  if (gameState === "START") { fill(0, 180); rect(0, 0, width, height); textAlign(CENTER, CENTER); fill(200); textSize(16); text("Noa Productions präsentiert:", width/2, height/2 - 100); fill(255, 204, 0); textSize(40); textStyle(BOLD); text("LEVEL " + currentLevel + (currentLevel === 1 ? ": DIE WIESE" : ": WELTRAUM"), width/2, height/2 - 55); }
  if (gameState === "GAMEOVER") { fill(0, 200); rect(0, 0, width, height); textAlign(CENTER, CENTER); textSize(40); fill(255, 50, 50); text("GAME OVER", width/2, height/2 - 40); }
  if (gameState === "WIN") { fill(0, 200); rect(0, 0, width, height); textAlign(CENTER, CENTER); textSize(40); fill(50, 255, 50); text("LEVEL " + currentLevel + " COMPLETE!", width/2, height/2 - 40); }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function drawClouds() { fill(255, 255, 255, 150); noStroke(); for(let c of clouds) ellipse(c.x, c.y, 70 * c.s, 40 * c.s); }
function createConfetti(x, y) { for(let i=0; i<150; i++) particles.push({x: x, y: y, vx: random(-6, 6), vy: random(-10, -3), color: color(random(255), random(255), random(255))}); }
function drawConfetti() { for (let part of particles) { fill(part.color); noStroke(); rect(part.x, part.y, 7, 7); part.x += part.vx; part.y += part.vy; part.vy += 0.15; } }
