const RPC = require("discord-rpc");
const image = require("../functions/image");
var state = "stopped";

console.log((new Date()).toLocaleTimeString(), "Connecting to Discord ...");
const Client = new RPC.Client({ transport: "ipc" });
Client.on("ready", () => {
	console.log((new Date()).toLocaleTimeString(), "Connected to Discord!");
	state = "ok";
});
Client.on("disconnected", err => {
	console.error((new Date()).toLocaleTimeString(), "Disconnected from Discord", err ?? "");
	state = "disconected";
});
Client.login(
	{
		clientId: global.config.RPC.clientId,
	}
);
module.exports = activityEvent => {
	let timeout = setTimeout(()=> {}, 0);
	let firsts; //the firsts one may be laggy so don't automatically use them

	activityEvent.on("act", async act => {
		if (firsts === undefined
		|| firsts +1000 > Date.now()
		){
			firsts = Date.now();
			return;
		}
		function messageReplace(mes){
			if (!global.config.messages) global.config.messages = {};
			if (!global.config.messages[mes]) global.config.messages[mes] = `Field "${mes}" missing in config.yml`;
			return global.config.messages[mes]
				.replace(/{artist}/g, act.artist)
				.replace(/{title}/g, act.title);
		}


		if (state === "ok"){
			let data = {

				type: 2,

				details: messageReplace("details"),
				state: messageReplace("subDetails"),
				startTimestamp: act.play.startTimestamp,

				largeImageKey: await image.getTitleArtwork(act.url)/*"track_864190654"*/,
				largeImageText: act.title,
				instance: true,
			};
			if (global.config.RPC.showListenButton === true){
				data["buttons"] = [
					{
						label: await messageReplace("listen"),
						url: act.url
					}
				];
			}
			if (global.config.RPC.showArtist === true){
				data["smallImageKey"] = await image.getArtistArtwork(act.url);
				data["smallImageText"]= act.artist;
			}
			Client.setActivity(data);
			clearTimeout(timeout);
			timeout = setTimeout(()=> {
				Client.clearActivity();
			}, 15000);
		}
	});

};
process.on("SIGINT", ()=> {
	Client.clearActivity();
	Client.destroy();
	process.exit(0);
});