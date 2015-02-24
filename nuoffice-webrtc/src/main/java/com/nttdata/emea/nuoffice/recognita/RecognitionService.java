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
package com.nttdata.emea.nuoffice.recognita;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.List;

import javax.sound.sampled.AudioFileFormat.Type;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bitsinharmony.recognito.MatchResult;
import com.bitsinharmony.recognito.Recognito;
import com.google.common.io.Files;
import com.sun.media.sound.WaveFileReader;
import com.sun.media.sound.WaveFileWriter;

@SuppressWarnings("restriction")
public class RecognitionService {

	private static final float SAMPLE_RATE = 16000.0f;

	// Create a new Recognito instance defining the audio sample rate to be
	// used
	Recognito<String> recognito = new Recognito<String>(SAMPLE_RATE);


	public RecognitionService()
			throws UnsupportedAudioFileException, IOException {
		super();
		loadPrintsFromDisc(new File(DIR),null);
	}

	public void loadPrintsFromDisc(File file, File except) {
		FilenameFilter filter = new FilenameFilter() {

			@Override
			public boolean accept(File dir, String name) {
				return name.endsWith(".wav");
			}
		};
		for (File f : file.listFiles(filter)) {
			try {
//				System.out.println(f.getAbsolutePath() + " ? " + except.getAbsolutePath());
				if (except == null
						|| !except.getAbsolutePath()
								.equals(f.getAbsolutePath()))
					// resample(new File(f.toPath().toString()), f);
					addPrint(f.getName().split("\\.wav")[0], f, false);
				// recognito.createVoicePrint(f.getName(), f);
				// log.info("Print " + key + " added with id " + f.getName());

			} catch (Exception e) {
				log.error("Error", e);
			}
		}
		;
	}

	private static String DIR = "c:/tmp/prints/";

	private static final Logger log = LoggerFactory
			.getLogger(RecognitionService.class);

	private static final int THRESHOLD = 90;

	public void addPrint(String key, File file, boolean copy)
			throws UnsupportedAudioFileException, IOException {
		try {

			File dest = new File(DIR + key + ".wav");
			if (copy)
				Files.copy(file, dest);
			WaveFileReader r1 = new WaveFileReader();
			AudioInputStream a1 = r1.getAudioInputStream(new File(file
					.getAbsolutePath()));
			AudioFormat srcFormat = a1.getFormat();
			log.info("Stream length = " + a1.getFrameLength());
			log.info("Format = " + srcFormat);
			String name = key.split("_")[0];
			recognito.createVoicePrint(key, name, readAudioInputStream(a1));
			log.info("print added with id = " + key);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public <K> String improveResult(List<MatchResult<K>> results, int threshold) {
		return ResultOptimizer.optimize(results, threshold);
	}

	public List<MatchResult<String>> matchPrints(File sample)
			throws UnsupportedAudioFileException, IOException {
		WaveFileReader r1 = new WaveFileReader();
		AudioInputStream a1 = r1.getAudioInputStream(sample);
		AudioFormat srcFormat = a1.getFormat();
		log.info("Stream length = " + a1.getFrameLength());
		log.info("Format = " + srcFormat);
		List<MatchResult<String>> results = recognito
				.identify(readAudioInputStream(a1));
		return results;
	}

	public String verifySample(File sample)
			throws UnsupportedAudioFileException, IOException {
		List<MatchResult<String>> results = matchPrints(sample);
		for (MatchResult<String> result : results) {
			log.debug("Match result " + result.getKey() + " = "
					+ result.getLikelihoodRatio());
		}
		if (results.get(0).getLikelihoodRatio() > THRESHOLD)
			return results.get(0).getKey();
		return null;
	}

	public void addPrint(String userKey, String filename)
			throws UnsupportedAudioFileException, IOException {
		addPrint(userKey, new File(filename), true);
	}

	public Recognito<String> getRecognito() {
		return recognito;
	}

	public void setRecognito(Recognito<String> recognito) {
		this.recognito = recognito;
	}

	private void resample(File wavFile, File dstFile) {
		try {
			WaveFileReader reader = new WaveFileReader();
			AudioInputStream audioIn = reader.getAudioInputStream(wavFile);
			AudioFormat srcFormat = audioIn.getFormat();
			AudioFormat dstFormat = new AudioFormat(srcFormat.getSampleRate(),
					16, 1, true, true);
			//
			// AudioFormat dstFormat = new AudioFormat(srcFormat.getEncoding(),
			// SAMPLE_RATE, srcFormat.getSampleSizeInBits(), 1, 2,
			// srcFormat.getFrameRate(), srcFormat.isBigEndian());

			AudioInputStream convertedIn = AudioSystem.getAudioInputStream(
					dstFormat, audioIn);

			WaveFileWriter writer = new WaveFileWriter();
			writer.write(convertedIn, Type.WAVE, dstFile);
			convertedIn.close();
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public static double[] readAudioInputStream(AudioInputStream is)
			throws IOException, UnsupportedAudioFileException {

		AudioFormat originalFormat = is.getFormat();
		AudioFormat format = new AudioFormat(originalFormat.getSampleRate(),
				16, 1, true, true);

		AudioInputStream localIs = null;

		if (!originalFormat.matches(format)) {
			if (AudioSystem.isConversionSupported(format, originalFormat)) {
				localIs = AudioSystem.getAudioInputStream(format, is);
			} else {
				throw new UnsupportedAudioFileException(
						"Alas, the system could not decode your file type."
								+ "Try converting your file to some PCM 16bit 16000 Hz mono file format using dedicated "
								+ "software. (Hint : http://sox.sourceforge.net/");
			}
		} else {
			localIs = is;
		}
		double[] audioSample = new double[(int) localIs.getFrameLength()];
		byte[] buffer = new byte[8192];
		int bytesRead = 0;
		int offset = 0;

		while ((bytesRead = localIs.read(buffer)) > -1) {
			int wordCount = (bytesRead / 2) + (bytesRead % 2);
			for (int i = 0; i < wordCount; i++) {
				double d = (double) byteArrayToShort(buffer, 2 * i,
						format.isBigEndian()) / 32768;
				audioSample[offset + i] = d;
			}
			offset += wordCount;
		}
		return audioSample;
	}

	private static short byteArrayToShort(byte[] bytes, int offset,
			boolean bigEndian) {
		int low, high;
		if (bigEndian) {
			low = bytes[offset + 1];
			high = bytes[offset + 0];
		} else {
			low = bytes[offset + 0];
			high = bytes[offset + 1];
		}
		return (short) ((high << 8) | (0xFF & low));
	}
}
