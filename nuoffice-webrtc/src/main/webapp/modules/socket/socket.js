var socketModule = angular.module('socket', []);

socketModule.factory("SocketService", [ function() {
	var headers = {
	// additional header
	// 'client-id' : clientId
	};

	var stompClient = null;
	var isConnected = false;
	var resolves = [];

	var socket = new SockJS('/broadcast');
	
	console.log("Connect to server" + isConnected);
	if (!isConnected) {
		stompClient = Stomp.over(socket);
		stompClient.connect({}, {}, function() {
			isConnected = true;
			resolvePromisses();
		});
	}

	function resolvePromisses() {
		for (var i = 0; i < resolves.length; i++) {
			resolves[i]();
		}
	}

	return {
		connect : function() {
			return new Promise(function(resolve, reject) {
				if (!isConnected)
					resolves.push(resolve);
				else
					resolve();
			});
		},
		disconnect : function() {
			stompClient.disconnect();
			isConnected = false;
			console.log("Disconnected");
		},
		send : function(destination, header, body) {
			stompClient.send(destination, {}, JSON.stringify(body));
		},
		subscribe : function(destination, callback, error) {
			stompClient.subscribe(destination, function(message) {
				if (message.body) {
					callback(JSON.parse(message.body));
				} else {
					error("message must not be null");
				}
			});
		},
		request : function(destinationRequest, destinationResponse, headers, body) {
			return new Promise(function(resolve, reject) {
				stompClient.subscribe(destinationResponse, function(
						message) {
					resolve(message.body);
				}, function(error) {
					reject(error);
				});
				stompClient.send(destinationRequest, headers, body);
			})
		}
	};

} ]);