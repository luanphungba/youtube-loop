class YouTubeLooper {
    constructor() {
        this.player = null;
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
        // Get input values
        const url = document.getElementById('videoUrl').value;
        this.startTime = this.convertTimeToSeconds(document.getElementById('startTime').value) || 0;
        this.endTime = this.convertTimeToSeconds(document.getElementById('endTime').value) || 0;
        this.maxLoops = parseInt(document.getElementById('loopCount').value) || 10;
        this.currentLoopCount = 0;

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
                        alert(`Finished ${this.maxLoops} loops!`);
                        clearInterval(this.checkInterval);
                    } else {
                        this.player.seekTo(this.startTime);
                    }
                }
            }, 1000);
        }
    }

    extractVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length == 11) ? match[7] : false;
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
        const start = urlParams.get('start');
        const end = urlParams.get('end');
        const loop = urlParams.get('loop');

        if (videoId) {
            document.getElementById('videoUrl').value = 'https://youtube.com/watch?v=' + videoId;
            document.getElementById('startTime').value = this.secondsToTimeStr(parseInt(start) || 0);
            document.getElementById('endTime').value = this.secondsToTimeStr(parseInt(end) || 0);
            document.getElementById('loopCount').value = parseInt(loop) || 10;
            this.loadVideo();
        }
    }

    generateShareableUrl() {
        const videoId = this.extractVideoId(document.getElementById('videoUrl').value);
        const start = this.convertTimeToSeconds(document.getElementById('startTime').value);
        const end = this.convertTimeToSeconds(document.getElementById('endTime').value);
        const loop = document.getElementById('loopCount').value;

        const baseUrl = window.location.origin + window.location.pathname;
        const shareableUrl = `${baseUrl}?v=${videoId}&start=${start}&end=${end}&loop=${loop}`;
        
        document.getElementById('shareableUrl').value = shareableUrl;
        document.getElementById('shareUrl').style.display = 'block';
    }

    copyShareableUrl() {
        const shareableUrl = document.getElementById('shareableUrl');
        shareableUrl.select();
        document.execCommand('copy');
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
    }
}

// Initialize the app
const youtubeLooper = new YouTubeLooper(); 