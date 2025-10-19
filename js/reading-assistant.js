// Enhanced Reading Assistant with Transformers.js TTS Support
class ReadingAssistant {
    static isSpeaking = false;
    static isPaused = false;
    static currentUtterance = null;
    static speechSynthesis = window.speechSynthesis;
    static voices = [];
    static isInitialized = false;
    static textChunks = [];
    static currentChunkIndex = 0;
    static transformerTTS = null;
    static useTransformers = false;
    static audioBuffers = null;

    static init() {
        if (this.isInitialized) return;
        
        console.log('Initializing Enhanced Reading Assistant...');
        this.isInitialized = true;
        
        // Initialize Transformers.js if available
        this.initTransformers();
        
        // Load standard voices
        this.loadVoices();
        
        // Setup all event listeners
        this.setupEventListeners();
        
        // Calculate reading statistics
        this.calculateReadingStats();
        
        // Add UI enhancements
        this.addUIEnhancements();
    }

    static async initTransformers() {
        // Check if TransformerTTS is available
        if (window.TransformerTTS && !this.transformerTTS) {
            console.log('TransformerTTS available, initializing...');
            this.transformerTTS = new window.TransformerTTS();
            
            // Add toggle for Transformer TTS
            const speechSettings = document.querySelector('.speech-settings');
            if (speechSettings && !document.getElementById('use-transformer-tts')) {
                const toggleDiv = document.createElement('div');
                toggleDiv.style.cssText = 'margin: 10px 0; padding: 8px; background: #f0f8ff; border-radius: 4px;';
                toggleDiv.innerHTML = `
                    <label style="display: flex; align-items: center; cursor: pointer; font-weight: 500;">
                        <input type="checkbox" id="use-transformer-tts" style="margin-right: 8px; width: 18px; height: 18px;">
                        <span style="display: flex; align-items: center; gap: 5px;">
                            🚀 Use AI Voice 
                            <span style="font-size: 0.8em; color: #666; font-weight: normal;">(Higher Quality, First load ~145MB)</span>
                        </span>
                    </label>
                `;
                speechSettings.appendChild(toggleDiv);
                
                document.getElementById('use-transformer-tts').addEventListener('change', (e) => {
                    this.useTransformers = e.target.checked;
                    if (this.useTransformers) {
                        this.showMessage('🚀 AI Voice enabled - First load may take a minute');
                        // Disable voice selection when using Transformers
                        const voiceSelect = document.getElementById('voice-select');
                        const voiceLabel = document.querySelector('label[for="voice-select"]');
                        if (voiceSelect) {
                            voiceSelect.disabled = true;
                            voiceSelect.style.opacity = '0.5';
                        }
                        if (voiceLabel) {
                            voiceLabel.style.opacity = '0.5';
                        }
                    } else {
                        this.showMessage('🔊 Standard voices enabled');
                        const voiceSelect = document.getElementById('voice-select');
                        const voiceLabel = document.querySelector('label[for="voice-select"]');
                        if (voiceSelect) {
                            voiceSelect.disabled = false;
                            voiceSelect.style.opacity = '1';
                        }
                        if (voiceLabel) {
                            voiceLabel.style.opacity = '1';
                        }
                    }
                    
                    // Stop any ongoing speech when switching modes
                    if (this.isSpeaking) {
                        this.stopSpeech();
                    }
                });
            }
        } else {
            console.log('TransformerTTS not available, using standard TTS only');
        }
    }

    static addUIEnhancements() {
        // Add progress bar
        const readingControls = document.querySelector('.reading-controls');
        if (readingControls && !document.getElementById('tts-progress')) {
            const progressDiv = document.createElement('div');
            progressDiv.innerHTML = `
                <div id="tts-progress" style="
                    display: none;
                    margin: 15px 0;
                    background: #f5f5f5;
                    border-radius: 8px;
                    padding: 10px;
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <span id="tts-progress-label" style="
                            font-size: 0.85rem;
                            color: #666;
                            min-width: 60px;
                            font-weight: 500;
                        ">0%</span>
                        <div style="
                            flex: 1;
                            height: 6px;
                            background: #e0e0e0;
                            border-radius: 3px;
                            overflow: hidden;
                        ">
                            <div id="tts-progress-bar" style="
                                width: 0%;
                                height: 100%;
                                background: linear-gradient(90deg, #4CAF50, #45a049);
                                transition: width 0.3s ease;
                            "></div>
                        </div>
                        <span id="tts-chunk-info" style="
                            font-size: 0.8rem;
                            color: #999;
                        "></span>
                    </div>
                </div>
            `;
            readingControls.appendChild(progressDiv.firstElementChild);
        }

        // Add quality mode selector
        const speechSettings = document.querySelector('.speech-settings');
        if (speechSettings && !document.getElementById('quality-mode')) {
            const qualityDiv = document.createElement('div');
            qualityDiv.className = 'quality-mode';
            qualityDiv.style.cssText = 'margin: 10px 0;';
            qualityDiv.innerHTML = `
                <label for="quality-mode" style="margin-right: 8px;">Quality:</label>
                <select id="quality-mode" class="quality-select" style="
                    padding: 4px 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                ">
                    <option value="balanced">Balanced</option>
                    <option value="quality">High Quality</option>
                    <option value="speed">Fast</option>
                </select>
            `;
            speechSettings.appendChild(qualityDiv);
        }
    }

    static loadVoices() {
        const loadVoiceList = () => {
            this.voices = speechSynthesis.getVoices();
            console.log(`Loaded ${this.voices.length} voices`);
            
            if (this.voices.length > 0) {
                this.populateVoiceList();
                this.categorizeVoices();
            }
        };

        // Try to load immediately
        loadVoiceList();

        // Also listen for the voiceschanged event
        if (this.voices.length === 0) {
            speechSynthesis.addEventListener('voiceschanged', loadVoiceList, { once: true });
        }
    }

    static categorizeVoices() {
        // Categorize voices by quality
        this.premiumVoices = this.voices.filter(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') ||
            voice.name.includes('Premium') ||
            voice.name.includes('Enhanced')
        );

        this.naturalVoices = this.voices.filter(voice =>
            voice.name.includes('Natural') ||
            voice.name.includes('Samantha') ||
            voice.name.includes('Daniel') ||
            voice.name.includes('Karen') ||
            voice.name.includes('Moira')
        );

        console.log(`Found ${this.premiumVoices.length} premium voices, ${this.naturalVoices.length} natural voices`);
    }

    static populateVoiceList() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) return;

        voiceSelect.innerHTML = '';
        
        // Group voices by language and quality
        const englishVoices = this.voices.filter(voice => voice.lang.startsWith('en'));
        
        if (englishVoices.length === 0) {
            voiceSelect.innerHTML = '<option value="">No English voices available</option>';
            return;
        }

        // Separate into quality tiers
        const premiumVoices = [];
        const standardVoices = [];
        
        englishVoices.forEach(voice => {
            const isPremium = voice.name.includes('Google') || 
                            voice.name.includes('Microsoft') ||
                            voice.name.includes('Premium') ||
                            voice.name.includes('Natural');
            
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} ${isPremium ? '⭐' : ''}`;
            option.dataset.lang = voice.lang;
            
            if (isPremium) {
                premiumVoices.push(option);
            } else {
                standardVoices.push(option);
            }
        });

        // Add premium voices first
        if (premiumVoices.length > 0) {
            const group = document.createElement('optgroup');
            group.label = '⭐ Premium Voices';
            premiumVoices.forEach(opt => group.appendChild(opt));
            voiceSelect.appendChild(group);
        }

        // Add standard voices
        if (standardVoices.length > 0) {
            const group = document.createElement('optgroup');
            group.label = 'Standard Voices';
            standardVoices.forEach(opt => group.appendChild(opt));
            voiceSelect.appendChild(group);
        }

        this.selectBestVoice();
    }

    static selectBestVoice() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect || voiceSelect.options.length === 0) return;

        // Priority list for best voices
        const preferredVoices = [
            'Google UK English Female',
            'Google US English',
            'Microsoft Zira Desktop',
            'Microsoft David Desktop',
            'Samantha',
            'Karen',
            'Daniel'
        ];

        for (const voiceName of preferredVoices) {
            const option = Array.from(voiceSelect.options).find(opt => 
                opt.text.includes(voiceName)
            );
            if (option) {
                voiceSelect.value = option.value;
                console.log('Selected voice:', option.text);
                return;
            }
        }

        // Fallback to first premium voice
        const premiumOption = Array.from(voiceSelect.options).find(opt => 
            opt.text.includes('⭐')
        );
        if (premiumOption) {
            voiceSelect.value = premiumOption.value;
        }
    }

    static getSelectedVoice() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) return null;
        return this.voices.find(voice => voice.name === voiceSelect.value);
    }

    static getSpeechSettings() {
        const rateSelect = document.getElementById('rate-select');
        const qualityMode = document.getElementById('quality-mode');
        
        let rate = rateSelect ? parseFloat(rateSelect.value) : 1.0;
        let pitch = 1.0;
        let volume = 1.0;

        // Adjust based on quality mode (only for standard TTS)
        if (qualityMode && !this.useTransformers) {
            switch(qualityMode.value) {
                case 'quality':
                    rate = Math.min(rate, 0.95); // Slightly slower for clarity
                    pitch = 1.05; // Slightly higher pitch for clarity
                    break;
                case 'speed':
                    rate = Math.min(rate * 1.1, 2.0); // Slightly faster
                    break;
                case 'balanced':
                default:
                    // Use default settings
                    break;
            }
        }

        return { rate, pitch, volume };
    }

    static preprocessText(text) {
        // Remove HTML tags
        text = text.replace(/<[^>]*>/g, '');
        
        // Normalize whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        // Don't add extra punctuation for Transformer TTS
        if (!this.useTransformers) {
            // Add pauses for better rhythm in standard TTS
            text = text.replace(/\./g, '. '); // Add pause after periods
            text = text.replace(/,/g, ', '); // Add pause after commas
            text = text.replace(/;/g, '; '); // Add pause after semicolons
            text = text.replace(/:/g, ': '); // Add pause after colons
        }
        
        // Expand common abbreviations
        const abbreviations = {
            'Dr.': 'Doctor',
            'Mr.': 'Mister',
            'Mrs.': 'Missus',
            'Ms.': 'Miss',
            'Prof.': 'Professor',
            'Sr.': 'Senior',
            'Jr.': 'Junior',
            'vs.': 'versus',
            'etc.': 'etcetera',
            'i.e.': 'that is',
            'e.g.': 'for example'
        };
        
        for (const [abbr, full] of Object.entries(abbreviations)) {
            const regex = new RegExp(abbr.replace('.', '\\.'), 'g');
            text = text.replace(regex, full);
        }
        
        return text;
    }

    static splitIntoChunks(text, maxLength = 200) {
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
                
                // If sentence is too long, split by commas or words
                if (trimmedSentence.length > maxLength) {
                    const parts = trimmedSentence.split(/,\s*/);
                    let tempChunk = '';
                    
                    for (const part of parts) {
                        if ((tempChunk + ', ' + part).length <= maxLength) {
                            tempChunk = tempChunk 
                                ? tempChunk + ', ' + part 
                                : part;
                        } else {
                            if (tempChunk) chunks.push(tempChunk);
                            tempChunk = part;
                        }
                    }
                    if (tempChunk) currentChunk = tempChunk;
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

    static setupEventListeners() {
        const listenBtn = document.getElementById('listen-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        const voiceSelect = document.getElementById('voice-select');
        const rateSelect = document.getElementById('rate-select');
        const qualityMode = document.getElementById('quality-mode');

        if (listenBtn) {
            listenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSpeech();
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.pauseSpeech();
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.stopSpeech();
            });
        }

        if (voiceSelect) {
            voiceSelect.addEventListener('change', () => {
                console.log('Voice changed to:', voiceSelect.value);
                if (this.isSpeaking && !this.useTransformers) {
                    this.showMessage('Voice changed. Restarting...');
                    this.restartSpeech();
                }
            });
        }

        if (rateSelect) {
            rateSelect.addEventListener('change', () => {
                const rate = parseFloat(rateSelect.value);
                console.log('Rate changed to:', rate);
                
                if (this.useTransformers && this.transformerTTS) {
                    this.transformerTTS.setRate(rate);
                    this.showMessage(`Speed: ${rate}x`);
                } else if (this.currentUtterance) {
                    this.currentUtterance.rate = rate;
                    this.showMessage(`Speed: ${rate}x`);
                }
            });
        }

        if (qualityMode) {
            qualityMode.addEventListener('change', () => {
                if (this.isSpeaking && !this.useTransformers) {
                    this.showMessage(`Quality mode: ${qualityMode.value}`);
                    this.restartSpeech();
                }
            });
        }
    }

    static toggleSpeech() {
        if (this.useTransformers && this.transformerTTS) {
            this.toggleTransformerSpeech();
        } else {
            this.toggleStandardSpeech();
        }
    }

    static async toggleTransformerSpeech() {
        if (this.transformerTTS.isPlaying) {
            if (this.transformerTTS.isPaused) {
                this.transformerTTS.resume();
                this.updateUIState();
                this.showMessage('🎙️ Speech resumed');
            } else {
                this.transformerTTS.pause();
                this.updateUIState();
                this.showMessage('⏸️ Speech paused');
            }
        } else {
            await this.startTransformerSpeech();
        }
    }

    static toggleStandardSpeech() {
        if (this.isPaused) {
            this.resumeSpeech();
        } else if (this.isSpeaking) {
            this.pauseSpeech();
        } else {
            this.startStandardSpeech();
        }
    }

    static async startTransformerSpeech() {
        const articleContent = document.querySelector('.article-content');
        if (!articleContent) {
            this.showMessage('❌ No article content found');
            return;
        }

        const text = this.extractSpeechText(articleContent);
        if (!text.trim()) {
            this.showMessage('❌ No content available for speech');
            return;
        }

        try {
            this.isSpeaking = true;
            this.updateUIState();
            
            // Show progress
            const progressDiv = document.getElementById('tts-progress');
            if (progressDiv) {
                progressDiv.style.display = 'block';
            }
            
            this.showMessage('🚀 Generating AI speech...');
            
            // Generate audio with Transformers.js
            const audioBuffers = await this.transformerTTS.synthesizeSpeech(text);
            
            if (!audioBuffers || audioBuffers.length === 0) {
                throw new Error('No audio generated');
            }
            
            this.showMessage('🎙️ Playing AI-generated speech...');
            
            // Get playback rate
            const rateSelect = document.getElementById('rate-select');
            const rate = rateSelect ? parseFloat(rateSelect.value) : 1.0;
            
            // Update progress during playback
            let currentBuffer = 0;
            const updatePlaybackProgress = setInterval(() => {
                if (!this.transformerTTS.isPlaying) {
                    clearInterval(updatePlaybackProgress);
                    this.updateProgress(100);
                } else {
                    const progress = Math.round((currentBuffer / audioBuffers.length) * 100);
                    this.updateProgress(progress);
                }
            }, 500);
            
            // Play the audio
            await this.transformerTTS.playAudioBuffers(audioBuffers, rate);
            
            clearInterval(updatePlaybackProgress);
            this.isSpeaking = false;
            this.updateUIState();
            this.updateProgress(100);
            
            // Hide progress after completion
            setTimeout(() => {
                if (progressDiv) {
                    progressDiv.style.display = 'none';
                }
            }, 1000);
            
            this.showMessage('✅ Speech completed');
            
        } catch (error) {
            console.error('Transformer TTS error:', error);
            this.isSpeaking = false;
            this.updateUIState();
            
            const progressDiv = document.getElementById('tts-progress');
            if (progressDiv) {
                progressDiv.style.display = 'none';
            }
            
            this.showMessage('❌ AI Voice error - trying standard voice...');
            
            // Automatically fallback to standard TTS
            const useTransformerCheckbox = document.getElementById('use-transformer-tts');
            if (useTransformerCheckbox) {
                useTransformerCheckbox.checked = false;
                this.useTransformers = false;
            }
            
            // Try with standard voice
            setTimeout(() => {
                this.startStandardSpeech();
            }, 1000);
        }
    }

    static async startStandardSpeech() {
        const articleContent = document.querySelector('.article-content');
        if (!articleContent) {
            this.showMessage('❌ No article content found');
            return;
        }

        // Extract and preprocess text
        let text = this.extractSpeechText(articleContent);
        text = this.preprocessText(text);
        
        if (!text.trim()) {
            this.showMessage('❌ No content available for speech');
            return;
        }

        // Check if voices are loaded
        if (this.voices.length === 0) {
            this.showMessage('⏳ Loading voices... please wait');
            this.loadVoices();
            setTimeout(() => this.startStandardSpeech(), 1000);
            return;
        }

        // Split into chunks for better handling
        this.textChunks = this.splitIntoChunks(text);
        this.currentChunkIndex = 0;
        
        console.log(`Starting speech with ${this.textChunks.length} chunks`);
        
        // Show progress
        const progressDiv = document.getElementById('tts-progress');
        if (progressDiv) {
            progressDiv.style.display = 'block';
        }

        this.isSpeaking = true;
        this.isPaused = false;
        this.updateUIState();
        this.showMessage('🔊 Starting speech...');
        
        // Start speaking chunks
        this.speakNextChunk();
    }

    static speakNextChunk() {
        if (!this.isSpeaking || this.currentChunkIndex >= this.textChunks.length) {
            this.onSpeechComplete();
            return;
        }

        const chunk = this.textChunks[this.currentChunkIndex];
        const voice = this.getSelectedVoice();
        const settings = this.getSpeechSettings();
        
        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(chunk);
        
        if (voice) {
            this.currentUtterance.voice = voice;
            this.currentUtterance.lang = voice.lang;
        }
        
        this.currentUtterance.rate = settings.rate;
        this.currentUtterance.pitch = settings.pitch;
        this.currentUtterance.volume = settings.volume;
        
        // Event handlers
        this.currentUtterance.onend = () => {
            this.currentChunkIndex++;
            this.updateProgress();
            
            if (this.isSpeaking && !this.isPaused) {
                // Small delay between chunks for natural flow
                setTimeout(() => this.speakNextChunk(), 100);
            }
        };

        this.currentUtterance.onerror = (event) => {
            console.error('Speech error:', event.error);
            
            // Try to recover from certain errors
            if (event.error === 'interrupted' || event.error === 'canceled') {
                return;
            }
            
            this.showMessage(`❌ Speech error: ${event.error}`);
            this.stopSpeech();
        };

        this.currentUtterance.onpause = () => {
            console.log('Speech paused');
        };

        this.currentUtterance.onresume = () => {
            console.log('Speech resumed');
        };

        // Speak the chunk
        try {
            speechSynthesis.speak(this.currentUtterance);
            this.updateProgress();
        } catch (error) {
            console.error('Failed to speak:', error);
            this.showMessage('❌ Failed to start speech');
            this.stopSpeech();
        }
    }

    static updateProgress(customProgress = null) {
        const progressBar = document.getElementById('tts-progress-bar');
        const progressLabel = document.getElementById('tts-progress-label');
        const chunkInfo = document.getElementById('tts-chunk-info');
        
        if (progressBar && progressLabel) {
            const progress = customProgress !== null 
                ? customProgress 
                : Math.round((this.currentChunkIndex / this.textChunks.length) * 100);
            
            progressBar.style.width = `${progress}%`;
            progressLabel.textContent = `${progress}%`;
            
            if (chunkInfo && !this.useTransformers) {
                chunkInfo.textContent = `Chunk ${this.currentChunkIndex}/${this.textChunks.length}`;
            }
        }
    }

    static onSpeechComplete() {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentChunkIndex = 0;
        this.textChunks = [];
        this.updateUIState();
        
        const progressDiv = document.getElementById('tts-progress');
        if (progressDiv) {
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 1000);
        }
        
        this.showMessage('✅ Reading completed');
    }

    static pauseSpeech() {
        if (this.useTransformers && this.transformerTTS) {
            this.transformerTTS.pause();
            this.updateUIState();
            this.showMessage('⏸️ Speech paused');
        } else if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            this.isPaused = true;
            this.updateUIState();
            this.showMessage('⏸️ Speech paused');
        }
    }

    static resumeSpeech() {
        if (this.useTransformers && this.transformerTTS) {
            this.transformerTTS.resume();
            this.updateUIState();
            this.showMessage('▶️ Speech resumed');
        } else if (speechSynthesis.paused) {
            speechSynthesis.resume();
            this.isPaused = false;
            this.updateUIState();
            this.showMessage('▶️ Speech resumed');
            
            // Continue with next chunk if needed
            if (!speechSynthesis.speaking && this.currentChunkIndex < this.textChunks.length) {
                this.speakNextChunk();
            }
        }
    }

    static stopSpeech() {
        if (this.transformerTTS) {
            this.transformerTTS.stop();
        }
        
        speechSynthesis.cancel();
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentChunkIndex = 0;
        this.textChunks = [];
        this.currentUtterance = null;
        this.updateUIState();
        
        const progressDiv = document.getElementById('tts-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
        
        console.log('Speech stopped');
    }

    static restartSpeech() {
        const wasChunkIndex = this.currentChunkIndex;
        this.stopSpeech();
        
        // Small delay to ensure clean state
        setTimeout(() => {
            if (this.useTransformers) {
                this.startTransformerSpeech();
            } else {
                this.startStandardSpeech();
                // Try to resume from approximate position
                if (wasChunkIndex > 0 && wasChunkIndex < this.textChunks.length) {
                    this.currentChunkIndex = Math.max(0, wasChunkIndex - 1);
                }
            }
        }, 100);
    }

    static extractSpeechText(articleContent) {
        const clone = articleContent.cloneNode(true);
        
        // Remove elements that shouldn't be read
        const elementsToRemove = clone.querySelectorAll(
            '.ad-unit, .share-buttons, .reading-assistant, script, style, .article-actions, .article-meta, .article-tags, img, video, iframe'
        );
        elementsToRemove.forEach(el => el.remove());
        
        // Get clean text
        let text = clone.textContent || clone.innerText || '';
        
        return text;
    }

    static updateUIState() {
        const listenBtn = document.getElementById('listen-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');

        if (!listenBtn || !pauseBtn || !stopBtn) return;

        let isPaused, isSpeaking;
        
        if (this.useTransformers && this.transformerTTS) {
            isPaused = this.transformerTTS.isPaused;
            isSpeaking = this.transformerTTS.isPlaying || this.transformerTTS.isProcessing;
        } else {
            isPaused = this.isPaused;
            isSpeaking = this.isSpeaking;
        }

        if (isSpeaking && !isPaused) {
            // Currently speaking
            listenBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
            stopBtn.style.display = 'inline-flex';
        } else if (isPaused) {
            // Paused
            listenBtn.style.display = 'inline-flex';
            listenBtn.innerHTML = '<span class="material-icons">play_arrow</span>Resume';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
        } else {
            // Not speaking
            listenBtn.style.display = 'inline-flex';
            listenBtn.innerHTML = '<span class="material-icons">play_arrow</span>Listen';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
        }
    }

    static showMessage(message) {
        console.log('Reading Assistant:', message);
        
        // Remove existing message
        const existingMsg = document.querySelector('.reading-assistant-message');
        if (existingMsg) {
            existingMsg.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'reading-assistant-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 0.95rem;
            max-width: 350px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            font-weight: 500;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOutRight 0.4s ease-in';
                setTimeout(() => messageDiv.remove(), 400);
            }
        }, 3000);
    }

    static calculateReadingStats() {
        const articleContent = document.querySelector('.article-content');
        if (!articleContent) return;

        const text = articleContent.textContent || articleContent.innerText;
        const wordCount = this.countWords(text);
        const readingTime = this.calculateReadingTime(wordCount);

        const wordCountElement = document.getElementById('word-count-number');
        const timeEstimateElement = document.getElementById('time-estimate');

        if (wordCountElement) {
            wordCountElement.textContent = `${wordCount.toLocaleString()} words`;
        }

        if (timeEstimateElement) {
            timeEstimateElement.textContent = `${readingTime} min read`;
        }

        const readingAssistant = document.getElementById('reading-assistant');
        if (readingAssistant) {
            readingAssistant.style.display = 'block';
        }
    }

    static countWords(text) {
        if (!text) return 0;
        const cleanText = text.trim().replace(/\s+/g, ' ');
        return cleanText === '' ? 0 : cleanText.split(' ').length;
    }

    static calculateReadingTime(wordCount) {
        const wordsPerMinute = 200;
        const time = Math.ceil(wordCount / wordsPerMinute);
        return time < 1 ? 1 : time;
    }

    static isSupported() {
        const webSpeechSupported = 'speechSynthesis' in window;
        const transformersSupported = window.TransformerTTS !== undefined;
        
        console.log('Web Speech API supported:', webSpeechSupported);
        console.log('Transformers.js TTS available:', transformersSupported);
        
        return webSpeechSupported || transformersSupported;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .reading-assistant-message {
        transition: all 0.3s ease;
    }
    
    #tts-progress-bar {
        position: relative;
        overflow: hidden;
    }
    
    #tts-progress-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
        );
        transform: translateX(-100%);
        animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
        100% {
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
if (document.getElementById('reading-assistant')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing Reading Assistant...');
        
        if (!ReadingAssistant.isSupported()) {
            const readingAssistant = document.getElementById('reading-assistant');
            if (readingAssistant) {
                readingAssistant.innerHTML = `
                    <div class="browser-support-warning" style="
                        padding: 1rem;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 8px;
                        color: white;
                        text-align: center;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        <span class="material-icons" style="font-size: 2rem;">volume_off</span>
                        <div style="margin-top: 10px; font-weight: 500;">Text-to-speech is not supported</div>
                        <small style="opacity: 0.9;">Please use Chrome, Edge, Safari, or Firefox</small>
                    </div>
                `;
            }
            return;
        }

        // Delay initialization to ensure voices are loaded
        setTimeout(() => {
            ReadingAssistant.init();
        }, 500);
    });
}