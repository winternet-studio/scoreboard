const app = Vue.createApp({
	setup() {
		const allSports = Vue.ref([
			{id: 'tabletennis', name: 'Table Tennis'},
			{id: 'tennis', name: 'Tennis / Padel'},
		]);
		const currSport = Vue.ref(JSON.parse(localStorage.getItem('currSport')) ?? 'tabletennis');
		const score1 = Vue.ref(0);
		const score2 = Vue.ref(0);
		const setPoints1 = Vue.ref(0);
		const setPoints2 = Vue.ref(0);
		const matchPoints1 = Vue.ref(0);
		const matchPoints2 = Vue.ref(0);
		const playersTurn = Vue.ref(1);
		const serveCount = Vue.ref(2);  //number of serve before it switches to the other player
		const reverseColumns = Vue.ref(JSON.parse(localStorage.getItem('reverseColumns')));
		let ws;

		Vue.watch(currSport, (newValue, oldValue) => {
			setCurrSport();
			localStorage.setItem('currSport', JSON.stringify(currSport.value));
		});

		const connectWebSocket = () => {
			ws = new WebSocket('ws://'+ scoreboardConfig.host +':'+ scoreboardConfig.port);
			ws.onopen = () => {
				console.log('WebSocket connection established.');
			};

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				currSport.value = data.currSport;
				score1.value = data.score1;
				score2.value = data.score2;
				setPoints1.value = data.setPoints1;
				setPoints2.value = data.setPoints2;
				matchPoints1.value = data.matchPoints1;
				matchPoints2.value = data.matchPoints2;
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
			if (navigator.vibrate) navigator.vibrate(50);
			ws.send(JSON.stringify({ type: 'increment', player }));
		};

		const decrementScore = (player) => {
			if (navigator.vibrate) navigator.vibrate(400);
			ws.send(JSON.stringify({ type: 'decrement', player }));
		};

		const pointsAdjusted = (event, valueRef) => {
			var newValue = event.target.value*1;
			ws.send(JSON.stringify({ type: 'setPoints', valueRef: valueRef, newValue: newValue }));
		};

		const switchServe = () => {
			ws.send(JSON.stringify({ type: 'switchServe' }));
		};

		const swapSides = () => {
			reverseColumns.value = !reverseColumns.value;
			localStorage.setItem('reverseColumns', JSON.stringify(reverseColumns.value));
		};

		const changeServeCount = () => {
			ws.send(JSON.stringify({ type: 'setServeCount', count: serveCount.value*1 }));
		};

		const reset = () => {
			if (confirm('Are you sure you want to reset the score?')) {
				ws.send(JSON.stringify({ type: 'reset' }));
			}
		};

		const setCurrSport = () => {
			ws.send(JSON.stringify({ type: 'setSport', id: currSport.value }));
		};

		return {
			allSports,
			currSport,
			score1,
			score2,
			setPoints1,
			setPoints2,
			matchPoints1,
			matchPoints2,
			playersTurn,
			serveCount,
			reverseColumns,
			incrementScore,
			decrementScore,
			pointsAdjusted,
			switchServe,
			swapSides,
			changeServeCount,
			reset,
		};
	},
});

app.mount('#app');
