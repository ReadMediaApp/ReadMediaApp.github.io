// Reading Assistant functionality
class ReadingAssistant {
    static isSpeaking = false;
    static currentUtterance = null;
    static speechSynthesis = window.speechSynthesis;
    static voices = [];
    static isInitialized = false;

    static init() {
        if (this.isInitialized) return;
        
        console.log('Initializing Reading Assistant...');
        this.isInitialized = true;
        this.loadVoices();
        this.setupEventListeners();
        this.calculateReadingStats();
    }

    static loadVoices() {
        // Get voices immediately
        this.voices = speechSynthesis.getVoices();
        
        // If no voices, wait for the voiceschanged event
        if (this.voices.length === 0) {
            console.log('No voices available initially, waiting for voiceschanged...');
            const voicesHandler = () => {
                this.voices = speechSynthesis.getVoices();
                console.log('Voices loaded via event:', this.voices.length);
                this.populateVoiceList();
                this.logAvailableVoices();
                // Remove the event listener after it fires once
                speechSynthesis.removeEventListener('voiceschanged', voicesHandler);
            };
            speechSynthesis.addEventListener('voiceschanged', voicesHandler);
        } else {
            console.log('Voices available immediately:', this.voices.length);
            this.populateVoiceList();
            this.logAvailableVoices();
        }
    }

    static populateVoiceList() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) return;

        voiceSelect.innerHTML = '';
        
        if (this.voices.length === 0) {
            voiceSelect.innerHTML = '<option value="">No voices available</option>';
            return;
        }

        // Add all English voices
        const englishVoices = this.voices.filter(voice => voice.lang.startsWith('en-'));
        
        if (englishVoices.length === 0) {
            voiceSelect.innerHTML = '<option value="">No English voices</option>';
            return;
        }

        englishVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

        this.setDefaultVoice();
    }

    static setDefaultVoice() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect || voiceSelect.options.length === 0) return;

        // Prefer natural-sounding voices
        const naturalVoices = [
            'Microsoft Zira', 'Microsoft David', 'Google UK English Female',
            'Google US English', 'Samantha', 'Karen', 'Victoria', 'Alex'
        ];

        for (const voiceName of naturalVoices) {
            const option = Array.from(voiceSelect.options).find(opt => 
                opt.textContent.includes(voiceName)
            );
            if (option) {
                voiceSelect.value = option.value;
                console.log('Set default voice to:', option.textContent);
                return;
            }
        }

        // Fallback to first available voice
        voiceSelect.selectedIndex = 0;
    }

    static getSelectedVoice() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect || !voiceSelect.value) return null;
        return this.voices.find(voice => voice.name === voiceSelect.value);
    }

    static getSpeechRate() {
        const rateSelect = document.getElementById('rate-select');
        return rateSelect ? parseFloat(rateSelect.value) : 0.9; // Default to 0.9 for better quality
    }

    static getSpeechPitch() {
        return 1.0; // Normal pitch to avoid robotic sound
    }

    static logAvailableVoices() {
        console.log('=== Available Voices ===');
        this.voices.forEach(voice => {
            console.log(`- ${voice.name} (${voice.lang}) ${voice.default ? '[DEFAULT]' : ''}`);
        });
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

    static setupEventListeners() {
        const listenBtn = document.getElementById('listen-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        const voiceSelect = document.getElementById('voice-select');
        const rateSelect = document.getElementById('rate-select');

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
                if (this.isSpeaking) {
                    this.restartWithNewVoice();
                }
            });
        }

        if (rateSelect) {
            rateSelect.addEventListener('change', () => {
                console.log('Rate changed to:', rateSelect.value);
                if (this.isSpeaking && this.currentUtterance) {
                    // Can't change rate mid-utterance, need to restart
                    this.restartWithNewVoice();
                }
            });
        }
    }

    static toggleSpeech() {
        if (speechSynthesis.paused && this.isSpeaking) {
            this.resumeSpeech();
        } else if (this.isSpeaking) {
            this.pauseSpeech();
        } else {
            this.startSpeech();
        }
    }

    static startSpeech() {
        // Ensure we have voices loaded
        if (this.voices.length === 0) {
            this.showMessage('Loading voices... please wait');
            this.loadVoices();
            setTimeout(() => this.startSpeech(), 1000);
            return;
        }

        const articleContent = document.querySelector('.article-content');
        if (!articleContent) {
            this.showMessage('No article content found');
            return;
        }

        const text = this.extractSpeechText(articleContent);
        
        if (!text.trim()) {
            this.showMessage('No content available for speech');
            return;
        }

        console.log('Starting speech with text length:', text.length);

        // Use a more reliable approach - always cancel first
        this.stopSpeech();
        
        // Small delay to ensure clean state
        setTimeout(() => {
            this.speakText(text);
        }, 50);
    }

    static speakText(text) {
        // Create new utterance
        this.currentUtterance = new SpeechSynthesisUtterance();
        
        // Configure settings - optimized for natural sound
        this.currentUtterance.text = text;
        this.currentUtterance.rate = this.getSpeechRate();
        this.currentUtterance.pitch = this.getSpeechPitch();
        this.currentUtterance.volume = 1.0;
        
        // Set voice
        const selectedVoice = this.getSelectedVoice();
        if (selectedVoice) {
            this.currentUtterance.voice = selectedVoice;
            this.currentUtterance.lang = selectedVoice.lang;
            console.log('Using voice:', selectedVoice.name);
        }

        // Event handlers
        this.currentUtterance.onstart = () => {
            console.log('✓ Utterance started successfully');
            this.isSpeaking = true;
            this.updateUIState();
            this.showMessage('Reading started...');
        };

        this.currentUtterance.onend = () => {
            console.log('✓ Utterance ended naturally');
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateUIState();
            this.showMessage('Reading completed');
        };

        this.currentUtterance.onerror = (event) => {
            console.error('✗ Utterance error:', event.error);
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateUIState();
            
            let errorMsg = 'Speech error: ' + event.error;
            if (event.error === 'interrupted') {
                errorMsg = 'Speech was interrupted';
            } else if (event.error === 'canceled') {
                errorMsg = 'Speech was canceled';
            }
            this.showMessage(errorMsg);
        };

        this.currentUtterance.onpause = () => {
            console.log('⏸️ Utterance paused');
            this.showMessage('Speech paused');
        };

        this.currentUtterance.onresume = () => {
            console.log('▶️ Utterance resumed');
            this.showMessage('Speech resumed');
        };

        // Start speaking with error handling
        try {
            speechSynthesis.speak(this.currentUtterance);
            console.log('✓ Speech synthesis initiated');
            
            // Update UI to show speaking state
            this.isSpeaking = true;
            this.updateUIState();
            
        } catch (error) {
            console.error('✗ Error starting speech:', error);
            this.showMessage('Error: ' + error.message);
            this.isSpeaking = false;
            this.updateUIState();
        }
    }

    static restartWithNewVoice() {
        if (!this.isSpeaking || !this.currentUtterance) return;
        
        const currentText = this.currentUtterance.text;
        const currentPosition = 0; // Can't get actual position, so restart from beginning
        
        this.stopSpeech();
        
        setTimeout(() => {
            this.speakText(currentText);
        }, 100);
    }

    static extractSpeechText(articleContent) {
        const clone = articleContent.cloneNode(true);
        
        // Remove elements that shouldn't be read
        const elementsToRemove = clone.querySelectorAll(
            '.ad-unit, .share-buttons, .reading-assistant, script, style, .article-actions, .article-meta, .article-tags'
        );
        elementsToRemove.forEach(el => el.remove());
        
        // Get clean text
        let text = clone.textContent || clone.innerText || '';
        
        // Clean up the text
        text = text.replace(/\s+/g, ' ').trim();
        
        console.log('Extracted text length:', text.length);
        return text;
    }

    static pauseSpeech() {
        if (this.isSpeaking && speechSynthesis.speaking) {
            speechSynthesis.pause();
            this.updateUIState();
            this.showMessage('Speech paused');
        }
    }

    static resumeSpeech() {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
            this.updateUIState();
            this.showMessage('Speech resumed');
        }
    }

    static stopSpeech() {
        if (speechSynthesis.speaking || speechSynthesis.paused) {
            speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.updateUIState();
        console.log('✓ Speech stopped');
    }

    static updateUIState() {
        const listenBtn = document.getElementById('listen-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');

        if (!listenBtn || !pauseBtn || !stopBtn) return;

        const isPaused = speechSynthesis.paused;
        const isSpeaking = this.isSpeaking && speechSynthesis.speaking;

        if (isSpeaking && !isPaused) {
            // Currently speaking
            listenBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
            stopBtn.style.display = 'inline-flex';
            listenBtn.innerHTML = '<span class="material-icons">play_arrow</span>Listen';
        } else if (isSpeaking && isPaused) {
            // Paused
            listenBtn.style.display = 'inline-flex';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            listenBtn.innerHTML = '<span class="material-icons">play_arrow</span>Resume';
        } else {
            // Not speaking
            listenBtn.style.display = 'inline-flex';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            listenBtn.innerHTML = '<span class="material-icons">play_arrow</span>Listen';
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
            background: #333;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 1000;
            font-size: 0.9rem;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // Check if browser supports speech synthesis
    static isSupported() {
        const supported = 'speechSynthesis' in window;
        console.log('Speech synthesis supported:', supported);
        return supported;
    }
}

// Initialize when DOM is loaded
if (document.getElementById('reading-assistant')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, checking Reading Assistant support...');
        
        if (!ReadingAssistant.isSupported()) {
            const readingAssistant = document.getElementById('reading-assistant');
            if (readingAssistant) {
                readingAssistant.innerHTML = `
                    <div class="browser-support-warning">
                        <span class="material-icons">volume_off</span>
                        <div>Text-to-speech not supported</div>
                        <small>Try Chrome, Edge, or Safari</small>
                    </div>
                `;
            }
            return;
        }

        // Initialize with a delay to ensure everything is loaded
        setTimeout(() => {
            ReadingAssistant.init();
        }, 1000);
    });
}