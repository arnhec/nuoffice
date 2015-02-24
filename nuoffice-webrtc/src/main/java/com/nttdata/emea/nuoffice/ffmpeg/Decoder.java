package com.nttdata.emea.nuoffice.ffmpeg;

import java.io.File;

import javax.sound.sampled.AudioFileFormat.Type;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioFormat.Encoding;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sun.media.sound.WaveFileWriter;
import com.tagtraum.ffsampledsp.FFAudioFileReader;
import com.tagtraum.ffsampledsp.FFFormatConversionProvider;
public class Decoder {
	private static final Logger log = LoggerFactory.getLogger(Decoder.class);

	public Decoder() {
		super();
	}

	@SuppressWarnings("restriction")
	public void process(String inFilename, String outFilename) {
		try {
			FFAudioFileReader reader = new FFAudioFileReader();
//			AudioFileFormat sourceFormat = reader
//					.getAudioFileFormat(sourceStream);
			AudioInputStream audioIn = reader.getAudioInputStream(new File(inFilename));
			AudioFormat sourceFormat = audioIn.getFormat();
			FFFormatConversionProvider convert = new FFFormatConversionProvider();

			AudioFormat dstFormat = new AudioFormat(AudioFormat.Encoding.PCM_UNSIGNED, 16000f, sourceFormat.getSampleSizeInBits(), 1, 2,
					2, false);
			Encoding[] encodings = convert.getTargetEncodings(dstFormat);
			
			
//			Encoding[] encodings = convert.getTargetEncodings(new AudioFormat(
//					16000f, // target sample rate
//					sourceFormat.getFormat().getSampleSizeInBits(), 1, true,
//					sourceFormat.getFormat().isBigEndian()));
			for (int i = 0; i < encodings.length; i++) {
				log.debug("Found target encoding " + encodings[i]);
			}

			final AudioInputStream resampledStream = convert
					.getAudioInputStream(encodings[0], audioIn);			
			WaveFileWriter writer = new WaveFileWriter();
			writer.write(resample(resampledStream), Type.WAVE, new File(outFilename));
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	// Audio format of print #1 is WAVE (.wav) file, byte length: 725246, data format: PCM_SIGNED 16000.0 Hz, 16 bit, mono, 2 bytes/frame, little-endian, frame length: 362601
	
	private AudioInputStream resample(AudioInputStream audioIn) {
		try {
			AudioFormat srcFormat = audioIn.getFormat();
			AudioFormat dstFormat = new AudioFormat(AudioFormat.Encoding.PCM_SIGNED,
					16000f, srcFormat.getSampleSizeInBits(), 1, 2,
					srcFormat.getFrameRate(), srcFormat.isBigEndian());
			AudioInputStream convertedIn = AudioSystem.getAudioInputStream(
					dstFormat, audioIn);
			return convertedIn;
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
}
