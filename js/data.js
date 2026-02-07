// ============================================
// SYNDL.COM - Movies Database (Firebase Version)
// ============================================

const MoviesDB = {
    // Movies Data Array (loaded from Firebase)
    movies: [],

    // Default movies (used when Firebase is empty)
    defaultMovies: [
        {
            id: "avatar-fire-and-ash",
            title: "Avatar: Fire and Ash",
            year: 2025,
            duration: "3h 17min",
            durationSeconds: 11820,
            rating: 8.9,
            genre: ["Action", "Sci-Fi", "Adventure"],
            synopsis: "Jake Sully and Neytiri have formed a family and are doing everything to stay together. However, they must leave their home and explore the regions of Pandora when an ancient threat resurfaces.",
            thumbnail: "assets/thumbnails/avatar.jpg",
            previewUrl: "https://dl.dropboxusercontent.com/scl/fi/8tmqk55d2fio12zd37gyi/start.mp4?rlkey=c0p9cxfbha3l2qkefqv4lxl6p",
            fullMovieUrl: "https://drive.google.com/file/d/1OmdI_pBnO-SB-8cyxJXGEsONLPYPTXtq/preview",
            lockerUrl: "https://appverification.site/cl/i/krr4k8",
            quality: "1080p",
            featured: true,
            isNew: true,
            cast: [
                { name: "Sam Worthington", role: "Jake Sully" },
                { name: "Zoe Saldana", role: "Neytiri" },
                { name: "Sigourney Weaver", role: "Kiri" },
                { name: "Stephen Lang", role: "Quaritch" }
            ],
            addedDate: "2025-01-15"
        },
        {
            id: "captain-america-brave-new-world",
            title: "Captain America: Brave New World",
            year: 2025,
            duration: "1h 52min",
            durationSeconds: 6742,
            rating: 8.4,
            genre: ["Action", "Superhero", "Thriller"],
            synopsis: "Sam Wilson, bearing the mantle of Captain America, finds himself in the middle of an international incident. He must discover the reason behind a nefarious global plot before the true mastermind has the entire world seeing red.",
            thumbnail: "assets/thumbnails/captain-america.jpg",
            previewUrl: "https://dl.dropboxusercontent.com/scl/fi/petdvzpto51w5a6ze50xl/start-captain-america.mp4?rlkey=092xizc8e9uhmcowt6q8yr7x9",
            fullMovieUrl: "https://drive.google.com/file/d/1Bf-EtSTH3-gzau5hbVa3pmBK8JXtTuLq/preview",
            lockerUrl: "https://appverification.site/cl/i/NEW_LOCKER_ID",
            quality: "1080p",
            featured: false,
            isNew: true,
            cast: [
                { name: "Anthony Mackie", role: "Sam Wilson" },
                { name: "Harrison Ford", role: "Thaddeus Ross" },
                { name: "Danny Ramirez", role: "Joaquín Torres" },
                { name: "Shira Haas", role: "Sabra" }
            ],
            addedDate: "2025-02-01"
        }
    ],

    // Firebase reference
    dbRef: null,

    // Get all movies
    getAll: function () {
        return this.movies;
    },

    // Get movie by ID
    getById: function (id) {
        return this.movies.find(movie => movie.id === id);
    },

    // Get featured movies
    getFeatured: function () {
        return this.movies.filter(movie => movie.featured);
    },

    // Get new movies
    getNew: function () {
        return this.movies.filter(movie => movie.isNew);
    },

    // Get movies by genre
    getByGenre: function (genre) {
        return this.movies.filter(movie =>
            movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        );
    },

    // Search movies
    search: function (query) {
        const q = query.toLowerCase();
        return this.movies.filter(movie =>
            movie.title.toLowerCase().includes(q) ||
            movie.genre.some(g => g.toLowerCase().includes(q))
        );
    },

    // Get all genres
    getAllGenres: function () {
        const genres = new Set();
        this.movies.forEach(movie => {
            movie.genre.forEach(g => genres.add(g));
        });
        return Array.from(genres).sort();
    },

    // Add new movie
    add: function (movie) {
        movie.id = this.generateId(movie.title);
        movie.addedDate = new Date().toISOString().split('T')[0];
        this.movies.unshift(movie);
        this.saveToFirebase();
        return movie;
    },

    // Update movie
    update: function (id, updates) {
        const index = this.movies.findIndex(m => m.id === id);
        if (index !== -1) {
            this.movies[index] = { ...this.movies[index], ...updates };
            this.saveToFirebase();
            return this.movies[index];
        }
        return null;
    },

    // Delete movie
    delete: function (id) {
        const index = this.movies.findIndex(m => m.id === id);
        if (index !== -1) {
            this.movies.splice(index, 1);
            this.saveToFirebase();
            return true;
        }
        return false;
    },

    // Generate ID from title
    generateId: function (title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    },

    // Save to Firebase
    saveToFirebase: function () {
        if (this.dbRef) {
            this.dbRef.set(this.movies)
                .then(() => console.log('✅ Data saved to Firebase'))
                .catch(err => console.error('❌ Firebase save error:', err));
        }
        // Also save to LocalStorage as backup
        localStorage.setItem('syndl_movies', JSON.stringify(this.movies));
    },

    // Load from Firebase
    loadFromFirebase: function (callback) {
        if (typeof firebase !== 'undefined' && firebase.database) {
            this.dbRef = firebase.database().ref('movies');

            this.dbRef.once('value')
                .then(snapshot => {
                    const data = snapshot.val();
                    if (data && Array.isArray(data) && data.length > 0) {
                        this.movies = data;
                        console.log('✅ Loaded', this.movies.length, 'movies from Firebase');
                    } else {
                        // First time - upload default movies to Firebase
                        console.log('📤 Uploading default movies to Firebase...');
                        this.movies = this.defaultMovies;
                        this.saveToFirebase();
                    }
                    if (callback) callback();
                })
                .catch(err => {
                    console.error('❌ Firebase load error:', err);
                    this.loadFromLocalStorage();
                    if (callback) callback();
                });

            // Set up real-time listener for updates
            this.dbRef.on('value', snapshot => {
                const data = snapshot.val();
                if (data && Array.isArray(data)) {
                    this.movies = data;
                    console.log('🔄 Real-time update received');
                    // Trigger custom event for UI updates
                    window.dispatchEvent(new CustomEvent('moviesUpdated'));
                }
            });
        } else {
            console.log('⚠️ Firebase not available, using LocalStorage');
            this.loadFromLocalStorage();
            if (callback) callback();
        }
    },

    // Load from LocalStorage (fallback)
    loadFromLocalStorage: function () {
        const saved = localStorage.getItem('syndl_movies');
        if (saved) {
            this.movies = JSON.parse(saved);
        } else {
            this.movies = this.defaultMovies;
        }
    },

    // Initialize
    init: function (callback) {
        this.loadFromFirebase(callback);
    }
};

// ============================================
// Admin Authentication
// ============================================
const AdminAuth = {
    // Default credentials (should be changed)
    credentials: {
        username: 'admin',
        password: 'syndl2025'
    },

    // Check if logged in
    isLoggedIn: function () {
        return sessionStorage.getItem('syndl_admin_logged') === 'true';
    },

    // Login
    login: function (username, password) {
        if (username === this.credentials.username && password === this.credentials.password) {
            sessionStorage.setItem('syndl_admin_logged', 'true');
            return true;
        }
        return false;
    },

    // Logout
    logout: function () {
        sessionStorage.removeItem('syndl_admin_logged');
    },

    // Change password
    changePassword: function (newPassword) {
        this.credentials.password = newPassword;
        localStorage.setItem('syndl_admin_password', newPassword);
    },

    // Load saved password
    init: function () {
        const savedPassword = localStorage.getItem('syndl_admin_password');
        if (savedPassword) {
            this.credentials.password = savedPassword;
        }
    }
};
