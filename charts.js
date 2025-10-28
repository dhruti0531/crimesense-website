// assets/js/charts.js - FINAL COMPLETE WORKING VERSION
console.log("🚀 FINAL charts.js loaded");

let charts = [];

// Main initialization function
async function initializeCharts() {
    console.log("🔄 initializeCharts() called");
    
    try {
        // Check if we're on analytics page
        const typeChart = document.getElementById('chartTypeDistribution');
        if (!typeChart) {
            console.log("❌ Not on analytics page, skipping charts");
            return;
        }

        console.log("✅ On analytics page, loading data...");
        const reports = await getAllReports();
        console.log(`📊 Loaded ${reports.length} reports`);
        
        // Destroy existing charts
        charts.forEach(chart => {
            try {
                chart.destroy();
            } catch (e) {
                console.log('Error destroying chart:', e);
            }
        });
        charts = [];
        
        if (!reports || reports.length === 0) {
            console.log("📭 No reports found, showing empty state");
            showEmptyState();
            return;
        }
        
        console.log("🎨 Creating charts...");
        createTypeChart(reports);
        createLocationChart(reports);
        createTimeChart(reports);
        
        console.log("✅ All charts created successfully!");
        
    } catch (error) {
        console.error('❌ Error in initializeCharts:', error);
        showEmptyState();
    }
}

function showEmptyState() {
    const containers = document.querySelectorAll('.card-body');
    containers.forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.style.display = 'none';
            // Remove existing messages
            const existing = container.querySelectorAll('.no-data-message');
            existing.forEach(el => el.remove());
            
            const message = document.createElement('div');
            message.className = 'no-data-message text-center text-muted py-4';
            message.innerHTML = `
                <p class="mb-2">No data available for charts</p>
                <small class="d-block mb-2">Submit crime reports to see analytics</small>
                <a href="report.html" class="btn btn-sm btn-outline-primary">Submit Report</a>
            `;
            container.appendChild(message);
        }
    });
}

function createTypeChart(reports) {
    const ctx = document.getElementById('chartTypeDistribution');
    if (!ctx) {
        console.log("❌ Type chart canvas not found");
        return;
    }
    
    try {
        // Count by type
        const typeCounts = {};
        reports.forEach(report => {
            const type = report.type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        console.log("📈 Type data:", typeCounts);
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(typeCounts),
                datasets: [{
                    data: Object.values(typeCounts),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                        '#9966FF', '#FF9F40', '#8AC926'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        charts.push(chart);
        console.log("✅ Type chart created");
        
    } catch (error) {
        console.error('❌ Error creating type chart:', error);
    }
}

function createLocationChart(reports) {
    const ctx = document.getElementById('chartReportsByLocation');
    if (!ctx) {
        console.log("❌ Location chart canvas not found");
        return;
    }
    
    try {
        // Count by location
        const locationCounts = {};
        reports.forEach(report => {
            const location = report.location || 'Unknown Location';
            locationCounts[location] = (locationCounts[location] || 0) + 1;
        });
        
        // Get top 10
        const topLocations = Object.entries(locationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        console.log("📍 Location data:", topLocations);
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topLocations.map(item => item[0]),
                datasets: [{
                    label: 'Number of Reports',
                    data: topLocations.map(item => item[1]),
                    backgroundColor: '#36A2EB',
                    borderColor: '#2a8bcc',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        charts.push(chart);
        console.log("✅ Location chart created");
        
    } catch (error) {
        console.error('❌ Error creating location chart:', error);
    }
}

function createTimeChart(reports) {
    const ctx = document.getElementById('chartReportsOverTime');
    if (!ctx) {
        console.log("❌ Time chart canvas not found");
        return;
    }
    
    try {
        // Count by date
        const dateCounts = {};
        reports.forEach(report => {
            const date = report.date || new Date().toISOString().split('T')[0];
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        });
        
        // Sort dates
        const sortedDates = Object.keys(dateCounts).sort();
        
        console.log("📅 Time data:", { dates: sortedDates, counts: sortedDates.map(d => dateCounts[d]) });
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Reports per Day',
                    data: sortedDates.map(date => dateCounts[date]),
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        charts.push(chart);
        console.log("✅ Time chart created");
        
    } catch (error) {
        console.error('❌ Error creating time chart:', error);
    }
}

// Enhanced initialization with retry
function initializeChartsWithRetry() {
    console.log("🔄 initializeChartsWithRetry() called");
    setTimeout(initializeCharts, 500);
}

// Global refresh function
window.refreshCharts = function() {
    console.log("🔄 Manual refresh requested");
    initializeChartsWithRetry();
    
    // Show feedback
    const alert = document.getElementById('reportAlert');
    if (alert) {
        alert.textContent = '📊 Charts refreshed!';
        alert.className = 'alert alert-info';
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    }
};

// ========== EVENT LISTENERS ==========

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM Content Loaded - charts.js");
    
    if (document.getElementById('chartTypeDistribution')) {
        console.log("🎯 Analytics page detected - scheduling chart initialization");
        setTimeout(initializeChartsWithRetry, 1000);
    }
});

// Listen for report updates
document.addEventListener('reportsUpdated', function() {
    console.log("📢 reportsUpdated event received");
    setTimeout(initializeChartsWithRetry, 500);
});

document.addEventListener('reportAdded', function() {
    console.log("📢 reportAdded event received");
    setTimeout(initializeChartsWithRetry, 500);
});

// Listen for storage updates
window.addEventListener('storage', function(e) {
    if (e.key === 'crimeReportsUpdated') {
        console.log("💾 Storage update detected");
        setTimeout(initializeChartsWithRetry, 500);
    }
});

// Final fallback initialization
window.addEventListener('load', function() {
    console.log("🏁 Window fully loaded");
    if (document.getElementById('chartTypeDistribution')) {
        console.log("🎯 Final chart initialization attempt");
        setTimeout(initializeChartsWithRetry, 1500);
    }
});

console.log("✅ charts.js initialization complete");