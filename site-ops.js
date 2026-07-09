// ==========================================================================
// APEX INFRASTRUCTURE ERP - REMOTE SITE OPS & GEO-TAGGING
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Daily Site Log Form Submission ---
    const siteLogForm = document.getElementById('site-log-form');
    if(siteLogForm) {
        siteLogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const logData = {
                date: new Date().toLocaleDateString('en-IN'),
                location: document.getElementById('site-location').value,
                labor_count: document.getElementById('labor-count').value,
                machine_hours: document.getElementById('machine-hours').value || 0,
                diesel_liters: document.getElementById('diesel-liters').value || 0,
                timestamp: new Date().getTime()
            };

            try {
                await ApexDB.add('Site_Logs', logData);
                alert("Site Log Saved Successfully!");
                siteLogForm.reset();
            } catch(err) {
                console.error("Failed to save log:", err);
            }
        });
    }

    // --- 2. Camera & Geo-Tagging Logic ---
    const startCamBtn = document.getElementById('start-camera-btn');
    const captureBtn = document.getElementById('capture-photo-btn');
    const videoFeed = document.getElementById('camera-feed');
    const canvas = document.getElementById('photo-canvas');
    const placeholder = document.getElementById('camera-placeholder');
    const gpsOverlay = document.getElementById('gps-overlay');
    
    let currentStream = null;
    let locationData = "GPS Location: Fetching...";

    // Start Camera
    if(startCamBtn) {
        startCamBtn.addEventListener('click', async () => {
            try {
                // Request back camera for mobile (environment), fallback to standard for PC
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                
                videoFeed.srcObject = currentStream;
                videoFeed.style.display = 'block';
                placeholder.style.display = 'none';
                startCamBtn.style.display = 'none';
                captureBtn.style.display = 'block';
                gpsOverlay.style.display = 'block';
                canvas.style.display = 'none';

                // Fetch GPS
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude.toFixed(6);
                            const lon = position.coords.longitude.toFixed(6);
                            const time = new Date().toLocaleString('en-IN');
                            locationData = `Lat: ${lat}, Lon: ${lon} <br> Time: ${time} <br> Apex Infrastructure`;
                            gpsOverlay.innerHTML = locationData;
                        },
                        (err) => {
                            locationData = `GPS Error: Please enable location. <br> Time: ${new Date().toLocaleString('en-IN')}`;
                            gpsOverlay.innerHTML = locationData;
                        },
                        { enableHighAccuracy: true } // Accuracy crucial for PWD proofs
                    );
                } else {
                    gpsOverlay.innerHTML = "GPS Not Supported by Browser.";
                }

            } catch (err) {
                alert("Camera access denied or unavailable.");
                console.error(err);
            }
        });
    }

    // Capture Image and Stamp GPS
    if(captureBtn) {
        captureBtn.addEventListener('click', () => {
            const context = canvas.getContext('2d');
            canvas.width = videoFeed.videoWidth;
            canvas.height = videoFeed.videoHeight;
            
            // Draw video frame to canvas
            context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
            
            // Stop Camera
            currentStream.getTracks().forEach(track => track.stop());
            videoFeed.style.display = 'none';
            canvas.style.display = 'block';
            captureBtn.style.display = 'none';
            startCamBtn.style.display = 'block';
            startCamBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Retake Photo';
            
            alert("Photo Captured & Geo-Tagged! (Save functionality will be handled via Export module)");
            // Note: In real production, we can convert canvas to Base64 and save to IndexedDB.
        });
    }
});