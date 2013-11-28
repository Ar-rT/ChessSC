var io = require('socket.io').listen(81);
var fs = require('fs');
var AloneRoom;

function Log(data)
{
	fs.appendFile('message.txt', data, function (err) {
	  if (err) throw err;
	});
}

io.sockets.on('connection', function (socket) {
	socket.emit("connected");
	socket.gameStatus = "connected";
	Log(socket.id + " connected.\r\n");

	socket.on('readyToPlay', function() {		
		if (socket.gameStatus != "connected")
			return;

		if (AloneRoom)
		{
			socket.join(AloneRoom);
			Log("Room #" + AloneRoom + " is full.\r\n");
			io.sockets.in(AloneRoom).emit("gameStarted");
		    //io.sockets.in(AloneRoom).set("gameStatus", "gameStarted"); //???

			for (var socketId in io.sockets.clients(AloneRoom)) {
			    console.log(socketId);
			    console.log(io.sockets.clients(AloneRoom)[socketId].gameStatus);
			    io.sockets.clients(AloneRoom)[socketId].gameStatus = "gameStarted";
			    console.log(io.sockets.clients(AloneRoom)[socketId].gameStatus);
			    Log(socketId + " game started.\r\n");
			}
			socket.inroom=AloneRoom;
			AloneRoom = undefined;
		}
		else
		{
			AloneRoom = socket.id;
			socket.join(AloneRoom);
			socket.inroom=AloneRoom;
			Log("Room #" + AloneRoom + " has been created.\r\n");
			socket.emit("waitingForPlayers");
			socket.gameStatus = "waitingForPlayers";
		}
		
	});
	socket.on("makeMove", function (data) {
	    Log("Make move called \r\n");
	    //console.log(socket.gameStatus);
		if (socket.gameStatus != "gameStarted")
		    return;

		Log("Make move valid \r\n");

		if (data.xfrom!=undefined && data.yfrom!=undefined && data.xto!=undefined && data.yto!=undefined) {
			socket.broadcast.to(socket.inroom).emit("makeMove", data);
			Log(socket.id + " maked move from " + data.xfrom + " " + data.yfrom + " to " + data.xto + " " + data.yto + "\r\n");
		}
		else {
		        this.disconnect();
		}
	});
	socket.on("gameOver", function (data) {
	    for (var socketId in io.sockets.clients(socket.inroom)) {
	        io.sockets.clients(socket.inroom)[socketId].disconnect();
	        Log(socketId + " game over.\r\n");
	    }
	});
	
	
	socket.on("disconnect",function(data){
	   var roomClients = io.sockets.clients(socket.inroom);
	   if (roomClients.length != 0) { 
	   console.log(roomClients.length);
	   for (var socketId in roomClients)
		  if(roomClients[socketId]!=this)
		  {
           roomClients[socketId].leave(socket.inroom);
		   roomClients[socketId].disconnect();
		   console.log(roomClients[socketId].id + " disconnected. ");
		   }
		 roomClients = io.sockets.clients(socket.inroom);
		 console.log(roomClients.length);
		}
	});
	
});