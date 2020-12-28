let config = require('./config.json');

let ws281x = require('./lib/ws281x-native');

let NUM_LEDS = 0;

config.leds.forEach(leds => { NUM_LEDS += leds});

let options = {gpioPin: 18};

ws281x.init(NUM_LEDS,options);


// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function () {
    ws281x.reset();
    process.nextTick(function () { process.exit(0); });
  });


let pixelData = new Uint32Array(NUM_LEDS);
let t0 = 0;
let timer = 0;
let time = 0;
let cpt = 0;
let animInterval;


let simpleColor = function(deb, fin, color){
    for(let i = deb ; i < fin ; i++){
        
        let red2 = color.red;
        red2 = Math.floor(red2);
       
        let green2 = color.green;
        green2 = Math.floor(green2);
       
        let blue2 = color.blue;
        blue2 = Math.floor(blue2);
        
        pixelData[i] = rgb2Int(blue2, red2, green2);
     }

     ws281x.render(pixelData);
}

let animLeds = function(deb, fin, color, strip){
    for(let i = deb ; i < fin ; i++){
        let mult=strip.offset+strip.ratio*Math.cos(0.01*timer+strip.dir*Math.floor(i/strip.stack));
        
        mult=clamp(mult,0,1);
        mult*=strip.maxi;
       
        let red2 = color.red * mult;
        red2 = Math.floor(red2);
       
        let green2 = color.green * mult;
        green2 = Math.floor(green2);
       
        let blue2 = color.blue * mult;
        blue2 = Math.floor(blue2);
        
        pixelData[i] = rgb2Int(blue2, red2, green2);
     }
}


function animBlink(deb, fin, color, t){
  let mult = 0.2;
  cpt++;

  if(cpt <= t/2) {
    mult=1;
  }
  let red2 = color.red * mult;
  red2 = Math.floor(red2);
  
  let green2 = color.green * mult;
  green2 = Math.floor(green2);
  
  let blue2 = color.blue * mult;
  blue2 = Math.floor(blue2);

  for(let i = deb ; i < fin ; i++){
    pixelData[i] = rgb2Int(blue2, red2, green2);
  }

  if(cpt >= t){
    cpt = 0;
  }
}


let ledWave = function(color, strip){

    let fin = 0;

    for(let i = 0; i <= config.leds.length ; i++){
        fin += config.leds[i];
        animLeds(i, fin, color, strip[i]);
    }
    
    ws281x.render(pixelData);
}

let ledBlink = function(color, t){

    let fin = 0;

    for(let i = 0; i <= config.leds.length ; i++){
        fin += config.leds[i];
        animBlink(i, fin, color, t);
    }
    
    ws281x.render(pixelData);
}

let clamp = function(val, mini, maxi){
    return Math.max(Math.min(val,maxi),mini);
}

function rgb2Int(r, g, b) {
    return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

let intervalAnimSimple = function(color, strip){
    clearInterval(animInterval);
    timer=0;
    animInterval = setInterval(function () {
        time = Date.now();
        timer += time - t0;
        t0 = time;
        ledWave(color, strip);
    }, 1000 / 30);
}

let intervalAnimDouble = function(color, t, stop, strip){
    clearInterval(animInterval);
    timer=0;
    animInterval = setInterval(function () {
        time = Date.now();
        timer += time - t0;
        t0 = time;

      if(timer>1000){
        ledWave(color, strip);
      }else{
        ledBlink(color, t);
      }
      if(timer>2000){
        timer=0
        if(stop){
            animWait();
        }
        
      }   
    }, 1000 / 30);
}

let staticColor = function(color){
    clearInterval(animInterval);
    timer=0;
    simpleColor(0, NUM_LEDS, color);
}


let animIdle = () => {
    intervalAnimSimple(config.idle.color, config.idle.anim);
}

let animWait = () => {
    intervalAnimSimple(config.wait.color, config.wait.anim);
}

let animVictory = () => {
    intervalAnimDouble(config.victory.color, config.victory.time, true, config.victory.anim);
}

let animFail = () => {
    intervalAnimDouble(config.fail.color, config.fail.time, true, config.fail.anim);
}

let solidGreen = () => {
    intervalAnimDouble(config.victory.color, config.victory.time, false, config.victory.anim);
}

let solidRed = () => {
    intervalAnimDouble(config.fail.color, config.fail.time, false, config.fail.anim);
}

let solidBlack = () => {
    staticColor(config.black.color);
}

let stopLed = () => {
    ws281x.reset();
}


exports.animIdle = animIdle;
exports.animWait = animWait;
exports.animVictory = animVictory;
exports.animFail = animFail;
exports.solidGreen = solidGreen;
exports.solidRed = solidRed;
exports.solidBlack = solidBlack;
exports.stopLed = stopLed;