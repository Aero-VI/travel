// ============================================
// TRAVEL TIMELINE — Main Application
// ============================================

let trips = [];
let map = null;
let markers = [];
let currentView = 'timeline';
let currentFilter = 'all';

// Type colors mapping
const typeColors = {
    'cruise': '#06b6d4',
    'city': '#f59e0b',
    'adventure': '#ef4444',
    'extended-stay': '#10b981',
    'backpacking': '#f97316',
    'road-trip': '#a855f7',
    'island-hopping': '#14b8a6'
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadTrips();
    initMap();
    renderTimeline();
    initControls();
    animateStats();
    updateLastUpdated();
    initScrollReveal();
});

async function loadTrips() {
    try {
        const res = await fetch('data/trips.json');
        trips = await res.json();
        // Sort by date descending (most recent first)
        trips.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    } catch (err) {
        console.error('Failed to load trips:', err);
    }
}

// ============================================
// MAP
// ============================================

function initMap() {
    map = L.map('world-map', {
        center: [25, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 8,
        zoomControl: true,
        attributionControl: false
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Add markers for each trip
    addMarkers();

    // Draw cruise routes
    drawCruiseRoutes();
}

function addMarkers() {
    trips.forEach(trip => {
        if (!trip.coordinates) return;

        const color = typeColors[trip.type] || '#3b82f6';

        const icon = L.divIcon({
            className: 'custom-marker-wrapper',
            html: `<div class="custom-marker" style="background:${color}; color:${color};"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const marker = L.marker(trip.coordinates, { icon })
            .addTo(map)
            .bindPopup(`
                <h3>${trip.title}</h3>
                <p>${trip.location}</p>
                <p>${formatDateRange(trip.startDate, trip.endDate)}</p>
                <span class="map-popup-tag" style="background:${color}22; color:${color};">${trip.type}</span>
            `);

        marker.tripData = trip;
        markers.push(marker);
    });
}

function drawCruiseRoutes() {
    trips.filter(t => t.route && t.route.length > 1).forEach(trip => {
        const latlngs = trip.route.map(r => r.coordinates);
        L.polyline(latlngs, {
            color: typeColors.cruise,
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 10'
        }).addTo(map);
    });
}

// ============================================
// TIMELINE RENDERING
// ============================================

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    container.className = `timeline-container view-${currentView}`;

    // Filter trips
    const filtered = currentFilter === 'all'
        ? trips
        : trips.filter(t => t.type === currentFilter);

    // Group by year
    const years = {};
    filtered.forEach(trip => {
        const year = new Date(trip.startDate).getFullYear();
        if (!years[year]) years[year] = [];
        years[year].push(trip);
    });

    // Render each year
    Object.keys(years).sort((a, b) => b - a).forEach(year => {
        const yearDiv = document.createElement('div');
        yearDiv.className = 'timeline-year';

        const yearLabel = document.createElement('h3');
        yearLabel.className = 'year-label';
        yearLabel.textContent = year;
        yearDiv.appendChild(yearLabel);

        const tripsDiv = document.createElement('div');
        tripsDiv.className = 'year-trips';

        years[year].forEach(trip => {
            tripsDiv.appendChild(createTripCard(trip));
        });

        yearDiv.appendChild(tripsDiv);
        container.appendChild(yearDiv);
    });

    // Re-init scroll reveal
    initScrollReveal();
}

function createTripCard(trip) {
    const card = document.createElement('div');
    card.className = 'trip-card reveal';
    card.dataset.tripId = trip.id;

    const color = typeColors[trip.type] || '#3b82f6';

    let routeHTML = '';
    if (trip.route && trip.route.length > 0) {
        const ports = trip.route.map(r => `<span class="route-port">${r.port.split(',')[0]}</span>`);
        routeHTML = `
            <div class="cruise-route">
                ${ports.join('<span class="route-arrow">→</span>')}
            </div>
        `;
    }

    card.innerHTML = `
        <div class="trip-header">
            <h3 class="trip-title">${trip.title}</h3>
            <span class="trip-type-badge ${trip.type}">${trip.type.replace('-', ' ')}</span>
        </div>
        <div class="trip-location">${trip.location}</div>
        <div class="trip-dates">${formatDateRange(trip.startDate, trip.endDate)}</div>
        <p class="trip-description">${trip.description}</p>
        <div class="trip-highlights">
            ${trip.highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
        </div>
        ${routeHTML}
    `;

    card.addEventListener('click', () => openTripDetail(trip));

    return card;
}

// ============================================
// TRIP DETAIL MODAL
// ============================================

function openTripDetail(trip) {
    // Remove existing modal if any
    const existing = document.querySelector('.trip-expanded');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'trip-expanded';

    const color = typeColors[trip.type] || '#3b82f6';

    let routeSection = '';
    if (trip.route && trip.route.length > 0) {
        routeSection = `
            <div class="expanded-map" id="detail-map"></div>
            <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Route</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:1rem;">
                ${trip.route.map(r => `
                    <div style="display:flex; flex-direction:column; align-items:center; padding:8px 12px; background:rgba(6,182,212,0.08); border-radius:8px; border:1px solid var(--border);">
                        <span style="font-size:0.8rem; color:var(--cruise-color); font-weight:500;">${r.port}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted);">${formatDate(r.date)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    modal.innerHTML = `
        <div class="trip-expanded-content">
            <button class="expanded-close">&times;</button>
            <span class="trip-type-badge ${trip.type}" style="margin-bottom:1rem; display:inline-block;">${trip.type.replace('-', ' ')}</span>
            <h2 style="font-family:'Playfair Display',serif; font-size:2rem; margin-bottom:0.5rem;">${trip.title}</h2>
            <p style="color:var(--text-secondary); margin-bottom:0.25rem;">📍 ${trip.location}</p>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">${formatDateRange(trip.startDate, trip.endDate)}</p>
            <p style="color:var(--text-secondary); line-height:1.7; margin-bottom:1.5rem;">${trip.description}</p>
            ${routeSection}
            <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Highlights</h4>
            <div class="trip-highlights">
                ${trip.highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => modal.classList.add('active'));

    // Close handlers
    modal.querySelector('.expanded-close').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });

    // Init detail map for cruise routes
    if (trip.route && trip.route.length > 0) {
        setTimeout(() => {
            const detailMap = L.map('detail-map', {
                center: trip.coordinates,
                zoom: 4,
                zoomControl: false
            });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(detailMap);

            const latlngs = trip.route.map(r => r.coordinates);
            L.polyline(latlngs, { color: typeColors.cruise, weight: 3, opacity: 0.8 }).addTo(detailMap);
            trip.route.forEach(r => {
                L.circleMarker(r.coordinates, { radius: 5, color: typeColors.cruise, fillOpacity: 0.8 })
                    .bindPopup(`<strong>${r.port}</strong><br>${formatDate(r.date)}`)
                    .addTo(detailMap);
            });
            detailMap.fitBounds(L.latLngBounds(latlngs).pad(0.2));
        }, 100);
    }
}

function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
}

// ============================================
// CONTROLS
// ============================================

function initControls() {
    // View toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderTimeline();
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTimeline();
        });
    });
}

// ============================================
// ANIMATIONS & STATS
// ============================================

function animateStats() {
    const countries = new Set();
    trips.forEach(t => {
        if (t.country === 'Multiple') {
            // Estimate from location/route
            if (t.route) t.route.forEach(r => countries.add(r.port.split(', ').pop()));
        } else {
            countries.add(t.country);
        }
    });

    const cruiseDays = trips
        .filter(t => t.type === 'cruise')
        .reduce((sum, t) => {
            const days = Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / 86400000);
            return sum + days;
        }, 0);

    animateNumber('country-count', countries.size, 2000);
    animateNumber('trip-count', trips.length, 2000);
    animateNumber('cruise-days', cruiseDays, 2000);
}

function animateNumber(elementId, target, duration) {
    const el = document.getElementById(elementId);
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        el.textContent = current + (elementId === 'cruise-days' ? '+' : elementId === 'country-count' ? '+' : '');

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    // Start animation when element is visible
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            requestAnimationFrame(update);
            observer.disconnect();
        }
    });
    observer.observe(el);
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.trip-card.reveal').forEach(card => {
        observer.observe(card);
    });
}

// ============================================
// UTILITIES
// ============================================

function formatDateRange(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} — ${e.toLocaleDateString('en-US', opts)}`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el) {
        el.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.trip-expanded.active');
        if (modal) closeModal(modal);
    }
});
