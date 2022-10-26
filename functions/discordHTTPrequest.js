const https = require("https");
let cache;
let isWorking = {get : false, upload: false};
function getAssets(){
	return new Promise((resolve, reject) => {
		if (cache) return resolve(cache);
		if (isWorking.get === true) return resolve([]);
		isWorking.get = true;
		const httpsreq = https.request({
			method: "get",
			host: "discord.com",
			path: `/api/v9/oauth2/applications/${global.config.RPC.clientId}/assets`,
			port: 443,
			headers: {
				authorization: global.config.RPC.token
			}
		}, async res => {
			isWorking.get = false;
			if (res.statusCode !== 200) return reject(res.statusMessage);
			const buffers = [];

			for await (const chunk of res) {
				buffers.push(chunk);
			}

			const body = JSON.parse(Buffer.concat(buffers).toString());
			cache = body;
			return resolve(body);
		});
		httpsreq.end();
		console.log(httpsreq);
	});
}
getAssets();
async function hasAsset(name){
	const assets = await getAssets();
	if (assets.filter(asset => asset.name === name).size !== 0) return true;
	return false;
}

function uploadAsset(type, name, data){
	return new Promise((resolve, reject) => {
		if (hasAsset(name)) return resolve("Already exist an aset with this name");
		if (isWorking.upload === true) return resolve([]);
		isWorking.upload = true;
		const req = https.request({
			method: "post",
			host: "discord.com",
			path: `/api/v9/oauth2/applications/${global.config.RPC.clientId}/assets`,
			port: 443,
			headers: {
				authorization: global.config.RPC.token
			}
		}, async res => {
			isWorking.upload = false;
			if (res.statusCode !== 200) {
				console.error((new Date()).toLocaleTimeString(), res.statusMessage);
				return resolve(res.statusMessage);
			}
			const buffers = [];

			for await (const chunk of res) {
				buffers.push(chunk);
			}

			const body = JSON.parse(Buffer.concat(buffers).toString());
			cache.push(body);
			return resolve(body);
		});
		req.write(JSON.stringify({image : data, type, name}));
		req.end();
	});
}
module.exports = {
	getAssets,
	hasAsset,
	uploadAsset
};