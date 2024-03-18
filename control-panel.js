const app = Vue.createApp({
	setup() {
		const score1 = Vue.ref(0);
		const score2 = Vue.ref(0);
		const playersTurn = Vue.ref(1);
		const serveCount = Vue.ref(2);  //number of serve before it switches to the other player
		let ws;

		const connectWebSocket = () => {
			ws = new WebSocket('ws://'+ scoreboardConfig.host +':'+ scoreboardConfig.port);
			ws.onopen = () => {
				console.log('WebSocket connection established.');
			};

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				score1.value = data.score1;
				score2.value = data.score2;
				playersTurn.value = data.playersTurn;
				serveCount.value = data.serveCount;
			};

			ws.onerror = () => {
				var reconnectInSecs = 2;
				ws.close();  //not sure if I need this
				console.error('WebSocket connection error. Reconnecting in '+ reconnectInSecs +' seconds...');
				setTimeout(connectWebSocket, reconnectInSecs * 1000);
			};
			ws.onclose = () => {
				var reconnectInSecs = 2;
				console.log('WebSocket connection closed. Reconnecting in '+ reconnectInSecs +' seconds...');
				setTimeout(connectWebSocket, reconnectInSecs * 1000);
			};
		};

		connectWebSocket();

		const incrementScore = (player) => {
			ws.send(JSON.stringify({ type: 'increment', player }));
		};

		const decrementScore = (player) => {
			ws.send(JSON.stringify({ type: 'decrement', player }));
		};

		const switchServe = () => {
			ws.send(JSON.stringify({ type: 'switchServe' }));
		};

		const changeServeCount = () => {
			ws.send(JSON.stringify({ type: 'setServeCount', count: serveCount.value }));
		};

		const reset = () => {
			if (confirm('Are you sure you want to reset the score?')) {
				ws.send(JSON.stringify({ type: 'reset' }));
			}
		};

		return {
			score1,
			score2,
			playersTurn,
			serveCount,
			incrementScore,
			decrementScore,
			switchServe,
			changeServeCount,
			reset,
		};
	},
});

app.mount('#app');
