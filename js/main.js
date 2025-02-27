// Değişkenleri en üstte tanımla
let viewer = null;
let isDragging = false;
let lastRotation = {};
let map = null;
let markers = [];

// DOMContentLoaded event listener'ı ekle
document.addEventListener('DOMContentLoaded', function() {
    // Haritayı başlat
    initMap();
    // Kaydedilmiş rotasyonları göster
    updateSavedRotationsList();
});

function initMap() {
    map = L.map('map').setView([40.1885, 29.0610], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Sağ tık olayını ekle
    map.on('contextmenu', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        const coordText = `${lat}, ${lng}`;
        
        navigator.clipboard.writeText(coordText).then(() => {
            L.popup()
                .setLatLng(e.latlng)
                .setContent(`Koordinatlar kopyalandı: ${coordText}`)
                .openOn(map);
        });
    });

    // Panorama işaretçilerini ekle
    addPanoramaMarkers();
}

function toggleAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

// Panorama noktalarını haritaya ekleyen fonksiyon
async function addPanoramaMarkers() {
    for (const location of panoramaLocations) {
        try {
            // Fotoğrafı yükle ve EXIF verilerini oku
            const response = await fetch(location.photo);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const tags = await ExifReader.load(blob);

            // GPS koordinatlarını al
            if (tags.GPSLatitude && tags.GPSLongitude) {
                const lat = convertDMSToDD(tags.GPSLatitude.value, tags.G