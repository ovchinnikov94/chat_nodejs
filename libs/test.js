var chai = require('chai');
var redis = require('redis');
var should  = chai.should();
var WebSocket = require('ws');

describe('Testing db', function(){
	var dbClient;
	before(function(){
		dbClient = redis.createClient();
		dbClient.keys('*', function(err, keys){
			keys.forEach(function(x){dbClient.del(x);});
		});
		var testArray = ['aaa', 'bbb', 'ccc', 'ddd'];
		testArray.forEach(function(x){
			dbClient.set(testArray.indexOf(x).toString(), x);
		});
	});

	after(function(){
		dbClient.keys('*', function(err, keys){
			keys.forEach(function(x){dbClient.del(x);});
		});
	});

	describe('#keys()', function(){
		it('length', function(done){
			dbClient.keys('*', function(err, keys){
				keys.should.have.length(4);
				done();
			});
		});
		it('should have zero length on nonexistent key', function(done){
			dbClient.keys('eee', function(err, keys){
				keys.should.have.length(0);
				done();
			});
		});
		it('should return existed key', function(done){
			dbClient.keys('0', function(err, keys){
				keys.should.have.length(1);
				keys[0].should.equal('0');
				done();
			});
		});
	});

	describe('#get()', function(){
		it('get nonexistent key', function(done){
			dbClient.get('aaa', function(err, value){
				chai.assert.equal(value, null, 'value equal null');
				done();
			});
		});

		it('get actual value', function(done){
			dbClient.get('1', function(err, value){
				value.should.equal('bbb');
				done();
			});
		});

	});
});

describe('Testing functionality', function(){
	var main = require('./main');
	var dbClient = redis.createClient();
	var websocket = new WebSocket('ws://127.0.0.1:2000');
	websocket.on('open', function(){
		websocket.send(JSON.stringify({type: 'authorize', username : 'admin', password : 'admin'}));
	});
	var messages = [];
	websocket.on('message', function(message, flags){
		messages.push(JSON.parse(message));
	});
	describe('authorize', function(){
		it('receive authorization', function(done){
			chai.assert.notEqual(messages.filter(function(x){return x.type === 'authorize';}).length, 0, 'server authorized me');
			done();
		});
	});

	describe('#handle_logout', function(){
		it('logout', function(done){
			main.onlineUsers.push({websocket : main.wss.clients[0]});
			main.handle_logout(main.wss.clients[0]);
			setTimeout(function(){
				chai.assert.notEqual(messages.filter(function(x){return x.type === 'logout';}).length, 0, 'logout success');
				done();
			}, 10);
			
		});
	});

	describe('#handle_online', function(){
		it('online', function(done){
			main.onlineUsers.forEach(function(x){
				main.handle_online(true, dbClient, x.websocket);
			});
			setTimeout(function(){
				chai.assert.notEqual(messages.filter(function(x){return x.type === 'online';}).length, 0, 'receive online list');
				done();
			}, 10);
		});
	});

	describe('#register_new_user', function(){
		it('register', function(done){
			main.register_new_user(main.wss.clients[0], dbClient, 
				{
					username : 'test1',
					password : 'test1',
					firstname : 'TEST',
					lastname : 'TEST'
				});
			setTimeout(function(){
				chai.assert.notEqual(messages.filter(function(x){return x.type === 'register';}).length, 0, 'response registering');
				done();
			}, 10);
		})
	});

	describe('#delete_user', function(){
		it('delete', function(done){
			main.delete_user(true, true, {username : 'test1'}, dbClient, main.wss.clients[0]);
			setTimeout(function(){
				chai.assert.notEqual(messages.filter(function(x){return x.type === 'delete';}).length, 0, 'response registering');
				done();
			}, 10);
		});
	});

	describe('#handle_message', function(){
		it('message', function(done){
			main.handle_message({text : 'HELLLO'}, 'admin', true, dbClient, main.wss.clients[0]);
			setTimeout(function(){
				chai.assert.notEqual(messages.filter(function(x){return x.type === 'message' && x.text === 'HELLLO';}).length, 
					0, 'sent message receiving');
				done();
			}, 10);
		});
	});

});