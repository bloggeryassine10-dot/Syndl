// ============================================
// SYNDL.COM - Video Player Controller
// ============================================

(function () {
    'use strict';

    // ============================================
    // GET MOVIE ID FROM URL
    // ============================================
    function getMovieId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // ============================================
    // LOAD MOVIE DATA
    // ============================================
    const movieId = getMovieId();
    const movie = MoviesDB.getById(movieId);

    if (!movie) {
        window.location.href = 'index.html';
        return;
    }

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        // Title elements
        movieTitle: document.getElementById('movieTitle'),
        movieMeta: document.getElementById('movieMeta'),
        qualityBadge: document.getElementById('qualityBadge'),
        nowPlayingTitle: document.getElementById('nowPlayingTitle'),

        // Player elements
        playerContainer: document.getElementById('playerContainer'),
        thumbnailOverlay: document.getElementById('thumbnailOverlay'),
        thumbnailImg: document.getElementById('thumbnailImg'),
        bigPlayBtn: document.getElementById('bigPlayBtn'),
        video: document.getElementById('video'),
        videoSource: document.getElementById('videoSource'),

        // Controls
        playerControls: document.getElementById('playerControls'),
        progressContainer: document.getElementById('progressContainer'),
        progressBar: document.getElementById('progressBar'),
        progressBuffered: document.getElementById('progressBuffered'),
        progressPlayed: document.getElementById('progressPlayed'),
        progressThumb: document.getElementById('progressThumb'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        skipBackBtn: document.getElementById('skipBackBtn'),
        skipForwardBtn: document.getElementById('skipForwardBtn'),
        volumeBtn: document.getElementById('volumeBtn'),
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        currentTime: document.getElementById('currentTime'),
        duration: document.getElementById('duration'),

        // Overlays
        loadingSpinner: document.getElementById('loadingSpinner'),
        lockOverlay: document.getElementById('lockOverlay'),
        unlockBtn: document.getElementById('unlockBtn'),
        waitingCount: document.getElementById('waitingCount'),
        fullMovieContainer: document.getElementById('fullMovieContainer'),

        // Info elements
        synopsisText: document.getElementById('synopsisText'),
        castGrid: document.getElementById('castGrid'),
        activityFeed: document.getElementById('activityFeed'),
        totalWatching: document.getElementById('totalWatching'),
        relatedMoviesGrid: document.getElementById('relatedMoviesGrid'),

        // OGAds overlays
        ogadsWaiting: document.getElementById('ogadsWaiting'),
        ogadsRetry: document.getElementById('ogadsRetry'),
        retryBtn: document.getElementById('retryBtn'),
        cancelRetryBtn: document.getElementById('cancelRetryBtn'),

        // Other
        liveCount: document.getElementById('liveCount')
    };

    // ============================================
    // STATE
    // ============================================
    const state = {
        isPlaying: false,
        isLocked: false,
        isUnlocked: false,
        previewEnded: false,
        previewDuration: 60, // Seconds of preview before lock
    };

    // ============================================
    // POPULATE PAGE DATA
    // ============================================
    function populatePage() {
        // Update page title
        document.title = `${movie.title} - SYNDL`;

        // Title bar
        elements.movieTitle.textContent = movie.title;
        elements.movieMeta.innerHTML = `
            <span>⭐ ${movie.rating}</span>
            <span>${movie.year}</span>
            <span>${movie.duration}</span>
        `;
        elements.qualityBadge.textContent = `HD ${movie.quality}`;
        elements.nowPlayingTitle.textContent = `${movie.title} (${movie.year})`;

        // Thumbnail
        elements.thumbnailImg.src = movie.thumbnail;
        elements.thumbnailImg.alt = movie.title;

        // Video source
        elements.videoSource.src = movie.previewUrl;
        elements.video.load();

        // Duration display (show full movie duration)
        elements.duration.textContent = formatTime(movie.durationSeconds);

        // Synopsis
        elements.synopsisText.textContent = movie.synopsis;

        // Cast
        if (movie.cast && movie.cast.length > 0) {
            elements.castGrid.innerHTML = movie.cast.map(person => `
                <div class="cast-chip">
                    <span class="actor-name">${person.name}</span>
                    <span class="role">${person.role}</span>
                </div>
            `).join('');
        }

        // Activity feed
        loadActivityFeed();

        // Related movies
        loadRelatedMovies();

        // Check if already unlocked
        checkUnlockStatus();
    }

    // ============================================
    // FORMAT TIME
    // ============================================
    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ============================================
    // CHECK UNLOCK STATUS
    // ============================================
    function checkUnlockStatus() {
        const unlockKey = `syndl_unlocked_${movie.id}`;
        const unlockData = localStorage.getItem(unlockKey);

        if (unlockData) {
            const data = JSON.parse(unlockData);
            const unlockTime = new Date(data.timestamp);
            const now = new Date();
            const hoursDiff = (now - unlockTime) / (1000 * 60 * 60);

            // Unlock valid for 24 hours
            if (hoursDiff < 24) {
                state.isUnlocked = true;
                showFullMovie();
            }
        }

        // Also check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('unlocked') === 'true') {
            unlockMovie();
        }
    }

    // ============================================
    // VIDEO EVENT HANDLERS
    // ============================================
    function setupVideoEvents() {
        const video = elements.video;

        // Time update
        video.addEventListener('timeupdate', function () {
            if (state.isUnlocked) return;

            const progress = (video.currentTime / movie.durationSeconds) * 100;
            elements.progressPlayed.style.width = `${progress}%`;
            elements.progressThumb.style.left = `${progress}%`;
            elements.currentTime.textContent = formatTime(video.currentTime);

            // Check if preview ended
            if (video.currentTime >= state.previewDuration && !state.previewEnded) {
                state.previewEnded = true;
                video.pause();
                showLockOverlay();
            }
        });

        // Buffered progress
        video.addEventListener('progress', function () {
            if (video.buffered.length > 0) {
                const buffered = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
                elements.progressBuffered.style.width = `${buffered}%`;
            }
        });

        // Loading
        video.addEventListener('waiting', function () {
            elements.loadingSpinner.classList.remove('hidden');
        });

        video.addEventListener('canplay', function () {
            elements.loadingSpinner.classList.add('hidden');
        });

        // Ended
        video.addEventListener('ended', function () {
            if (!state.isUnlocked) {
                showLockOverlay();
            }
        });
    }

    // ============================================
    // CONTROL HANDLERS
    // ============================================
    function setupControls() {
        // Big play button
        elements.bigPlayBtn.addEventListener('click', function () {
            elements.thumbnailOverlay.classList.add('hidden');
            elements.playerControls.classList.remove('hidden');
            elements.video.play();
            state.isPlaying = true;
            updatePlayPauseIcon();
        });

        // Play/Pause
        elements.playPauseBtn.addEventListener('click', togglePlayPause);

        // Skip buttons
        elements.skipBackBtn.addEventListener('click', function () {
            elements.video.currentTime = Math.max(0, elements.video.currentTime - 10);
        });

        elements.skipForwardBtn.addEventListener('click', function () {
            elements.video.currentTime = Math.min(elements.video.duration, elements.video.currentTime + 10);
        });

        // Progress bar seeking
        elements.progressContainer.addEventListener('click', function (e) {
            if (state.isUnlocked) return;

            const rect = elements.progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const seekTime = pos * state.previewDuration;

            if (seekTime <= state.previewDuration) {
                elements.video.currentTime = seekTime;
            }
        });

        // Volume
        elements.volumeBtn.addEventListener('click', function () {
            elements.video.muted = !elements.video.muted;
            elements.volumeBtn.classList.toggle('muted', elements.video.muted);
        });

        // Fullscreen
        elements.fullscreenBtn.addEventListener('click', toggleFullscreen);

        // Keyboard controls
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    elements.video.currentTime -= 10;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    elements.video.currentTime += 10;
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    elements.video.muted = !elements.video.muted;
                    break;
            }
        });
    }

    function togglePlayPause() {
        if (elements.video.paused) {
            elements.video.play();
            state.isPlaying = true;
        } else {
            elements.video.pause();
            state.isPlaying = false;
        }
        updatePlayPauseIcon();
    }

    function updatePlayPauseIcon() {
        const playIcon = elements.playPauseBtn.querySelector('.icon-play');
        const pauseIcon = elements.playPauseBtn.querySelector('.icon-pause');

        if (state.isPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            elements.playerContainer.requestFullscreen?.() ||
                elements.playerContainer.webkitRequestFullscreen?.() ||
                elements.playerContainer.msRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() ||
                document.webkitExitFullscreen?.() ||
                document.msExitFullscreen?.();
        }
    }

    // ============================================
    // LOCK OVERLAY
    // ============================================
    function showLockOverlay() {
        state.isLocked = true;
        elements.video.pause();
        elements.lockOverlay.classList.remove('hidden');

        // Animate waiting count
        animateWaitingCount();
    }

    function animateWaitingCount() {
        setInterval(() => {
            const count = 800 + Math.floor(Math.random() * 200);
            elements.waitingCount.textContent = count;
        }, 3000);
    }

    // ============================================
    // OGADS INTEGRATION
    // ============================================
    function setupOGAds() {
        elements.unlockBtn.addEventListener('click', function () {
            // Hide lock overlay
            elements.lockOverlay.classList.add('hidden');

            // Show waiting overlay
            elements.ogadsWaiting.classList.remove('hidden');

            // Open OGAds locker in new tab
            window.open(movie.lockerUrl, '_blank');

            // Start checking for unlock
            startUnlockCheck();
        });

        // Retry button
        elements.retryBtn?.addEventListener('click', function () {
            elements.ogadsRetry.classList.add('hidden');
            elements.ogadsWaiting.classList.remove('hidden');
            window.open(movie.lockerUrl, '_blank');
            startUnlockCheck();
        });

        // Cancel retry
        elements.cancelRetryBtn?.addEventListener('click', function () {
            elements.ogadsRetry.classList.add('hidden');
            showLockOverlay();
        });
    }

    function startUnlockCheck() {
        let checkCount = 0;
        const maxChecks = 60; // 1 minute of checking

        const checkInterval = setInterval(() => {
            checkCount++;

            // Check if URL has unlocked parameter
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('unlocked') === 'true') {
                clearInterval(checkInterval);
                unlockMovie();
                return;
            }

            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                elements.ogadsWaiting.classList.add('hidden');
                elements.ogadsRetry.classList.remove('hidden');
            }
        }, 1000);
    }

    function unlockMovie() {
        state.isUnlocked = true;

        // Hide all overlays
        elements.ogadsWaiting.classList.add('hidden');
        elements.ogadsRetry.classList.add('hidden');
        elements.lockOverlay.classList.add('hidden');
        elements.playerControls.classList.add('hidden');
        elements.thumbnailOverlay.classList.add('hidden');

        // Save unlock status
        const unlockKey = `syndl_unlocked_${movie.id}`;
        localStorage.setItem(unlockKey, JSON.stringify({
            timestamp: new Date().toISOString(),
            movieId: movie.id
        }));

        // Show full movie
        showFullMovie();
    }

    function showFullMovie() {
        elements.fullMovieContainer.classList.remove('hidden');
        elements.fullMovieContainer.innerHTML = `
            <iframe 
                src="${movie.fullMovieUrl}" 
                allowfullscreen 
                allow="autoplay; encrypted-media"
                loading="lazy">
            </iframe>
        `;

        // Hide video elements
        elements.video.style.display = 'none';
        elements.thumbnailOverlay.classList.add('hidden');
        elements.playerControls.classList.add('hidden');
    }

    // ============================================
    // ACTIVITY FEED
    // ============================================
    function loadActivityFeed() {
        const activities = [
            { icon: '🎬', text: 'Someone from New York started watching', time: 'just now', isNew: true },
            { icon: '✅', text: 'User from California unlocked the movie', time: '2 min ago', isNew: false },
            { icon: '🎬', text: 'Someone from Texas started watching', time: '5 min ago', isNew: false },
            { icon: '✅', text: 'User from Florida just verified', time: '7 min ago', isNew: false }
        ];

        elements.activityFeed.innerHTML = activities.map(a => `
            <div class="activity-item ${a.isNew ? 'new' : ''}">
                <span class="activity-icon">${a.icon}</span>
                <span class="activity-text">${a.text}</span>
                <span class="activity-time">${a.time}</span>
            </div>
        `).join('');
    }

    // ============================================
    // RELATED MOVIES
    // ============================================
    function loadRelatedMovies() {
        const related = MoviesDB.getAll().filter(m => m.id !== movie.id).slice(0, 5);

        if (elements.relatedMoviesGrid && related.length > 0) {
            elements.relatedMoviesGrid.innerHTML = related.map(m => `
                <article class="movie-card" onclick="window.location='movie.html?id=${m.id}'">
                    <div class="movie-poster">
                        <img src="${m.thumbnail}" alt="${m.title}" loading="lazy" onerror="this.src='assets/thumbnails/placeholder.jpg'">
                        <div class="movie-badges">
                            <span class="badge badge-quality">${m.quality}</span>
                        </div>
                        <div class="movie-poster-overlay">
                            <div class="play-btn-card">
                                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                            </div>
                        </div>
                    </div>
                    <div class="movie-info">
                        <h3 class="movie-title">${m.title}</h3>
                        <div class="movie-meta">
                            <span>⭐ ${m.rating}</span>
                            <span>•</span>
                            <span>${m.year}</span>
                        </div>
                    </div>
                </article>
            `).join('');
        }
    }

    // ============================================
    // LIVE VIEWERS ANIMATION
    // ============================================
    function animateLiveViewers() {
        const base = 12000;
        const variance = 1500;

        setInterval(() => {
            const count = base + Math.floor(Math.random() * variance);
            if (elements.liveCount) {
                elements.liveCount.textContent = count.toLocaleString();
            }
            if (elements.totalWatching) {
                elements.totalWatching.textContent = count.toLocaleString();
            }
        }, 5000);
    }

    // ============================================
    // INITIALIZE
    // ============================================
    function init() {
        populatePage();
        setupVideoEvents();
        setupControls();
        setupOGAds();
        animateLiveViewers();

        console.log(`🎬 Playing: ${movie.title}`);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
