document.addEventListener('DOMContentLoaded', () => {
    // HTML elementlerini seç
    const adminPanel = document.getElementById('admin-panel');
    const locationList = document.getElementById('location-list');
    const addLocationBtn = document.getElementById('addLocation');

    // Element kontrolü
    if (!adminPanel || !locationList || !addLocationBtn) {
        console.error('Gerekli admin panel elementleri bulunamadı');
        return;
    }

    // Lokasyonları listele
    function renderLocations() {
        locationList.innerHTML = '';
        panoramaLocations.forEach((location, index) => {
            const locationElement = document.createElement('div');
            locationElement.className = 'location-item';
            locationElement.innerHTML = `
                <input type="text" value="${location.name}" placeholder="Lokasyon Adı" data-field="name" data-index="${index}">
                <input type="number" step="0.000001" value="${location.lat}" placeholder="Enlem" data-field="lat" data-index="${index}">
                <input type="number" step="0.000001" value="${location.lng}" placeholder="Boylam" data-field="lng" data-index="${index}">
                <div class="location-controls">
                    <button class="admin-btn save-btn" data-index="${index}">Kaydet</button>
                    <button class="admin-btn delete-btn" data-index="${index}">Sil</button>
                </div>
            `;
            locationList.appendChild(locationElement);
        });

        // Input değişikliklerini dinle
        document.querySelectorAll('.location-item input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                const value = field === 'name' ? e.target.value : parseFloat(e.target.value);
                panoramaLocations[index][field] = value;
            });
        });

        // Kaydet butonları
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                try {
                    updateMarker(panoramaLocations[index]);
                    alert('Değişiklikler kaydedildi!');
                } catch (error) {
                    console.error('Marker güncellenirken hata:', error);
                    alert('Değişiklikler kaydedilirken bir hata oluştu!');
                }
            });
        });

        // Sil butonları
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) {
                    try {
                        removeMarker(index);
                        panoramaLocations.splice(index, 1);
                        renderLocations();
                        alert('Lokasyon başarıyla silindi!');
                    } catch (error) {
                        console.error('Lokasyon silinirken hata:', error);
                        alert('Lokasyon silinirken bir hata oluştu!');
                    }
                }
            });
        });
    }

    // Yeni lokasyon ekleme
    addLocationBtn.addEventListener('click', () => {
        const newLocation = {
            id: panoramaLocations.length + 1,
            name: 'Yeni Lokasyon',
            lat: map.getCenter().lat,
            lng: map.getCenter().lng,
            photo: '',
            description: 'Yeni lokasyon açıklaması'
        };

        try {
            panoramaLocations.push(newLocation);
            addMarker(newLocation);
            renderLocations();
            alert('Yeni lokasyon eklendi! Lütfen bilgileri güncelleyin.');
        } catch (error) {
            console.error('Yeni lokasyon eklenirken hata:', error);
            alert('Yeni lokasyon eklenirken bir hata oluştu!');
        }
    });

    // İlk render
    renderLocations();
}); 