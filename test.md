# TOC
   - [Testing db](#testing-db)
     - [#keys()](#testing-db-keys)
     - [#get()](#testing-db-get)
<a name=""></a>
 
<a name="testing-db"></a>
# Testing db
<a name="testing-db-keys"></a>
## #keys()
length.

```js
dbClient.keys('*', function(err, keys){
	keys.should.have.length(4);
	done();
});
```

should have zero length on nonexistent key.

```js
dbClient.keys('eee', function(err, keys){
	keys.should.have.length(0);
	done();
});
```

should return existed key.

```js
dbClient.keys('0', function(err, keys){
	keys.should.have.length(1);
	keys[0].should.equal('0');
	done();
});
```

<a name="testing-db-get"></a>
## #get()
get nonexistent key.

```js
dbClient.get('aaa', function(err, value){
	chai.assert.equal(value, null, 'value equal null');
	done();
});
```

get actual value.

```js
dbClient.get('1', function(err, value){
	value.should.equal('bbb');
	done();
});
```

Server is ready for connections
# TOC
   - [Testing db](#testing-db)
     - [#keys()](#testing-db-keys)
     - [#get()](#testing-db-get)
   - [Testing functionality](#testing-functionality)
     - [authorize](#testing-functionality-authorize)
     - [#handle_logout](#testing-functionality-handle_logout)
     - [#handle_online](#testing-functionality-handle_online)
     - [#register_new_user](#testing-functionality-register_new_user)
     - [#delete_user](#testing-functionality-delete_user)
     - [#handle_message](#testing-functionality-handle_message)
<a name=""></a>
 
<a name="testing-db"></a>
# Testing db
<a name="testing-db-keys"></a>
## #keys()
length.

```js
dbClient.keys('*', function(err, keys){
	keys.should.have.length(4);
	done();
});
```

should have zero length on nonexistent key.

```js
dbClient.keys('eee', function(err, keys){
	keys.should.have.length(0);
	done();
});
```

should return existed key.

```js
dbClient.keys('0', function(err, keys){
	keys.should.have.length(1);
	keys[0].should.equal('0');
	done();
});
```

<a name="testing-db-get"></a>
## #get()
get nonexistent key.

```js
dbClient.get('aaa', function(err, value){
	chai.assert.equal(value, null, 'value equal null');
	done();
});
```

get actual value.

```js
dbClient.get('1', function(err, value){
	value.should.equal('bbb');
	done();
});
```

<a name="testing-functionality"></a>
# Testing functionality
<a name="testing-functionality-authorize"></a>
## authorize
receive authorization.

```js
chai.assert.notEqual(messages.filter(function(x){return x.type === 'authorize';}).length, 0, 'server authorized me');
done();
```

<a name="testing-functionality-handle_logout"></a>
## #handle_logout
logout.

```js
main.onlineUsers.push({websocket : main.wss.clients[0]});
main.handle_logout(main.wss.clients[0]);
setTimeout(function(){
	chai.assert.notEqual(messages.filter(function(x){return x.type === 'logout';}).length, 0, 'logout success');
	done();
}, 10);
```

<a name="testing-functionality-handle_online"></a>
## #handle_online
online.

```js
main.onlineUsers.forEach(function(x){
	main.handle_online(true, dbClient, x.websocket);
});
setTimeout(function(){
	chai.assert.notEqual(messages.filter(function(x){return x.type === 'online';}).length, 0, 'receive online list');
	done();
}, 10);
```

<a name="testing-functionality-register_new_user"></a>
## #register_new_user
register.

```js
main.register_new_user(main.wss.clients[0], dbClient, 
	{
		username : 'test1',
		password : 'test1',
		firstname : 'TEST',
		lastname : 'TEST',
	});
setTimeout(function(){
	chai.assert.notEqual(messages.filter(function(x){return x.type === 'register';}).length, 0, 'response registering');
	done();
}, 10);
```

<a name="testing-functionality-delete_user"></a>
## #delete_user
delete.

```js
main.delete_user(true, true, {username : 'test1'}, dbClient, main.wss.clients[0]);
setTimeout(function(){
	chai.assert.notEqual(messages.filter(function(x){return x.type === 'delete';}).length, 0, 'response registering');
	done();
}, 10);
```

<a name="testing-functionality-handle_message"></a>
## #handle_message
message.

```js
main.handle_message({text : 'HELLLO'}, 'admin', true, dbClient, main.wss.clients[0]);
setTimeout(function(){
	chai.assert.notEqual(messages.filter(function(x){return x.type === 'message' && x.text === 'HELLLO';}).length, 
		0, 'sent message receiving');
	done();
}, 10);
```

