const sc = require("./soundcloud");
const discord = require("./discordHTTPrequest");

const canUpload = global.config.RPC.clientId !== "657893063875624961" && global.config.RPC.token !== "" || global.config.forceImage === true;
if (!canUpload) console.warn((new Date()).toLocaleTimeString(), "We detected that we can't upload pictures to discord, resolving to using default ones.");

const scIdAvailable = ()=> global.config.soundcloud.clientId !== "auto";


module.exports = {

	async getArtistArtwork(url){
		if (!canUpload || !scIdAvailable())
			return "default";
		if (sc.isInCache(url)){
			const name = (await sc.getCovers(url)).artist.name;
			if (await discord.hasAsset(name)) return name;
		}
		sc.getCovers(url).then(covers => {
			//type 1 is for tracks
			discord.uploadAsset(1, covers.title.name, covers.title.data);
			discord.uploadAsset(2, covers.artist.name, covers.artist.data);
		}).catch(O_o=> {});
		return "default";
	},
	async getTitleArtwork(url){
		if (!canUpload || !scIdAvailable())
			return "default";
		if (sc.isInCache(url)){
			const name = (await sc.getCovers(url)).title.name;
			if (await discord.hasAsset(name)) return name;
		}
		sc.getCovers(url).then(covers => {
			//type 1 is for tracks
			discord.uploadAsset(1, covers.title.name, covers.title.data);
			discord.uploadAsset(2, covers.artist.name, covers.artist.data);
		}).catch(O_o=> {});
		return "default";
	}

};