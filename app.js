const express = require('express');
const app = express();
var server = require('http').createServer(app);
const bodyParser = require('body-parser');
const gamepad = require("gamepad");
const io = require('socket.io')(server);
const sockets = io.listen(8050);
const { exec } = require("child_process");
const shutdownCommand = "sudo shutdown now";
const cors = require('cors');

const ws281x = require('./ws281x');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

gamepad.init();

app.use(cors());

app.use(express.static(__dirname + '/public'));

let dir = __dirname;
let txt = "";

//Create a game loop and poll for event
setInterval(gamepad.processEvents, 16);
//Scan for a new gamepads as slower rate
setInterval(gamepad.detectDevices, 500);

app.get('/', function (req, res) {
  res.sendFile('/home/qba/testborne/public/index.html');
})

app.get('/health', (req, res) => {
    res.status(200).send();
});

//Listed for button up events on all gamepads
gamepad.on("up", function(id, num){
    txt = "BOUTON";

    console.log("Down "+ num);

    io.emit('change_header', {
        header: txt
    });  
});

//Listed for button down events on all gamepads
gamepad.on("down", function(id, num){
    if(num == 1){
        txt = "GAUCHE";
    }else if(num == 2){
        txt = "DROITE";
    }else{
        txt = num;
    }

    console.log(txt);

    io.emit('change_header', {
        header: txt
    });   
});


io.on('connection', function(socket) {
    socket.emit('change_header', {
        header: txt
    });
});

sockets.on('connection', function (socket) {
    socket.on('shutdown', function(){
        shutdownServer();
        console.log('ShutDown');
    })
})

let shutdownServer = async () => {
    console.log("Server shutdown in progress...");
    ws281x.stopLed();
    exec(shutdownCommand, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

ws281x.animIdle();

server.listen(80);
