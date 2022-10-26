const request = require("request-promise-native");
const trace = require("debug")("soundcloud-rp:trace");

module.exports = (config) => {

	function getTrackData(url) {
		trace("soundcloud.getTrackData", url);

		return request.get("https://api-v2.soundcloud.com/resolve", {
			qs: {
				client_id: "ZzQw5OLejAQys1cYAUI2nUbLtZbBe5Lg",
				url: "https://soundcloud.com/cysteke/luda-gets-funky-b-r-e-a-k-cysteke-remixremake"
			},
			json: true
		});
	}

	function sanitizeArtworkUrl(url) {
		trace("soundcloud.sanitizeArtworkUrl", url);

		return url.replace("large", "t500x500");
	}

	return {
		getTrackData,
		sanitizeArtworkUrl
	};
};