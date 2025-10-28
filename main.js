// assets/js/main.js - FINAL CORRECTED VERSION WITH AUTH INTEGRATION

// Global variables
let reportsData = [];
let recordsData = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Main.js loaded - initializing application');
    initializeThemeToggle();
    initializeCurrentYear();
    initializeForms();
    initializeDataDisplay();
    initializeAuthAwareFeatures();
    
    // Test database connection
    setTimeout(() => {
        console.log('🔄 Testing database connection...');
        getAllReports().then(reports => {
            console.log(`📊 Found ${reports.length} reports in database`);
        }).catch(error => {
            console.error('❌ Database test failed:', error);
        });
    }, 1000);
});

// Theme toggle
function initializeThemeToggle() {
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    updateThemeButton(currentTheme);

    themeToggle.addEventListener('click', function() {
        const newTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    });

    function updateThemeButton(theme) {
        themeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
}

// Copyright year
function initializeCurrentYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Auth-aware initialization
function initializeAuthAwareFeatures() {
    const currentUser = getCurrentUser();
    
    // Show/hide auth-only features
    const authOnlyElements = document.querySelectorAll('[data-auth-only]');
    const guestOnlyElements = document.querySelectorAll('[data-guest-only]');
    
    if (currentUser) {
        authOnlyElements.forEach(el => el.style.display = '');
        guestOnlyElements.forEach(el => el.style.display = 'none');
        
        // Update user-specific content
        const userWelcome = document.getElementById('userWelcome');
        if (userWelcome) {
            userWelcome.textContent = `Welcome, ${currentUser.firstName}!`;
        }
    } else {
        authOnlyElements.forEach(el => el.style.display = 'none');
        guestOnlyElements.forEach(el => el.style.display = '');
    }
}

// Form handling
function initializeForms() {
    initializeReportForm();
    initializeRecordForm();
    initializeContactForm();
}

function initializeReportForm() {
    const reportForm = document.getElementById('reportForm');
    if (!reportForm) {
        console.log('ℹ️ Report form not found on this page');
        return;
    }

    console.log('✅ Initializing report form');

    reportForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Report form submitted');

        // Check authentication
        if (!isLoggedIn()) {
            showAlert('reportAlert', 'Please login to submit a report!', 'warning');
            window.location.href = 'login.html?redirect=report.html';
            return;
        }

        // Basic validation
        if (!this.checkValidity()) {
            console.log('❌ Form validation failed');
            e.stopPropagation();
            this.classList.add('was-validated');
            return;
        }

        // Get form data
        const formData = new FormData(this);
        const reportData = {
            name: formData.get('name') || 'Anonymous',
            contact: formData.get('contact') || 'Not provided',
            location: formData.get('location'),
            type: formData.get('type'),
            date: formData.get('date'),
            time: formData.get('time'),
            description: formData.get('description')
        };

        console.log('📋 Form data collected:', reportData);

        // Validate required fields
        if (!reportData.location || !reportData.type || !reportData.date || !reportData.time || !reportData.description) {
            showAlert('reportAlert', 'Please fill all required fields!', 'danger');
            return;
        }

        try {
            console.log('💾 Attempting to save report...');
            // Save report
            const reportId = await saveReport(reportData);
            console.log('✅ Report saved successfully with ID:', reportId);

            // ========== CRITICAL: Notify charts about new report ==========
            console.log('📢 Main.js: Dispatching events for chart updates');
            
            // Method 1: Dispatch custom event
            const reportEvent = new CustomEvent('reportAdded', {
                detail: { reportId: reportId }
            });
            document.dispatchEvent(reportEvent);
            
            // Method 2: Dispatch reportsUpdated event
            const updateEvent = new CustomEvent('reportsUpdated');
            document.dispatchEvent(updateEvent);
            
            // Method 3: Update localStorage for cross-page communication
            localStorage.setItem('crimeReportsUpdated', Date.now().toString());
            
            console.log('✅ All chart update events dispatched');

            // Show success message
            showAlert('reportAlert', '✅ Report submitted successfully! Report ID: ' + reportId);
            
            // Reset form
            reportForm.reset();
            reportForm.classList.remove('was-validated');

            // Refresh data displays if they exist
            setTimeout(() => {
                if (typeof loadReports === 'function') {
                    loadReports();
                }
                if (typeof initializeCharts === 'function') {
                    initializeCharts();
                }
                if (typeof updateDatabaseViewer === 'function') {
                    updateDatabaseViewer();
                }
            }, 1500);

        } catch (error) {
            console.error('❌ Error submitting report:', error);
            showAlert('reportAlert', '❌ Error saving report: ' + error.message, 'danger');
        }
    });
}

function initializeRecordForm() {
    const recordForm = document.getElementById('recordForm');
    if (!recordForm) return;

    recordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Check authentication and admin status
        if (!isLoggedIn()) {
            showAlert('recordAlert', 'Please login to manage records!', 'warning');
            window.location.href = 'login.html?redirect=records.html';
            return;
        }

        if (!isAdmin()) {
            showAlert('recordAlert', 'Only administrators can manage police records!', 'warning');
            return;
        }
        
        if (!this.checkValidity()) {
            e.stopPropagation();
            this.classList.add('was-validated');
            return;
        }

        const formData = new FormData(this);
        const recordData = {
            name: formData.get('name'),
            alias: formData.get('alias') || null,
            crimeType: formData.get('crimeType'),
            riskLevel: formData.get('riskLevel'),
            lastKnownLocation: formData.get('lastKnownLocation') || null,
            notes: formData.get('notes') || null
        };

        try {
            const recordId = await saveRecord(recordData);
            showAlert('recordAlert', '✅ Record saved successfully!');
            recordForm.reset();
            recordForm.classList.remove('was-validated');
            
            if (typeof loadRecords === 'function') {
                loadRecords();
            }
            if (typeof updateDatabaseViewer === 'function') {
                updateDatabaseViewer();
            }
            
        } catch (error) {
            console.error('❌ Error saving record:', error);
            showAlert('recordAlert', '❌ Error saving record: ' + error.message, 'danger');
        }
    });
}

function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!this.checkValidity()) {
            e.stopPropagation();
            this.classList.add('was-validated');
            return;
        }

        const formData = new FormData(this);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };

        try {
            const contactId = await saveContact(contactData);
            showAlert('contactAlert', '✅ Message sent successfully!');
            contactForm.reset();
            contactForm.classList.remove('was-validated');
            
        } catch (error) {
            console.error('❌ Error saving contact:', error);
            showAlert('contactAlert', '❌ Error sending message: ' + error.message, 'danger');
        }
    });
}

// Data display
function initializeDataDisplay() {
    if (document.getElementById('reportsTableBody')) {
        console.log('✅ Initializing reports display');
        loadReports();
        initializeReportFilters();
    }
    
    if (document.getElementById('recordsTableBody')) {
        console.log('✅ Initializing records display');
        loadRecords();
        initializeRecordSearch();
    }
    
    if (document.getElementById('dbReports')) {
        console.log('✅ Initializing database viewer');
        updateDatabaseViewer();
    }
}

function initializeReportFilters() {
    const filter = document.getElementById('reportFilter');
    const search = document.getElementById('reportSearch');
    
    if (filter) {
        filter.addEventListener('change', loadReports);
    }
    
    if (search) {
        search.addEventListener('input', loadReports);
    }
}

function initializeRecordSearch() {
    const search = document.getElementById('recordSearch');
    if (search) {
        search.addEventListener('input', loadRecords);
    }
}

async function loadReports() {
    try {
        console.log('🔄 Loading reports...');
        const reports = await getAllReports();
        const tbody = document.getElementById('reportsTableBody');
        
        if (!tbody) return;
        
        console.log(`✅ Loaded ${reports.length} reports`);

        if (reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No reports found. <a href="report.html" class="btn btn-sm btn-primary">Create your first report</a></td></tr>';
            return;
        }

        // Sort by ID descending (newest first)
        reports.sort((a, b) => b.id - a.id);

        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>${report.id}</td>
                <td>${report.type || 'Unknown'}</td>
                <td>${report.location || 'Unknown'}</td>
                <td>${formatDate(report.date)} ${report.time || ''}</td>
                <td><span class="badge bg-warning">${report.status || 'Pending'}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewReport(${report.id})">View</button>
                    ${isAdmin() ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteReport(${report.id})">Delete</button>` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error loading reports:', error);
        const tbody = document.getElementById('reportsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">❌ Error loading reports: ' + error.message + '</td></tr>';
        }
    }
}

async function loadRecords() {
    try {
        console.log('🔄 Loading records...');
        const records = await getAllRecords();
        const tbody = document.getElementById('recordsTableBody');
        
        if (!tbody) return;
        
        console.log(`✅ Loaded ${records.length} records`);

        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No records found. Add your first record above.</td></tr>';
            return;
        }

        // Sort by ID descending (newest first)
        records.sort((a, b) => b.id - a.id);

        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${record.alias || '-'}</td>
                <td>${record.crimeType}</td>
                <td><span class="badge ${getRiskBadgeClass(record.riskLevel)}">${record.riskLevel}</span></td>
                <td>${record.lastKnownLocation || '-'}</td>
                <td class="text-end">
                    ${isAdmin() ? `<button class="btn btn-sm btn-outline-danger" onclick="deletePoliceRecord(${record.id})">Delete</button>` : '<span class="text-muted">Admin only</span>'}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error loading records:', error);
        const tbody = document.getElementById('recordsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">❌ Error loading records: ' + error.message + '</td></tr>';
        }
    }
}

// Database viewer
async function updateDatabaseViewer() {
    try {
        const reports = await getAllReports();
        const records = await getAllRecords();
        
        const reportsElement = document.getElementById('dbReports');
        const recordsElement = document.getElementById('dbRecords');
        
        if (reportsElement) {
            reportsElement.textContent = JSON.stringify(reports, null, 2);
        }
        
        if (recordsElement) {
            recordsElement.textContent = JSON.stringify(records, null, 2);
        }
        
        console.log('✅ Database viewer updated');
    } catch (error) {
        console.error('❌ Error updating database viewer:', error);
    }
}

// Utility functions
function showAlert(alertId, message, type = 'success') {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.innerHTML = message;
        alert.className = `alert alert-${type}`;
        alert.style.display = 'block';
        
        // Scroll to alert
        alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    } else {
        // Fallback alert
        alert(message);
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }
        return date.toLocaleDateString();
    } catch (error) {
        return dateString;
    }
}

function getRiskBadgeClass(riskLevel) {
    if (!riskLevel) return 'bg-secondary';
    
    switch (riskLevel.toLowerCase()) {
        case 'high': return 'bg-danger';
        case 'medium': return 'bg-warning';
        case 'low': return 'bg-success';
        default: return 'bg-secondary';
    }
}

// Global functions for HTML onclick handlers
window.viewReport = async function(id) {
    try {
        console.log('👀 Viewing report:', id);
        const report = await getReportById(id);
        if (!report) {
            alert('❌ Report not found');
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('reportModal'));
        document.getElementById('mTitle').textContent = `${report.type} - ${report.location}`;
        document.getElementById('mMeta').textContent = `Reported by ${report.name || 'Anonymous'} on ${formatDate(report.date)} at ${report.time}`;
        document.getElementById('mDesc').textContent = report.description;
        
        modal.show();
    } catch (error) {
        console.error('❌ Error viewing report:', error);
        alert('❌ Error loading report details: ' + error.message);
    }
}

window.deleteReport = async function(id) {
    if (!isAdmin()) {
        showAlert('reportAlert', 'Only administrators can delete reports!', 'warning');
        return;
    }

    if (confirm('⚠️ Are you sure you want to delete this report?')) {
        try {
            await deleteReport(id);
            showAlert('reportAlert', '✅ Report deleted successfully!');
            loadReports();
            if (typeof initializeCharts === 'function') {
                initializeCharts();
            }
            if (typeof updateDatabaseViewer === 'function') {
                updateDatabaseViewer();
            }
        } catch (error) {
            console.error('❌ Error deleting report:', error);
            showAlert('reportAlert', '❌ Error deleting report: ' + error.message, 'danger');
        }
    }
}

window.deletePoliceRecord = async function(id) {
    if (!isAdmin()) {
        showAlert('recordAlert', 'Only administrators can delete records!', 'warning');
        return;
    }

    if (confirm('⚠️ Are you sure you want to delete this record?')) {
        try {
            await deleteRecord(id);
            showAlert('recordAlert', '✅ Record deleted successfully!');
            loadRecords();
            if (typeof updateDatabaseViewer === 'function') {
                updateDatabaseViewer();
            }
        } catch (error) {
            console.error('❌ Error deleting record:', error);
            showAlert('recordAlert', '❌ Error deleting record: ' + error.message, 'danger');
        }
    }
}

// Clear database function (for testing)
window.clearDatabase = async function() {
    if (!isAdmin()) {
        showAlert('recordAlert', 'Only administrators can clear the database!', 'warning');
        return;
    }

    if (confirm('⚠️ 🚨 DANGER! Are you sure you want to delete ALL data? This cannot be undone!')) {
        try {
            await clearAllData();
            showAlert('recordAlert', '✅ All data cleared successfully!');
            if (typeof loadReports === 'function') loadReports();
            if (typeof loadRecords === 'function') loadRecords();
            if (typeof initializeCharts === 'function') initializeCharts();
            if (typeof updateDatabaseViewer === 'function') updateDatabaseViewer();
        } catch (error) {
            console.error('❌ Error clearing database:', error);
            showAlert('recordAlert', '❌ Error clearing database: ' + error.message, 'danger');
        }
    }
}

// Refresh charts function for analytics page
window.refreshCharts = function() {
    if (typeof initializeChartsWithRetry === 'function') {
        console.log('🔄 Manual chart refresh requested');
        initializeChartsWithRetry();
        showAlert('reportAlert', '📊 Charts refreshed successfully!', 'info');
    }
};

// Listen for auth state changes
document.addEventListener('userLoggedIn', initializeAuthAwareFeatures);
document.addEventListener('userLoggedOut', initializeAuthAwareFeatures);