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
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.kurento.client.MediaPipeline;
import org.kurento.client.RecorderEndpoint;
import org.kurento.client.VideoCaps;
import org.kurento.client.VideoCodec;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.client.factory.KurentoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Media Pipeline (connection of Media Elements) for the advanced one to one
 * video communication.
 * 
 * @author Boni Garcia (bgarcia@gsyc.es)
 * @author Micael Gallego (micael.gallego@gmail.com)
 * @since 5.0.0
 */
public class CallMediaPipeline {

	private static final Logger log = LoggerFactory
			.getLogger(CallMediaPipeline.class);
	
	public static final String RECORDING_PATH = "file:///tmp/";
	public static final String RECORDING_EXT = ".webm";

	private String id = UUID.randomUUID().toString();
	
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	private MediaPipeline pipeline;
	
	private WebRtcEndpoint webRtcCaller;
	private WebRtcEndpoint webRtcCallee;
	
	private RecorderEndpoint recorderCaller;
	private RecorderEndpoint defaultRecorder;
	
	public RecorderEndpoint getRecorderCaller() {
		return recorderCaller;
	}

	public void setRecorderCaller(RecorderEndpoint recorderCaller) {
		this.recorderCaller = recorderCaller;
	}

	private String recordId;
	

	
	public CallMediaPipeline(KurentoClient kurento, String from, String to) {
		// Media pipeline
		pipeline = kurento.createMediaPipeline();

		// Media Elements (WebRtcEndpoint, RecorderEndpoint, FaceOverlayFilter)
		webRtcCaller = new WebRtcEndpoint.Builder(pipeline).build();
		webRtcCallee = new WebRtcEndpoint.Builder(pipeline).build();
		
		defaultRecorder = new RecorderEndpoint.Builder(pipeline,RECORDING_PATH
				+ "LAST_SESSION" + RECORDING_EXT).build();


		// Connections
		webRtcCaller.connect(webRtcCallee);
		webRtcCallee.connect(webRtcCaller);
		webRtcCaller.connect(defaultRecorder);
		
	}


	public String generateSdpAnswerForCaller(String sdpOffer) {
		return webRtcCaller.processOffer(sdpOffer);
	}

	public String generateSdpAnswerForCallee(String sdpOffer) {
		return webRtcCallee.processOffer(sdpOffer);
	}

	public void release() {
		if (pipeline != null) {
			pipeline.release();
		}
	}
	private String generateRecordId() {
		this.recordId = UUID.randomUUID().toString();
		return this.recordId;
	}
	
	public void startDefaultRecording() {
		defaultRecorder.record();
	}
	public void stopDefaultRecording() {
		defaultRecorder.stop();
	}
	
	public String startRecording() {
		String id = generateRecordId();
		recorderCaller = new RecorderEndpoint.Builder(pipeline, RECORDING_PATH + id + RECORDING_EXT).build();
		webRtcCaller.connect(recorderCaller);
		recorderCaller.record();
		return this.recordId;
	}

	
	public String stopRecording() {
		try {
		if (recorderCaller != null) {
			recorderCaller.stop();
			recorderCaller.release();
		}
		return this.recordId;
		}
		catch (Exception e) {
			log.error("Error stopping recorder", e);
		}
		return null;
	}
}
