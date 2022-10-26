const Http = require("http");
const SocketIO = require("socket.io");
const fs = require("fs");
const events = require("events");

const port = global.config.advanced.port ?? 7769;

const httpServer = Http.createServer(async (req, res)=> {
	const buffers = [];

	for await (const chunk of req) {
		buffers.push(chunk);
	}

	req.body = Buffer.concat(buffers).toString();

	const urlObj = new URL(`http://${req.headers.host}${req.url}`);

	switch (urlObj.pathname) {
	case "/client.js":{

		res.writeHead(200, {

			"Access-Control-Allow-Origin": "https://soundcloud.com",
			"content-type": "text/javascript;charset=utf-8",
			"X-Content-Type-Options": "nosniff",
		});
		res.write(
			fs.readFileSync(__dirname + "/www/client.js", "utf-8")
				.replace(/{{host}}/g, urlObj.hostname + ":" + urlObj.port)
		);
		res.end();

		break;
	}


	default:
		res.writeHead(404);
		res.end("");
		break;
	}

});
const io = new SocketIO.Server(httpServer, {
	cors:{
		origin: "https://soundcloud.com"
	}
});
io.serveClient(true);
httpServer.listen(port);

const activityEvent = new events.EventEmitter();
io.on("connection", socket => {
	//TODO add verifications to not trouble discord moduel later
	socket.on("activity", act => {
		console.log((new Date()).toLocaleTimeString(), "New alert", act);
		activityEvent.emit("act", act);
	});
	if (global.config.soundcloud.clientId === "auto") socket.emit("clientId");
	socket.on("clientId", clientID => {
		if (global.config.soundcloud.clientId !== "auto") return;
		console.log((new Date()).toLocaleTimeString(), "We got soundcloud clientID :", clientID);
		global.config.soundcloud.clientId = clientID;
	});
});
module.exports = activityEvent;
