// ==========================================================================
// APEX INFRASTRUCTURE ERP - MAIN APP INITIALIZATION & NAVIGATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SPA Navigation Logic ---
    // Bina page refresh kiye modules ke beech switch karna
    const navBtns = document.querySelectorAll('.nav-btn');
    const modules = document.querySelectorAll('.app-module');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove 'active' state from all buttons
            navBtns.forEach(b => b.classList.remove('active'));
            // Hide all modules
            modules.forEach(m => {
                m.classList.remove('active-module');
                m.classList.add('hidden-module');
            });

            // Add 'active' state to clicked button
            btn.classList.add('active');
            
            // Show the target module
            const targetId = btn.getAttribute('data-target');
            const targetModule = document.getElementById(targetId);
            if(targetModule) {
                targetModule.classList.remove('hidden-module');
                targetModule.classList.add('active-module');
            }
        });
    });


    // --- 2. Live KPI Dashboard Updater ---
    // Jab app load ho, IndexedDB se total profit aur tender value nikal ke Dashboard par dikhao
    const updateDashboardKPIs = async () => {
        try {
            // Access data from database.js
            const tenders = await ApexDB.getAll('Tender_Projects');
            
            let totalTenderValue = 0;
            let totalNetProfit = 0;

            tenders.forEach(tender => {
                totalTenderValue += (parseFloat(tender.base_value) || 0);
                totalNetProfit += (parseFloat(tender.net_profit) || 0);
            });

            // Format as INR
            const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

            document.getElementById('kpi-total-value').textContent = formatter.format(totalTenderValue);
            
            const profitEl = document.getElementById('kpi-net-profit');
            const profitCard = document.getElementById('kpi-profit-card');
            
            profitEl.textContent = formatter.format(totalNetProfit);

            // Dynamic Styling logic: Crimson for Loss, Neon for Profit
            if (totalNetProfit < 0) {
                profitEl.style.color = 'var(--crimson-red)';
                profitCard.classList.remove('profit-glow');
                profitCard.classList.add('loss-glow'); // Defined in CSS
            } else {
                profitEl.style.color = 'var(--neon-green)';
                profitCard.classList.add('profit-glow');
                profitCard.classList.remove('loss-glow');
            }

        } catch (error) {
            console.error("KPI Dashboard Error (Waiting for DB):", error);
        }
    };

    // DB setup hone ka thoda wait karke KPIs update karo
    setTimeout(updateDashboardKPIs, 800);
});