ws = new WebSocket("ws://127.0.0.1:2000");
function $(el){return document.getElementById(el)}
ws.onmessage = function(message){
	var event = JSON.parse(message.data);
	$("result").innerText = event.status;
};

$("result").innerText = "Hello world!";
$("my_message").onkeydown = function(e){
	if (e.which == 13 && !e.ctrlKey && !e.shiftKey) {
		ws.send(JSON.stringify({
			type : 'message',
			message : $("my_message").value
		}));
		$("my_message").value = '';
	}
};