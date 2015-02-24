/*
 * Copyright 2012-2013 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.nttdata.emea.nuoffice;

import java.io.IOException;

import javax.sound.sampled.UnsupportedAudioFileException;

import org.kurento.client.factory.KurentoClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.nttdata.emea.nuoffice.recognita.RecognitionService;


@Configuration
@ComponentScan
@EnableAutoConfiguration
public class NuOfficePrototypeApplication extends SpringBootServletInitializer {
	public static final String IP_ADRESS = "141.77.9.77";
	final static String DEFAULT_KMS_WS_URI = "ws://"+IP_ADRESS+":8888/kurento";
	
	@Bean
	public CallHandler callHandler() {
		return new CallHandler();
	}

	@Bean
	public UserRegistry registry() {
		return new UserRegistry();
	}

	@Bean
	public RecognitionService recognition() throws UnsupportedAudioFileException, IOException {
		return new RecognitionService();
	}
	
	@Bean
	public KurentoClient kurentoClient() {
		return KurentoClient.create(System.getProperty("kms.ws.uri",
				DEFAULT_KMS_WS_URI));
	}
	
	public static void main(String[] args) throws Exception {
		SpringApplication.run(NuOfficePrototypeApplication.class, args);
	}

	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(callHandler(), "/call");
	}
	
	@Override
	protected SpringApplicationBuilder configure(
			SpringApplicationBuilder application) {
		return application.sources(NuOfficePrototypeApplication.class);
	}

}
