document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = document.getElementById('adminPanel');
    const toggleBtn = document.getElementById('togglePanel');
    const locationList = document.getElementById('locationList');
    const addLocationBtn = document.getElementById('addLocation');

    // Panel açma/kapama
    toggleBtn.addEventListener('click', () => {
        adminPanel.classList.toggle('open');
    });

    // Lokasyonları listele
    function renderLocations() {
        locationList.innerHTML = '';
        panoramaLocations.forEach((location, index) => {
            const locationElement = document.createElement('div');
            locationElement.className = 'location-item';
            locationElement.innerHTML = `
                <input type="text" value="${location.name}" placeholder="Lokasyon Adı" data-field="name" data-index="${index}">
                <input type="number" step="0.0001" value="${location.lat}" placeholder="Enlem" data-field="lat" data-index="${index}">
                <input type="number" step="0.0001" value="${location.lng}" placeholder="Boylam" data-field="lng" data-index="${index}">
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
                // Haritayı güncelle
                updateMarker(panoramaLocations[index]);
                alert('Değişiklikler kaydedildi!');
            });
        });

        // Sil butonları
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) {
                    panoramaLocations.splice(index, 1);
                    renderLocations();
                    // Haritadan marker'ı kaldır
                    removeMarker(index);
                }
            });
        });
    }

    // Yeni lokasyon ekleme
    addLocationBtn.addEventListener('click', () => {
        const newLocation = {
            id: panoramaLocations.length + 1,
            name: 'Yeni Lokasyon',
            lat: 40.1843, // Varsayılan olarak Bursa merkezi
            lng: 29.0608,
            photo: '',
            description: 'Yeni lokasyon açıklaması'
        };
        panoramaLocations.push(newLocation);
        renderLocations();
        // Haritaya yeni marker ekle
        addMarker(newLocation);
    });

    // İlk yükleme
    renderLocations();
}); 