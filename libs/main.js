var WebSocketServer = require('ws').Server;
var redis = require('redis');
var wss = new WebSocketServer({
	port : 2000
});

var onlineUsers = [];
var onlineUsersCount = 0;

wss.on('connection', function(ws){
	var client = redis.createClient();
	var username = '';
	var authorized = false;
	var isAdmin = false;
	

	ws.on('close', function(){
		console.log('User went out');
		for (var i = 0; i < onlineUsers.length; i++)
			if (onlineUsers[i].websocket === ws) {
				onlineUsers[i].redisClient.close();
				onlineUsers.splice(i, 1);
				break;
			}
	});

	client.on('error', function(err){
		console.log('Error occured: ' + err);
	});

	ws.on('message', function(message) {
		var msg = JSON.parse(message);
		switch(msg.type) {
			case 'message':
				if (!authorized) {
					ws.send(JSON.stringify({type: 'error', text : 'You are not authorized!'}));
					break;
				}
				var new_msg = new Object();
				new_msg.user = username;
				new_msg.text = msg.text;
				new_msg.date = Date.now();
				client.set('message:' + Date.now().toString(), JSON.stringify(new_msg));
				new_msg.type = 'message';
				broadcast(new_msg);
				break;
			case 'authorize':
				if ('admin' === msg.username && 'admin' === msg.password) {
					console.log('Admin is here!');
					username = msg.username;
					isAdmin = true; authorized = true;
					send_prev_messages(ws, client);
					onlineUsers.push({username : msg.username, websocket : ws, redis : client});
					ws.send(JSON.stringify({type : 'authorize', success : true, admin : true, username : msg.username}));
					return;
				}
				client.get('user:' + msg.username, function(err, value){
					if (err || value === null) {
						console.log('Error in authorization');
						ws.send(JSON.stringify({type : 'authorize', success : false, text : 'No such username in the system!'}));
					}
					else {
						var user = JSON.parse(value);
						authorized = user.password === msg.password;
						isAdmin = authorized && 'admin' === msg.username;
						if (isAdmin){
							ws.send(JSON.stringify({type : 'authorize', success : true, admin : true, username : msg.username}));
							username = msg.username;
							send_prev_messages(ws, client);
							onlineUsers.push({username : msg.username, websocket : ws, redis : client});
						}
						else if (authorized){
							ws.send(JSON.stringify({type : 'authorize', success : true, admin : false, username : msg.username})); 
							username = msg.username;
							send_prev_messages(ws, client);
							onlineUsers.push({username : msg.username, websocket : ws, redis : client});
						}
						else 
							ws.send(JSON.stringify({type : 'authorize', success : false, text : 'Password is not valid!'}));
					}
				});
				break;
			case 'logout':
				for (var i = 0; i < onlineUsers.length; i++)
					if (onlineUsers[i].websocket === ws) {
						onlineUsers.splice(i, 1);
						break;
					}
				username = '';
				isAdmin = false;
				authorized = false;
				ws.send(JSON.stringify({type : 'logout', success : true}));
				break;
			case 'register':
				register_new_user(ws, client, msg);
				break;
			case 'online':
				if (authorized)
					ws.send(JSON.stringify({
						type : 'online',
						online : onlineUsers.map(function(x){return x.username;})
					}));
				else 
					ws.send(JSON.stringify({
						type : 'online',
						online : []
					}));
				break;
			default:
				console.log('uknown command');
		}

	});
});

var send_prev_messages = function(websocket, redisClient){
	redisClient.keys('message:*', function(err, keys){
			keys.sort(function(x,y){
				var a = x.split(':')[1];
				var b = y.split(':')[1];
				return Number(a) > Number(b);
			});
			for (var i = keys.length - 11; i >= 0; i--)
				redisClient.del(keys[i]);
			keys = keys.slice(-10);
			for (var i = 0; i < keys.length; i++) {
				redisClient.get(keys[i], function(err, value){
					var v = JSON.parse(value);
					v.type = 'message';
					websocket.send(JSON.stringify(v));
				});
			}
		});
};

var broadcast = function(msg){
	onlineUsers.forEach(function(x){
		x.websocket.send(JSON.stringify(msg));
	});
};

var register_new_user = function(websocket, redisClient, msg){
	redisClient.get('user:' + msg.username, function(err, value){
		if (value != null)
			if (JSON.parse(value).username === msg.username) {
				websocket.send(JSON.stringify({type : 'error', text : 'Such username already exists!'}));
				return;
			}
		var new_user = new Object();
		new_user.username = msg.username;
		new_user.password = msg.password;
		new_user.firstname = msg.firstname;
		new_user.lastname = msg.lastname;
		console.log('Adding new user!');
		redisClient.set('user:' + msg.username, JSON.stringify(new_user));
		websocket.send(JSON.stringify({
			type : 'register',
			success : true
		}));
	});
};