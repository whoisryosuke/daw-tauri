use std::{fs::File, io::BufWriter};

pub struct WavEncoder {
    writer: hound::WavWriter<BufWriter<File>>,
}

impl WavEncoder {
    pub fn new(save_path: std::path::PathBuf) -> Self {
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate: 44100,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let mut writer = hound::WavWriter::create(save_path, spec).unwrap();

        Self { writer }
    }

    pub fn write(&mut self, samples: &[f32]) {
        for sample in samples {
            self.writer.write_sample(*sample as i16).unwrap();
        }
    }
}
