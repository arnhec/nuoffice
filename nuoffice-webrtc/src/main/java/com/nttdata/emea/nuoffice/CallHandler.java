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
package com.nttdata.emea.nuoffice;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.concurrent.ConcurrentHashMap;

import org.kurento.client.factory.KurentoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.nttdata.emea.nuoffice.ffmpeg.Decoder;
import com.nttdata.emea.nuoffice.recognita.RecognitionService;
import com.nttdata.emea.nuoffice.scp.ScpFrom;

/**
 * Protocol handler for 1 to 1 video call communication.
 * 
 * @author Boni Garcia (bgarcia@gsyc.es)
 * @author Micael Gallego (micael.gallego@gmail.com)
 * @since 5.0.0
 */
public class CallHandler extends TextWebSocketHandler {

	private CallMediaPipeline pipeline;

	private static final Logger log = LoggerFactory
			.getLogger(CallHandler.class);
	private static final Gson gson = new GsonBuilder().create();

	private static final long DEFAULT_RECORD_PERIOD = 5000;

	private static final long DEFAULT_SAMPLE_PERIOD = 2000;

	private static final String DIR = "/tmp/";



	private ConcurrentHashMap<String, CallMediaPipeline> pipelines = new ConcurrentHashMap<String, CallMediaPipeline>();

	@Autowired
	private KurentoClient kurento;

	@Autowired
	private UserRegistry registry;

	@Autowired
	private RecognitionService recognitoService;

	public CallHandler () {
		super();
		File dir = new File(DIR+"");
		if (!dir.exists()) dir.mkdirs();
	}
	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message)
			throws Exception {
		JsonObject jsonMessage = gson.fromJson(message.getPayload(),
				JsonObject.class);
		UserSession user = registry.getBySession(session);

		if (user != null) {
			log.debug("Incoming message from user '{}': {}", user.getName(),
					jsonMessage);
		} else {
			log.debug("Incoming message from new user: {}", jsonMessage);
		}

		switch (jsonMessage.get("id").getAsString()) {
		case "register":
			register(session, jsonMessage);
			break;
		case "reset":
			reset(session, jsonMessage);
			break;
		case "call":
			call(user, jsonMessage);
			break;
		case "incomingCallResponse":
			incomingCallResponse(user, jsonMessage);
			break;
		case "startRecording":
			startRecording(session, jsonMessage);
			break;
		case "stopRecording":
			stopRecording(session, jsonMessage);
			break;
		case "addPrint":
			addPrint(session, jsonMessage);
			break;
		case "verifySample":
			verifySample(session, jsonMessage);
			break;
		case "play":
			play(session, jsonMessage);
			break;
		case "textChat":
			textChat(session, jsonMessage);
			break;
		case "cobrowsing":
			cobrowsing(session, jsonMessage);
			break;
		case "stop":
			stop(session);
			break;
		default:
			break;
		}
	}

	private void startRecording(WebSocketSession session, JsonObject jsonMessage)
			throws IOException {
		JsonObject response = new JsonObject();
		String user = jsonMessage.getAsJsonPrimitive("user").getAsString();
		String responseMsg = "accepted";
		pipeline.startDefaultRecording();
		response.addProperty("id", "startRecording");
		response.addProperty("response", responseMsg);
		UserSession us = new UserSession(session, user);
		us.sendMessage(response);
	}

	private void stopRecording(WebSocketSession session, JsonObject jsonMessage)
			throws IOException {
		try {

			log.debug("System library path = "
					+ System.getProperty("java.library.path"));
			JsonObject response = new JsonObject();
			String user = jsonMessage.getAsJsonPrimitive("user").getAsString();
			pipeline.stopDefaultRecording();
			String responseMsg = "accepted";
			response.addProperty("id", "stopRecording");
			response.addProperty("response", responseMsg);
			UserSession us = new UserSession(session, user);
			us.sendMessage(response);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void addPrint(WebSocketSession session, JsonObject jsonMessage)
			throws IOException {
		try {
			JsonObject response = new JsonObject();
			String user = jsonMessage.getAsJsonPrimitive("user").getAsString();
			String caller = jsonMessage.getAsJsonPrimitive("caller")
					.getAsString();
			long recordPeriod = DEFAULT_RECORD_PERIOD;
			try {
				recordPeriod = jsonMessage.getAsJsonPrimitive("recordPeriod")
						.getAsLong();
			} catch (Exception e) {
			}
			log.debug("Record period = " + recordPeriod);
			log.debug("Start print recording");
			String recordId = pipeline.startRecording();
			Thread.sleep(recordPeriod);
			log.debug("Stop print recording");
			recordId = pipeline.stopRecording();

			log.debug("System library path = "
					+ System.getProperty("java.library.path"));
			log.info("Read file " + recordId + ".webm from media server");
			new ScpFrom().read(new String[] {
					"chris@"+NuOfficePrototypeApplication.IP_ADRESS+":" + DIR + recordId + ".webm",
					DIR + recordId + ".webm" });
			String printId = caller + "_" + recordId;
			new Decoder().process(DIR + recordId + ".webm",DIR
					+ printId + ".wav");
			String responseMsg = "accepted";
			response.addProperty("id", "addPrint");
			response.addProperty("recordId", recordId);
			response.addProperty("printId", printId);
			response.addProperty("response", responseMsg);
			UserSession us = new UserSession(session, user);
			us.sendMessage(response);
			recognitoService.addPrint(printId, "c:/tmp/" + printId + ".wav");

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void verifySample(WebSocketSession session, JsonObject jsonMessage)
			throws IOException {
		try {
			JsonObject response = new JsonObject();
			String user = jsonMessage.getAsJsonPrimitive("user").getAsString();
			long recordPeriod = DEFAULT_SAMPLE_PERIOD;
			try {
				recordPeriod = jsonMessage.getAsJsonPrimitive("recordPeriod")
						.getAsLong();
			} catch (Exception e) {
			}
			String result = null;
			String recordId = null;
			int count = 0;
			do {
				log.debug("Record period = " + recordPeriod);
				log.debug("Start sample recording");
				recordId = pipeline.startRecording();
				Thread.sleep(recordPeriod);
				log.debug("Stop sample recording");
				recordId = pipeline.stopRecording();
				log.debug("System library path = "
						+ System.getProperty("java.library.path"));
				log.info("Read file " + recordId + ".webm from media server");
				new ScpFrom().read(new String[] {
						"chris@localhost:/tmp/" + recordId + ".webm",
						"c:/tmp/" + recordId + ".webm" });
				new Decoder().process("c:/tmp/" + recordId + ".webm", "c:/tmp/"
						+ recordId + ".wav");
				result = recognitoService.verifySample(new File(
						"c:/tmp/" + recordId + ".wav"));
			} while (result == null && count++ < 5);
			String responseMsg = result != null ? result.split("_")[0]
					: "unknown";
			response.addProperty("id", "verifySample");
			response.addProperty("recordId", recordId);
			response.addProperty("response", responseMsg);
			UserSession us = new UserSession(session, user);
			us.sendMessage(response);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void register(WebSocketSession session, JsonObject jsonMessage)
			throws IOException {
		String name = jsonMessage.getAsJsonPrimitive("name").getAsString();
		boolean cobrowsing = jsonMessage.getAsJsonPrimitive("cobrowsing")
				.getAsBoolean();
		UserSession caller = new UserSession(session, name, cobrowsing);
		String responseMsg = "accepted";
		if (name.isEmpty()) {
			responseMsg = "rejected: empty user name";
		} else if (registry.exists(name)) {
			responseMsg = "rejected: user '" + name + "' already registered";
		} else {
			registry.register(caller);
		}

		JsonObject response = new JsonObject();
		response.addProperty("id", "registerResponse");
		response.addProperty("response", responseMsg);
		caller.sendMessage(response);

		response = new JsonObject();
		response.addProperty("id", "textChat");
		response.addProperty("response", chat.toString());
		TextMessage tm = new TextMessage(response.toString());
		session.sendMessage(tm);

	}

	private void reset(WebSocketSession session, JsonObject jsonMessage) throws IOException {
		registry.reset();
		register(session,jsonMessage);
	}
	private void call(UserSession caller, JsonObject jsonMessage)
			throws IOException {
		String to = jsonMessage.get("to").getAsString();
		String from = jsonMessage.get("from").getAsString();
		JsonObject response = new JsonObject();

		if (registry.exists(to)) {
			UserSession callee = registry.getByName(to);
			caller.setSdpOffer(jsonMessage.getAsJsonPrimitive("sdpOffer")
					.getAsString());
			caller.setCallingTo(to);

			response.addProperty("id", "incomingCall");
			response.addProperty("from", from);

			callee.sendMessage(response);
			callee.setCallingFrom(from);
		} else {
			response.addProperty("id", "callResponse");
			response.addProperty("response", "rejected: user '" + to
					+ "' is not registered");

			caller.sendMessage(response);
		}
	}

	private void incomingCallResponse(UserSession callee, JsonObject jsonMessage)
			throws IOException {
		String callResponse = jsonMessage.get("callResponse").getAsString();
		String from = jsonMessage.get("from").getAsString();
		UserSession calleer = registry.getByName(from);
		String to = calleer.getCallingTo();

		if ("accept".equals(callResponse)) {
			log.debug("Accepted call from '{}' to '{}'", from, to);

			pipeline = new CallMediaPipeline(kurento, from, to);
			pipelines.put(calleer.getSessionId(), pipeline);
			pipelines.put(callee.getSessionId(), pipeline);

			String calleeSdpOffer = jsonMessage.get("sdpOffer").getAsString();
			String calleeSdpAnswer = pipeline
					.generateSdpAnswerForCallee(calleeSdpOffer);

			JsonObject startCommunication = new JsonObject();
			startCommunication.addProperty("id", "startCommunication");
			startCommunication.addProperty("sdpAnswer", calleeSdpAnswer);
			callee.sendMessage(startCommunication);

			String callerSdpOffer = registry.getByName(from).getSdpOffer();
			String callerSdpAnswer = pipeline
					.generateSdpAnswerForCaller(callerSdpOffer);

			JsonObject response = new JsonObject();
			response.addProperty("id", "callResponse");
			response.addProperty("response", "accepted");
			response.addProperty("sdpAnswer", callerSdpAnswer);
			calleer.sendMessage(response);

			// pipeline.record();

		} else {
			JsonObject response = new JsonObject();
			response.addProperty("id", "callResponse");
			response.addProperty("response", "rejected");
			calleer.sendMessage(response);
		}
	}

	public void cobrowsing(WebSocketSession session, JsonObject jsonMessage)
			throws IOException {
		for (UserSession s : registry.getCobrowsingSessions()) {
			log.info("receiving cobrowsing message");
			if (!s.getSessionId().equals(session.getId()))
				s.sendMessage(jsonMessage);
		}
	}

	public void stop(WebSocketSession session) throws IOException {
		String sessionId = session.getId();
		if (pipelines.containsKey(sessionId)) {
			pipelines.get(sessionId).release();
			pipelines.remove(sessionId);

			// Both users can stop the communication. A 'stopCommunication'
			// message will be sent to the other peer.
			UserSession stopperUser = registry.getBySession(session);
			UserSession stoppedUser = (stopperUser.getCallingFrom() != null) ? registry
					.getByName(stopperUser.getCallingFrom()) : registry
					.getByName(stopperUser.getCallingTo());

			JsonObject message = new JsonObject();
			message.addProperty("id", "stopCommunication");
			stoppedUser.sendMessage(message);
		}
	}

	private void play(WebSocketSession session, JsonObject jsonMessage)
			throws IOException {
		String id = "LAST_SESSION";
		String recordId = (jsonMessage.get("recordId") != null && !jsonMessage
				.getAsJsonPrimitive("recordId").getAsString().isEmpty()) ? jsonMessage
				.get("recordId").getAsString() : id;
		log.debug("Playing recorded call with id '{}'", recordId);
		PlayMediaPipeline pipeline = new PlayMediaPipeline(kurento, recordId,
				session);
		String sdpOffer = jsonMessage.get("sdpOffer").getAsString();
		String sdpAnswer = pipeline.generateSdpAnswer(sdpOffer);

		JsonObject response = new JsonObject();
		response.addProperty("id", "playResponse");
		response.addProperty("response", "accepted");
		response.addProperty("sdpAnswer", sdpAnswer);
		session.sendMessage(new TextMessage(response.toString()));

		pipeline.play();

	}

	private static final String newLine = System.getProperty("line.separator");

	private StringBuffer chat = new StringBuffer();

	private String addToChat(String user, String text) {
		if (chat.length() > 0)
			chat.append(newLine);
		return chat.append(user + ": ").append(text).toString();
	}

	private void textChat(WebSocketSession session, JsonObject jsonMessage)
			throws IOException {
		String user = jsonMessage.getAsJsonPrimitive("user").getAsString();
		JsonObject response = new JsonObject();
		response.addProperty("id", "textChat");
		String text = jsonMessage.getAsJsonPrimitive("input").getAsString();
		response.addProperty("response", addToChat(user, text));
		TextMessage tm = new TextMessage(response.toString());
		for (UserSession s : registry.getSessions()) {
			s.getSession().sendMessage(tm);
		}
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session,
			CloseStatus status) throws Exception {
		registry.removeBySession(session);
	}

}
