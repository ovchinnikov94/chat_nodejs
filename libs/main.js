var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
	port : 2000
});
wss.on('connection', function(ws){
	ws.on('message', function(message) {
		ws.send(JSON.stringify({status : "OK"}));
	});
});