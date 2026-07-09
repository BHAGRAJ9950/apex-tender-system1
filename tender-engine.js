// ==========================================================================
// APEX INFRASTRUCTURE ERP - SMART G-SCHEDULE & BOQ ENGINE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- DOM Elements ---
    const baseValueInput = document.getElementById('base-tender-value');
    const quoteSlider = document.getElementById('quote-slider');
    const quoteBadge = document.getElementById('quote-badge');
    
    const petiRateInput = document.getElementById('peti-rate');
    const ohSite = document.getElementById('oh-site');
    const ohContingency = document.getElementById('oh-contingency');
    const ohConsultancy = document.getElementById('oh-consultancy');

    // Result Displays
    const resQuotedAmount = document.getElementById('res-quoted-amount');
    const resOverheads = document.getElementById('res-overheads');
    const resPetiPayout = document.getElementById('res-peti-payout');
    const resNetProfit = document.getElementById('res-net-profit');
    
    const saveTenderBtn = document.getElementById('save-tender-btn');

    // --- Format Currency (Indian Rupees) ---
    const formatINR = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // --- Main Calculation Engine ---
    const calculateBOQ = () => {
        // 1. Get Base Values
        const baseValue = parseFloat(baseValueInput.value) || 0;
        const sliderValue = parseFloat(quoteSlider.value) || 0;
        
        // Update Badge UI
        let badgeText = sliderValue > 0 ? `${sliderValue}% Above` : (sliderValue < 0 ? `${sliderValue}% Below` : "At Par (0%)");
        quoteBadge.textContent = badgeText;
        quoteBadge.style.color = sliderValue >= 0 ? 'var(--neon-green)' : 'var(--crimson-red)';

        // 2. Calculate Quoted Amount based on PWD G-Schedule
        const quotedAmount = baseValue + (baseValue * (sliderValue / 100));

        // 3. Calculate Overheads (Deductions from Quoted Amount)
        const totalOverheadPercent = (parseFloat(ohSite.value) || 0) + 
                                     (parseFloat(ohContingency.value) || 0) + 
                                     (parseFloat(ohConsultancy.value) || 0);
        
        const overheadAmount = quotedAmount * (totalOverheadPercent / 100);

        // 4. Calculate Peti-Contractor Payout (Based on Base G-Schedule)
        const petiRatePercent = parseFloat(petiRateInput.value) || 0;
        const petiPayoutAmount = baseValue + (baseValue * (petiRatePercent / 100));

        // 5. Calculate Direct Net Margin (Profit)
        // Profit = Jo Paisa PWD se milega (Quoted) - Jo Legal Overheads me jayega - Jo Peti-Contractor ko dena hai
        const netProfit = quotedAmount - overheadAmount - petiPayoutAmount;

        // 6. Update UI (Dashboard)
        resQuotedAmount.textContent = formatINR(quotedAmount);
        resOverheads.textContent = "- " + formatINR(overheadAmount);
        resPetiPayout.textContent = "- " + formatINR(petiPayoutAmount);
        resNetProfit.textContent = formatINR(netProfit);

        // Update color for profit/loss indication
        if(netProfit < 0) {
            resNetProfit.style.color = 'var(--crimson-red)';
            resNetProfit.parentElement.style.borderLeft = '4px solid var(--crimson-red)';
        } else {
            resNetProfit.style.color = 'var(--neon-green)';
            resNetProfit.parentElement.style.borderLeft = '4px solid var(--neon-green)';
        }
    };

    // --- Event Listeners for Real-Time Updates ---
    // Inme se koi bhi value change hone par turant calculation update hogi
    const inputs = [baseValueInput, quoteSlider, petiRateInput, ohSite, ohContingency, ohConsultancy];
    inputs.forEach(input => {
        if(input) {
            input.addEventListener('input', calculateBOQ);
        }
    });

    // --- Save to Database Functionality ---
    if(saveTenderBtn) {
        saveTenderBtn.addEventListener('click', async () => {
            const baseValue = parseFloat(baseValueInput.value) || 0;
            if(baseValue === 0) {
                alert("Please enter a valid Base PWD Value before saving.");
                return;
            }

            const tenderData = {
                tender_name: `Tender Setup - ${new Date().toLocaleDateString()}`,
                base_value: baseValue,
                quoted_percentage: quoteSlider.value,
                peti_percentage: petiRateInput.value,
                net_profit: parseFloat(resNetProfit.textContent.replace(/[^\d.-]/g, '')),
                status: 'Draft',
                timestamp: new Date().getTime()
            };

            try {
                // Using the ApexDB object we created in database.js (Step 3)
                await ApexDB.add('Tender_Projects', tenderData);
                alert("Tender calculation saved successfully to local database!");
                
                // TODO: Update KPI Dashboard totals in app.js later
            } catch (error) {
                console.error("Failed to save tender:", error);
                alert("Error saving data. Please check console.");
            }
        });
    }
});