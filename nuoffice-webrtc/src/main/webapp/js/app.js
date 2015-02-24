var app = angular.module('app', [ 'ngRoute', 'controllers', 'directives', 'services' ]);

app.config([ '$routeProvider', function($routeProvider) {
	$routeProvider.when('', {
		templateUrl : 'partials/antrag.html',
		controller : 'MainCtrl'
	})
	.when('/', {
		templateUrl : 'partials/antrag.html',
		controller : 'MainCtrl'
	})
	.when('/antrag', {
		templateUrl : 'partials/antrag.html',
		controller : 'MainCtrl'
	}).otherwise({
		redirectTo : '/'
	});
} ]);
