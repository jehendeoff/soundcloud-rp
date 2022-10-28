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
			const socket = io.connect("http://{{host}}", {transports: ["websocket"]});
			socket.on("connect_error", () => {
				// revert to classic upgrade
				socket.io.opts.transports = ["polling", "websocket"];
			});
			const interval = 10;

			function getNext(){
				return new Promise((resolve) => {
					let isQueueOpened = document.querySelector("div.playControls__queue>div.queue.m-visible") !== null;
					if (!isQueueOpened)
						document.querySelector(".playControls__queue").style.visibility = "hidden";
					const wasQueueOpened = isQueueOpened;
					document.querySelector("a.playbackSoundBadge__showQueue").click();

					isQueueOpened = document.querySelector("div.playControls__queue>div.queue.m-visible") !== null;
					if (!isQueueOpened) {
						document.querySelector("a.playbackSoundBadge__showQueue").click();
						isQueueOpened = true;
					}
					setTimeout(() => {
						const child = document.querySelector(".queue__itemsContainer > div.queue__itemWrapper > div.queueItemView.m-active" /*.m-playing"*/ );
						const isShowingCurentlyPlaying =
							isQueueOpened &&
							child !== null;
						if (isShowingCurentlyPlaying) {
							const childOfQueue = child.parentNode;
							const parentOfQueue = childOfQueue.parentNode;
							const children = [...parentOfQueue.children]
								.filter(elem => !elem.classList.contains("queue__fallback"))
								.sort((a, b)=> {
									let nbb = b.style.transform.replace(/(?:translate\(0px,? ?|(?:px)?\))/g, "");
									if (nbb === "") nbb = "0";
									let nba = a.style.transform.replace(/(?:translate\(0px,? ?|(?:px)?\))/g, "");
									if (nba === "") nba = "0";

									return parseInt(nba) - parseInt(nbb);
								});

							const indexOfChild = Array.prototype.indexOf.call(children, childOfQueue);

							//console.log(children, indexOfChild)
							if (children.length > indexOfChild + 1) {
								const next = children[indexOfChild + 1]
									.children[0]; // wrapper
								/*console.log(children[indexOfChild])
								console.log(next)*/
								resolve(next.querySelector("a.sc-link-primary[href^=\"/\"]").href);
							}/* else {
								console.log("no further song");
							}*/
						}/* else {
							console.log("queue not opened");
						}*/
						if (!wasQueueOpened)
							document.querySelector("a.playbackSoundBadge__showQueue").click();
						setTimeout(() => {
							document.querySelector(".playControls__queue").style.visibility = "unset";
						}, 200);
						return resolve(undefined);

					}, 500);
				});
			}
			window.test = {getNext};

			async function poll_activity() {
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
				const next = await getNext();

				socket.emit("activity",
					{
						url,
						title: $title.getAttribute("title"),
						artist : $artist.getAttribute("title"),

						play:
						{
							startTimestamp,
						},
						next
					}
				);
			}

			poll_activity();
			setInterval(poll_activity, interval * 1000);
			if (typeof MutationObserver !== "undefined"){
				const targetClass = [
					".playbackSoundBadge__titleLink > span:nth-child(1)",
					".playControl"
				];
				function observe(){
					const targets = targetClass.map(cla => document.querySelector(cla));
					const MusicNameObserver = new MutationObserver(poll_activity);
					targets.forEach(elem => {
						console.log("observing", elem);
						MusicNameObserver.observe(elem, {childList: true, attributes: true});
					});
				}
				let good = false;
				const t = setInterval(()=> {
					good = true;
					targetClass.forEach(elem =>{
						if (document.querySelector(elem) === null)
							good = false;
					});
					if (good === true){
						observe();
						clearInterval(t);
					}
				}, 500);


			}

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