var async = require('async');
var WebSocketServer = require('ws').Server;
var redis = require('redis');
var wss = new WebSocketServer({
	port : 2000
});

var onlineUsers = [];


wss.on('connection', function(ws){
	var client = redis.createClient();
	var username = '';
	var authorized = false;
	var isAdmin = false;
	

	ws.on('close', function(){
		//console.log('User went out');
		for (var i = 0; i < onlineUsers.length; i++)
			if (onlineUsers[i].websocket === ws) {
				onlineUsers.splice(i, 1);
				break;
			}
	});

	/*
	client.on('error', function(err){
		//console.log('Error occured: ' + err);
	});
	*/
	ws.on('message', function(message) {
		var msg = JSON.parse(message);
		switch(msg.type) {
			case 'message':
				handle_message(msg, username, authorized, client, ws);
				break;
			case 'authorize':
				if ('admin' === msg.username && 'admin' === msg.password) {
					username = msg.username;
					isAdmin = true; authorized = true;
					send_prev_messages(ws, client);
					onlineUsers.push({username : msg.username, websocket : ws, redis : client});
					ws.send(JSON.stringify({type : 'authorize', success : true, admin : true, username : msg.username}));
					return;
				}
				client.get('user:' + msg.username, function(err, value){
					if (err || value === null) {
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
				handle_logout(ws);
				username = '';
				isAdmin = false;
				authorized = false;
				break;
			case 'register':
				register_new_user(ws, client, msg);
				break;
			case 'online':
				handle_online(authorized, client, ws);
				break;
			case 'delete':
				delete_user(authorized, isAdmin, msg, client, ws);
				break;
			default:
				//console.log('uknown command');
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
			for (i = 0; i < keys.length; i++) {
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
		redisClient.set('user:' + msg.username, JSON.stringify(new_user));
		websocket.send(JSON.stringify({
			type : 'register',
			success : true
		}));
	});
};

var handle_message = function(message, username, authorized, redisClient, websocket){
	if (!authorized) {
		websocket.send(JSON.stringify({type: 'error', text : 'You are not authorized!'}));
		return;
	}
	var msg = new Object();
	msg.user = username;
	msg.text = message.text;
	msg.date = Date.now();
	redisClient.set('message:' + msg.date.toString(), JSON.stringify(msg));
	msg.type = 'message';
	broadcast(msg);
};

var handle_logout = function(websocket){
	for (var i = 0; i < onlineUsers.length; i++)
		if (onlineUsers[i].websocket === websocket) {
			onlineUsers.splice(i, 1);
			break;
		}
	websocket.send(JSON.stringify({type : 'logout', success : true}));
};

var handle_online = function(authorized, redisClient, websocket){
	if (authorized)
		async.map(
			onlineUsers, 
			function(x, callback){
				redisClient.get('user:' + x.username, function(err, value){
					callback(null, value);
				});
			},
			function(err, results){
				websocket.send(JSON.stringify({
					type : 'online',
					online : results.map(function(x){
						var user = JSON.parse(x);
						if (user != null)
							user.password = '';
						return user;
					})
				}));
			});
	else 
		websocket.send(JSON.stringify({
			type : 'online',
			online : []
		}));
};

var delete_user = function(authorized, isAdmin, message, redisClient, websocket){
	if (authorized && isAdmin && message.username != 'admin') {
		redisClient.keys('user:' + message.username, function(err, keys){
			keys.forEach(function(x){
				redisClient.del(x);
			});
			for (var i = 0; i < onlineUsers.length; i++) {
				if (onlineUsers[i].username === message.username){
					onlineUsers[i].websocket.send(JSON.stringify({
						type : 'logout',
						success : true
					}));
					onlineUsers.splice(i, 1);
					break;
				}
			}
			websocket.send(JSON.stringify({
				type : 'delete',
				success : true
			}));
		});
	}
};


module.exports.onlineUsers = onlineUsers;
module.exports.wss = wss;
module.exports.handle_logout = handle_logout;
module.exports.handle_online = handle_online;
module.exports.register_new_user = register_new_user;
module.exports.delete_user = delete_user;
module.exports.handle_message = handle_message;