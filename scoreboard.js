const { ref, onMounted } = Vue;

const app = Vue.createApp({
	setup() {
		const score1 = ref(0);
		const score2 = ref(0);
		const playersTurn = ref(1);

		const connectWebSocket = () => {
			const ws = new WebSocket('ws://'+ scoreboardConfig.host +':'+ scoreboardConfig.port);
			ws.onopen = () => {
				console.log('WebSocket connection established.');
			};
			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				score1.value = data.score1;
				score2.value = data.score2;
				playersTurn.value = data.playersTurn;
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

		onMounted(() => {
			connectWebSocket();
		});

		return { score1, score2, playersTurn };
	},
});

app.mount('#app');
