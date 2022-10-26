let cache = {};
const getSCIC = () => global.config.soundcloud.clientId === "auto" ? undefined : global.config.soundcloud.clientId;
const https = require("https");

let inTask =[];

function getData(url){
	return new Promise((resolve, rej)=> {
		if (!getSCIC()) return rej("soundcloud clientID isn't set");
		if (cache[url]) return resolve(cache[url]);
		if (inTask.includes(url))return rej("Already scraping this url");
		inTask.push(url);

		const urlObj = new URL("https://api-v2.soundcloud.com/resolve");
		urlObj.searchParams.set("client_id", getSCIC());
		urlObj.searchParams.set("url", url);
		https.get(urlObj.toString(), async res => {
			inTask.splice(inTask.indexOf(url), 1);
			if (res.statusCode !== 200) return rej(res.statusMessage);
			const buffers = [];

			for await (const chunk of res) {
				buffers.push(chunk);
			}

			const body = JSON.parse(Buffer.concat(buffers).toString());
			cache[url] = {
				user : {
					id: body.user.id,
					avatar_url : body.user.avatar_url
				},
				id: body.id,
				artwork_url: body.artwork_url
			};
			return resolve (body);
		});
	});
}
function getB64Image(url, info){
	return new Promise((resolve, rej) => {
		if (cache[url]) return resolve(cache[url]);

		https.get(url, async res => {
			if (res.statusCode !== 200) return rej(res.statusMessage);
			const buffers = [];

			for await (const chunk of res) {
				buffers.push(chunk);
			}

			const body = "data:" + res.headers["content-type"] + ";" + Buffer.concat(buffers).toString("base64");
			cache[url] = body;
			return resolve (body);
		}).on("error", err => {
			rej((new Date()).toLocaleDateString() + info + err);
		});
	});
}
let coversCache = {};
function getCovers(url){
	return new Promise((res, rej) => {
		if (coversCache[url]) return res(coversCache[url]);
		getData(url)
			.then(data => {
				const artistCoverURL = data.user.avatar_url;
				const titleCoverURL = data.artwork_url;

				const artisteCoverB64 = getB64Image(artistCoverURL, "Getting the artist image url : " + artistCoverURL).catch(err =>{console.error((new Date()).toLocaleTimeString(), err); return undefined;});
				const titleCoverB64 = getB64Image(titleCoverURL, "Getting the track cover url : " + titleCoverURL).catch(err =>{console.error((new Date()).toLocaleTimeString(), err); return undefined;});

				const ret = {
					artist: {
						name: artisteCoverB64 !== undefined ? "artist_" + data.user.id : "default",
						b64: artisteCoverB64
					},
					title: {
						name: titleCoverB64 !== undefined ? "track_" + data.id : "default",
						b64: titleCoverB64
					}
				};
				coversCache[url] = ret;
				return res(ret);

			})
			.catch(err => {
				return rej(err);
			});
	});
}
module.exports = {
	getCovers,
	isInCache(url){
		return cache[url] !== undefined;
	}
};