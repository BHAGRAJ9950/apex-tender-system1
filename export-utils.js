// ==========================================================================
// APEX INFRASTRUCTURE ERP - EXPORT, SYNC & WHATSAPP API
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    const backupBtn = document.getElementById('backup-btn');
    const syncBtn = document.getElementById('sync-btn');

    // --- 1. JSON Data Backup (Download to Device/Drive) ---
    if(backupBtn) {
        backupBtn.addEventListener('click', async () => {
            try {
                // Changing icon to show loading
                backupBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                // Fetch all data from IndexedDB (database.js)
                const tenders = await ApexDB.getAll('Tender_Projects');
                const funds = await ApexDB.getAll('Funds_Legal');
                const logs = await ApexDB.getAll('Site_Logs');

                // Create a master JSON object
                const exportData = {
                    firm: "Apex Infrastructure",
                    md: "Tulsa Ram Choudhary",
                    export_date: new Date().toISOString(),
                    data: {
                        Tender_Projects: tenders,
                        Funds_Legal: funds,
                        Site_Logs: logs
                    }
                };

                // Convert to JSON String and format as a downloadable file
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                
                // File name with current date
                const fileName = `ApexERP_Backup_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.json`;
                downloadAnchorNode.setAttribute("download", fileName);
                
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();

                // Reset icon
                backupBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i>';
                alert(`Data Backup Successful!\nFile saved as: ${fileName}\nYou can now upload this to Google Drive.`);

            } catch (error) {
                console.error("Backup Failed:", error);
                alert("Failed to export data. Please try again.");
                backupBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i>';
            }
        });
    }

    // --- 2. JSON Data Restore (Sync from Drive/Device) ---
    // Creating a hidden file input element dynamically
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    if(syncBtn) {
        syncBtn.addEventListener('click', () => {
            // Trigger the hidden file input
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                
                const importedData = JSON.parse(event.target.result);
                
                // Security Check
                if(importedData.firm !== "Apex Infrastructure") {
                    alert("Security Alert: Invalid Backup File. This data does not belong to Apex Infrastructure.");
                    syncBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i>';
                    return;
                }

                // Import logic: We use .update() (which is PUT in IDB) so existing IDs are updated, new ones are added
                const tables = ['Tender_Projects', 'Funds_Legal', 'Site_Logs'];
                
                for (const table of tables) {
                    const tableData = importedData.data[table] || [];
                    for (const record of tableData) {
                        await ApexDB.update(table, record); // Custom update function from database.js
                    }
                }

                alert("Data Synced Successfully! The system will now refresh to load new data.");
                location.reload(); // Refresh to apply changes to UI

            } catch(err) {
                console.error("Sync Error:", err);
                alert("Error importing data. The JSON file might be corrupted.");
                syncBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i>';
            }
        };
        reader.readAsText(file);
    });

    // --- 3. WhatsApp Integration (Global Utility) ---
    // Ek function jo kisi bhi data ko WhatsApp message me convert kar de
    window.shareToWhatsApp = (type, dataObj) => {
        let message = `🏢 *APEX INFRASTRUCTURE* 🏢\n_Proprietor: Tulsa Ram Choudhary_\n\n`;

        if(type === 'SITE_LOG') {
            message += `*🚧 DAILY SITE LOG*\n`;
            message += `📍 Location: ${dataObj.location}\n`;
            message += `📅 Date: ${dataObj.date}\n`;
            message += `👷 Labor Hajiri: ${dataObj.labor_count}\n`;
            message += `🚜 Machine Hours: ${dataObj.machine_hours} Hrs\n`;
            message += `⛽ Diesel Used: ${dataObj.diesel_liters} Ltr\n`;
        } 
        else if(type === 'BOQ') {
            message += `*📊 BOQ & QUOTATION SUMMARY*\n`;
            message += `💰 PWD G-Schedule: ₹${dataObj.base}\n`;
            message += `📉 Quoted Adjust: ${dataObj.quote}%\n`;
            message += `💼 Direct Net Margin: ₹${dataObj.profit}\n`;
        }

        message += `\n_Automated via Apex ERP System_`;

        // Encode string to URL safe format and open WhatsApp
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    // --- Auto-Injecting WhatsApp Buttons into the UI ---
    // Injecting WhatsApp Share button into the Site Ops Form magically
    setTimeout(() => {
        const siteLogForm = document.getElementById('site-log-form');
        if(siteLogForm) {
            const waBtn = document.createElement('button');
            waBtn.type = 'button';
            waBtn.className = 'primary-btn';
            waBtn.style.background = '#25D366'; // Official WhatsApp Green
            waBtn.style.color = '#fff';
            waBtn.innerHTML = '<i class="fa-brands fa-whatsapp" style="font-size:1.2rem;"></i> Share Log to WhatsApp';
            
            waBtn.addEventListener('click', () => {
                const loc = document.getElementById('site-location').value;
                const lab = document.getElementById('labor-count').value;
                if(!loc || !lab) {
                    alert("Please fill the Location and Labor Count before sharing.");
                    return;
                }
                
                window.shareToWhatsApp('SITE_LOG', {
                    date: new Date().toLocaleDateString('en-IN'),
                    location: loc,
                    labor_count: lab,
                    machine_hours: document.getElementById('machine-hours').value || 0,
                    diesel_liters: document.getElementById('diesel-liters').value || 0
                });
            });

            siteLogForm.appendChild(waBtn);
        }
    }, 1000); // Wait 1 sec for DOM to settle

});