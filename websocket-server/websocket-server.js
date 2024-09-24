require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });

var sharedData = {
	currSport: null,
	score1: 0,
	score2: 0,
	setPoints1: 0,
	setPoints2: 0,
	matchPoints1: 0,
	matchPoints2: 0,
	playersTurn: 1,
	serveCount: 2,
};
var serveToggler = false;  //boolean which inverts the player's turn calculation when toggled in order to change who serve first

if (typeof process.env.SERVER_PORT == 'undefined') {
	process.env.SERVER_PORT = 3011;
}

wsServer.on('connection', (ws) => {
	// Send initial data to clients
	ws.send(JSON.stringify(getSendPayload()));

	// Handle messages from clients
	ws.on('message', (message) => {
		const data = JSON.parse(message);
		logMe('RECV:', data);
		if (data.type === 'increment') {
			// logMe('Incrementing player '+ data.player);
			if (sharedData.currSport == 'tabletennis') {
				if (data.player === 1) {
					sharedData.score1++;
				} else if (data.player === 2) {
					sharedData.score2++;
				}
			} else if (sharedData.currSport == 'tennis') {
				if (data.player === 1) {
					TennisLogic.increaseScore(sharedData, 1, 2);
				} else if (data.player === 2) {
					TennisLogic.increaseScore(sharedData, 2, 1);
				}
			}
		} else if (data.type === 'decrement') {
			// logMe('Decrementing player '+ data.player);
			if (sharedData.currSport == 'tabletennis') {
				if (data.player === 1) {
					if (sharedData.score1 > 0) {
						sharedData.score1--;
					}
				} else if (data.player === 2) {
					if (sharedData.score2 > 0) {
						sharedData.score2--;
					}
				}
			} else if (sharedData.currSport == 'tennis') {
				if (data.player === 1) {
					TennisLogic.decreaseScore(sharedData, 1, 2);
				} else if (data.player === 2) {
					TennisLogic.decreaseScore(sharedData, 2, 1);
				}
			}
		} else if (data.type === 'switchServe') {
			// logMe('Switching serve');
			serveToggler = !serveToggler;
		} else if (data.type === 'reset') {
			logMe('Resetting the current score: '+ sharedData.score1 + ' - '+ sharedData.score2);
			sharedData.score1 = sharedData.score2 = sharedData.setPoints1 = sharedData.setPoints2 = sharedData.matchPoints1 = sharedData.matchPoints2 = 0;
			// logMe('Reset complete');
		} else if (data.type === 'setServeCount') {
			sharedData.serveCount = parseInt(data.count, 10);
			// logMe('New serve count:', sharedData.serveCount);
		} else if (data.type === 'setPoints') {
			if (['setPoints1', 'setPoints2', 'matchPoints1', 'matchPoints2'].indexOf(data.valueRef) > -1) {
				sharedData[data.valueRef] = parseInt(data.newValue, 10);
			}
			// logMe('Setting points value:', data.valueRef +'='+ data.newValue);
		} else if (data.type === 'setSport') {
			if (data.id != sharedData.currSport) {
				sharedData.currSport = data.id;
				sharedData.score1 = sharedData.score2 = 0;
			}
			// logMe('Sport:', sharedData.currSport);
		}

		// Determine next player to serve
		var scoreSum;
		if (sharedData.currSport == 'tabletennis') {
			scoreSum = sharedData.score1 + sharedData.score2;
			var temp = Math.floor(scoreSum / sharedData.serveCount);
			if (temp % 2 == 0) {  //do we have an even number (not odd)
				sharedData.playersTurn = (serveToggler ? 2 : 1);
			} else {
				sharedData.playersTurn = (serveToggler ? 1 : 2);
			}
		} else if (sharedData.currSport == 'tennis') {
			scoreSum = sharedData.setPoints1*1 + sharedData.setPoints2*1 + sharedData.matchPoints1*1 + sharedData.matchPoints2*1;
			if (scoreSum % 2 == 0) {  //do we have an even number (not odd)
				sharedData.playersTurn = (serveToggler ? 2 : 1);
			} else {
				sharedData.playersTurn = (serveToggler ? 1 : 2);
			}
		}

		// Broadcast updated data to all clients
		var payload = getSendPayload();
		logMe('SEND:', payload);
		wsServer.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(payload));
			}
		});
	});
});

server.listen(process.env.SERVER_PORT, () => {
	console.log('WebSocket server listening on port '+ process.env.SERVER_PORT);
});

function getSendPayload() {
	return sharedData;
}

function logMe(message, message2) {
	if (message2) {
		console.log(getCurrentTime() +': ', message, message2);
	} else {
		console.log(getCurrentTime() +': ', message);
	}
}

function getCurrentTime() { // in format hh:mm:ss
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}


class TennisLogic {

	static increaseScore(sharedData, thisPlayer, otherPlayer) {
		if (sharedData['score'+thisPlayer] == 'AD') {
			this.setWon(sharedData, thisPlayer, otherPlayer);
		} else if (sharedData['score'+thisPlayer] < 30) {
			sharedData['score'+thisPlayer] += 15;
		} else if (sharedData['score'+thisPlayer] == 30) {
			sharedData['score'+thisPlayer] += 10;
		} else if (sharedData['score'+thisPlayer] == 40) {
			if (sharedData['score'+otherPlayer] == 'AD') {
				sharedData['score'+otherPlayer] = 40;
			} else if (sharedData['score'+otherPlayer] == 40) {
				sharedData['score'+thisPlayer] = 'AD';
			} else {
				this.setWon(sharedData, thisPlayer, otherPlayer);
			}
		}
		return sharedData;
	}

	static setWon(sharedData, thisPlayer, otherPlayer) {
		sharedData['setPoints'+thisPlayer]++;
		sharedData['score'+thisPlayer] = sharedData['score'+otherPlayer] = 0;
		if (sharedData['setPoints'+thisPlayer] >= 5) {
			sharedData['matchPoints'+thisPlayer]++;
			sharedData['setPoints'+thisPlayer] = 0;
		}
	}

	static decreaseScore(sharedData, thisPlayer, otherPlayer) {
		if (sharedData['score'+thisPlayer] == 'AD') {
			sharedData['score'+thisPlayer] = 40;
		} else if (sharedData['score'+thisPlayer] <= 30 && sharedData['score'+thisPlayer] > 0) {
			sharedData['score'+thisPlayer] -= 15;
		} else if (sharedData['score'+thisPlayer] == 40) {
			if (sharedData['score'+otherPlayer] == 'AD') {
				console.log('Cant decrease score for '+ thisPlayer +' when other player has advantage.');
			} else {
				sharedData['score'+thisPlayer] -= 10;
			}
		}
		return sharedData;
	}

}
