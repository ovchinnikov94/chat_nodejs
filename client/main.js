ws = new WebSocket("ws://127.0.0.1:2000");
function $(el){return document.getElementById(el)}
ws.onmessage = function(message){
	var msg = JSON.parse(message.data);
	switch(msg.type){
		case 'message':
			var root = document.createElement('p');
			var name = document.createElement('h3');
			var text = document.createElement('div');
			var time = document.createElement('div');
	
			name.innerText = msg.user;
			text.innerText = msg.text;
			time.innerText = new Date(parseInt(msg.date)).toString();

			root.appendChild(name);
			root.appendChild(text);
			root.appendChild(time);

			$("messages").appendChild(root);
			break;
	}
};

$("my_message").onkeydown = function(e){
	if (e.which == 13 && !e.ctrlKey && !e.shiftKey) {
		ws.send(JSON.stringify({
			type : 'message',
			user : 'me',
			text : $("my_message").value
		}));
		$("my_message").value = '';
	}
};