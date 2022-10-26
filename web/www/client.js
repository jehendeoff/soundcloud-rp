(function () {
	function load_script(url) {
		return new Promise(function (resolve, reject) {
			const head = document.getElementsByTagName("head")[0];
			const script = document.createElement("script");
			script.type = "text/javascript";
			script.onload = resolve;
			script.onerror = reject;
			script.src = url;
			head.appendChild(script);
		});
	}

	load_script("http://{{host}}/socket.io/socket.io.js")
		.then(function () {
			/*global io */
			const socket = io.connect("http://{{host}}");
			const interval = 10;

			function poll_activity() {
				const $title = document.querySelector(".playbackSoundBadge__titleLink"),
					$progress = document.querySelector(".playbackTimeline__progressWrapper"),
					$artist = document.querySelector(".playbackSoundBadge__lightLink"),
					$play = document.querySelector(".playControls__play");

				if (!$title || !$artist || !$progress || !$play)
					return;

				const url = "https://soundcloud.com" + $title.getAttribute("href"),
					now = Math.floor(Date.now() / 1000) * 1000, // we round it up a bit as it is never perfect
					pos = parseInt($progress.getAttribute("aria-valuenow"), 10),
					startTimestamp = now - pos * 1000,

					playing = $play.classList.contains("playing");

				if (!playing)
					return;

				socket.emit("activity",
					{
						url,
						title: $title.getAttribute("title"),
						artist : $artist.getAttribute("title"),

						play:
						{
							startTimestamp,
						}
					}
				);
			}

			poll_activity();
			setInterval(poll_activity, interval * 1000);
			let clientID;
			//modified from https://gist.github.com/webketje/8cd2e6ae8a86dbe0533c5d2c612c42c6
			function patchXHR(onRestore) {
				const originalXHR = window.XMLHttpRequest.prototype.open;

				window.XMLHttpRequest.prototype.open = function () {
					originalXHR.apply(this, arguments);
					const restore = arguments[1] && arguments[1].match(/client_id=([\w\d]+)&*/) && arguments[1].match(/client_id=([\w\d]+)&*/)[1];
					if (restore) {
						window.XMLHttpRequest.prototype.open = originalXHR;
						onRestore(restore);
					}
				};
			}
			socket.on("clientId", ()=> {
				if (!clientID){
					patchXHR(clientId => {
						socket.emit("clientId", clientId);
						clientID = clientId;
					});
				}else
					socket.emit("clientId", clientID);

			});



		})
		.catch(function (err) {
			console.error("soundcloud-rp", err);
		});

})();