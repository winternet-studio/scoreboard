const { ref, onMounted } = Vue;

const app = Vue.createApp({
	setup() {
		const currSport = Vue.ref('tabletennis');
		const score1 = ref(0);
		const score2 = ref(0);
		const setPoints1 = Vue.ref(0);
		const setPoints2 = Vue.ref(0);
		const matchPoints1 = Vue.ref(0);
		const matchPoints2 = Vue.ref(0);
		const playersTurn = ref(1);
		const reverseColumns = Vue.ref(JSON.parse(localStorage.getItem('reverseColumns')));

		const connectWebSocket = () => {
			const ws = new WebSocket('ws://'+ scoreboardConfig.host +':'+ scoreboardConfig.port);
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
			};
			// TODO: I think there might be an issue with making lots of retry calls if no connection over longer time... test for some recursion...
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

		const swapSides = () => {
			reverseColumns.value = !reverseColumns.value;
			localStorage.setItem('reverseColumns', JSON.stringify(reverseColumns.value));
		};

		const isSpecialPoint = (playerNum) => {
			if (currSport.value == 'tennis') {
				if (playerNum == 1 && score1.value == 'AD') {
					return true;
				} else if (playerNum == 2 && score2.value == 'AD') {
					return true;
				}
			}
			return false;
		};

		onMounted(() => {
			connectWebSocket();
		});

		return {
			currSport,
			score1,
			score2,
			setPoints1,
			setPoints2,
			matchPoints1,
			matchPoints2,
			playersTurn,
			reverseColumns,
			swapSides,
			isSpecialPoint,
		};
	},
});

app.mount('#app');
