class MediaLooper {
    constructor() {
        this.player = null;
        this.audioPlayer = null;
        this.startTime = 0;
        this.endTime = 0;
        this.currentLoopCount = 0;
        this.maxLoops = 10;
        this.checkInterval = null;
        
        this.initializeYouTubeAPI();
        this.setupEventListeners();
    }

    initializeYouTubeAPI() {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Make onYouTubeIframeAPIReady global
        window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube API Ready');
        };
    }

    setupEventListeners() {
        document.getElementById('loadButton').addEventListener('click', () => this.loadVideo());
        document.getElementById('copyButton').addEventListener('click', () => this.copyShareableUrl());
        window.addEventListener('load', () => this.getUrlParams());
        document.getElementById('resetButton').addEventListener('click', () => this.resetAll());
    }

    loadVideo() {
        const url = document.getElementById('videoUrl').value;
        this.startTime = this.convertTimeToSeconds(document.getElementById('startTime').value) || 0;
        this.endTime = this.convertTimeToSeconds(document.getElementById('endTime').value) || 0;
        this.maxLoops = parseInt(document.getElementById('loopCount').value) || 10;
        this.currentLoopCount = 0;

        // Check if URL is a direct audio file
        if (url.match(/\.(mp3|wav|ogg)$/i) || url.includes('mp3')) {
            this.setupAudioPlayer(url);
        } else {
            // Extract video ID from URL
            const videoId = this.extractVideoId(url);
            
            if (!videoId) {
                alert('Please enter a valid YouTube URL');
                return;
            }

            if (this.player) {
                // If player exists, load new video
                this.player.loadVideoById({
                    videoId: videoId,
                    startSeconds: this.startTime
                });
            } else {
                // Create new player
                this.player = new YT.Player('player', {
                    height: '360',
                    width: '640',
                    videoId: videoId,
                    playerVars: {
                        start: this.startTime,
                        autoplay: 1
                    },
                    events: {
                        'onStateChange': (event) => this.onPlayerStateChange(event)
                    }
                });
            }

        }
        this.generateShareableUrl();
    }

    onPlayerStateChange(event) {
        // Clear existing interval if any
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        // When video is playing
        if (event.data == YT.PlayerState.PLAYING) {
            this.checkInterval = setInterval(() => {
                const currentTime = this.player.getCurrentTime();
                if (currentTime >= this.endTime) {
                    this.currentLoopCount++;
                    if (this.currentLoopCount >= this.maxLoops) {
                        this.player.pauseVideo();
                        clearInterval(this.checkInterval);
                    } else {
                        this.player.seekTo(this.startTime);
                    }
                }
            }, 1000);
        }
    }

    extractVideoId(url) {
        // Handle empty or invalid URLs
        if (!url) return false;

        // Try different URL patterns
        let match;
        
        // Pattern 1: Standard YouTube URLs (watch?v=)
        const standardPattern = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        match = url.match(standardPattern);
        if (match && match[7].length == 11) return match[7];
        
        // Pattern 2: Short URLs (youtu.be/) and mobile app URLs
        const shortPattern = /^.*(youtu\.be\/|youtube\.com\/shorts\/)([^#&?]*).*/;
        match = url.match(shortPattern);
        if (match && match[2].length == 11) return match[2];
        
        return false;
    }

    convertTimeToSeconds(timeStr) {
        if (!timeStr) return 0;
        
        const parts = timeStr.split(':').map(part => parseInt(part) || 0);
        
        if (parts.length === 2) {
            // mm:ss format
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            // hh:mm:ss format
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        
        return 0;
    }

    secondsToTimeStr(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(remainingSeconds)}`;
        }
        return `${this.padZero(minutes)}:${this.padZero(remainingSeconds)}`;
    }

    padZero(num) {
        return num.toString().padStart(2, '0');
    }

    getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');
        const directUrl = urlParams.get('url');
        const start = urlParams.get('start');
        const end = urlParams.get('end');
        const loop = urlParams.get('loop');

        if (videoId) {
            document.getElementById('videoUrl').value = 'https://youtube.com/watch?v=' + videoId;
        } else if (directUrl) {
            document.getElementById('videoUrl').value = decodeURIComponent(directUrl);
        }

        if (videoId || directUrl) {
            document.getElementById('startTime').value = this.secondsToTimeStr(parseInt(start) || 0);
            document.getElementById('endTime').value = this.secondsToTimeStr(parseInt(end) || 0);
            document.getElementById('loopCount').value = parseInt(loop) || 10;
            this.loadVideo();
        }
    }

    generateShareableUrl() {
        const videoUrl = document.getElementById('videoUrl').value;
        const start = this.convertTimeToSeconds(document.getElementById('startTime').value);
        const end = this.convertTimeToSeconds(document.getElementById('endTime').value);
        const loop = document.getElementById('loopCount').value;

        const baseUrl = window.location.origin + window.location.pathname;
        
        if (videoUrl.match(/\.(mp3|wav|ogg)$/i) || videoUrl.includes('mp3')) {
            // For audio files, use the full URL
            const shareableUrl = `${baseUrl}?url=${encodeURIComponent(videoUrl)}&start=${start}&end=${end}&loop=${loop}`;
            document.getElementById('shareableUrl').value = shareableUrl;
        } else {
            // For YouTube videos, use video ID
            const videoId = this.extractVideoId(videoUrl);
            const shareableUrl = `${baseUrl}?v=${videoId}&start=${start}&end=${end}&loop=${loop}`;
            document.getElementById('shareableUrl').value = shareableUrl;
        }
        
        document.getElementById('shareUrl').style.display = 'block';
    }

    copyShareableUrl() {
        const shareableUrl = document.getElementById('shareableUrl');
        shareableUrl.select();
        document.execCommand('copy');
    }

    setupAudioPlayer(url) {
        // Clear any existing players
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }

        // Create audio player
        this.audioPlayer = new Audio(url);
        
        // Create a visible audio element for better control
        const playerDiv = document.getElementById('player');
        playerDiv.innerHTML = `
            <audio controls style="width: 100%;">
                <source src="${url}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
        `;
        this.audioPlayer = playerDiv.querySelector('audio');
        
        this.audioPlayer.addEventListener('timeupdate', () => this.checkAudioTime());
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            // If no end time specified, use audio duration
            if (!this.endTime) {
                this.endTime = this.audioPlayer.duration;
            }
            this.audioPlayer.currentTime = this.startTime;
            this.audioPlayer.play();
        });

        // Handle errors
        this.audioPlayer.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
            alert('Error loading audio file. Please check the URL and try again.');
        });
    }

    checkAudioTime() {
        if (!this.audioPlayer) return;

        if (this.audioPlayer.currentTime >= this.endTime) {
            if (this.maxLoops && this.currentLoopCount >= this.maxLoops) {
                this.audioPlayer.pause();
                return;
            }
            this.currentLoopCount++;
            this.audioPlayer.currentTime = this.startTime;
        }
    }

    resetAll() {
        // Reset all form inputs
        document.getElementById('videoUrl').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('endTime').value = '';
        document.getElementById('loopCount').value = '10';
        
        // Hide the share URL section if it's visible
        document.getElementById('shareUrl').style.display = 'none';
        
        // Clear the shareable URL input if it exists
        const shareableUrl = document.getElementById('shareableUrl');
        if (shareableUrl) {
            shareableUrl.value = '';
        }
        
        // If there's a YouTube player instance, stop it and clear the player div
        if (this.player) {
            this.player.stopVideo();
            this.player.destroy();
            this.player = null;
        }
        document.getElementById('player').innerHTML = '';

        // Reset the URL without refreshing the page
        window.history.pushState({}, '', window.location.pathname);

        // Add audio player cleanup
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
    }
}

// Initialize the app
const mediaLooper = new MediaLooper(); 