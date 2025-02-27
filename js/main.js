// DOM yüklendikten sonra çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    // Font Awesome'ı yükle
    addFontAwesome();
    
    // Haritayı başlat
    initMap();
});

// Harita değişkenleri
let map;
let markers = [];
let viewer;

// Haritayı başlatan fonksiyon
function initMap() {
    // Bursa merkez koordinatları (varsayılan görünüm)
    const bursaCenter = [40.1885, 29.0610];
    
    // Farklı harita katmanlarını oluştur
    const osmMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const baseMaps = {
        "Harita": osmMap,
        "Uydu": satelliteMap
    };
    
    // Leaflet haritasını oluştur
    map = L.map('map', {
        layers: [osmMap]
    }).setView(bursaCenter, 11);
    
    // Katman kontrolünü ekle
    L.control.layers(baseMaps).addTo(map);
    
    // Panorama noktalarını haritaya ekle
    addPanoramaMarkers();
    
    // Modal kapatma işlevi
    document.querySelector('.close-btn').addEventListener('click', function() {
        document.getElementById('panorama-modal').style.display = 'none';
    });
    
    // Modal dışına tıklanınca kapatma işlevi
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('panorama-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Panorama noktalarını haritaya ekleyen fonksiyon
function addPanoramaMarkers() {
    // Her bir panorama lokasyonu için döngü
    panoramaLocations.forEach(location => {
        // Özel simge oluştur
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: '<i class="fa fa-camera"></i>',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -20]
        });
        
        // Marker oluştur ve haritaya ekle
        const marker = L.marker([location.lat, location.lng], {
            icon: markerIcon,
            title: location.name
        }).addTo(map);
        
        // Marker'a popup ekle
        marker.bindPopup(`
            <div class="popup-content">
                <h3>${location.name}</h3>
                <p>${location.description}</p>
                <button class="view-panorama-btn" data-id="${location.id}">360° Görüntüle</button>
            </div>
        `);
        
        // Popup açıldığında, butona tıklama olayı ekle
        marker.on('popupopen', function() {
            document.querySelector(`.view-panorama-btn[data-id="${location.id}"]`).addEventListener('click', function() {
                openPanorama(location);
            });
        });
        
        // Marker'ı diziye ekle
        markers.push(marker);
    });
}

// Panorama görüntüsünü açan fonksiyon
function openPanorama(location) {
    // Modal'ı göster
    document.getElementById('panorama-modal').style.display = 'block';
    
    // Varsa önceki panoramayı temizle
    const panoramaContainer = document.getElementById('panorama');
    panoramaContainer.innerHTML = '';
    
    // Hotspot ayarlarını oluştur
    const hotspots = [];
    
    // Lokasyona özgü hotspot'lar ekle (örnek olarak)
    if (location.id === 1) { // Ulucami için
        hotspots.push({
            pitch: -3,
            yaw: 117,
            type: "info",
            text: "Bu tarihi yapının minaresi 15. yüzyılda inşa edilmiştir."
        });
    } else if (location.id === 2) { // Kent Meydanı için
        hotspots.push({
            pitch: -9,
            yaw: 222,
            type: "info",
            text: "Bursa'nın modern yüzü"
        });
    }
    
    // Yakındaki diğer lokasyonlara bağlantılar ekle
    const nearbyLocations = findNearbyPanoramas(location, 2); // 2 km yarıçaplı
    
    nearbyLocations.forEach((nearby, index) => {
        // Her bir yakın lokasyonu farklı bir açıya yerleştir
        const yawOffset = index * 45; // 45 derece aralıklarla
        
        hotspots.push({
            pitch: -15,
            yaw: yawOffset,
            type: "scene",
            text: `${nearby.name} görüntüsüne git`,
            sceneId: nearby.id.toString()
        });
    });
    
    // Pannellum viewer'ı oluştur
    viewer = pannellum.viewer('panorama', {
        type: 'equirectangular',
        panorama: location.photo,
        autoLoad: true,
        autoRotate: -2,
        compass: true,
        title: location.name,
        author: 'GIS-360 Projesi',
        sceneFadeDuration: 1000,
        hfov: 100, // Yatay görüş alanı
        minHfov: 50, // Minimum yatay görüş alanı (yakınlaştırma limiti)
        maxHfov: 120, // Maksimum yatay görüş alanı (uzaklaştırma limiti)
        hotSpotDebug: false, // Geliştirme aşamasında hotspot ayarlaması için true yapılabilir
        touchPanEnabled: true,
        touchZoomEnabled: true,
        mouseZoom: true,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        hotSpots: hotspots
    });
    
    // Sahne değişimi için olay dinleyici
    viewer.on('scenechange', function(sceneId) {
        // ID'ye göre panorama lokasyonunu bul
        const targetLocation = panoramaLocations.find(loc => loc.id.toString() === sceneId);
        if (targetLocation) {
            openPanorama(targetLocation);
        }
    });
}

// Belirli bir mesafe içindeki diğer panoramaları bulan fonksiyon
function findNearbyPanoramas(currentLocation, maxDistance = 1) {
    return panoramaLocations.filter(loc => {
        if (loc.id === currentLocation.id) return false;
        
        // Haversine formülü ile mesafe hesaplama
        const R = 6371; // Dünya yarıçapı (km)
        const dLat = (loc.lat - currentLocation.lat) * Math.PI / 180;
        const dLon = (loc.lng - currentLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(loc.lat * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance <= maxDistance;
    });
}

// Sayfaya Font Awesome ikonlarını ekle
function addFontAwesome() {
    // Font Awesome zaten sayfada var mı kontrol et
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        document.head.appendChild(link);
        console.log('Font Awesome yüklendi');
    }
} 