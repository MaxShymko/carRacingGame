(function() {
//Aliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle,
    Text = PIXI.Text,
    Graphics = PIXI.Graphics;

let gameWindow = document.body.querySelector('#gameWindow');
let gameScore = gameWindow.querySelector('#gameScore > span');
let scoreForm = document.body.querySelector('#scoreForm');
let gameWindowWidth = 300;
let gameWindowHeight = document.body.clientHeight;
let id;
let gameStartScene = new Container();
let gameScene = new Container();
let gameOverScene = new Container();
let road = new Container();
let roadTexture;
let mainCar;
let keyLeft;
let keyRight;
let minDistance;
let bots = [];
let score = 0;
let gameStartMessage;
let bootSpeed = 4;
let mainCarTextureId = 0;

//Create a Pixi Application
let app = new Application({ 
    width: gameWindowWidth,
    height: gameWindowHeight,
    antialias: true, 
    transparent: false, 
    resolution: 1,
    backgroundColor: 0xFFFFFF
  }
);

gameWindow.appendChild(app.view);

loader
  .add("../img/carRacing.json")
  .load(setup);

function setup() {
  id = PIXI.loader.resources["../img/carRacing.json"].textures;

  app.stage.addChild(gameScene);
  gameOverScene.visible = false;
  app.stage.addChild(gameOverScene);
  app.stage.addChild(gameStartScene);
  gameStartScene.visible = false;

  roadTexture = id["road.png"];
  for (let i = -15; i < gameWindowHeight + roadTexture.height; i += roadTexture.height) {
    let sprite = new Sprite(roadTexture);
    sprite.y = i;
    road.addChild(sprite);
  }
  gameScene.addChild(road);

  mainCar = new Sprite(id["mainCar0.png"]);
  mainCar.anchor.set(0.5, 0.2);
  gameScene.addChild(mainCar);

  keyLeft = keyboard(37);
  keyLeft.press = function() {
    mainCar.vx += -7;
  };
  keyLeft.release = function() {
    mainCar.vx += 7;
  };
  keyRight = keyboard(39);
  keyRight.press = function() {
    mainCar.vx += 7;
  };
  keyRight.release = function() {
    mainCar.vx += -7;
  };

  minDistance = mainCar.height + 300;

  let textStyle = {
    fontFamily: "Helvetica",
    fontSize: 30,
    fill: "#FFF",
    dropShadow: true,
    dropShadowColor: "#000",
    dropShadowBlur: 2,
    dropShadowAngle: Math.PI / 4,
    dropShadowDistance: 2,
    wordWrap: true,
    wordWrapWidth: gameWindowWidth
  };

  gameStartMessage = new Text("", textStyle);
  gameStartMessage.x = 20;
  gameStartScene.addChild(gameStartMessage);
  updateScoreList();

  let pressEnterMessage = new Text("press Enter", textStyle);
  pressEnterMessage.x = 70;
  pressEnterMessage.y = gameWindowHeight - 150;
  gameStartScene.addChild(pressEnterMessage);


  state = startGame;
  app.ticker.add(delta => gameLoop(delta));
  generateBot();
}

function gameLoop(delta){

  state(delta);
}

function gameOver(delta) {
  gameOverScene.visible = true;
  scoreForm.classList.remove('hidden');
}

let timeCounter = 0;
let turnSpeed = 0;
function play(delta) {
  if (road.y >= 0)
    road.y = -roadTexture.height + 15;
  else
    road.y += 15;
    
  if (mainCar.vx > 0) {
    turnSpeed += 0.2;
    if (turnSpeed > mainCar.vx)
      turnSpeed = mainCar.vx;
  } else if (mainCar.vx < 0) {
    turnSpeed -= 0.2;
    if (turnSpeed < mainCar.vx)
      turnSpeed = mainCar.vx;
  } else {
    if (turnSpeed > 0.2) {
      turnSpeed -= 0.2;
    } else if (turnSpeed < -0.2) {
      turnSpeed += 0.2;
    } else {
      turnSpeed = 0;
    }
  }
  if (Math.abs(turnSpeed) > 0.2) {
    if (mainCar.x + turnSpeed > mainCar.width/2 && mainCar.x + turnSpeed < gameWindowWidth - mainCar.width/2) {
      mainCar.x += turnSpeed;
    } else {
      turnSpeed = 0;
    }
    mainCar.rotation = turnSpeed * Math.PI / 160;
  } else {
    mainCar.rotation = 0;
  }

  bots.forEach((bot, i) => {
    if (hitRectangle(mainCar, bot))
      return state = gameOver;
    if (bot.y >= gameWindowHeight) {
      gameScene.removeChild(bot);
      bots.splice(i, 1);
      gameScore.innerText = ++score;
      if (score%10 == 0)
        bootSpeed++;
    } else {
      bot.y += bootSpeed;
    }
  });

  timeCounter++;
  if (timeCounter >= 5) {
    mainCar.setTexture(id[`mainCar${mainCarTextureId = (mainCarTextureId + 1) % 3}.png`])
    timeCounter = 0;
  }
}

function generateBot() {
  setTimeout(generateBot, randomInt(200, 800));

  let bot = new Sprite(id[`car${randomInt(0, 6)}.png`]);
  bot.y = -bot.height;
  let line = randomInt(0, 2);
  let carsOnRowCount = 0;
  
  if (bots.some(item => {
    if (item.line == line) {
      return item.y - bot.y - bot.height < minDistance;
    }
    if (item.line != line) {
      if (item.y - bot.y - bot.height < minDistance)
        carsOnRowCount++;
    }
    return false;
  }))
    return;

  if (carsOnRowCount >= 2)
    return;

  bot.x = gameWindowWidth/2 - bot.width/2 + (line - 1) * 100;
  bot.line = line;
  gameScene.addChild(bot);
  bots.push(bot);
}

function keyboard(keyCode) {
  let key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) {
        key.press();
        if (state == play)
          event.preventDefault();
      }
      key.isDown = true;
      key.isUp = false;
    }
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) {
        key.release();
        if (state == play)
          event.preventDefault();
      }
      key.isDown = false;
      key.isUp = true;
    }
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}

function hitRectangle(r1, r2) {
  let
    xLeft1 = r1.x - r1.anchor.x * r1.width,
    xRight1 = r1.x + r1.width - r1.anchor.x * r1.width,
    yTop1 = r1.y - r1.anchor.y * r1.height + 10,
    yBottom1 = r1.y + r1.height - r1.anchor.y * r1.height - 20;
  let
    xLeft2 = r2.x - r2.anchor.x * r2.width,
    xRight2 = r2.x + r2.width - r2.anchor.x * r2.width,
    yTop2 = r2.y - r2.anchor.y * r2.height + 10,
    yBottom2 = r2.y + r2.height - r2.anchor.y * r2.height - 20;

  if (xRight1 > xLeft2 && xLeft1 < xRight2 && yBottom1 > yTop2 && yTop1 < yBottom2)
    return true;
  return false;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

scoreForm.addEventListener('click', function(e) {
  let name = document.body.querySelector('#scoreName').value;
  if (e.target.id == 'scoreSaveBtn' && name.length) {
    let scoreStr = window.localStorage.getItem('score');
    let obj;
    if (!scoreStr)
      obj = [];
    else
      obj = JSON.parse(scoreStr);

    obj.push({name, points: score});
    obj.sort((a, b) => b.points - a.points);
    window.localStorage.setItem('score', JSON.stringify(obj.slice(0, 10)));

    state = startGame;
    e.preventDefault();
  } else if (e.target.id == 'scoreCancelBtn') {
    state = startGame;
    e.preventDefault();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (state === startGame) {
      gameStartScene.visible = false;
      state = play;
    }
  }
});

function startGame() {
  updateScoreList();
  gameOverScene.visible = false;
  gameStartScene.visible = true;
  scoreForm.classList.add('hidden');
  score = 0;
  bots.forEach(bot => gameScene.removeChild(bot));
  bots = [];
  mainCar.y = gameWindowHeight - mainCar.height;
  mainCar.x = gameWindowWidth / 2;
  mainCar.vx = 0;
  gameScore.innerText = 0;
  mainCar.rotation = 0;
  turnSpeed = 0;
  bootSpeed = 4;
  mainCarTextureId = 0;
}

function updateScoreList() {
  gameStartMessage.text = 'Top results:\n';
  let scoreStr = window.localStorage.getItem('score');
  let obj;
  if (!scoreStr)
    obj = [];
  else
    obj = JSON.parse(scoreStr);
  for (let i = 0; i < 10 && i < obj.length; i++) {
    gameStartMessage.text += `${i+1}. ${obj[i].name}: ${obj[i].points}\n`;
  }
}

}())
