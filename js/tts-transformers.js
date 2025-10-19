// TTS Transformers v2 - Working implementation with SpeechT5
class TransformerTTS {
    constructor() {
        this.synthesizer = null;
        this.isInitializing = false;
        this.isInitialized = false;
        this.audioQueue = [];
        this.isProcessing = false;
        this.currentAudio = null;
        this.isPaused = false;
        this.isStopped = false;
        this.speakerEmbeddings = null;
    }

    async initialize() {
        if (this.isInitialized || this.isInitializing) {
            return this.isInitialized;
        }

        this.isInitializing = true;
        
        try {
            console.log('Initializing Transformers.js TTS...');
            this.showInitializationMessage();

            // Dynamically import Transformers.js
            const module = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
            const { pipeline, env } = module;
            
            // Configure environment
            env.allowLocalModels = false;
            env.useBrowserCache = true;
            env.remoteURL = 'https://huggingface.co/';
            
            // Load the TTS pipeline with SpeechT5
            this.synthesizer = await pipeline(
                'text-to-speech',
                'Xenova/speecht5_tts',
                {
                    quantized: false, // Use full precision for better quality
                    progress_callback: (progress) => {
                        this.updateLoadingProgress(progress);
                    }
                }
            );
            
            // Load speaker embeddings
            this.speakerEmbeddings = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';
            
            console.log('TTS model loaded successfully');
            this.isInitialized = true;
            this.hideInitializationMessage();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize TTS:', error);
            this.isInitializing = false;
            this.hideInitializationMessage();
            this.showErrorMessage(error.message);
            return false;
        }
    }

    showInitializationMessage() {
        const existingMsg = document.querySelector('.tts-init-message');
        if (existingMsg) return;

        const message = document.createElement('div');
        message.className = 'tts-init-message';
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 10000;
                text-align: center;
                min-width: 350px;
                max-width: 500px;
            ">
                <h3 style="margin-top: 0; color: #333;">🎙️ Loading Advanced TTS</h3>
                <p style="color: #666;">Downloading SpeechT5 model for the first time...</p>
                <div class="progress-container" style="
                    width: 100%;
                    height: 8px;
                    background: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 1.5rem 0;
                ">
                    <div class="progress-fill" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #4CAF50, #45a049);
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <p class="progress-text" style="font-size: 0.9rem; color: #666; margin: 10px 0;">Initializing...</p>
                <p style="font-size: 0.8rem; color: #999; margin-top: 15px;">
                    This is a one-time download (~145MB)<br>
                    Next time will be instant!
                </p>
            </div>
        `;
        document.body.appendChild(message);
    }

    updateLoadingProgress(progress) {
        const progressFill = document.querySelector('.tts-init-message .progress-fill');
        const progressText = document.querySelector('.tts-init-message .progress-text');
        
        if (progressFill && progressText) {
            if (progress.status === 'download') {
                const percentage = Math.round((progress.loaded / progress.total) * 100);
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `Downloading: ${percentage}% (${(progress.loaded / 1024 / 1024).toFixed(1)}MB / ${(progress.total / 1024 / 1024).toFixed(1)}MB)`;
            } else if (progress.status === 'done') {
                progressFill.style.width = '100%';
                progressText.textContent = 'Model ready!';
            } else {
                progressText.textContent = progress.status || 'Processing...';
            }
        }
    }

    hideInitializationMessage() {
        const message = document.querySelector('.tts-init-message');
        if (message) {
            setTimeout(() => message.remove(), 500);
        }
    }

    showErrorMessage(error) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
        message.innerHTML = `
            <h3 style="color: #d32f2f; margin-top: 0;">⚠️ TTS Error</h3>
            <p style="color: #666; margin: 15px 0;">${error}</p>
            <button onclick="this.parentElement.remove()" style="
                padding: 8px 20px;
                background: #d32f2f;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">OK</button>
        `;
        document.body.appendChild(message);
    }

    async synthesizeSpeech(text) {
        if (!this.isInitialized) {
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize TTS');
            }
        }

        try {
            console.log('Starting speech synthesis...');
            
            // Split text into manageable chunks
            const chunks = this.splitIntoChunks(text, 200);
            const audioBuffers = [];
            
            // Show progress
            this.showSynthesisProgress(0, chunks.length);

            for (let i = 0; i < chunks.length; i++) {
                if (this.isStopped) break;
                
                const chunk = chunks[i];
                console.log(`Processing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 50)}..."`);
                
                // Generate audio for this chunk
                const output = await this.synthesizer(chunk, {
                    speaker_embeddings: this.speakerEmbeddings
                });
                
                if (output && output.audio) {
                    audioBuffers.push({
                        audio: output.audio,
                        sampling_rate: output.sampling_rate || 16000
                    });
                }
                
                this.showSynthesisProgress(i + 1, chunks.length);
            }

            this.hideSynthesisProgress();
            return audioBuffers;
            
        } catch (error) {
            console.error('Speech synthesis error:', error);
            this.hideSynthesisProgress();
            throw error;
        }
    }

    showSynthesisProgress(current, total) {
        let progressDiv = document.querySelector('.synthesis-progress');
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.className = 'synthesis-progress';
            progressDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
                font-size: 14px;
            `;
            document.body.appendChild(progressDiv);
        }
        
        const percentage = Math.round((current / total) * 100);
        progressDiv.textContent = `Processing speech: ${percentage}% (${current}/${total} chunks)`;
    }

    hideSynthesisProgress() {
        const progressDiv = document.querySelector('.synthesis-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }

    splitIntoChunks(text, maxLength = 200) {
        // Clean text
        text = text.replace(/\s+/g, ' ').trim();
        
        // Split into sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            
            if ((currentChunk + ' ' + trimmedSentence).length <= maxLength) {
                currentChunk = currentChunk 
                    ? currentChunk + ' ' + trimmedSentence 
                    : trimmedSentence;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                
                // If single sentence is too long, split it
                if (trimmedSentence.length > maxLength) {
                    const words = trimmedSentence.split(' ');
                    currentChunk = '';
                    
                    for (const word of words) {
                        if ((currentChunk + ' ' + word).length <= maxLength) {
                            currentChunk = currentChunk 
                                ? currentChunk + ' ' + word 
                                : word;
                        } else {
                            if (currentChunk) chunks.push(currentChunk);
                            currentChunk = word;
                        }
                    }
                } else {
                    currentChunk = trimmedSentence;
                }
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    createAudioBlob(audioData, sampleRate) {
        // Ensure audioData is a Float32Array
        if (!(audioData instanceof Float32Array)) {
            audioData = new Float32Array(audioData);
        }

        const length = audioData.length;
        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);

        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    async playAudioBuffers(audioBuffers, rate = 1.0) {
        this.isProcessing = true;
        this.isPaused = false;
        this.isStopped = false;

        for (const buffer of audioBuffers) {
            if (this.isStopped) break;
            
            while (this.isPaused) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (this.isStopped) break;
            }
            
            if (this.isStopped) break;

            await this.playAudioBuffer(buffer.audio, buffer.sampling_rate, rate);
        }

        this.isProcessing = false;
        this.currentAudio = null;
    }

    playAudioBuffer(audioData, sampleRate, rate = 1.0) {
        return new Promise((resolve, reject) => {
            try {
                const blob = this.createAudioBlob(audioData, sampleRate);
                const audioUrl = URL.createObjectURL(blob);
                
                this.currentAudio = new Audio(audioUrl);
                this.currentAudio.playbackRate = rate;
                
                this.currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                
                this.currentAudio.onerror = (error) => {
                    URL.revokeObjectURL(audioUrl);
                    console.error('Audio playback error:', error);
                    reject(error);
                };
                
                this.currentAudio.play().catch(reject);
            } catch (error) {
                console.error('Error creating audio:', error);
                reject(error);
            }
        });
    }

    pause() {
        this.isPaused = true;
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
        }
    }

    resume() {
        this.isPaused = false;
        if (this.currentAudio && this.currentAudio.paused) {
            this.currentAudio.play();
        }
    }

    stop() {
        this.isStopped = true;
        this.isPaused = false;
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isProcessing = false;
    }

    setRate(rate) {
        if (this.currentAudio) {
            this.currentAudio.playbackRate = rate;
        }
    }

    get isPlaying() {
        return this.isProcessing && !this.isPaused && !this.isStopped;
    }
}

// Export to global scope
window.TransformerTTS = TransformerTTS;

// Auto-initialize if ReadingAssistant exists
if (window.ReadingAssistant) {
    console.log('TransformerTTS: Ready for integration with ReadingAssistant');
}