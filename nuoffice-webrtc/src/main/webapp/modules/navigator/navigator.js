var navigatorModule = angular.module('navigator', []);
navigatorModule.controller('NavigatorController', [
		'$scope',
		'NavigatorService', 'EventService', 
		'ngTableParams',
		'$filter',
		function($scope, NavigatorService, EventService, ngTableParams, $filter) {

			$scope.my_data = [];
			$scope.projectLink = '/meap-parent/meap-ui/';

			$scope.tableParams = new ngTableParams({
				page : 1, // show first page
				count : 10
			// count per page
			}, {
				counts : [], // hide page counts control
				total : 1, // value less than count hide pagination
				getData : function($defer, params) {
					var filteredData = $scope.my_data;
					var orderedData = params.sorting() ? $filter('orderBy')(
							filteredData, params.orderBy()) : filteredData;

					$defer.resolve(orderedData.slice((params.page() - 1)
							* params.count(), params.page() * params.count()));
				}
			});

			NavigatorService.connect().then(function() {
				getFiles("/");
			}, function(err) {
				console.log(err);
			});

			function getFiles(dir) {
				NavigatorService.getFiles(dir).then(function(data) {
					$scope.$apply(function() {
						var my_data = JSON.parse(data);
						for (i = 0; i < my_data.length; i++) {
							if (my_data[i].directory) {
								my_data[i].noLeaf = true;
								my_data[i].onSelect = function(branch) {
									getFiles(branch.link);
								};
							}
						}
						$scope.my_data = my_data;
					});
				});
			}

			$scope.select = function(row) {
				if ($scope.active)
					$scope.active.$selected = false;
				row.$selected = !row.$selected;
				$scope.active = row;
				if (row.directory)
					getFiles(row.link);
				else {
					NavigatorService.select(row);
				}
			}
			$scope.selectLink = function(category) {
				getFiles($scope.projectLink + category);
			};

		} ]);



navigatorModule.factory("NavigatorService", [
		"SocketService", "EventService",
		function(SocketService, EventService) {

			return {
				connect : function() {
					return SocketService.connect();
				},
				getFiles : function(dir) {
					EventService.emit("navigator.directoryChanged", dir);
					return SocketService.request('/app/queue/getFiles',
							'/user/topic/getFiles', {}, dir);
				},
				select : function(item) {
					EventService.emit("navigator.itemSelected", item);
				}
			}
		} ]);