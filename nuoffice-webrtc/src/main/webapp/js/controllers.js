var appControllers = angular.module('controllers', []);

appControllers
		.controller(
				'MainCtrl',
				[
						'$scope',
						'$location',
						function($scope, $location) {

							var ws = new WebSocket('ws://' + location.host
									+ '/call');

							$scope.model = {
								tarifoption : [],
							};

							var videoInput;
							var videoOutput;
							var webRtcPeer;

							var registerName = null;
							var registerState = null;
							const
							NOT_REGISTERED = 0;
							const
							REGISTERING = 1;
							const
							REGISTERED = 2;
							var callState = null;
							const
							NO_CALL = 0;
							const
							PROCESSING_CALL = 1;
							const
							IN_CALL = 2;
							const
							RECORDING = 3;

							function setRegisterState(nextState) {
								switch (nextState) {
								case NOT_REGISTERED:
									$('#register').attr('disabled', false);
									$('#call').attr('disabled', true);
									$('#terminate').attr('disabled', true);
									$('#startRecording').attr('disabled', true);
									$('#stopRecording').attr('disabled', true);
									$('#addPrint').attr('disabled', true);
									$('#verifySample').attr('disabled', true);
									$('#videoSmall').hide();
									$('#chatInput').attr('disabled', true);
									// $('#cobrowsing').attr('disabled', false);
									$scope.registered = false;
									break;
								case REGISTERING:
									$('#register').attr('disabled', true);
									// $('#cobrowsing').attr('disabled', true);
									break;
								case REGISTERED:
									$('#register').attr('disabled', true);
									$('#chatInput').attr('disabled', false);
									setCallState(NO_CALL);
									$scope.registered = true;
									break;
								default:
									return;
								}
								registerState = nextState;
							}

							function setCallState(nextState) {
								switch (nextState) {
								case NO_CALL:
									$('#call').attr('disabled', false);
									$('#terminate').attr('disabled', true);
									$('#startRecording').attr('disabled', true);
									$('#stopRecording').attr('disabled', true);
									$('#play').attr('disabled', false);
									$('#videoSmall').hide();
									break;
								case PROCESSING_CALL:
									$('#videoSmall').attr('disabled', false);
									$('#call').attr('disabled', true);
									$('#terminate').attr('disabled', true);
									$('#startRecording').attr('disabled', true);
									$('#stopRecording').attr('disabled', true);
									$('#play').attr('disabled', true);
									$('#videoSmall').show();
									break;
								case IN_CALL:
									$('#call').attr('disabled', true);
									$('#terminate').attr('disabled', false);
									$('#startRecording')
											.attr('disabled', false);
									$('#stopRecording').attr('disabled', true);
									$('#play').attr('disabled', false);
									$('#addPrint').attr('disabled', false);
									$('#verifySample').attr('disabled', false);

									break;
								case RECORDING:
									$('#call').attr('disabled', true);
									$('#terminate').attr('disabled', true);
									$('#startRecording').attr('disabled', true);
									$('#stopRecording').attr('disabled', false);
									$('#play').attr('disabled', true);
									$('#addPrint').attr('disabled', true);
									$('#verifySample').attr('disabled', true);
									break;
								default:
									return;
								}
								callState = nextState;
							}

							setRegisterState(NOT_REGISTERED);
							// console = new Console('console', console);
							dragDrop.initElement('videoSmall');
							videoInput = document.getElementById('videoInput');
							videoOutput = document
									.getElementById('videoOutput');
							document.getElementById('name').focus();
							document.getElementById('chatInput').value = '';
							document.getElementById('chatText').value = '';

							$('#chatText').attr('disabled', true);

							window.onbeforeunload = function() {
								ws.close();
							}

							ws.onmessage = function(message) {
								var parsedMessage = JSON.parse(message.data);
								console.info('Received message: '
										+ message.data);

								switch (parsedMessage.id) {
								case 'registerResponse':
									registerResponse(parsedMessage);
									break;
								case 'callResponse':
									callResponse(parsedMessage);
									break;
								case 'incomingCall':
									incomingCall(parsedMessage);
									break;
								case 'startCommunication':
									startCommunication(parsedMessage);
									break;
								case 'stopCommunication':
									console
											.info("Communication ended by remote peer");
									$scope.stop(true);
									break;
								case 'startRecording':
									console.info("Start recording");
									break;
								case 'stopRecording':
									console.info("Stop recording");
									break;
								case 'addPrint':
									console.info("Add print");
									break;
								case 'verifySample':
									console.info("Verify sample");
									registerVerification(parsedMessage);
									break;
								case 'playResponse':
									playResponse(parsedMessage);
									break;
								case 'playEnd':
									$scope.stop();
									break;
								case 'textChat':
									addToTextChat(parsedMessage);
									break;
								case 'cobrowsing':
									receiveCobrowsingMessage(parsedMessage);
									break;
								default:
									console.error('Unrecognized message',
											parsedMessage);
								}
							}

							function registerResponse(message) {
								if (message.response == 'accepted') {
									setRegisterState(REGISTERED);
								} else {
									setRegisterState(NOT_REGISTERED);
									var errorMessage = message.message ? message.message
											: 'Unknown reason for register rejection.';
									console.log(errorMessage);
									alert('Error registering user. See console for further information.');
								}
							}
							function registerVerification(message) {
								if (message.response == 'unknown') {
									console.log('unknown user');
								} else {
									document.getElementById('peer').value = message.response;
									$('#peer').focus();
								}
							}
							function callResponse(message) {
								if (message.response != 'accepted') {
									console
											.info('Call not accepted by peer. Closing call');
									var errorMessage = message.message ? message.message
											: 'Unknown reason for call rejection.';
									console.log(errorMessage);
									$scope.stop();
								} else {
									setCallState(IN_CALL);
									webRtcPeer
											.processSdpAnswer(message.sdpAnswer);
								}
							}

							function startCommunication(message) {
								setCallState(IN_CALL);
								webRtcPeer.processSdpAnswer(message.sdpAnswer);
							}

							function playResponse(message) {
								if (message.response != 'accepted') {
									alert('Play request rejected');
								} else {
									webRtcPeer
											.processSdpAnswer(message.sdpAnswer);
								}
								hideSpinner(videoOutput);
							}

							function incomingCall(message) {
								// If bussy just reject without disturbing user
								if (callState != NO_CALL) {
									var response = {
										id : 'incomingCallResponse',
										from : message.from,
										callResponse : 'reject',
										message : 'bussy'
									};
									return sendMessage(response);
								}

								setCallState(PROCESSING_CALL);
								if (confirm('User '
										+ message.from
										+ ' is calling you. Do you accept the call?')) {
									showSpinner(videoInput, videoOutput);
									webRtcPeer = kurentoUtils.WebRtcPeer
											.startSendRecv(
													videoInput,
													videoOutput,
													function(offerSdp) {
														var response = {
															id : 'incomingCallResponse',
															from : message.from,
															callResponse : 'accept',
															sdpOffer : offerSdp
														};
														sendMessage(response);
													}, function(error) {
														setCallState(NO_CALL);
													});
								} else {
									var response = {
										id : 'incomingCallResponse',
										from : message.from,
										callResponse : 'reject',
										message : 'user declined'
									};
									sendMessage(response);
									$scope.stop();
								}
							}

							$scope.register = function() {
								var name = $scope.name;
								if (name == '') {
									window
											.alert("You must insert your user name");
									return;
								}
								setRegisterState(REGISTERING);
								var message = {
									id : 'register',
									name : name,
									cobrowsing : $('#cobrowsing')
											.is(':checked'),
								};
								sendMessage(message);
								if ($scope.name === 'Client') {
									$scope.model.cobrowsing=true;
									var message = {

										id : 'cobrowsing',
										user : $scope.name,
										value : JSON.stringify($scope.model),
									};
									sendMessage(message);
								} else {
									$scope.model.cobrowsing=false;
								}
							}

							$scope.reset = function() {
								var name = $scope.name;
								if (name == '') {
									window
											.alert("You must insert your user name");
									return;
								}
								setRegisterState(REGISTERING);

								var message = {
									id : 'reset',
									name : name,
									cobrowsing : $('#cobrowsing')
											.is(':checked'),
								};
								sendMessage(message);
							}

							$scope.call = function() {
								if (document.getElementById('peer').value == '') {
									window
											.alert("You must specify the peer name");
									return;
								}
								setCallState(PROCESSING_CALL);
								showSpinner(videoInput, videoOutput);

								webRtcPeer = kurentoUtils.WebRtcPeer
										.startSendRecv(
												videoInput,
												videoOutput,
												function(offerSdp) {
													console
															.log('Invoking SDP offer callback function');
													var message = {
														id : 'call',
														from : document
																.getElementById('name').value,
														to : document
																.getElementById('peer').value,
														sdpOffer : offerSdp
													};
													sendMessage(message);
												}, function(error) {
													console.log(error);
													setCallState(NO_CALL);
												});
							}

							$scope.play = function() {
								document.getElementById('videoSmall').style.display = 'none';
								showSpinner(videoOutput);
								webRtcPeer = kurentoUtils.WebRtcPeer
										.startRecvOnly(
												videoOutput,
												function(offerSdp) {
													console
															.log('Invoking SDP offer callback function');
													var message = {
														id : 'play',
														user : document
																.getElementById('name').value,
														callee : document
																.getElementById('peer').value,
														recordId : document
																.getElementById('recordId').value,
														sdpOffer : offerSdp
													};
													sendMessage(message);
												});
							}

							$scope.startRecording = function() {
								setCallState(RECORDING);
								var message = {
									id : 'startRecording',
									user : document.getElementById('name').value,
									caller : document.getElementById('peer').value
								};
								sendMessage(message);
							}
							$scope.stopRecording = function() {
								setCallState(IN_CALL);
								var message = {
									id : 'stopRecording',
									user : document.getElementById('name').value,
									caller : document.getElementById('peer').value
								};
								sendMessage(message);
							}

							$scope.addPrint = function() {
								var message = {
									id : 'addPrint',
									user : document.getElementById('name').value,
									caller : document.getElementById('peer').value
								};
								sendMessage(message);
							}
							function verifySample() {
								var message = {
									id : 'verifySample',
									user : document.getElementById('name').value,
								};
								sendMessage(message);
							}

							$scope.chat = function() {
								var message = {
									id : 'textChat',
									user : $scope.name,
									input : $scope.chatInput,
								}
								console.log(message);
								document.getElementById('chatInput').value = '';
								sendMessage(message);
							}

							function addToTextChat(message) {
								$scope
										.$apply(function() {
											$scope.chatText = message.response;
											var psconsole = $('#chatText');
											if (psconsole.length)
												psconsole
														.scrollTop(psconsole[0].scrollHeight
																- psconsole
																		.height());

										});
							}

							/**
							 * $('.cobrowsing').on("change", function(event) {
							 * if ($('#cobrowsing').is(':checked')) {
							 * sendCoBrowsingMessage(event); } });
							 */

							$scope.listen = true;
							$scope
									.$watch(
											'model',
											function(newValue, oldValue) {
												if (newValue.activeTab != oldValue.activeTab) {
													$scope
															.clickTabByName(newValue.activeTab);
												}
												if (!$scope.listen)
													$scope.listen = true;
												else {
													if ($scope.registered) {
														var message = {
															id : 'cobrowsing',
															user : $scope.name,
															value : JSON
																	.stringify($scope.model),
														};
														sendMessage(message);
													}
												}
											}, true);

							// function sendCoBrowsingMessage(event) {
							//
							// var property = 'value';
							// var value = event.target.value;
							//
							// if (event.target.type === 'checkbox') {
							// property = 'checked';
							// value = $('#' + event.target.id).is(
							// ':checked');
							// }
							//
							// var message = {
							// id : 'cobrowsing',
							// user : document.getElementById('name').value,
							// tag : event.target.tagName,
							// type : event.target.type,
							// property : property,
							// control : event.target.id,
							// value : value,
							// };
							// sendMessage(message);
							// }

							function receiveCobrowsingMessage(jsonMessage) {
								console.log(jsonMessage);
								$scope.$apply(function() {
									$scope.listen = false;
									var model = JSON.parse(jsonMessage.value, function(k, v) {
										// hack - identify date objects
										if (v && k && typeof(v) === 'string' && v.indexOf('.000Z')>=0) {
											return new Date(v);
										} 
										return v;
									});
									$scope.model = model;
								});

								// $("#" + jsonMessage.control)
								// .prop(jsonMessage.property,
								// jsonMessage.value);
								// $("#" + jsonMessage.control).focus();
							}

							$scope.stop = function(message) {
								setCallState(NO_CALL);
								if (webRtcPeer) {
									webRtcPeer.dispose();
									webRtcPeer = null;

									if (!message) {
										var message = {
											id : 'stop'
										}
										sendMessage(message);
									}
								}
								hideSpinner(videoInput, videoOutput);
								// document.getElementById('videoSmall').style.display
								// = 'block';
							}

							// function receiveCobrowsingMessage(jsonMessage) {
							// console.log(jsonMessage);
							// $("#" + jsonMessage.control)
							// .prop(jsonMessage.property,
							// jsonMessage.value);
							// $("#" + jsonMessage.control).focus();
							// }
							//

							function sendMessage(message) {
								var jsonMessage = JSON.stringify(message);
								console.log('Senging message: ' + jsonMessage);
								ws.send(jsonMessage);
							}

							function showSpinner() {
								for (var i = 0; i < arguments.length; i++) {
									arguments[i].poster = './img/transparent-1px.png';
									arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
								}
							}

							function hideSpinner() {
								for (var i = 0; i < arguments.length; i++) {
									arguments[i].src = '';
									arguments[i].poster = './img/NTTD_Logo.jpg';
									arguments[i].style.background = '';
								}
							}

							/**
							 * Lightbox utility (to display media pipeline image
							 * in a modal dialog)
							 */
							$(document).delegate('*[data-toggle="lightbox"]',
									'click', function(event) {
										event.preventDefault();
										$(this).ekkoLightbox();
									});

							$scope.isValid = function(attrs) {
								if (attrs.href === "#situation") {
									return true;
								} else if (attrs.href === "#tarifmerkmale") {
									return $scope.situationValid();
								} else if (attrs.href === "#versicherungsschutz") {
									return $scope.tarifmerkmaleValid();
								} else if (attrs.href === "#ergebnis") {
									return $scope.versicherungsschutzValid();
								}

							};

							$scope.situationValid = function() {

								var result = $scope.versicherungsbeginn
										&& $scope.model.versicherungsnehmer
										&& $scope.model.eigentuemer
										&& $scope.model.fahrzeugart
										&& $scope.model.fahrzeugzulassung;
								return true || result;
							};
							$scope.tarifmerkmaleValid = function() {

								var result = $scope.fahrzeugleistung
										&& $scope.model.abstellort
										&& $scope.model.nutzungsart
										&& $scope.model.nutzer
										&& $scope.model.geburtsdatum
										&& $scope.model.wohneigentum
										&& $scope.model.branche;
								return true || result;
							};
							$scope.versicherungsschutzValid = function() {
								var result = $scope.uebernahmeScheidenfreiheitsklasse
										&& $scope.model.verbleibBisherigesFahrzeug
										&& $scope.model.fuehrerschein3Jahre
										&& $scope.model.kasko
										&& $scope.model.tarif;
								return result;
							};

							$scope.model.activeTab = 'situation';

							$scope.weiter = function() {
								if ($scope.model.activeTab === 'situation') {
									$("#myTab a[name='tarifmerkmale'").click();
								} else if ($scope.model.activeTab === 'tarifmerkmale') {
									$("#myTab a[name='versicherungsschutz'")
											.click();
								}
							};
							$scope.zurueck = function() {
								if ($scope.model.activeTab === 'tarifmerkmale') {
									$("#myTab a[name='situation'").click();
								} else if ($scope.model.activeTab === 'versicherungsschutz') {
									$("#myTab a[name='tarifmerkmale'").click();
								}
							};

							$scope.weiterEnabled = function() {
								return $scope.model.activeTab === 'situation'
										&& $scope.situationValid()
										|| $scope.model.activeTab === 'tarifmerkmale'
										&& $scope.tarifmerkmaleValid();
							};

							$scope.model.aktion = "1";

							$scope.versicherungsnehmerListe = [ {
								id : 1,
								label : 'Privatperson'
							}, {
								id : 2,
								label : 'Firma'
							} ];

							$scope.fahrzeugarten = [ {
								id : 1,
								label : 'PKW'
							}, {
								id : 2,
								label : 'Motorrad'
							}, {
								id : 3,
								label : 'Motorroller'
							} ];

							$scope.herstellerListe = [ {
								id : "1",
								label : 'Alfa-Romeo'
							}, {
								id : "2",
								label : 'Audi'
							}, {
								id : "3",
								label : 'BMW'
							}, {
								id : "4",
								label : 'Citroen'
							}, {
								id : "5",
								label : 'Dacia'
							}, {
								id : "6",
								label : 'Fiat'
							}, {
								id : "7",
								label : 'Mercedes'
							}, {
								id : "8",
								label : 'Volkswagen'
							} ];

							$scope.modelle = [ {
								id : 101,
								hersteller : "1",
								label : 'Idea'
							}, {
								id : 102,
								hersteller : "1",
								label : 'Kappa'
							}, {
								id : 103,
								hersteller : "1",
								label : 'GT'
							}, {
								id : 104,
								hersteller : "1",
								label : 'GTV'
							}, {
								id : 201,
								hersteller : "2",
								label : 'A1'
							}, {
								id : 202,
								hersteller : "2",
								label : 'A2'
							}, {
								id : 203,
								hersteller : "2",
								label : 'A3'
							}, {
								id : 204,
								hersteller : "2",
								label : 'A4'
							}, {
								id : 205,
								hersteller : "2",
								label : 'A5'
							}, {
								id : 206,
								hersteller : "2",
								label : 'A6'
							} ];

							$scope.baujahreListe = [];

							for (var i = 2015; i > 1979; i--) {
								$scope.baujahreListe.push(i);
							}
							;

							$scope.criteriaMatch = function() {
								return function(item) {
									return item.hersteller === $scope.model.hersteller;
								};
							};

							$scope.fahrzeugsucheEnabled = function() {
								var result = ($scope.model.hersteller > 0 && $scope.model.modell > 0
										& $scope.model.baujahr > 0);
								return result;
							};

							$scope.clickTab = function(element, e, attrs) {
								e.preventDefault();
								if ($scope.isValid(attrs)) {
									$(element).tab('show');
									$scope.$apply(function() {
										$scope.model.activeTab = attrs.name;
									});
								}
							}

							$scope.clickTabByName = function(name) {
								$('a[name=' + name + ']').tab('show');
							}

							$scope.eigentuemerListe = [ {
								id : 1,
								label : 'auf mich'
							}, {
								id : 2,
								label : 'auf meinen Ehe-/Lebenspartner'
							}, {
								id : 3,
								label : 'auf eine andere Person'
							} ];

							$scope.model.nutzer = [];

							$scope.toggleNutzer = function(id) {
								var idx = $scope.model.nutzer.indexOf(id);

								// is currently selected
								if (idx > -1) {
									$scope.model.nutzer.splice(idx, 1);
								}
								// is newly selected
								else {
									$scope.model.nutzer.push(id);
								}
							};

							$scope.abstellorte = [ {
								id : 1,
								label : "Einzel-/Doppelgarage"
							}, {
								id : 2,
								label : "Einzel-/Doppelcarport"
							} ];

							$scope.nutzungsarten = [ {
								id : 1,
								label : "ausschließlich privat"
							}, {
								id : 2,
								label : "privat und geschäftlich"
							}, {
								id : 3,
								label : "ausschließlich geschäftlich"
							} ];

							$scope.nutzerListe = [ {
								id : 1,
								label : "ich selbst"
							}, {
								id : 2,
								label : "Partner"
							}, {
								id : 4,
								label : "Kind/Kinder"
							}, {
								id : 8,
								label : "Sonstige"
							} ];

							$scope.wohneigentumListe = [ {
								id : 1,
								label : "nicht vorhanden"
							}, {
								id : 2,
								label : "Einfamilienhaus"
							}, {
								id : 3,
								label : "Mehrfamilienhaus"
							}, {
								id : 4,
								label : "Reihenhaus/Doppelhaushälfte"
							}, {
								id : 5,
								label : "Eigentumswohnung"
							} ];

							$scope.taetigkeiten = [ {
								id : 1,
								label : "Angestellte"
							}, {
								id : 2,
								label : "Arbeiter/-innen"
							}, {
								id : 3,
								label : "Beamte/-innen"
							}, {
								id : 4,
								label : "ohne Beschäftigungsverhältnis"
							}, {
								id : 5,
								label : "Rentner/-innen / Pensionär/-innen"
							} ];

							$scope.branchen = [ {
								id : 1,
								label : "Agrar"
							}, {
								id : 2,
								label : "Öffentlicher Dienst"
							}, {
								id : 3,
								label : "Banken/Versicherungen"
							}, {
								id : 4,
								label : "Sonstige"
							} ];

							$scope.uebernahmenScheidenfreiheitsklasse = [
									{
										id : 1,
										label : "Ja, von meinem bisherigen Versicherer"
									},
									{
										id : 2,
										label : "Ja, von einer anderen Person/Firma"
									},
									{
										id : 3,
										label : "Nein, es ist ein zusätzliches Fahrzeug"
									},
									{
										id : 4,
										label : "Nein, es ist mein allererstes Fahrzeug"
									} ];

							$scope.verbleibeBisherigesFahrzeug = [ {
								id : 1,
								label : "ist abgemeldet/verkauft"
							}, {
								id : 2,
								label : "wird abgemeldet/verkauft"
							}, {
								id : 3,
								label : "wird nicht verkauft/abgemeldet"
							} ];

							$scope.kaskoOptionen = [ {
								id : 1,
								label : "Ja, Vollkasko inkl. Teilkasko"
							}, {
								id : 2,
								label : "Ja, Teilkasko"
							}, {
								id : 3,
								label : "Nein, keine Kasko"
							} ];

							$scope.tarife = [ {
								id : 1,
								label : "Basis"
							}, {
								id : 2,
								label : "Komfort"
							}, {
								id : 3,
								label : "Premium"
							} ];

							$scope.tarifoptionen = [ {
								id : 1,
								label : "Schutzbrief"
							}, {
								id : 2,
								label : "Fahrerschutz-Versicherung"
							}, {
								id : 4,
								label : "GAP"
							} ];
							// $scope.tarifoption = [];
							$scope.toggleTarifoption = function(id) {
								var idx = $scope.model.tarifoption.indexOf(id);

								// is currently selected
								if (idx > -1) {
									$scope.model.tarifoption.splice(idx, 1);
								}
								// is newly selected
								else {
									$scope.model.tarifoption.push(id);
								}
							};

						} ]);
