var WebSocketServer = require('ws').Server;
var redis = require('redis');
var wss = new WebSocketServer({
	port : 2000
});

var onlineUsers = [];
var onlineUsersCount = 0;

wss.on('connection', function(ws){
	var client = redis.createClient();
	ws.send(JSON.stringify({type : 'message', user : 'Dima', text : 'This is the test'}));
	client.keys('message:*', function(err, keys){
		for (var i = 0; i < keys.length; i++) {
			client.get(keys[i], function(err, value){
				var v = JSON.parse(value);
				v.type = 'message';
				ws.send(JSON.stringify(v));
			});
		}
	});
	onlineUsers[onlineUsersCount++] = ws;
	ws.on('message', function(message) {
		var msg = JSON.parse(message);
		client.on('error', function(err){
			console.log('Error occured: ' + err);
		});
		switch(msg.type) {
			case 'message':
				var new_msg = new Object();
				new_msg.user = msg.user;
				new_msg.text = msg.text;
				new_msg.date = Date.now();
				client.set('message:' + Date.now().toString(),JSON.stringify(new_msg));
				new_msg.type = 'message';
				ws.send(JSON.stringify(new_msg));
				break;
			case 'authorize':
				break;
			default:
				console.log('uknown command');
		}
	});
});
