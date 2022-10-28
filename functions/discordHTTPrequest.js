const https = require("https");
const maxAsset = 150;
const maxInDiscordAssets = 135;
const recentId = 20;

const canUpload = global.configParsed.canUpload;

let cache = [];
let uploaded = [];
let isWorking = {get : false, upload: false};

var events = require("events");

const GetCacheEvent = new events.EventEmitter();

function getAssets(){
	return new Promise((resolve, reject) => {
		if (cache.length !== 0) return resolve(cache);
		if (isWorking.get === true){
			return GetCacheEvent.once("cache", cache => {
				return resolve(cache);
			});
		} else{
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
				uploaded = uploaded.filter(obj =>
					body.filter(asset =>
						asset.id === obj.id
					).length === 0
				);
				GetCacheEvent.emit("cache", body);
				return resolve(body);
			});
			httpsreq.end();
		}
	});
}
async function hasAsset(name){
	const assets = await getAssets();
	if (assets.filter(asset => asset.name === name).length !== 0) return true;
	return false;
}
const recentlyPushed = [];
function pushNew(id) {
	if (recentlyPushed.includes(id)) return;
	recentlyPushed.push(id);
	if (recentlyPushed.length > recentId) recentlyPushed.shift();
	return;
}


function uploadAsset(type, name, data){
	return new Promise((resolve, reject) => {
		if (uploaded.filter(obj => obj.name === name).length !== 0)return resolve("discord has that asset, but the cache hasn't recognized it");
		hasAsset(name).then(res => {
			if (res === true)return resolve("Already exist an aset with this name");
			autoDelete();
			if (isWorking.upload === true) return resolve("Already working.");
			isWorking.upload = true;
			const bodyreq = JSON.stringify({image : data, type, name});
			const req = https.request({
				method: "post",
				host: "discord.com",
				path: `/api/v9/oauth2/applications/${global.config.RPC.clientId}/assets`,
				port: 443,
				headers: {
					authorization: global.config.RPC.token,
					"Content-Type":"application/json"
				}
			}, async res => {
				isWorking.upload = false;
				if (res.statusCode !== 201) {
					console.error((new Date()).toLocaleTimeString(), res.statusMessage);
					return resolve(res.statusMessage);
				}
				const buffers = [];

				for await (const chunk of res) {
					buffers.push(chunk);
				}

				const body = JSON.parse(Buffer.concat(buffers).toString());
				uploaded.push(body);
				pushNew(body.id);
				return resolve(body);
			});
			req.write(bodyreq);
			req.end();
		});
	});
}
function deleteAsset(id){
	return new Promise((resolve, reject) => {
		const req = https.request({
			method: "delete",
			host: "discord.com",
			path: `/api/v9/oauth2/applications/${global.config.RPC.clientId}/assets/${id}`,
			port: 443,
			headers: {
				authorization: global.config.RPC.token
			}
		}, async res => {
			if (res.statusCode !== 204) {
				console.error("\t",(new Date()).toLocaleTimeString(), res.statusMessage);
				return resolve(res.statusMessage);
			}

			let index = -1;
			cache.forEach((obj, i) => {
				if (obj.id === id) index = i;
			});
			if (index !== -1)
				cache.slice(index,1);
			return resolve();
		});
		req.end();
	});
}
async function deleteDouble(){
	const assets = await getAssets();
	const single = [];
	assets.forEach(asset => {
		if (single.includes(asset.name)){
			console.error((new Date()).toLocaleTimeString(), "Found a duplicate asset, deleting");
			deleteAsset(asset.id);
		}else{
			single.push(asset.name);
		}
	});
}
let lastDelete;
async function autoDelete(){
	if (lastDelete !== undefined
	|| lastDelete +30000 > Date.now()) return;
	lastDelete = Date.now();
	const assets = await getAssets();
	if (assets.length > maxInDiscordAssets){
		console.error((new Date()).toLocaleTimeString(), "Found too many assets. We will delete some");
		const toDelete = assets.length - maxInDiscordAssets;
		let double = [...assets];
		double = double.sort((aobj,bobj)=> {
			const a = aobj.name
				, b = bobj.name;
			let ret = 0;
			if (a === "default") ret +=10;
			if (b === "default") ret -=10; // we make sure to never delete the default

			if (recentlyPushed.includes(aobj.id)) ret +=5;
			if (recentlyPushed.includes(bobj.id)) ret -=5;

			if (a.startsWith("track_") || a.startsWith("artist_")) ret +=2;
			if (b.startsWith("track_") || b.startsWith("artist_")) ret -=2; // and if possible we delete the artist and the track last
			ret += (aobj.id - bobj.id) > 0 ? 1 : 0-1;
			return ret;
		});
		console.error((new Date()).toLocaleTimeString(), "We will begin deleting some asset");
		for (let i = 0; i < toDelete; i++) {
			const obj = double[i];
			console.error("\t", (new Date()).toLocaleTimeString(), "Deleting", obj);
			deleteAsset(obj.id).then(()=> {
				console.error("\t", (new Date()).toLocaleTimeString(), "Deleted", obj);
			});

		}
		cache = [];
	}
	deleteDouble();
}
if(canUpload){
	autoDelete();
	setInterval(()=> {
		cache = [];
		console.log((new Date()).toLocaleTimeString(), "Updating local cache");
		autoDelete();
	}, 40000);
}
module.exports = {
	getAssets,
	hasAsset,
	uploadAsset
};