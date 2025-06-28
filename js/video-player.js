// YouTube 비디오 플레이어 JavaScript
class VideoPlayer {
    constructor() {
        this.player = null;
        this.isPlayerReady = false;
        this.currentTime = 0;
        this.duration = 0;
        this.playbackRate = 1.0;
        this.subtitlesEnabled = false;
        this.progress = 0;
        this.videoId = null;
        this.notes = '';
        
        this.init();
    }
    
    // 플레이어 초기화
    init() {
        this.setupEventListeners();
        this.loadUserPreferences();
    }
    
    // YouTube 플레이어 로드
    loadPlayer(youtubeUrl) {
        try {
            this.videoId = this.extractVideoId(youtubeUrl);
            
            if (!this.videoId) {
                throw new Error('유효하지 않은 YouTube URL입니다.');
            }
            
            // YouTube IFrame API 로드
            if (!window.YT) {
                this.loadYouTubeAPI();
            } else {
                this.createPlayer();
            }
            
        } catch (error) {
            console.error('플레이어 로드 오류:', error);
            this.showError('동영상을 불러올 수 없습니다.');
        }
    }
    
    // YouTube API 로드
    loadYouTubeAPI() {
        // YouTube API가 로드되면 onYouTubeIframeAPIReady 콜백 호출
        window.onYouTubeIframeAPIReady = () => {
            this.createPlayer();
        };
        
        // API 스크립트가 이미 로드되어 있는지 확인
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }
    
    // YouTube 플레이어 생성
    createPlayer() {
        const playerContainer = document.getElementById('youtube-player');
        if (!playerContainer) {
            console.error('플레이어 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        this.player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: this.videoId,
            playerVars: {
                autoplay: 0,
                controls: 0, // 기본 컨트롤 숨김
                rel: 0,
                showinfo: 0,
                modestbranding: 1,
                cc_load_policy: 1, // 자막 로드
                hl: 'ko',
                cc_lang_pref: 'ko'
            },
            events: {
                'onReady': (event) => this.onPlayerReady(event),
                'onStateChange': (event) => this.onPlayerStateChange(event),
                'onError': (event) => this.onPlayerError(event)
            }
        });
    }
    
    // 플레이어 준비 완료
    onPlayerReady(event) {
        this.isPlayerReady = true;
        this.duration = this.player.getDuration();
        this.updateDurationDisplay();
        this.loadSavedProgress();
        
        console.log('YouTube 플레이어가 준비되었습니다.');
        
        // 진행률 업데이트 시작
        this.startProgressUpdate();
    }
    
    // 플레이어 상태 변경
    onPlayerStateChange(event) {
        const state = event.data;
        
        switch (state) {
            case YT.PlayerState.PLAYING:
                this.onVideoPlay();
                break;
            case YT.PlayerState.PAUSED:
                this.onVideoPause();
                break;
            case YT.PlayerState.ENDED:
                this.onVideoEnd();
                break;
        }
    }
    
    // 플레이어 오류
    onPlayerError(event) {
        console.error('YouTube 플레이어 오류:', event.data);
        this.showError('동영상 재생 중 오류가 발생했습니다.');
    }
    
    // 비디오 재생 시작
    onVideoPlay() {
        console.log('동영상 재생 시작');
        this.saveWatchTime();
    }
    
    // 비디오 일시 정지
    onVideoPause() {
        console.log('동영상 일시 정지');
        this.saveProgress();
    }
    
    // 비디오 종료
    onVideoEnd() {
        console.log('동영상 재생 완료');
        this.progress = 100;
        this.saveProgress();
        this.markAsCompleted();
    }
    
    // YouTube 비디오 ID 추출
    extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    // 재생/일시정지 토글
    togglePlayPause() {
        if (!this.isPlayerReady) return;
        
        const state = this.player.getPlayerState();
        
        if (state === YT.PlayerState.PLAYING) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    }
    
    // 특정 시간으로 이동
    seekTo(seconds) {
        if (!this.isPlayerReady) return;
        
        this.player.seekTo(seconds, true);
    }
    
    // 재생 속도 변경
    changePlaybackRate(rate) {
        if (!this.isPlayerReady) return;
        
        this.playbackRate = rate;
        this.player.setPlaybackRate(rate);
        
        const speedControl = document.getElementById('speed-control');
        if (speedControl) {
            speedControl.innerHTML = `<i class="fas fa-tachometer-alt"></i> ${rate}x`;
        }
        
        this.saveUserPreferences();
    }
    
    // 자막 토글
    toggleSubtitles() {
        if (!this.isPlayerReady) return;
        
        try {
            const options = this.player.getOptions();
            if (options && options.includes('captions')) {
                const tracks = this.player.getOption('captions', 'tracklist');
                
                if (tracks && tracks.length > 0) {
                    if (this.subtitlesEnabled) {
                        this.player.unloadModule('captions');
                        this.subtitlesEnabled = false;
                    } else {
                        this.player.loadModule('captions');
                        this.subtitlesEnabled = true;
                        
                        // 한국어 자막 우선 선택
                        const koreanTrack = tracks.find(track => track.languageCode === 'ko');
                        if (koreanTrack) {
                            this.player.setOption('captions', 'track', koreanTrack);
                        }
                    }
                    
                    const subtitleBtn = document.getElementById('subtitle-toggle');
                    if (subtitleBtn) {
                        subtitleBtn.classList.toggle('active', this.subtitlesEnabled);
                    }
                }
            }
        } catch (error) {
            console.error('자막 토글 오류:', error);
            showToast('자막 기능을 사용할 수 없습니다.', 'warning');
        }
    }
    
    // 진행률 업데이트 시작
    startProgressUpdate() {
        setInterval(() => {
            if (this.isPlayerReady && this.player.getPlayerState() === YT.PlayerState.PLAYING) {
                this.updateProgress();
            }
        }, 1000);
    }
    
    // 진행률 업데이트
    updateProgress() {
        if (!this.isPlayerReady) return;
        
        this.currentTime = this.player.getCurrentTime();
        this.duration = this.player.getDuration();
        
        if (this.duration > 0) {
            this.progress = (this.currentTime / this.duration) * 100;
            
            // UI 업데이트
            this.updateProgressBar();
            this.updateTimeDisplay();
            
            // 주기적으로 진행률 저장
            if (Math.floor(this.currentTime) % 30 === 0) {
                this.saveProgress();
            }
        }
    }
    
    // 진행률 바 업데이트
    updateProgressBar() {
        const progressBar = document.getElementById('video-progress');
        if (progressBar) {
            progressBar.style.width = this.progress + '%';
            progressBar.setAttribute('aria-valuenow', Math.round(this.progress));
        }
        
        // 강의 전체 진행률 업데이트
        const courseProgress = document.getElementById('course-progress');
        if (courseProgress) {
            courseProgress.style.width = this.progress + '%';
        }
    }
    
    // 시간 표시 업데이트
    updateTimeDisplay() {
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');
        
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.currentTime);
        }
        
        if (durationEl) {
            durationEl.textContent = this.formatTime(this.duration);
        }
    }
    
    // 재생 시간 업데이트
    updateDurationDisplay() {
        const lectureEls = document.querySelectorAll('#lecture-duration');
        lectureEls.forEach(el => {
            el.textContent = this.formatTime(this.duration);
        });
    }
    
    // 시간 포맷팅
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    // 진행률 저장
    saveProgress() {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (productId) {
            const progressData = {
                currentTime: this.currentTime,
                duration: this.duration,
                progress: this.progress,
                lastWatched: new Date().toISOString()
            };
            
            localStorage.setItem(`video-progress-${productId}`, JSON.stringify(progressData));
        }
    }
    
    // 저장된 진행률 로드
    loadSavedProgress() {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (productId) {
            try {
                const saved = localStorage.getItem(`video-progress-${productId}`);
                if (saved) {
                    const progressData = JSON.parse(saved);
                    
                    if (progressData.currentTime > 30) { // 30초 이상 시청한 경우
                        const resume = confirm(
                            `${this.formatTime(progressData.currentTime)}부터 이어서 시청하시겠습니까?`
                        );
                        
                        if (resume) {
                            this.seekTo(progressData.currentTime);
                        }
                    }
                }
            } catch (error) {
                console.error('진행률 로드 오류:', error);
            }
        }
    }
    
    // 시청 시간 저장
    saveWatchTime() {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (productId) {
            const watchData = {
                startTime: new Date().toISOString(),
                videoId: this.videoId
            };
            
            localStorage.setItem(`watch-session-${productId}`, JSON.stringify(watchData));
        }
    }
    
    // 완료 상태 마크
    markAsCompleted() {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (productId) {
            const completionData = {
                completed: true,
                completedAt: new Date().toISOString(),
                totalWatchTime: this.duration
            };
            
            localStorage.setItem(`completion-${productId}`, JSON.stringify(completionData));
            
            // 사용자에게 완료 알림
            showToast('강의를 완주하셨습니다! 축하합니다!', 'success');
            
            // 완료 상태 UI 업데이트
            this.updateCompletionUI();
        }
    }
    
    // 완료 상태 UI 업데이트
    updateCompletionUI() {
        const courseProgress = document.getElementById('course-progress');
        if (courseProgress) {
            courseProgress.style.width = '100%';
            courseProgress.classList.add('bg-success');
        }
        
        const completedLessons = document.getElementById('completed-lessons');
        const totalLessons = document.getElementById('total-lessons');
        
        if (completedLessons && totalLessons) {
            completedLessons.textContent = totalLessons.textContent;
        }
    }
    
    // 노트 저장
    saveNotes() {
        const notesTextarea = document.getElementById('personal-notes');
        if (notesTextarea) {
            this.notes = notesTextarea.value;
            
            const productId = new URLSearchParams(window.location.search).get('id');
            if (productId) {
                const notesData = {
                    notes: this.notes,
                    timestamp: this.currentTime,
                    savedAt: new Date().toISOString()
                };
                
                localStorage.setItem(`notes-${productId}`, JSON.stringify(notesData));
                showToast('노트가 저장되었습니다.', 'success');
            }
        }
    }
    
    // 저장된 노트 로드
    loadSavedNotes() {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (productId) {
            try {
                const saved = localStorage.getItem(`notes-${productId}`);
                if (saved) {
                    const notesData = JSON.parse(saved);
                    this.notes = notesData.notes || '';
                    
                    const notesTextarea = document.getElementById('personal-notes');
                    if (notesTextarea) {
                        notesTextarea.value = this.notes;
                    }
                }
            } catch (error) {
                console.error('노트 로드 오류:', error);
            }
        }
    }
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 자막 토글
        document.getElementById('subtitle-toggle')?.addEventListener('click', () => {
            this.toggleSubtitles();
        });
        
        // 재생 속도 변경
        document.getElementById('speed-control')?.addEventListener('click', () => {
            const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
            const currentIndex = speeds.indexOf(this.playbackRate);
            const nextIndex = (currentIndex + 1) % speeds.length;
            this.changePlaybackRate(speeds[nextIndex]);
        });
        
        // 노트 저장
        document.getElementById('save-notes')?.addEventListener('click', () => {
            this.saveNotes();
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                case 'j':
                    e.preventDefault();
                    this.seekTo(Math.max(0, this.currentTime - 10));
                    break;
                case 'ArrowRight':
                case 'l':
                    e.preventDefault();
                    this.seekTo(Math.min(this.duration, this.currentTime + 10));
                    break;
                case 'Home':
                    e.preventDefault();
                    this.seekTo(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.seekTo(this.duration);
                    break;
                case 'c':
                    e.preventDefault();
                    this.toggleSubtitles();
                    break;
                case '>':
                    e.preventDefault();
                    this.changePlaybackRate(Math.min(2.0, this.playbackRate + 0.25));
                    break;
                case '<':
                    e.preventDefault();
                    this.changePlaybackRate(Math.max(0.5, this.playbackRate - 0.25));
                    break;
            }
        });
        
        // 진행률 바 클릭
        document.getElementById('video-progress')?.parentElement?.addEventListener('click', (e) => {
            const progressContainer = e.currentTarget;
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const targetTime = percentage * this.duration;
            
            this.seekTo(targetTime);
        });
    }
    
    // 사용자 설정 저장
    saveUserPreferences() {
        const preferences = {
            playbackRate: this.playbackRate,
            subtitlesEnabled: this.subtitlesEnabled
        };
        
        localStorage.setItem('video-player-preferences', JSON.stringify(preferences));
    }
    
    // 사용자 설정 로드
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('video-player-preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                this.playbackRate = preferences.playbackRate || 1.0;
                this.subtitlesEnabled = preferences.subtitlesEnabled || false;
            }
        } catch (error) {
            console.error('설정 로드 오류:', error);
        }
    }
    
    // 오류 표시
    showError(message) {
        const playerContainer = document.getElementById('youtube-player');
        if (playerContainer) {
            playerContainer.innerHTML = `
                <div class="d-flex align-items-center justify-content-center h-100 bg-light">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                        <h5>${message}</h5>
                        <p class="text-muted">잠시 후 다시 시도해 주세요.</p>
                    </div>
                </div>
            `;
        }
    }
}

// 전역 인스턴스
let videoPlayer;

// 비디오 플레이어 초기화
function initializeVideoPlayer(youtubeUrl) {
    videoPlayer = new VideoPlayer();
    
    if (youtubeUrl) {
        videoPlayer.loadPlayer(youtubeUrl);
    }
    
    return videoPlayer;
}

// YouTube API 준비 완료 콜백 (전역)
window.onYouTubeIframeAPIReady = function() {
    if (videoPlayer) {
        videoPlayer.createPlayer();
    }
};

// 전역 함수로 내보내기
window.VideoPlayer = VideoPlayer;
window.initializeVideoPlayer = initializeVideoPlayer;
