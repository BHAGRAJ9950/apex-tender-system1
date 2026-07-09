// ==========================================================================
// APEX INFRASTRUCTURE ERP - FUNDS & LEGAL TRACKER
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const fundForm = document.getElementById('add-fund-form');
    const tableBody = document.getElementById('funds-table-body');

    // Indian Currency Formatter
    const formatINR = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Table UI me data render karne ka function
    const renderFundsTable = async () => {
        if (!tableBody) return;
        
        try {
            // ApexDB (database.js se) saara Funds ka data nikalo
            const funds = await ApexDB.getAll('Funds_Legal');
            tableBody.innerHTML = ''; // Pehle se jo hai clear karo

            if (funds.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No active deposits found.</td></tr>`;
                return;
            }

            const today = new Date();

            // Data ko loop karke table me add karna
            funds.forEach(fund => {
                const expiryDate = new Date(fund.maturity_date);
                
                // Expiry Logic: Alert System (Neon/Amber/Crimson)
                const timeDiff = expiryDate.getTime() - today.getTime();
                const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

                let statusBadge = '';
                if (daysLeft < 0) {
                    statusBadge = `<span class="status-badge badge-danger">Expired (${Math.abs(daysLeft)}d ago)</span>`;
                } else if (daysLeft <= 30) {
                    statusBadge = `<span class="status-badge badge-warning">Expiring Soon (${daysLeft}d left)</span>`;
                } else {
                    statusBadge = `<span class="status-badge badge-active">Active (${daysLeft}d left)</span>`;
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${fund.type}</strong></td>
                    <td>${fund.tender_name}</td>
                    <td>${formatINR(fund.amount)}</td>
                    <td>${expiryDate.toLocaleDateString('en-IN')}</td>
                    <td>${statusBadge}</td>
                `;
                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error("Error loading funds:", error);
        }
    };

    // Jab form submit ho (Naya Fund Add karna)
    if (fundForm) {
        fundForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Page refresh roko

            const fundData = {
                type: document.getElementById('fund-type').value,
                tender_name: document.getElementById('fund-tender-name').value,
                amount: parseFloat(document.getElementById('fund-amount').value),
                maturity_date: document.getElementById('fund-expiry').value,
                timestamp: new Date().getTime()
            };

            try {
                // Database me save karo
                await ApexDB.add('Funds_Legal', fundData);
                alert(`${fundData.type} Record Added Successfully!`);
                
                // Form clear karo aur table update karo
                fundForm.reset();
                renderFundsTable();
            } catch (error) {
                console.error("Failed to add fund:", error);
                alert("Error saving record.");
            }
        });
    }

    // Taki page load hotey hi database se data table me show ho jaye
    // Hum timeout de rahe hain taaki DB initialize hone ka thoda time mil jaye
    setTimeout(() => {
        renderFundsTable();
    }, 500);

});