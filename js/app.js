// ============================================
// SYNDL.COM - Main Application
// ============================================

(function () {
    'use strict';

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        navbar: document.getElementById('navbar'),
        searchInput: document.getElementById('searchInput'),
        liveCount: document.getElementById('liveCount'),
        heroBg: document.getElementById('heroBg'),
        heroTitle: document.getElementById('heroTitle'),
        heroRating: document.getElementById('heroRating'),
        heroYear: document.getElementById('heroYear'),
        heroDuration: document.getElementById('heroDuration'),
        heroQuality: document.getElementById('heroQuality'),
        heroDescription: document.getElementById('heroDescription'),
        heroPlayBtn: document.getElementById('heroPlayBtn'),
        categoryTabs: document.getElementById('categoryTabs'),
        newReleasesGrid: document.getElementById('newReleasesGrid'),
        allMoviesGrid: document.getElementById('allMoviesGrid'),
        movieCount: document.getElementById('movieCount')
    };

    // ============================================
    // MOVIE CARD TEMPLATE
    // ============================================
    function createMovieCard(movie) {
        return `
            <article class="movie-card" data-id="${movie.id}" onclick="openMovie('${movie.id}')">
                <div class="movie-poster">
                    <img src="${movie.thumbnail}" alt="${movie.title}" loading="lazy" onerror="this.src='assets/thumbnails/placeholder.jpg'">
                    
                    <div class="movie-badges">
                        <span class="badge badge-quality">${movie.quality}</span>
                        ${movie.isNew ? '<span class="badge badge-new">NEW</span>' : ''}
                    </div>
                    
                    <div class="movie-poster-overlay">
                        <div class="play-btn-card">
                            <svg viewBox="0 0 24 24">
                                <polygon points="5,3 19,12 5,21"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span>⭐ ${movie.rating}</span>
                        <span>•</span>
                        <span>${movie.year}</span>
                        <span>•</span>
                        <span>${movie.duration}</span>
                    </div>
                    <div class="movie-genre">
                        ${movie.genre.slice(0, 2).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                </div>
            </article>
        `;
    }

    // ============================================
    // RENDER FUNCTIONS
    // ============================================
    function renderMovies(movies, container) {
        if (!container) return;
        container.innerHTML = movies.map(createMovieCard).join('');
    }

    function renderHero() {
        const featured = MoviesDB.getFeatured()[0] || MoviesDB.getAll()[0];
        if (!featured) return;

        elements.heroBg.src = featured.thumbnail;
        elements.heroBg.alt = featured.title;
        elements.heroTitle.textContent = featured.title;
        elements.heroRating.innerHTML = `⭐ ${featured.rating}`;
        elements.heroYear.textContent = featured.year;
        elements.heroDuration.textContent = featured.duration;
        elements.heroQuality.textContent = featured.quality;
        elements.heroDescription.textContent = featured.synopsis;
        elements.heroPlayBtn.href = `movie.html?id=${featured.id}`;
    }

    function renderNewReleases() {
        const newMovies = MoviesDB.getNew();
        renderMovies(newMovies, elements.newReleasesGrid);
    }

    function renderAllMovies(genre = 'all') {
        let movies = MoviesDB.getAll();

        if (genre !== 'all') {
            movies = MoviesDB.getByGenre(genre);
        }

        renderMovies(movies, elements.allMoviesGrid);
        elements.movieCount.textContent = `${movies.length} movies`;
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    // Navbar scroll effect
    function handleScroll() {
        if (window.scrollY > 50) {
            elements.navbar.classList.add('scrolled');
        } else {
            elements.navbar.classList.remove('scrolled');
        }
    }

    // Category tabs
    function handleCategoryClick(e) {
        if (!e.target.classList.contains('category-tab')) return;

        // Update active state
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        e.target.classList.add('active');

        // Filter movies
        const genre = e.target.dataset.genre;
        renderAllMovies(genre);
    }

    // Search
    function handleSearch(e) {
        const query = e.target.value.trim();

        if (query.length < 2) {
            renderAllMovies();
            return;
        }

        const results = MoviesDB.search(query);
        renderMovies(results, elements.allMoviesGrid);
        elements.movieCount.textContent = `${results.length} results`;
    }

    // Live viewers count animation
    function animateLiveCount() {
        const base = 12000;
        const variance = 1500;

        setInterval(() => {
            const count = base + Math.floor(Math.random() * variance);
            elements.liveCount.textContent = count.toLocaleString();
        }, 5000);
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Initialize database with callback for async Firebase loading
        MoviesDB.init(function () {
            // Render content after data is loaded
            renderHero();
            renderNewReleases();
            renderAllMovies();

            console.log('🎬 SYNDL Platform initialized with', MoviesDB.getAll().length, 'movies');
        });

        // Event listeners (can run immediately)
        window.addEventListener('scroll', handleScroll);
        elements.categoryTabs?.addEventListener('click', handleCategoryClick);
        elements.searchInput?.addEventListener('input', handleSearch);

        // Animations
        animateLiveCount();

        // Listen for real-time updates from Firebase
        window.addEventListener('moviesUpdated', function () {
            renderHero();
            renderNewReleases();
            renderAllMovies();
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================
    // GLOBAL FUNCTIONS
    // ============================================
    window.openMovie = function (movieId) {
        window.location.href = `movie.html?id=${movieId}`;
    };

})();
