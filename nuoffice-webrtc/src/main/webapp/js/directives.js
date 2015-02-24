angular.module('directives', []).directive('showtab', function() {
	return {
		link : function($scope, element, attrs) {
			element.click(function(e) {
				$scope.clickTab(element, e,attrs);
			});
		}
	};
}).directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter, {
						'event' : event
					});
				});

				event.preventDefault();
			}
		});
	};
});