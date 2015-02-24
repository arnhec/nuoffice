var navigatorModule = angular.module('event', []);

app.factory("EventService", [ function() {
	var listeners = [];
	var types = [];
	return {
		on : function(type, listener) {
			types.push(type);
			listeners.push(listener);
		},
		emit : function(type, event) {
			console.log("Event fetched type = " + type);
			for (var i = 0; i < types.length; i++) {
				if (types[i] === type)
					listeners[i](event);
			}
		}
	}
} ]);
