document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // --- PIDILITE DATABASE (DUMMY DATA) ---
    const pidiliteDB = {
        vendors: ['Parekh Plast', 'Jolly Containers', 'RP Industries', 'Vandmarks', 'MoldTech'],
        pilTeam: ['Bharat Maru', 'Srinivas', 'Hitesh', 'Ayaz', 'Trupti', 'Sanjeev', 'Dwijeesh'],
        brands: ['Fevicol MR 100g', 'Fevicol SH 1kg', 'Fevikwik 1g', 'Fevikwik 3g', 'Roff NCA 20kg', 'Fevicol Flexi Pack', 'M-Seal 100g'],
        projects: [
            { 
                id: 'P001', asset: 'A500010', brand: 'Fevicol MR 100g', vendor: 'Parekh Plast', pilTeam: 'Bharat Maru', machine: 'Machine 1', status: 'Active', alerts: 1,
                details: { dimensions: '180x1200', processingParams: 'Temp: 220C, Pressure: 80bar', annualVerification: 'Verified (Jan 2026)', scrapDetails: 'N/A', inactiveDetails: 'N/A' },
                reports: { mouldQual: 'Approved', historyCard: 'Updated', spares: 'In Stock', componentQual: 'Approved', commissioning: 'Completed', lineTrials: 'Passed (IQ/OQ/PQ)', stability: 'Ongoing', transit: 'Passed' },
                commercial: { rfq: 'Uploaded', contracts: 'Valid till Dec 2027' },
                sap: { po: 'PO-99281', grn: 'GRN-4421', far: 'FAR-110', atr: 'ATR-001' }
            },
            { 
                id: 'P002', asset: 'A500017', brand: 'Fevikwik 1g', vendor: 'Jolly Containers', pilTeam: 'Srinivas', machine: 'Machine 2', status: 'Active', alerts: 0,
                details: { dimensions: '90x400', processingParams: 'Temp: 180C, Pressure: 60bar', annualVerification: 'Pending', scrapDetails: 'N/A', inactiveDetails: 'N/A' },
                reports: { mouldQual: 'Approved', historyCard: 'Updated', spares: 'Low Stock', componentQual: 'Approved', commissioning: 'Completed', lineTrials: 'Passed', stability: 'Passed', transit: 'Passed' },
                commercial: { rfq: 'Uploaded', contracts: 'Valid till Jun 2026' },
                sap: { po: 'PO-99282', grn: 'GRN-4422', far: 'FAR-111', atr: 'ATR-002' }
            },
            { 
                id: 'P003', asset: 'A500018', brand: 'Roff NCA 20kg', vendor: 'RP Industries', pilTeam: 'Hitesh', machine: 'Machine 3', status: 'Active', alerts: 0,
                details: { dimensions: '300x1500', processingParams: 'Temp: 240C, Pressure: 90bar', annualVerification: 'Verified (Feb 2026)', scrapDetails: 'N/A', inactiveDetails: 'N/A' },
                reports: { mouldQual: 'Approved', historyCard: 'Updated', spares: 'In Stock', componentQual: 'Approved', commissioning: 'Completed', lineTrials: 'Passed', stability: 'N/A', transit: 'Passed' },
                commercial: { rfq: 'Uploaded', contracts: 'Valid till Mar 2028' },
                sap: { po: 'PO-99283', grn: 'GRN-4423', far: 'FAR-112', atr: 'ATR-003' }
            },
            { 
                id: 'P004', asset: 'A500019', brand: 'Fevicol SH 1kg', vendor: 'Parekh Plast', pilTeam: 'Ayaz', machine: 'Machine 4', status: 'Active', alerts: 2,
                details: { dimensions: '200x1300', processingParams: 'Temp: 220C, Pressure: 85bar', annualVerification: 'Overdue', scrapDetails: 'N/A', inactiveDetails: 'N/A' },
                reports: { mouldQual: 'Pending', historyCard: 'Outdated', spares: 'Depleted', componentQual: 'Pending', commissioning: 'Pending', lineTrials: 'Scheduled', stability: 'Pending', transit: 'Pending' },
                commercial: { rfq: 'Pending', contracts: 'Expired' },
                sap: { po: 'PO-99284', grn: 'Pending', far: 'Pending', atr: 'Pending' }
            },
            { 
                id: 'P005', asset: 'A500021', brand: 'M-Seal 100g', vendor: 'Vandmarks', pilTeam: 'Trupti', machine: 'Machine 2', status: 'Inactive', alerts: 0,
                details: { dimensions: '150x800', processingParams: 'Temp: 200C, Pressure: 70bar', annualVerification: 'N/A', scrapDetails: 'N/A', inactiveDetails: 'Product Discontinued' },
                reports: { mouldQual: 'Approved', historyCard: 'Archived', spares: 'N/A', componentQual: 'Approved', commissioning: 'Completed', lineTrials: 'Passed', stability: 'Passed', transit: 'Passed' },
                commercial: { rfq: 'Archived', contracts: 'Terminated' },
                sap: { po: 'PO-99285', grn: 'GRN-4425', far: 'FAR-114', atr: 'ATR-005' }
            },
            { 
                id: 'P006', asset: 'A500022', brand: 'Fevikwik 3g', vendor: 'Jolly Containers', pilTeam: 'Sanjeev', machine: 'Machine 1', status: 'Active', alerts: 1,
                details: { dimensions: '100x450', processingParams: 'Temp: 185C, Pressure: 65bar', annualVerification: 'Verified (Dec 2025)', scrapDetails: 'N/A', inactiveDetails: 'N/A' },
                reports: { mouldQual: 'Approved', historyCard: 'Updated', spares: 'Critical', componentQual: 'Approved', commissioning: 'Completed', lineTrials: 'Passed', stability: 'Passed', transit: 'Passed' },
                commercial: { rfq: 'Uploaded', contracts: 'Valid till Jan 2027' },
                sap: { po: 'PO-99286', grn: 'GRN-4426', far: 'FAR-115', atr: 'ATR-006' }
            },
            { 
                id: 'P007', asset: 'A500023', brand: 'Fevicol Flexi Pack', vendor: 'RP Industries', pilTeam: 'Dwijeesh', machine: 'Machine 1', status: 'Active', alerts: 0,
                details: { dimensions: '120x900', processingParams: 'Temp: 210C, Pressure: 75bar', annualVerification: 'Verified (Mar 2026)', scrapDetails: 'N/A', inactiveDetails: 'N/A' },
                reports: { mouldQual: 'Approved', historyCard: 'Updated', spares: 'In Stock', componentQual: 'Approved', commissioning: 'Completed', lineTrials: 'Passed', stability: 'Passed', transit: 'Passed' },
                commercial: { rfq: 'Uploaded', contracts: 'Valid till Sep 2026' },
                sap: { po: 'PO-99287', grn: 'GRN-4427', far: 'FAR-116', atr: 'ATR-007' }
            },
            { 
                id: 'P008', asset: 'A500024', brand: 'Fevicol MR 100g', vendor: 'MoldTech', pilTeam: 'Bharat Maru', machine: 'Machine 2', status: 'Active', alerts: 0,
                details: { dimensions: '180x1200', processingParams: 'Temp: 220C, Pressure: 80bar', annualVerification: 'Verified (Feb 2026)', scrapDetails: 'N/A', inactiveDetails: 'N/A' },
                reports: { mouldQual: 'Approved', historyCard: 'Updated', spares: 'In Stock', componentQual: 'Approved', commissioning: 'Completed', lineTrials: 'Passed', stability: 'Passed', transit: 'Passed' },
                commercial: { rfq: 'Uploaded', contracts: 'Valid till Nov 2028' },
                sap: { po: 'PO-99288', grn: 'GRN-4428', far: 'FAR-117', atr: 'ATR-008' }
            },
        ],
        part2Projects: [
            { name: 'Fevicol Flexi Pack 50g', pmQual: 'Approved', lineTrials: 'Pending', stability: 'Ongoing', transit: 'N/A' },
            { name: 'Roff Sack 50kg', pmQual: 'Approved', lineTrials: 'Passed', stability: 'Passed', transit: 'Passed' },
            { name: 'Fevikwik Display Card', pmQual: 'Pending', lineTrials: 'Scheduled', stability: 'N/A', transit: 'Pending' },
            { name: 'M-Seal Blister Pack', pmQual: 'Approved', lineTrials: 'Passed', stability: 'Ongoing', transit: 'Passed' }
        ],
        maintenanceAlerts: [
            { statusClass: 'status-green', statusText: 'OK', asset: 'A500010', brand: 'Fevicol MR 100g', cycles: '45,200', threshold: '100,000', action: 'None' },
            { statusClass: 'status-yellow', statusText: 'Warning', asset: 'A500017', brand: 'Fevikwik 1g', cycles: '92,500', threshold: '100,000', action: 'Schedule PM Level 1' },
            { statusClass: 'status-red', statusText: 'Overdue', asset: 'A500022', brand: 'Fevikwik 3g', cycles: '105,000', threshold: '100,000', action: 'Immediate PM Required' },
            { statusClass: 'status-green', statusText: 'OK', asset: 'A500024', brand: 'Fevicol MR 100g', cycles: '12,000', threshold: '50,000', action: 'None' },
        ]
    };

    let currentFilteredData = [...pidiliteDB.projects];

    // --- POPULATE FILTERS ---
    const populateSelect = (id, items) => {
        const select = document.getElementById(id);
        if(!select) return;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        });
    };
    populateSelect('filter-vendor', pidiliteDB.vendors);
    populateSelect('filter-pil-team', pidiliteDB.pilTeam);
    
    // Populate Maintenance Asset Dropdown
    const maintAssetSelect = document.getElementById('maint-asset-select');
    if(maintAssetSelect) {
        pidiliteDB.projects.forEach(p => {
            const option = document.createElement('option');
            option.value = p.asset;
            option.textContent = `${p.asset} (${p.brand})`;
            maintAssetSelect.appendChild(option);
        });
    }

    // --- VIEW SWITCHING LOGIC ---
    const navLinks = document.querySelectorAll('#main-nav a[data-target]');
    const views = document.querySelectorAll('.view-container');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update active view
            views.forEach(view => {
                if (view.id === targetId) {
                    view.classList.remove('hidden');
                } else {
                    view.classList.add('hidden');
                }
            });
        });
    });

    // --- MODAL LOGIC ---
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const btnCloseModal = document.getElementById('close-modal');
    const btnModalClose = document.getElementById('btn-modal-close');

    const openModal = (project) => {
        modalTitle.textContent = `Project Lifecycle: ${project.asset} (${project.brand})`;
        
        const getBadgeClass = (val) => {
            const v = val.toLowerCase();
            if(v.includes('approved') || v.includes('passed') || v.includes('completed') || v.includes('verified') || v.includes('in stock') || v.includes('valid')) return 'badge-green';
            if(v.includes('pending') || v.includes('ongoing') || v.includes('scheduled') || v.includes('low stock')) return 'badge-amber';
            if(v.includes('overdue') || v.includes('depleted') || v.includes('critical') || v.includes('expired')) return 'badge-red';
            return 'badge-gray';
        };

        modalBody.innerHTML = `
            <div class="modal-tabs">
                <div class="modal-tab active" data-tab="tab-details">Mould Details</div>
                <div class="modal-tab" data-tab="tab-reports">Reports & Trials</div>
                <div class="modal-tab" data-tab="tab-commercial">Commercial & SAP</div>
            </div>

            <!-- TAB 1: DETAILS -->
            <div id="tab-details" class="modal-tab-content active">
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">Asset Code</span><span class="detail-value">${project.asset}</span></div>
                    <div class="detail-item"><span class="detail-label">Brand / SKU</span><span class="detail-value">${project.brand}</span></div>
                    <div class="detail-item"><span class="detail-label">Vendor</span><span class="detail-value">${project.vendor}</span></div>
                    <div class="detail-item"><span class="detail-label">PIL TEAM</span><span class="detail-value">${project.pilTeam}</span></div>
                    <div class="detail-item"><span class="detail-label">Machine Assigned</span><span class="detail-value">${project.machine}</span></div>
                    <div class="detail-item"><span class="detail-label">Dimensions</span><span class="detail-value">${project.details.dimensions}</span></div>
                    <div class="detail-item"><span class="detail-label">Processing Params</span><span class="detail-value">${project.details.processingParams}</span></div>
                    <div class="detail-item"><span class="detail-label">Annual Verification</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.details.annualVerification)}">${project.details.annualVerification}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Scrap Details</span><span class="detail-value">${project.details.scrapDetails}</span></div>
                    <div class="detail-item"><span class="detail-label">Inactive Details</span><span class="detail-value">${project.details.inactiveDetails}</span></div>
                </div>
            </div>

            <!-- TAB 2: REPORTS -->
            <div id="tab-reports" class="modal-tab-content">
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">Mould Qualification (Vendor)</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.reports.mouldQual)}">${project.reports.mouldQual}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Mould History Card</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.reports.historyCard)}">${project.reports.historyCard}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Spares & Consumption</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.reports.spares)}">${project.reports.spares}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Component Qualification</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.reports.componentQual)}">${project.reports.componentQual}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Mould Commissioning (PIL)</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.reports.commissioning)}">${project.reports.commissioning}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Line Trials (IQ/OQ/PQ)</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.reports.lineTrials)}">${project.reports.lineTrials}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Stability Reports</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.reports.stability)}">${project.reports.stability}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Transit Trial Reports</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.reports.transit)}">${project.reports.transit}</span></span></div>
                </div>
            </div>

            <!-- TAB 3: COMMERCIAL & SAP -->
            <div id="tab-commercial" class="modal-tab-content">
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">RFQs & Commercial Docs</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.commercial.rfq)}">${project.commercial.rfq}</span></span></div>
                    <div class="detail-item"><span class="detail-label">Linked Contracts</span><span class="detail-value"><span class="badge-status ${getBadgeClass(project.commercial.contracts)}">${project.commercial.contracts}</span></span></div>
                    <div class="detail-item"><span class="detail-label">SAP P.O.</span><span class="detail-value"><span class="badge-status badge-blue">${project.sap.po}</span></span></div>
                    <div class="detail-item"><span class="detail-label">SAP GRN</span><span class="detail-value"><span class="badge-status badge-blue">${project.sap.grn}</span></span></div>
                    <div class="detail-item"><span class="detail-label">SAP FAR</span><span class="detail-value"><span class="badge-status badge-blue">${project.sap.far}</span></span></div>
                    <div class="detail-item"><span class="detail-label">SAP ATR (Asset Transfer)</span><span class="detail-value"><span class="badge-status badge-blue">${project.sap.atr}</span></span></div>
                </div>
            </div>
        `;

        // Tab Switching Logic
        const tabs = modalBody.querySelectorAll('.modal-tab');
        const contents = modalBody.querySelectorAll('.modal-tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                modalBody.querySelector(`#${tab.getAttribute('data-tab')}`).classList.add('active');
            });
        });

        modal.classList.add('active');
    };

    const closeModal = () => {
        modal.classList.remove('active');
    };

    btnCloseModal.addEventListener('click', closeModal);
    btnModalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });

    // --- RENDER TABLE LOGIC ---
    const renderProjectsTable = (data) => {
        const tbodyPart1 = document.querySelector('#table-part1 tbody');
        tbodyPart1.innerHTML = ''; // Clear existing
        
        // Update KPIs
        document.getElementById('kpi-total-moulds').textContent = data.length;
        const totalAlerts = data.reduce((sum, p) => sum + p.alerts, 0);
        document.getElementById('kpi-alerts-pending').textContent = totalAlerts;

        if (data.length === 0) {
            tbodyPart1.innerHTML = '<tr><td colspan="6" class="text-center text-muted italic py-3">No projects match the selected filters.</td></tr>';
            return;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'clickable-row';
            tr.innerHTML = `
                <td class="font-medium text-blue">${row.asset}</td>
                <td>${row.brand}</td>
                <td>${row.vendor}</td>
                <td>${row.pilTeam}</td>
                <td>${row.machine}</td>
                <td class="text-center">
                    ${row.alerts > 0 ? `<i data-lucide="alert-triangle" class="icon-alert text-red"></i>` : `<i data-lucide="check-circle" class="icon-sm text-green"></i>`}
                </td>
            `;
            tr.addEventListener('click', () => openModal(row));
            tbodyPart1.appendChild(tr);
        });
        
        lucide.createIcons();
    };

    // --- FILTERING LOGIC ---
    const applyFilters = () => {
        const vendorFilter = document.getElementById('filter-vendor').value;
        const pilTeamFilter = document.getElementById('filter-pil-team').value;
        
        let statusFilter = 'Active';
        const statusRadios = document.getElementsByName('status');
        for (const radio of statusRadios) {
            if (radio.checked) {
                statusFilter = radio.value;
                break;
            }
        }

        currentFilteredData = pidiliteDB.projects.filter(p => {
            const matchVendor = vendorFilter === 'all' || p.vendor === vendorFilter;
            const matchPilTeam = pilTeamFilter === 'all' || p.pilTeam === pilTeamFilter;
            const matchStatus = statusFilter === 'All' || p.status === statusFilter;
            return matchVendor && matchPilTeam && matchStatus;
        });

        renderProjectsTable(currentFilteredData);
    };

    // Add Event Listeners to Filters
    document.getElementById('filter-vendor').addEventListener('change', applyFilters);
    document.getElementById('filter-pil-team').addEventListener('change', applyFilters);
    document.getElementsByName('status').forEach(radio => radio.addEventListener('change', applyFilters));

    // Initial Render
    applyFilters();

    // 3. Populate Alerts Data
    const alertsData = [
        { time: '10 mins ago', text: 'Capacity Utilization Warning: Mould A500010 exceeding 90% forecast capacity.', type: 'red' },
        { time: '2 hours ago', text: 'Contract Expiry: Vendor RP Industries contract expires in 15 days.', type: 'amber' },
        { time: '5 hours ago', text: 'Spare Depletion: O-Ring Kit (Standard) below minimum stock.', type: 'red' },
        { time: '1 day ago', text: 'Vendor NC Escalation: Jolly Containers missing mandatory annual verification data.', type: 'red' },
        { time: '2 days ago', text: 'SAP Sync: PO-99281 successfully synced with FAR.', type: 'green' }
    ];

    const alertsList = document.getElementById('alerts-list');
    alertsData.forEach(alert => {
        const div = document.createElement('div');
        div.className = `alert-item ${alert.type}`;
        div.innerHTML = `
            <i data-lucide="${alert.type === 'green' ? 'check-circle' : 'alert-triangle'}" class="icon-alert"></i>
            <span><span class="font-medium">${alert.time}</span> - ${alert.text}</span>
        `;
        alertsList.appendChild(div);
    });

    // Populate Part 2 Table Data
    const tbodyPart2 = document.querySelector('#table-part2 tbody');
    if(tbodyPart2) {
        const getBadgeClass = (val) => {
            const v = val.toLowerCase();
            if(v.includes('approved') || v.includes('passed')) return 'text-green font-medium';
            if(v.includes('pending') || v.includes('ongoing') || v.includes('scheduled')) return 'text-amber font-medium';
            return 'text-muted';
        };

        pidiliteDB.part2Projects.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-medium">${row.name}</td>
                <td class="${getBadgeClass(row.pmQual)}">${row.pmQual}</td>
                <td class="${getBadgeClass(row.lineTrials)}">${row.lineTrials}</td>
                <td class="${getBadgeClass(row.stability)}">${row.stability}</td>
                <td class="${getBadgeClass(row.transit)}">${row.transit}</td>
            `;
            tbodyPart2.appendChild(tr);
        });
    }

    // 4. Populate Status Alerts (Maintenance View)
    const tbodyStatusAlerts = document.querySelector('#table-status-alerts tbody');
    document.getElementById('kpi-molds-prod').textContent = pidiliteDB.projects.filter(p => p.status === 'Active').length;

    pidiliteDB.maintenanceAlerts.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="status-dot ${row.statusClass}"></span>${row.statusText}</td>
            <td class="font-medium">${row.asset}</td>
            <td>${row.brand}</td>
            <td>${row.cycles}</td>
            <td>${row.threshold}</td>
            <td class="${row.statusClass === 'status-red' ? 'text-red font-bold' : ''}">${row.action}</td>
        `;
        tbodyStatusAlerts.appendChild(tr);
    });

    // 5. Populate Inventory Monitoring (Maintenance View)
    const inventoryData = [
        { item: 'Hot Runner Nozzle (Type A)', stock: '12', reorder: '15', status: 'Re-order' },
        { item: 'Ejector Pin Set (5mm)', stock: '45', reorder: '20', status: 'OK' },
        { item: 'O-Ring Kit (Standard)', stock: '2', reorder: '10', status: 'Critical' },
    ];

    const tbodyInventory = document.querySelector('#table-inventory tbody');
    inventoryData.forEach(row => {
        const tr = document.createElement('tr');
        const statusColor = row.status === 'Critical' ? 'text-red font-bold' : (row.status === 'Re-order' ? 'text-amber font-bold' : 'text-green');
        tr.innerHTML = `
            <td>${row.item}</td>
            <td>${row.stock}</td>
            <td>${row.reorder}</td>
            <td class="${statusColor}">${row.status}</td>
        `;
        tbodyInventory.appendChild(tr);
    });

    // Re-initialize icons for dynamically added elements
    lucide.createIcons();

    // 6. Initialize Chart.js for the Line Chart
    const ctx = document.getElementById('capacityChart').getContext('2d');
    
    // Data matching the screenshot trend
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataPoints = [22, 32, 35, 38, 48, 51, 58, 68, 73, 80, 95];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Capacity Utilization',
                data: dataPoints,
                borderColor: '#2563eb', // Blue
                backgroundColor: '#2563eb',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false,
                tension: 0.1 // Slight curve
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide legend to match screenshot
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: { size: 10 },
                        color: '#64748b'
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: '#e2e8f0',
                        drawBorder: false,
                        borderDash: [3, 3]
                    },
                    ticks: {
                        stepSize: 20,
                        font: { size: 10 },
                        color: '#64748b'
                    }
                }
            }
        }
    });

    // --- EXPORT LOGIC ---
    const btnExportExcel = document.getElementById('btn-export-excel');
    const btnExportPdf = document.getElementById('btn-export-pdf');

    btnExportExcel.addEventListener('click', () => {
        // Generate CSV from currentFilteredData
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Asset Code,Brand / SKU,Vendor,PIL TEAM,Machine,Status,Alerts\n";
        
        currentFilteredData.forEach(p => {
            const row = `${p.asset},"${p.brand}","${p.vendor}","${p.pilTeam}","${p.machine}",${p.status},${p.alerts}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Pidilite_Moulds_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    btnExportPdf.addEventListener('click', () => {
        // Simulate PDF generation by opening a print window with styled content
        const printWindow = window.open('', '_blank');
        
        let htmlContent = `
            <html>
            <head>
                <title>Pidilite P-MMS Report</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                    h1 { color: #00529b; border-bottom: 2px solid #00529b; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
                    th { background-color: #f8fafc; color: #475569; }
                    .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
                </style>
            </head>
            <body>
                <h1>Pidilite P-MMS: Filtered Moulds Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Asset Code</th>
                            <th>Brand / SKU</th>
                            <th>Vendor</th>
                            <th>PIL TEAM</th>
                            <th>Machine</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        currentFilteredData.forEach(p => {
            htmlContent += `
                <tr>
                    <td><strong>${p.asset}</strong></td>
                    <td>${p.brand}</td>
                    <td>${p.vendor}</td>
                    <td>${p.pilTeam}</td>
                    <td>${p.machine}</td>
                    <td>${p.status}</td>
                </tr>
            `;
        });

        htmlContent += `
                    </tbody>
                </table>
                <div class="footer">Confidential - Pidilite Industries Private Limited</div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    });
});
