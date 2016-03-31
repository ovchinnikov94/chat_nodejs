ws = new WebSocket("ws://127.0.0.1:2000");
function $(el){return document.getElementById(el)}
var myname = '';
ws.onmessage = function(message){
	var msg = JSON.parse(message.data);
	switch(msg.type){
		case 'message':
			var li = document.createElement('li');
			if (myname != msg.user)
				li.className = "left clearfix";
			else 
				li.className = "right clearfix";
			var span_img = document.createElement('span');
			if (myname != msg.user)
				span_img.className = "chat-img pull-left";
			else {
				span_img.className = "chat-img pull-right";
			}
			var img = document.createElement('img');
			img.src = "http://placehold.it/50/55C1E7/fff&text=U";
			img.className = "img-circle";
			span_img.appendChild(img);
			
			var div_chat_body = document.createElement('div');
			div_chat_body.className = "chat-body clearfix";
			var div_header = document.createElement('div');
			div_header.className = "header";
			var strong = document.createElement('strong');
			if (myname != msg.user)
				strong.className = "primary-font";
			else 
				strong.className = "pull-right primary-font";
			strong.innerText = msg.user;
			var small = document.createElement('small');
			if (myname != msg.user) 
				small.className = "pull-right text-muted";
			else 
				small.className = " text-muted";
			var span_time = document.createElement('span');
			span_time.className = "glyphicon glyphicon-time";
			small.appendChild(span_time);
			small.innerText = new Date(msg.date).toString();
			strong.appendChild(small);
			div_header.appendChild(strong);
			var p = document.createElement('p');
			p.innerText = msg.text;
			div_chat_body.appendChild(div_header);
			div_chat_body.appendChild(p);
			li.appendChild(span_img);
			li.appendChild(div_chat_body);
			$("messages").appendChild(li);
			break;
		case 'error':
			$("div-error").style.display = 'block';
			$("div-error").innerText = msg.text;
			break;
		case 'authorize':
			if (msg.success) {
				$("authorization").style.display = 'none';
				$("div-error").style.display = 'none';
				$("signed_username").innerText = 'Signed in as ' + msg.username;
				myname = msg.username;
				$("user-info").style.display = 'block';
			}
			else {
				$("passwordForm").class = "form-group has-error";
				$("password").value = '';
				$("div-error").style.display = 'block';
				$("div-error").innerText = msg.text;
			}
			break;
		case 'logout':
			if (msg.success) {
				$("user-info").style.display = 'none';
				$("authorization").style.display = 'block';
				$("div-error").style.display = 'none';
				$("password").value = ''
				$("messages").innerText = '';
				myname = '';
			}
			else {

			}
			break;
		default:
			alert('Uknown command: ' + msg.type);
	}
};

$("msg_to_send").onkeydown = function(e){
	if (e.which == 13 && !e.ctrlKey && !e.shiftKey) {
		ws.send(JSON.stringify({
			type : 'message',
			text : $("msg_to_send").value
		}));
		$("msg_to_send").value = '';
	}
};

$("msg_btn").onclick = function(){
	ws.send(JSON.stringify({
		type : 'message',
		text : $("msg_to_send").value
	}));
	$("msg_to_send").value = '';
};

$("authorize").onclick = function(e){
	ws.send(JSON.stringify({
		type : 'authorize',
		username : $("username").value,
		password : $("password").value
	}));
};

$("logout-btn").onclick = function(){
	ws.send(JSON.stringify({
		type : 'logout'
	}));
};

$("password").onkeydown = function(e){
	if(e.which == 13) {
		ws.send(JSON.stringify({
			type : 'authorize',
			username : $("username").value,
			password : $("password").value
		}));
	}
};