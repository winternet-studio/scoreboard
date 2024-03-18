require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });

var score1 = 0;
var score2 = 0;
var serveToggler = false;  //boolean which inverts the player's turn calculation when toggled in order to change who serve first
var playersTurn = 1;
var serveCount = 2;

wsServer.on('connection', (ws) => {
	// Send initial data to clients
	ws.send(JSON.stringify(getSendPayload()));

	// Handle messages from clients
	ws.on('message', (message) => {
		const data = JSON.parse(message);
		logMe('RECV:', data);
		if (data.type === 'increment') {
			// logMe('Incrementing player '+ data.player);
			if (data.player === 1) {
				score1++;
			} else if (data.player === 2) {
				score2++;
			}
		} else if (data.type === 'decrement') {
			// logMe('Decrementing player '+ data.player);
			if (data.player === 1) {
				if (score1 > 0) {
					score1--;
				}
			} else if (data.player === 2) {
				if (score2 > 0) {
					score2--;
				}
			}
		} else if (data.type === 'switchServe') {
			// logMe('Switching serve');
			serveToggler = !serveToggler;
		} else if (data.type === 'reset') {
			logMe('Resetting the current score: '+ score1 + ' - '+ score2);
			score1 = score2 = 0;
			// logMe('Reset complete');
		} else if (data.type === 'setServeCount') {
			serveCount = data.count;
			// logMe('New serve count:', serveCount);
		}

		// Determine next player to serve
		var scoreSum = score1 + score2;
		var temp = Math.floor(scoreSum / serveCount);
		if (temp % 2 == 0) {  //do we have an even number (not odd)
			playersTurn = (serveToggler ? 2 : 1);
		} else {
			playersTurn = (serveToggler ? 1 : 2);
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
	return { score1, score2, playersTurn, serveCount };
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
