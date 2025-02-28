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
    
    // Admin panel toggle butonuna tıklama olayı ekle
    const adminPanel = document.getElementById('admin-panel');
    const toggleBtn = document.querySelector('.admin-toggle');
    
    if (toggleBtn && adminPanel) {
        console.log('Admin panel ve toggle butonu bulundu');
        toggleBtn.addEventListener('click', function() {
            console.log('Toggle butonuna tıklandı');
            adminPanel.classList.toggle('open');
        });
    } else {
        console.error('Admin panel veya toggle butonu bulunamadı');
    }
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

// Yönetim paneli toggle fonksiyonu
function toggleAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) {
        panel.classList.toggle('open');
        console.log('Admin panel durumu değiştirildi:', panel.classList.contains('open'));
    } else {
        console.error('Admin panel elementi bulunamadı');
    }
}

// Panorama noktalarını haritaya ekleyen fonksiyon
function addPanoramaMarkers() {
    panoramaLocations.forEach(location => {
        const marker = L.marker([location.lat, location.lng])
            .bindPopup(`
                <h3>${location.name}</h3>
                <p>${location.description}</p>
                <button onclick="showPanorama('${location.photo}')">360° Görüntüle</button>
            `)
            .addTo(map);
        markers.push(marker);
    });
}

// Marker'ı güncelle
function updateMarker(location) {
    const index = panoramaLocations.findIndex(loc => loc.id === location.id);
    if (index !== -1 && markers[index]) {
        const newLatLng = L.latLng(location.lat, location.lng);
        markers[index].setLatLng(newLatLng);
        markers[index].getPopup().setContent(`
            <h3>${location.name}</h3>
            <p>${location.description}</p>
            <button onclick="showPanorama('${location.photo}')">360° Görüntüle</button>
        `);
    }
}

// Marker'ı kaldır
function removeMarker(index) {
    if (markers[index]) {
        map.removeLayer(markers[index]);
        markers.splice(index, 1);
    }
}

// Yeni marker ekle
function addMarker(location) {
    const marker = L.marker([location.lat, location.lng])
        .bindPopup(`
            <h3>${location.name}</h3>
            <p>${location.description}</p>
            <button onclick="showPanorama('${location.photo}')">360° Görüntüle</button>
        `)
        .addTo(map);
    markers.push(marker);
}

// 360 derece panorama görüntüleyici
function showPanorama(photoUrl, initialLocation) {
    console.log('Panorama açılıyor:', photoUrl);
    const modal = document.getElementById('panorama-modal');
    const panoramaContainer = document.getElementById('panorama');
    
    if (!modal || !panoramaContainer) {
        console.error('Modal veya panorama container bulunamadı');
        return;
    }
    
    modal.style.display = 'block';
    
    try {
        // Mevcut lokasyonun index'ini bul
        const currentIndex = panoramaLocations.findIndex(loc => loc.photo === photoUrl);
        
        // Kaydedilmiş konum varsa al
        const savedPosition = localStorage.getItem(`panorama_position_${currentIndex}`);
        let initialConfig = savedPosition ? JSON.parse(savedPosition) : null;
        
        // Hotspotları oluştur
        const hotSpots = [];
        
        // Önceki panorama için hotspot
        if (currentIndex > 0) {
            hotSpots.push({
                pitch: 0,
                yaw: -30,
                type: "custom",
                cssClass: "custom-hotspot prev-panorama",
                createTooltipFunc: hotspot => {
                    const tooltip = document.createElement('div');
                    tooltip.classList.add('hotspot-tooltip');
                    tooltip.innerHTML = `${panoramaLocations[currentIndex - 1].name}'e git`;
                    return tooltip;
                },
                clickHandlerFunc: () => {
                    showPanorama(panoramaLocations[currentIndex - 1].photo);
                }
            });
        }
        
        // Sonraki panorama için hotspot
        if (currentIndex < panoramaLocations.length - 1) {
            hotSpots.push({
                pitch: 0,
                yaw: 30,
                type: "custom",
                cssClass: "custom-hotspot next-panorama",
                createTooltipFunc: hotspot => {
                    const tooltip = document.createElement('div');
                    tooltip.classList.add('hotspot-tooltip');
                    tooltip.innerHTML = `${panoramaLocations[currentIndex + 1].name}'e git`;
                    return tooltip;
                },
                clickHandlerFunc: () => {
                    showPanorama(panoramaLocations[currentIndex + 1].photo);
                }
            });
        }

        // Bilgi noktaları ekle
        hotSpots.push({
            pitch: 10,
            yaw: 0,
            type: "info",
            text: panoramaLocations[currentIndex].description
        });
        
        viewer = pannellum.viewer('panorama', {
            type: 'equirectangular',
            panorama: photoUrl,
            autoLoad: true,
            autoRotate: 0, // Otomatik dönmeyi kapat
            compass: true,
            northOffset: 247.5,
            preview: photoUrl,
            hotSpots: hotSpots,
            
            // Kontrol butonları
            controls: {
                mouseZoom: true,
                fullscreen: true,
                orientationOnByDefault: false,
                pan: true
            },
            
            // Görüş ayarları - Kaydedilmiş konumu kullan veya varsayılan değerleri al
            haov: 360,
            vaov: 180,
            vOffset: 0,
            yaw: initialConfig ? initialConfig.yaw : 0,
            pitch: initialConfig ? initialConfig.pitch : 0,
            hfov: initialConfig ? initialConfig.hfov : 100,
            minHfov: 50,
            maxHfov: 120,
            
            // Olaylar
            onLoad: () => {
                console.log('Panorama yüklendi');
                
                // Konum kaydetme butonunu ekle
                const saveBtn = document.createElement('button');
                saveBtn.innerHTML = '📍 Konumu Kaydet';
                saveBtn.className = 'save-position-btn';
                saveBtn.onclick = () => {
                    const position = {
                        yaw: viewer.getYaw(),
                        pitch: viewer.getPitch(),
                        hfov: viewer.getHfov()
                    };
                    localStorage.setItem(`panorama_position_${currentIndex}`, JSON.stringify(position));
                    alert('Konum kaydedildi!');
                };
                document.querySelector('.pnlm-controls').appendChild(saveBtn);
            },
            onError: function(message) {
                console.error('Pannellum hatası:', message);
            }
        });
        
        // Klavye kontrollerini ekle
        document.addEventListener('keydown', function(e) {
            switch(e.key) {
                case 'ArrowLeft':
                    viewer.setYaw(viewer.getYaw() - 5);
                    break;
                case 'ArrowRight':
                    viewer.setYaw(viewer.getYaw() + 5);
                    break;
                case 'ArrowUp':
                    viewer.setPitch(viewer.getPitch() + 5);
                    break;
                case 'ArrowDown':
                    viewer.setPitch(viewer.getPitch() - 5);
                    break;
                case '+':
                    viewer.setHfov(viewer.getHfov() - 5);
                    break;
                case '-':
                    viewer.setHfov(viewer.getHfov() + 5);
                    break;
            }
        });
        
        // Modal kapatma
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.style.display = 'none';
                if (viewer) {
                    viewer.destroy();
                }
            }
        }
        
        // Modal dışına tıklama
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
                if (viewer) {
                    viewer.destroy();
                }
            }
        }
    } catch (error) {
        console.error('Panorama yüklenirken hata:', error);
        modal.style.display = 'none';
    }
}