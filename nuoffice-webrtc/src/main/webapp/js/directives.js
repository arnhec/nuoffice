angular.module('directives', []).directive('showtab', function() {
	return {
		link : function($scope, element, attrs) {
			element.click(function(e) {
				e.preventDefault();
				if ($scope.isValid(attrs)) {
					console.log(attrs.name);
					
					$scope.activeTab = attrs.name;
					$(element).tab('show');
				}
			});
		}
	};
});