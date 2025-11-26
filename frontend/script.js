const API_URL_MOVIES = '/movies';
const API_URL_RESTAURANTS = '/restaurants';

// Available genres for selection
const AVAILABLE_GENRES = ["Action", "Adventure", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Krimi", "Sci-Fi", "Thriller"];

let movies = [];
let restaurants = [];
let currentAppMode = 'vault'; // 'vault' or 'restaurants'
let currentFilter = 'all';
let currentSeenFilter = 'all';
let currentSort = 'default';
let currentSearchTerm = '';
window.currentSearchTerm = currentSearchTerm; // Debug expose

// Restaurant Filters
let currentCityFilter = '';
let currentPriceFilter = 'all';
let currentVisitedFilter = 'all';

const gallery = document.getElementById('movie-gallery');
const addMovieBtn = document.getElementById('add-movie-button');
const genreFilterContainer = document.getElementById('genre-filter');
const seenFilter = document.getElementById('seen-filter');
const sortFilter = document.getElementById('sort-filter');
const searchFilter = document.getElementById('search-filter');

// New Filter Elements
const vaultFilters = document.getElementById('vault-filters');
const restaurantFilters = document.getElementById('restaurant-filters');
const cityFilter = document.getElementById('city-filter');
const priceFilter = document.getElementById('price-filter');
const visitedFilter = document.getElementById('visited-filter');
const vaultCategoryNav = document.getElementById('vault-category-nav');

// App Mode Elements
const appTitle = document.getElementById('app-title');
const modeDropdown = document.getElementById('mode-dropdown');
const modeOptions = document.querySelectorAll('.mode-option');

// Modal Elements
const modal = document.getElementById('movie-modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalCreated = document.getElementById('modal-created');
const modalGenres = document.getElementById('modal-genres');
const modalImageUrl = document.getElementById('modal-image-url');
const modalType = document.getElementById('modal-type');
const modalYear = document.getElementById('modal-year');
const modalRatingDavid = document.getElementById('modal-rating-david');
const modalRatingLena = document.getElementById('modal-rating-lena');
const modalTotalRating = document.getElementById('modal-total-rating');
const modalStarRating = document.getElementById('modal-star-rating');
const modalSeen = document.getElementById('modal-seen');
// Restaurant Modal Elements
const modalCity = document.getElementById('modal-city');
const modalCuisine = document.getElementById('modal-cuisine');
const modalPrice = document.getElementById('modal-price');
const modalVisited = document.getElementById('modal-visited');
const vaultFields = document.querySelectorAll('.vault-field');
const restaurantFields = document.querySelectorAll('.restaurant-field');
const closeModalBtn = document.getElementById('close-modal');
const saveModalBtn = document.getElementById('save-modal');
const deleteModalBtn = document.getElementById('delete-modal');

let currentEditingId = null;
let currentCategory = 'Film'; // Default category
let currentImagePosition = 'center';
let isDragging = false;
let startX, startY;
let initialPosX = 50, initialPosY = 50;

// Navigation Logic
const navBtns = document.querySelectorAll('.nav-btn');
const navSlider = document.querySelector('.nav-slider');

function updateNavSlider() {
    const activeBtn = document.querySelector('.nav-btn.active');
    if (activeBtn) {
        navSlider.style.width = `${activeBtn.offsetWidth}px`;
        navSlider.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    }
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        updateNavSlider();

        // Reset genre filter when switching category
        setFilter('all');
        renderGenres(); // Re-render genres based on new category
    });
});

// Initial slider position
window.addEventListener('load', updateNavSlider);
window.addEventListener('resize', updateNavSlider);

async function fetchData() {
    if (currentAppMode === 'vault') {
        await fetchMovies();
    } else {
        await fetchRestaurants();
    }
}

async function fetchMovies() {
    try {
        const response = await fetch(API_URL_MOVIES);
        movies = await response.json();
        renderGallery();
        renderGenres();
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

async function fetchRestaurants() {
    try {
        const response = await fetch(API_URL_RESTAURANTS);
        restaurants = await response.json();
        renderGallery();
    } catch (error) {
        console.error('Error fetching restaurants:', error);
    }
}

async function saveItem(item) {
    const isVault = currentAppMode === 'vault';
    const url = isVault ? API_URL_MOVIES : API_URL_RESTAURANTS;
    const items = isVault ? movies : restaurants;

    try {
        const existing = items.find(i => i.id === item.id);
        if (existing) {
            await fetch(`${url}/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
        } else {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
        }
        await fetchData();
    } catch (error) {
        console.error('Error saving item:', error);
    }
}

function calculateTotalRating(david, lena) {
    if (david === 0 && lena === 0) return 0;
    // Average of 0-10 ratings, divided by 2 to get 0-5 stars
    const avg = (david + lena) / 2;
    return Math.round((avg / 2) * 10) / 10; // Round to 1 decimal place
}

function getStarHTML(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            starsHtml += '<span class="star filled">★</span>';
        } else if (rating >= i - 0.5) {
            starsHtml += '<span class="star half">★</span>';
        } else {
            starsHtml += '<span class="star">★</span>';
        }
    }
    return starsHtml;
}

function renderGenres() {
    const allGenres = new Set();
    // Filter movies by current category first
    const categoryMovies = movies.filter(m => (m.type || 'Film') === currentCategory);
    categoryMovies.forEach(m => m.genres.forEach(g => allGenres.add(g)));

    // Clear existing buttons except 'All'
    const existingBtns = genreFilterContainer.querySelectorAll('.filter-btn:not([data-genre="all"])');
    existingBtns.forEach(btn => btn.remove());

    // Add buttons for each genre
    Array.from(allGenres).sort().forEach(genre => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${currentFilter === genre ? 'active' : ''}`;
        btn.textContent = genre;
        btn.dataset.genre = genre;
        btn.onclick = () => setFilter(genre);
        genreFilterContainer.appendChild(btn);
    });
}

function setFilter(genre) {
    currentFilter = genre;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.genre === genre);
    });
    renderGallery();
}

function renderGallery() {
    try {
        gallery.innerHTML = '';

        let items = currentAppMode === 'vault' ? movies : restaurants;
        let filteredItems = [...items];
        window.debugFiltered = filteredItems; // Debug expose

        if (currentAppMode === 'vault') {
            // Filter by Category AND Genre
            filteredItems = filteredItems.filter(m => (m.type || 'Film') === currentCategory);

            if (currentFilter !== 'all') {
                filteredItems = filteredItems.filter(m => m.genres.includes(currentFilter));
            }

            // Filter by Seen Status
            if (currentSeenFilter === 'seen') {
                filteredItems = filteredItems.filter(m => m.seen);
            } else if (currentSeenFilter === 'unseen') {
                filteredItems = filteredItems.filter(m => !m.seen);
            }

            // Filter by Search Term
            if (currentSearchTerm) {
                filteredItems = filteredItems.filter(m => m.title.toLowerCase().includes(currentSearchTerm));
            }
        } else {
            // Restaurant Filters
            if (currentCityFilter) {
                filteredItems = filteredItems.filter(r => r.city.toLowerCase().includes(currentCityFilter.toLowerCase()));
            }
            if (currentPriceFilter !== 'all') {
                filteredItems = filteredItems.filter(r => r.price === currentPriceFilter);
            }
            if (currentVisitedFilter === 'visited') {
                filteredItems = filteredItems.filter(r => r.visited);
            } else if (currentVisitedFilter === 'not_visited') {
                filteredItems = filteredItems.filter(r => !r.visited);
            }
        }

        // Sort Items
        if (currentSort === 'rating-desc') {
            filteredItems.sort((a, b) => {
                const ratingA = calculateTotalRating(a.ratingDavid, a.ratingLena);
                const ratingB = calculateTotalRating(b.ratingDavid, b.ratingLena);
                return ratingB - ratingA;
            });
        } else if (currentSort === 'rating-asc') {
            filteredItems.sort((a, b) => {
                const ratingA = calculateTotalRating(a.ratingDavid, a.ratingLena);
                const ratingB = calculateTotalRating(b.ratingDavid, b.ratingLena);
                return ratingA - ratingB;
            });
        } else if (currentSort === 'newest') {
            filteredItems.sort((a, b) => b.id - a.id);
        } else if (currentSort === 'oldest') {
            filteredItems.sort((a, b) => a.id - b.id);
        }

        filteredItems.forEach(item => {
            const totalRating = calculateTotalRating(item.ratingDavid, item.ratingLena);
            const card = document.createElement('div');
            card.className = 'movie-card';

            const title = currentAppMode === 'vault' ? item.title : item.name;
            const imageUrl = item.image ? item.image : `https://placehold.co/600x300/2a2a2a/FFF?text=${encodeURIComponent(title)}`;
            const imagePos = item.imagePosition || 'center';

            // Subtitle info
            let subtitleHtml = '';
            if (currentAppMode === 'restaurants') {
                const priceMap = { 'Low': '€', 'Mid': '€€', 'High': '€€€' };
                const priceSymbol = priceMap[item.price] || item.price;
                subtitleHtml = `<div class="card-subtitle">${item.city} • ${item.cuisine.join(', ')} • ${priceSymbol}</div>`;
            }

            // Checkbox logic
            const isChecked = currentAppMode === 'vault' ? item.seen : item.visited;
            const checkboxLabel = currentAppMode === 'vault' ? 'Seen' : 'Visited';

            card.innerHTML = `
            <div class="card-image" style="background-image: url('${imageUrl}'); background-position: ${imagePos}"></div>
            <div class="card-content">
                <h3 class="movie-title">${title}</h3>
                ${subtitleHtml}
                
                <div class="checkbox-row">
                    <label class="custom-checkbox" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSeen(${item.id})">
                        <span class="checkmark"></span>
                        <span class="label-text">${checkboxLabel}</span>
                    </label>
                </div>

                <div class="rating-row">
                    <span class="rating-text">${totalRating}</span>
                    <div class="star-rating">
                        ${getStarHTML(totalRating)}
                    </div>
                </div>
            </div>
        `;

            // Add click event to open modal (ignoring checkbox clicks)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.custom-checkbox')) {
                    openModal(item);
                }
            });

            gallery.appendChild(card);
        });
    } catch (e) {
        console.error('Render error:', e);
        window.debugError = e.toString();
    }
}

function toggleSeen(id) {
    const items = currentAppMode === 'vault' ? movies : restaurants;
    const item = items.find(i => i.id === id);
    if (item) {
        if (currentAppMode === 'vault') {
            item.seen = !item.seen;
        } else {
            item.visited = !item.visited;
        }
        saveItem(item);
    }
}

// Modal Logic
function openModal(item) {
    currentEditingId = item.id;

    // Show/Hide Delete Button
    if (currentEditingId) {
        deleteModalBtn.classList.remove('hidden');
    } else {
        deleteModalBtn.classList.add('hidden');
    }

    // Toggle Fields based on Mode
    if (currentAppMode === 'vault') {
        vaultFields.forEach(el => el.classList.remove('hidden'));
        restaurantFields.forEach(el => el.classList.add('hidden'));

        modalTitle.value = item.title;
        modalType.value = item.type || currentCategory;
        modalYear.value = item.releaseYear || "";
        modalSeen.checked = item.seen;
        renderModalGenres(item.genres);
    } else {
        vaultFields.forEach(el => el.classList.add('hidden'));
        restaurantFields.forEach(el => el.classList.remove('hidden'));

        modalTitle.value = item.name;
        modalCity.value = item.city || "";
        modalCuisine.value = (item.cuisine || []).join(', ');
        modalPrice.value = item.price || "";
        modalVisited.checked = item.visited;
    }

    const imageUrl = item.image || "";
    modalImage.style.backgroundImage = imageUrl ? `url('${imageUrl}')` : 'none';
    modalImageUrl.value = imageUrl;

    modalCreated.textContent = item.createdDate || "Unknown";
    modalRatingDavid.value = item.ratingDavid;
    modalRatingLena.value = item.ratingLena;

    // Set Image Position
    currentImagePosition = item.imagePosition || 'center';
    modalImage.style.backgroundPosition = currentImagePosition;

    updateModalRatingDisplay();

    modal.classList.remove('hidden');
}

function renderModalGenres(selectedGenres) {
    modalGenres.innerHTML = '';
    AVAILABLE_GENRES.forEach(genre => {
        const tag = document.createElement('span');
        tag.className = `genre-tag ${selectedGenres.includes(genre) ? 'selected' : ''}`;
        tag.textContent = genre;
        tag.onclick = () => {
            tag.classList.toggle('selected');
        };
        modalGenres.appendChild(tag);
    });
}

function updateModalRatingDisplay() {
    const david = parseInt(modalRatingDavid.value) || 0;
    const lena = parseInt(modalRatingLena.value) || 0;
    const total = calculateTotalRating(david, lena);

    modalTotalRating.textContent = `${total}`;
    modalStarRating.innerHTML = getStarHTML(total);
}

// Event Listeners for Modal
modalRatingDavid.addEventListener('input', updateModalRatingDisplay);
modalRatingLena.addEventListener('input', updateModalRatingDisplay);

// Update modal image preview on URL input
modalImageUrl.addEventListener('input', () => {
    const url = modalImageUrl.value;
    if (url) {
        modalImage.style.backgroundImage = `url('${url}')`;
    } else {
        modalImage.style.backgroundImage = 'none';
    }
});

// Image Drag Logic
modalImage.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    // Parse current position (e.g., "50% 50%")
    const parts = currentImagePosition.split(' ');
    if (parts.length === 2) {
        initialPosX = parseFloat(parts[0]) || 50;
        initialPosY = parseFloat(parts[1]) || 50;
    } else {
        initialPosX = 50;
        initialPosY = 50;
    }

    modalImage.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Convert pixels to percentage (approximate sensitivity)
    const percentX = initialPosX - (deltaX / modalImage.offsetWidth) * 100;
    const percentY = initialPosY - (deltaY / modalImage.offsetHeight) * 100;

    // Clamp between 0 and 100
    const clampedX = Math.max(0, Math.min(100, percentX));
    const clampedY = Math.max(0, Math.min(100, percentY));

    currentImagePosition = `${clampedX.toFixed(1)}% ${clampedY.toFixed(1)}%`;
    modalImage.style.backgroundPosition = currentImagePosition;
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        modalImage.style.cursor = 'move';
    }
});

// Direct Event Listener for Delete Button
// Global Delete Handler
window.handleDeleteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked (global handler)', currentEditingId);

    if (currentEditingId) {
        await deleteItem(currentEditingId);
    } else {
        console.error('No currentEditingId to delete');
        alert('Error: No movie selected for deletion.');
    }
};

async function deleteItem(id) {
    console.log('Attempting to delete item:', id);
    // if (!confirm('Are you sure you want to delete this item?')) {
    //     console.log('Deletion cancelled by user');
    //     return;
    // }
    alert('DELETING NOW ' + id);

    const isVault = currentAppMode === 'vault';
    const url = isVault ? API_URL_MOVIES : API_URL_RESTAURANTS;
    const fullUrl = `${url}/${id}`;
    console.log('Sending DELETE request to:', fullUrl);


    try {
        const response = await fetch(fullUrl, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log('Delete successful');
            modal.classList.add('hidden');
            currentEditingId = null;
            await fetchData(); // Refresh list
        } else {
            console.error('Delete failed:', response.statusText);
            alert('Failed to delete item. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Check console for details.');
    }
}

const cancelModalBtn = document.getElementById('cancel-modal');
cancelModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    currentEditingId = null;
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    currentEditingId = null;
});

saveModalBtn.addEventListener('click', () => {
    const commonData = {
        id: currentEditingId || Date.now(),
        image: modalImageUrl.value || "",
        ratingDavid: parseInt(modalRatingDavid.value) || 0,
        ratingLena: parseInt(modalRatingLena.value) || 0,
        createdDate: modalCreated.textContent !== "New Movie" ? modalCreated.textContent : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        imagePosition: currentImagePosition
    };

    let itemData = { ...commonData };

    if (currentAppMode === 'vault') {
        itemData.title = modalTitle.value || "Untitled";
        itemData.releaseYear = modalYear.value;
        itemData.seen = modalSeen.checked;
        itemData.type = modalType.value;

        const selectedTags = modalGenres.querySelectorAll('.genre-tag.selected');
        itemData.genres = Array.from(selectedTags).map(tag => tag.textContent);
    } else {
        itemData.name = modalTitle.value || "Untitled";
        itemData.city = modalCity.value;
        itemData.cuisine = modalCuisine.value.split(',').map(s => s.trim()).filter(s => s);
        itemData.price = modalPrice.value;
        itemData.visited = modalVisited.checked;
    }

    // Placeholder image logic
    if (!itemData.image) {
        const title = currentAppMode === 'vault' ? itemData.title : itemData.name;
        itemData.image = `https://placehold.co/600x300/2a2a2a/FFF?text=${encodeURIComponent(title)}`;
    }

    saveItem(itemData);
    modal.classList.add('hidden');
    currentEditingId = null;
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

addMovieBtn.addEventListener('click', () => {
    const newItem = {
        id: null,
        image: "",
        ratingDavid: 0,
        ratingLena: 0,
        createdDate: "New Movie",
    };

    if (currentAppMode === 'vault') {
        newItem.title = "";
        newItem.seen = false;
        newItem.genres = [];
        newItem.releaseYear = "";
        newItem.type = currentCategory;
    } else {
        newItem.name = "";
        newItem.visited = false;
        newItem.city = "";
        newItem.cuisine = [];
        newItem.price = "";
    }
    openModal(newItem);
});

// App Mode Switching Logic
appTitle.addEventListener('click', () => {
    modeDropdown.classList.toggle('hidden');
});

modeOptions.forEach(option => {
    option.addEventListener('click', () => {
        const mode = option.dataset.mode;
        switchAppMode(mode);
        modeDropdown.classList.add('hidden');
    });
});

function switchAppMode(mode) {
    currentAppMode = mode;
    appTitle.textContent = mode === 'vault' ? 'Lenas & Davids Movie Vault' : 'Restaurant Guide';

    if (mode === 'vault') {
        vaultFilters.classList.remove('hidden');
        restaurantFilters.classList.add('hidden');
        vaultCategoryNav.style.display = 'flex';
    } else {
        vaultFilters.classList.add('hidden');
        restaurantFilters.classList.remove('hidden');
        vaultCategoryNav.style.display = 'none';
    }

    fetchData();
}

// Restaurant Filter Listeners
cityFilter.addEventListener('input', (e) => {
    currentCityFilter = e.target.value;
    renderGallery();
});

priceFilter.addEventListener('change', (e) => {
    currentPriceFilter = e.target.value;
    renderGallery();
});

visitedFilter.addEventListener('change', (e) => {
    currentVisitedFilter = e.target.value;
    renderGallery();
});

// Initial setup
document.querySelector('.filter-btn[data-genre="all"]').onclick = () => setFilter('all');

sortFilter.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderGallery();
});

seenFilter.addEventListener('change', (e) => {
    currentSeenFilter = e.target.value;
    renderGallery();
});

// Search Filter Listener
if (searchFilter) {
    searchFilter.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase().trim();
        window.currentSearchTerm = currentSearchTerm; // Debug expose
        renderGallery();
    });
}

fetchData();
// Mobile Filter Toggle
const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
const filterRow = document.querySelector('.filter-row');

if (mobileFilterToggle) {
    mobileFilterToggle.addEventListener('click', () => {
        filterRow.classList.toggle('visible');
        mobileFilterToggle.textContent = filterRow.classList.contains('visible') ? 'Hide Filters' : 'Filters';
    });
}

// Hide Header on Scroll (Mobile)
let lastScrollTop = 0;
const header = document.querySelector('header');
const scrollThreshold = 50; // Minimum scroll amount before hiding

window.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return; // Only for mobile

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
        // Scrolling down
        header.classList.add('header-hidden');
    } else {
        // Scrolling up
        header.classList.remove('header-hidden');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
});
