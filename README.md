# Scoreboard

Made for table tennis but can be used for other sports as well.

Provides one webpage with a scoreboard which can be remotely controlled through a control panel on another webpage. The two pages use Vue 3 and a Node.js Websocket server for communication. You can have multiple scoreboard pages open, and even multiple control panels. Webserver is not required.


## Install

Ensure you have Node.js installed.

- `npm install`
- copy `config.example.js` to `config.js` and modify as needed
- copy `websocket-server/.env.example` to `config.js` and modify as needed
- `node websocket-server.js` to start the websocket server
- open the `scoreboard.html` and `control-panel.html` webpages in your desired browser windows of any device on the network. Using a webserver is optional.


## Notes

We don't use ES modules because it requires the pages to be served through a webserver.
