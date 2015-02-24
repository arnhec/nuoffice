var documentModule = angular.module('document', []);

documentModule.controller('DocumentController', [
		'$scope',
		'SocketService',
		'DocumentService',
		'EventService',
		function($scope, SocketService, DocumentService, EventService) {

			$scope.codeMirror = CodeMirror.fromTextArea(document
					.getElementById("sourcecode"), {
				lineNumbers : true,
				extraKeys : {
					"Ctrl-Space" : "autocomplete"
				},
				mode : {
					name : "javascript",
					globalVars : true,
				},
				autoCloseBrackets : true,
				matchBrackets : true
			});

			$scope.opened = false;
			$scope.saved = true;
			$scope.dir = "/";
			/**
			 * UI buttons
			 */
			$('#ok').on('click', function() {
				$('#myModal').modal('hide');
				DocumentService.setFilename($scope.dir + "/" + $scope.filename);
				$scope.save();
				EventService.emit('document.created', $scope.document);
				console.log("Gotcha" + $scope.dir + "/" + $scope.filename);
			});

			$scope.create = function() {
				$('#myModal').modal('show');
			};
			$scope.save = function() {
				DocumentService.save($scope.codeMirror.getDoc().getValue())
						.then(function(message) {
							EventService.emit("document.saved", message);
						});
				$scope.opened = true;
				$scope.saved = true;
			};
			$scope.close = function() {
				$scope.document = null;
				$scope.codeMirror.getDoc().setValue("");
				EventService.emit('document.closed', null);
				$scope.opened = false;
				$scope.saved = false;
			};

			/**
			 * Event handling
			 */
			$scope.codeMirror.on("change", function() {
				$scope.$apply(function() {
					$scope.saved = false;

				});
			});
			EventService.on('document.opened', function(document) {
				$scope.$apply(function() {
					$scope.opened = true;
					$scope.saved = true;
					$scope.codeMirror.setOption("mode", document.mimeType);
					$scope.codeMirror.getDoc().setValue(document.content);
				})
			});
			EventService.on('navigator.directoryChanged', function(dir) {
				console.log("Directory changed to " + dir);
				$scope.dir = dir;
			});
			
			EventService.on('navigator.itemSelected', function(item) {
				DocumentService.load(item);
			});

		}

]);

documentModule.factory("DocumentService", [
		"SocketService",
		"EventService",
		function(SocketService, EventService) {
			var document = {};
			SocketService.connect().then(
					function() {
						SocketService.subscribe(
								"/user/topic/document/loadResponse", function(
										message) {
									document = message;
									EventService.emit("document.opened",
											document);
								}, function(error) {
									console.log(error);
								});
					});
			return {
				setFilename : function(filename) {
					document.filename = filename;
				},
				load : function(item) {
					SocketService.send('/app/queue/document/loadRequest', {},
							item);
				},
				save : function(content) {
					document.content = content;
					return SocketService.request(
							'/app/queue/document/saveRequest',
							'/user/topic/document/saveResponse', {}, JSON
									.stringify(document));

				}
			}
		} ]);