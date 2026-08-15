#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AdsrState {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

#[derive(Debug, Clone)]
pub struct AdsrParams {
    // Parameters (in seconds)
    attack_time: f32,
    decay_time: f32,
    sustain_level: f32, // 0.0 to 1.0
    release_time: f32,
}

pub struct Adsr {
    state: AdsrState,
    current_level: f32,
    sample_rate: f32,
    release_start_level: f32,
    params: AdsrParams,
}

impl Adsr {
    pub fn new(sample_rate: f32, attack: f32, decay: f32, sustain: f32, release: f32) -> Self {
        Self {
            state: AdsrState::Idle,
            current_level: 0.0,
            release_start_level: 0.0,
            sample_rate,
            params: AdsrParams {
                attack_time: attack,
                decay_time: decay,
                sustain_level: sustain,
                release_time: release,
            },
        }
    }

    pub fn note_on(&mut self) {
        self.state = AdsrState::Attack;
    }

    pub fn note_off(&mut self) {
        self.release_start_level = self.current_level;
        self.state = AdsrState::Release;
    }

    /// This is called for every single sample
    pub fn next_sample(&mut self) -> f32 {
        match self.state {
            AdsrState::Idle => 0.0,
            AdsrState::Attack => {
                // Increment level towards 1.0
                let increment = 1.0 / (self.params.attack_time * self.sample_rate);
                self.current_level += increment;
                if self.current_level >= 1.0 {
                    self.current_level = 1.0;
                    self.state = AdsrState::Decay;
                }
                self.current_level
            }
            AdsrState::Decay => {
                // Decrement level towards sustain_level
                let decrement =
                    (1.0 - self.params.sustain_level) / (self.params.decay_time * self.sample_rate);
                self.current_level -= decrement;
                if self.current_level <= self.params.sustain_level {
                    self.current_level = self.params.sustain_level;
                    self.state = AdsrState::Sustain;
                }
                self.current_level
            }
            AdsrState::Sustain => self.params.sustain_level,
            AdsrState::Release => {
                // Decrement level towards 0.0
                let decrement =
                    self.release_start_level / (self.params.release_time * self.sample_rate);
                self.current_level -= decrement;
                if self.current_level <= 0.0 {
                    self.current_level = 0.0;
                    self.state = AdsrState::Idle;
                }
                self.current_level
            }
        }
    }
}
