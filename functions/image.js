const sc = require("./soundcloud");
const discord = require("./discordHTTPrequest");

const canUpload = global.configParsed.canUpload;
if (!canUpload) console.warn((new Date()).toLocaleTimeString(), "We detected that we can't upload pictures to discord, resolving to using default ones.");

const scIdAvailable = ()=> global.config.soundcloud.clientId !== "auto" || global.config.soundcloud.clienId === "none";


module.exports = {

	async getArtistArtwork(url){
		if (!canUpload || !scIdAvailable()){
			console.log((new Date()).toLocaleTimeString(), "We can't upload");
			return "default";
		}
		if (sc.isInCache(url)){
			const name = (await sc.getCovers(url)).artist.name;
			if (await discord.hasAsset(name)) return name;
		}
		const covers = await sc.getCovers(url);

		//type 1 is for tracks
		console.log((new Date()).toLocaleTimeString(), "uploading");
		discord.uploadAsset(1, covers.title.name, covers.title.b64).then(console.log);
		discord.uploadAsset(2, covers.artist.name, covers.artist.b64).then(console.log);
		return "default";
	},
	async getTitleArtwork(url){
		if (!canUpload || !scIdAvailable()){
			console.log((new Date()).toLocaleTimeString(), "We can't upload");
			return "default";
		}
		if (sc.isInCache(url)){
			const name = (await sc.getCovers(url)).title.name;
			if (await discord.hasAsset(name)) return name;
		}
		const covers = await sc.getCovers(url);

		//type 1 is for tracks
		console.log((new Date()).toLocaleTimeString(), "uploading");
		discord.uploadAsset(1, covers.title.name, covers.title.b64).then(console.log);
		discord.uploadAsset(2, covers.artist.name, covers.artist.b64).then(console.log);
		return "default";
	}

};