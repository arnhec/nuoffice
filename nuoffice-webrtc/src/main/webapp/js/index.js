/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */

var ws = new WebSocket('ws://' + location.host + '/call');
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
//		$('#cobrowsing').attr('disabled', false);
		break;
	case REGISTERING:
		$('#register').attr('disabled', true);
	//	$('#cobrowsing').attr('disabled', true);
		break;
	case REGISTERED:
		$('#register').attr('disabled', true);
		$('#chatInput').attr('disabled', false);
		setCallState(NO_CALL);
		break;
	default:
		return;
	}
	registerState = nextState;
}

var callState = null;
const
NO_CALL = 0;
const
PROCESSING_CALL = 1;
const
IN_CALL = 2;
const
RECORDING = 3;

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
		$('#startRecording').attr('disabled', false);
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

window.onload = function() {
	setRegisterState(NOT_REGISTERED);
	console = new Console('console', console);
	dragDrop.initElement('videoSmall');
	videoInput = document.getElementById('videoInput');
	videoOutput = document.getElementById('videoOutput');
//	document.getElementById('name').focus();
	document.getElementById('chatInput').value = '';
	document.getElementById('chatText').value = '';
	$('#chatText').attr('disabled', true);

	$('.cobrowsing').on("change", function(event) {
		if ($('#cobrowsing').is(':checked')) {
			sendCoBrowsingMessage(event);
		}
	});
}

window.onbeforeunload = function() {
	ws.close();
}

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

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
		console.info("Communication ended by remote peer");
		stop(true);
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
		stop();
		break;
	case 'textChat':
		addToTextChat(parsedMessage);
		break;
	case 'cobrowsing':
		receiveCobrowsingMessage(parsedMessage);
		break;
	default:
		console.error('Unrecognized message', parsedMessage);
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
		console.info('Call not accepted by peer. Closing call');
		var errorMessage = message.message ? message.message
				: 'Unknown reason for call rejection.';
		console.log(errorMessage);
		stop();
	} else {
		setCallState(IN_CALL);
		webRtcPeer.processSdpAnswer(message.sdpAnswer);
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
		webRtcPeer.processSdpAnswer(message.sdpAnswer);
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
	if (confirm('User ' + message.from
			+ ' is calling you. Do you accept the call?')) {
		showSpinner(videoInput, videoOutput);
		webRtcPeer = kurentoUtils.WebRtcPeer.startSendRecv(videoInput,
				videoOutput, function(offerSdp) {
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
		stop();
	}
}

function register() {
	var name = document.getElementById('name').value;
	if (name == '') {
		window.alert("You must insert your user name");
		return;
	}
	setRegisterState(REGISTERING);

	var message = {
		id : 'register',
		name : name, 
		cobrowsing : $('#cobrowsing').is(':checked'),
	};
	sendMessage(message);
	document.getElementById('peer').focus();
}

function call() {
	if (document.getElementById('peer').value == '') {
		window.alert("You must specify the peer name");
		return;
	}
	setCallState(PROCESSING_CALL);
	showSpinner(videoInput, videoOutput);

	webRtcPeer = kurentoUtils.WebRtcPeer.startSendRecv(videoInput, videoOutput,
			function(offerSdp) {
				console.log('Invoking SDP offer callback function');
				var message = {
					id : 'call',
					from : document.getElementById('name').value,
					to : document.getElementById('peer').value,
					sdpOffer : offerSdp
				};
				sendMessage(message);
			}, function(error) {
				console.log(error);
				setCallState(NO_CALL);
			});
}

function play() {
	document.getElementById('videoSmall').style.display = 'none';
	showSpinner(videoOutput);
	webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(videoOutput, function(
			offerSdp) {
		console.log('Invoking SDP offer callback function');
		var message = {
			id : 'play',
			user : document.getElementById('name').value,
			callee : document.getElementById('peer').value,
			recordId : document.getElementById('recordId').value,
			sdpOffer : offerSdp
		};
		sendMessage(message);
	});
}

function startRecording() {
	setCallState(RECORDING);
	var message = {
		id : 'startRecording',
		user : document.getElementById('name').value,
		caller : document.getElementById('peer').value
	};
	sendMessage(message);
}
function stopRecording() {
	setCallState(IN_CALL);
	var message = {
		id : 'stopRecording',
		user : document.getElementById('name').value,
		caller : document.getElementById('peer').value
	};
	sendMessage(message);
}

function addPrint() {
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

function chat() {
	var message = {
		id : 'textChat',
		user : document.getElementById('name').value,
		input : document.getElementById('chatInput').value
	}
	console.log(message);
	document.getElementById('chatInput').value = '';
	sendMessage(message);
}

function addToTextChat(message) {
	document.getElementById('chatText').value = message.response;
	var psconsole = $('#chatText');
	if (psconsole.length)
		psconsole.scrollTop(psconsole[0].scrollHeight - psconsole.height());
}
function sendCoBrowsingMessage(event) {
	
	var property = 'value';
	var value = event.target.value;
	
	if (event.target.type === 'checkbox') {
		property = 'checked';
		value = $('#'+event.target.id).is(':checked');
	}
	
	var message = {
		id : 'cobrowsing',
		user : document.getElementById('name').value,
		tag : event.target.tagName,
		type : event.target.type, 
		property : property,
		control : event.target.id,
		value : value,
	};
	sendMessage(message);	
}

function receiveCobrowsingMessage(jsonMessage) {
	$("#"+jsonMessage.control).prop(jsonMessage.property, jsonMessage.value);
	$("#"+jsonMessage.control).focus();
}

function stop(message) {
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
	// document.getElementById('videoSmall').style.display = 'block';
}

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
		arguments[i].poster = './img/NTT_Logo.jpg';
		arguments[i].style.background = '';
	}
}


/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
