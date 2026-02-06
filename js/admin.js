// ============================================
// SYNDL.COM - Admin Dashboard Controller
// ============================================

(function () {
    'use strict';

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        // Login
        loginScreen: document.getElementById('loginScreen'),
        loginForm: document.getElementById('loginForm'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        loginError: document.getElementById('loginError'),

        // Dashboard
        adminDashboard: document.getElementById('adminDashboard'),
        logoutBtn: document.getElementById('logoutBtn'),
        currentDate: document.getElementById('currentDate'),

        // Stats
        totalMovies: document.getElementById('totalMovies'),
        featuredCount: document.getElementById('featuredCount'),
        newCount: document.getElementById('newCount'),
        genreCount: document.getElementById('genreCount'),

        // Navigation
        navItems: document.querySelectorAll('.nav-item'),
        sections: document.querySelectorAll('.admin-section'),

        // Movies tables
        recentMoviesBody: document.getElementById('recentMoviesBody'),
        allMoviesBody: document.getElementById('allMoviesBody'),
        movieSearch: document.getElementById('movieSearch'),
        genreFilter: document.getElementById('genreFilter'),
        addMovieFromList: document.getElementById('addMovieFromList'),

        // Movie form
        movieForm: document.getElementById('movieForm'),
        formTitle: document.getElementById('formTitle'),
        editMovieId: document.getElementById('editMovieId'),
        movieTitle: document.getElementById('movieTitle'),
        movieYear: document.getElementById('movieYear'),
        movieDuration: document.getElementById('movieDuration'),
        movieDurationSec: document.getElementById('movieDurationSec'),
        movieRating: document.getElementById('movieRating'),
        movieQuality: document.getElementById('movieQuality'),
        movieGenre: document.getElementById('movieGenre'),
        movieSynopsis: document.getElementById('movieSynopsis'),
        thumbnailUrl: document.getElementById('thumbnailUrl'),
        previewUrl: document.getElementById('previewUrl'),
        fullMovieUrl: document.getElementById('fullMovieUrl'),
        lockerUrl: document.getElementById('lockerUrl'),
        castInputs: document.getElementById('castInputs'),
        addCastBtn: document.getElementById('addCastBtn'),
        isFeatured: document.getElementById('isFeatured'),
        isNew: document.getElementById('isNew'),
        cancelBtn: document.getElementById('cancelBtn'),

        // Settings
        passwordForm: document.getElementById('passwordForm'),
        newPassword: document.getElementById('newPassword'),
        confirmPassword: document.getElementById('confirmPassword'),
        exportBtn: document.getElementById('exportBtn'),
        resetBtn: document.getElementById('resetBtn'),

        // Modal
        deleteModal: document.getElementById('deleteModal'),
        deleteMovieName: document.getElementById('deleteMovieName'),
        cancelDelete: document.getElementById('cancelDelete'),
        confirmDelete: document.getElementById('confirmDelete'),

        // Toast
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toastMessage')
    };

    // Current movie being deleted
    let deleteMovieId = null;

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Initialize database
        MoviesDB.init();
        AdminAuth.init();

        // Check login status
        if (AdminAuth.isLoggedIn()) {
            showDashboard();
        }

        // Setup event listeners
        setupEventListeners();

        // Update date
        updateDate();
    }

    function updateDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        elements.currentDate.textContent = now.toLocaleDateString('en-US', options);
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    function setupEventListeners() {
        // Login form
        elements.loginForm.addEventListener('submit', handleLogin);

        // Logout
        elements.logoutBtn.addEventListener('click', handleLogout);

        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => navigateToSection(item.dataset.section));
        });

        // Add movie from list
        elements.addMovieFromList?.addEventListener('click', () => {
            navigateToSection('add-movie');
            resetMovieForm();
        });

        // Movie search
        elements.movieSearch?.addEventListener('input', filterMovies);

        // Genre filter
        elements.genreFilter?.addEventListener('change', filterMovies);

        // Movie form
        elements.movieForm.addEventListener('submit', handleMovieSubmit);
        elements.cancelBtn.addEventListener('click', () => {
            navigateToSection('movies');
            resetMovieForm();
        });

        // Cast inputs
        elements.addCastBtn.addEventListener('click', addCastInput);
        elements.castInputs.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-cast')) {
                e.target.closest('.cast-input-row').remove();
            }
        });

        // Settings
        elements.passwordForm?.addEventListener('submit', handlePasswordChange);
        elements.exportBtn?.addEventListener('click', handleExport);
        elements.resetBtn?.addEventListener('click', handleReset);

        // Delete modal
        elements.cancelDelete?.addEventListener('click', () => {
            elements.deleteModal.classList.add('hidden');
            deleteMovieId = null;
        });

        elements.confirmDelete?.addEventListener('click', confirmDeleteMovie);
    }

    // ============================================
    // LOGIN / LOGOUT
    // ============================================
    function handleLogin(e) {
        e.preventDefault();

        const username = elements.username.value.trim();
        const password = elements.password.value;

        if (AdminAuth.login(username, password)) {
            elements.loginError.classList.add('hidden');
            showDashboard();
        } else {
            elements.loginError.classList.remove('hidden');
            elements.password.value = '';
        }
    }

    function handleLogout() {
        AdminAuth.logout();
        elements.adminDashboard.classList.add('hidden');
        elements.loginScreen.classList.remove('hidden');
        elements.username.value = '';
        elements.password.value = '';
    }

    function showDashboard() {
        elements.loginScreen.classList.add('hidden');
        elements.adminDashboard.classList.remove('hidden');

        // Load dashboard data
        loadStats();
        loadRecentMovies();
        loadAllMovies();
        loadGenreFilter();
    }

    // ============================================
    // NAVIGATION
    // ============================================
    function navigateToSection(sectionId) {
        // Update nav items
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

        // Show/hide sections
        elements.sections.forEach(section => {
            section.classList.toggle('hidden', section.id !== `section-${sectionId}`);
        });

        // Reload data for specific sections
        if (sectionId === 'dashboard') {
            loadStats();
            loadRecentMovies();
        } else if (sectionId === 'movies') {
            loadAllMovies();
        }
    }

    // ============================================
    // STATS
    // ============================================
    function loadStats() {
        const movies = MoviesDB.getAll();

        elements.totalMovies.textContent = movies.length;
        elements.featuredCount.textContent = MoviesDB.getFeatured().length;
        elements.newCount.textContent = MoviesDB.getNew().length;
        elements.genreCount.textContent = MoviesDB.getAllGenres().length;
    }

    // ============================================
    // MOVIES TABLE
    // ============================================
    function loadRecentMovies() {
        const movies = MoviesDB.getAll().slice(0, 5);
        renderMoviesTable(movies, elements.recentMoviesBody, false);
    }

    function loadAllMovies() {
        const movies = MoviesDB.getAll();
        renderMoviesTable(movies, elements.allMoviesBody, true);
    }

    function renderMoviesTable(movies, container, showAll = false) {
        if (!container) return;

        container.innerHTML = movies.map(movie => `
            <tr>
                <td>
                    <div class="movie-cell">
                        <img src="${movie.thumbnail}" alt="${movie.title}" class="movie-thumb" onerror="this.src='../assets/thumbnails/placeholder.jpg'">
                        <span>${movie.title}</span>
                    </div>
                </td>
                <td>${movie.year}</td>
                ${showAll ? `<td>${movie.duration}</td>` : ''}
                <td>⭐ ${movie.rating}</td>
                ${showAll ? `<td>${movie.genre.slice(0, 2).join(', ')}</td>` : ''}
                <td>
                    ${movie.featured ? '<span class="status-badge featured">Featured</span>' : ''}
                    ${movie.isNew ? '<span class="status-badge new">New</span>' : ''}
                    ${!movie.featured && !movie.isNew ? '<span class="status-badge active">Active</span>' : ''}
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editMovie('${movie.id}')" title="Edit">✏️</button>
                        <button class="action-btn view" onclick="viewMovie('${movie.id}')" title="View">👁️</button>
                        <button class="action-btn delete" onclick="deleteMovie('${movie.id}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function loadGenreFilter() {
        const genres = MoviesDB.getAllGenres();
        if (elements.genreFilter) {
            elements.genreFilter.innerHTML = `
                <option value="">All Genres</option>
                ${genres.map(g => `<option value="${g}">${g}</option>`).join('')}
            `;
        }
    }

    function filterMovies() {
        const searchQuery = elements.movieSearch?.value.toLowerCase() || '';
        const genreValue = elements.genreFilter?.value || '';

        let movies = MoviesDB.getAll();

        if (searchQuery) {
            movies = movies.filter(m =>
                m.title.toLowerCase().includes(searchQuery)
            );
        }

        if (genreValue) {
            movies = movies.filter(m =>
                m.genre.some(g => g.toLowerCase() === genreValue.toLowerCase())
            );
        }

        renderMoviesTable(movies, elements.allMoviesBody, true);
    }

    // ============================================
    // MOVIE FORM
    // ============================================
    function handleMovieSubmit(e) {
        e.preventDefault();

        // Gather cast data
        const castRows = elements.castInputs.querySelectorAll('.cast-input-row');
        const cast = [];
        castRows.forEach(row => {
            const name = row.querySelector('.cast-name').value.trim();
            const role = row.querySelector('.cast-role').value.trim();
            if (name) {
                cast.push({ name, role });
            }
        });

        // Build movie object
        const movieData = {
            title: elements.movieTitle.value.trim(),
            year: parseInt(elements.movieYear.value),
            duration: elements.movieDuration.value.trim(),
            durationSeconds: parseInt(elements.movieDurationSec.value),
            rating: parseFloat(elements.movieRating.value) || 8.0,
            quality: elements.movieQuality.value,
            genre: elements.movieGenre.value.split(',').map(g => g.trim()).filter(g => g),
            synopsis: elements.movieSynopsis.value.trim(),
            thumbnail: elements.thumbnailUrl.value.trim(),
            previewUrl: elements.previewUrl.value.trim(),
            fullMovieUrl: elements.fullMovieUrl.value.trim(),
            lockerUrl: elements.lockerUrl.value.trim(),
            cast: cast,
            featured: elements.isFeatured.checked,
            isNew: elements.isNew.checked
        };

        const editId = elements.editMovieId.value;

        if (editId) {
            // Update existing movie
            MoviesDB.update(editId, movieData);
            showToast('Movie updated successfully!');
        } else {
            // Add new movie
            MoviesDB.add(movieData);
            showToast('Movie added successfully!');
        }

        // Navigate back to movies list
        navigateToSection('movies');
        resetMovieForm();
    }

    function resetMovieForm() {
        elements.movieForm.reset();
        elements.editMovieId.value = '';
        elements.formTitle.textContent = '➕ Add New Movie';
        elements.isNew.checked = true;

        // Reset cast inputs
        elements.castInputs.innerHTML = `
            <div class="cast-input-row">
                <input type="text" placeholder="Actor name" class="cast-name">
                <input type="text" placeholder="Role" class="cast-role">
                <button type="button" class="btn btn-ghost remove-cast">✕</button>
            </div>
        `;
    }

    function addCastInput() {
        const row = document.createElement('div');
        row.className = 'cast-input-row';
        row.innerHTML = `
            <input type="text" placeholder="Actor name" class="cast-name">
            <input type="text" placeholder="Role" class="cast-role">
            <button type="button" class="btn btn-ghost remove-cast">✕</button>
        `;
        elements.castInputs.appendChild(row);
    }

    // Global function to edit movie
    window.editMovie = function (id) {
        const movie = MoviesDB.getById(id);
        if (!movie) return;

        // Navigate to form
        navigateToSection('add-movie');

        // Fill form
        elements.formTitle.textContent = '✏️ Edit Movie';
        elements.editMovieId.value = movie.id;
        elements.movieTitle.value = movie.title;
        elements.movieYear.value = movie.year;
        elements.movieDuration.value = movie.duration;
        elements.movieDurationSec.value = movie.durationSeconds;
        elements.movieRating.value = movie.rating;
        elements.movieQuality.value = movie.quality;
        elements.movieGenre.value = movie.genre.join(', ');
        elements.movieSynopsis.value = movie.synopsis;
        elements.thumbnailUrl.value = movie.thumbnail;
        elements.previewUrl.value = movie.previewUrl;
        elements.fullMovieUrl.value = movie.fullMovieUrl;
        elements.lockerUrl.value = movie.lockerUrl;
        elements.isFeatured.checked = movie.featured;
        elements.isNew.checked = movie.isNew;

        // Fill cast
        elements.castInputs.innerHTML = '';
        if (movie.cast && movie.cast.length > 0) {
            movie.cast.forEach(person => {
                const row = document.createElement('div');
                row.className = 'cast-input-row';
                row.innerHTML = `
                    <input type="text" placeholder="Actor name" class="cast-name" value="${person.name}">
                    <input type="text" placeholder="Role" class="cast-role" value="${person.role}">
                    <button type="button" class="btn btn-ghost remove-cast">✕</button>
                `;
                elements.castInputs.appendChild(row);
            });
        } else {
            addCastInput();
        }
    };

    // Global function to view movie
    window.viewMovie = function (id) {
        window.open(`../movie.html?id=${id}`, '_blank');
    };

    // Global function to delete movie
    window.deleteMovie = function (id) {
        const movie = MoviesDB.getById(id);
        if (!movie) return;

        deleteMovieId = id;
        elements.deleteMovieName.textContent = movie.title;
        elements.deleteModal.classList.remove('hidden');
    };

    function confirmDeleteMovie() {
        if (deleteMovieId) {
            MoviesDB.delete(deleteMovieId);
            showToast('Movie deleted successfully!');
            loadStats();
            loadRecentMovies();
            loadAllMovies();
        }

        elements.deleteModal.classList.add('hidden');
        deleteMovieId = null;
    }

    // ============================================
    // SETTINGS
    // ============================================
    function handlePasswordChange(e) {
        e.preventDefault();

        const newPass = elements.newPassword.value;
        const confirmPass = elements.confirmPassword.value;

        if (newPass !== confirmPass) {
            showToast('Passwords do not match!', true);
            return;
        }

        if (newPass.length < 6) {
            showToast('Password must be at least 6 characters!', true);
            return;
        }

        AdminAuth.changePassword(newPass);
        showToast('Password changed successfully!');
        elements.passwordForm.reset();
    }

    function handleExport() {
        const movies = MoviesDB.getAll();
        const dataStr = JSON.stringify(movies, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `syndl_movies_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        showToast('Movies exported successfully!');
    }

    function handleReset() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone!')) {
            localStorage.removeItem('syndl_movies');
            MoviesDB.init();
            loadStats();
            loadRecentMovies();
            loadAllMovies();
            showToast('Data reset to default!');
        }
    }

    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    function showToast(message, isError = false) {
        const icon = elements.toast.querySelector('.toast-icon');
        icon.textContent = isError ? '❌' : '✅';
        elements.toast.style.borderColor = isError ? 'var(--primary)' : 'var(--accent-alt)';
        elements.toastMessage.textContent = message;
        elements.toast.classList.remove('hidden');

        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 3000);
    }

    // ============================================
    // START
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
