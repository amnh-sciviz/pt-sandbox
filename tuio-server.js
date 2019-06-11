// > node server.js 8888
var port = 2222;
if (process.argv.length > 2) port = parseInt(process.argv[2]);

const dServer = require('dgram').createSocket('udp4');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const WebSocket = require('ws');

const wss = new WebSocket.Server({ server });

// bind UDP datagram server to standard TUIO port
dServer.bind(3333, '0.0.0.0');

wss.on('connection', function connection(ws) {
  console.log('Connected to WebSocket Server');
  
  // forward UDP packets via WebSockets
  dServer.on('message', function(buf, rinfo){
    ws.send({buffer: buf, sender: rinfo});
  });

  dServer.on('listening', function() {
    const address = server.address();
    console.log(`UDP Server listening ${address.address}:${address.port}`);
  });
});

app.use(express.static('./')); //Tells the app to serve static files from ./
server.listen(port, () => console.log('Web Server listening on port '+port));
