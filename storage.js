// assets/js/storage.js - FINAL CORRECTED VERSION WITH CHART UPDATES

const DB_NAME = 'CrimeSenseDB';
const DB_VERSION = 2;
const REPORT_STORE = 'reports';
const RECORD_STORE = 'records';
const CONTACT_STORE = 'contacts';

let db = null;

// Simple database initialization
function initDB() {
    return new Promise((resolve, reject) => {
        console.log('Initializing database...');
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            console.log('Database upgrade needed - creating stores');
            const database = event.target.result;

            // Delete old stores if they exist
            if (database.objectStoreNames.contains(REPORT_STORE)) {
                database.deleteObjectStore(REPORT_STORE);
            }
            if (database.objectStoreNames.contains(RECORD_STORE)) {
                database.deleteObjectStore(RECORD_STORE);
            }
            if (database.objectStoreNames.contains(CONTACT_STORE)) {
                database.deleteObjectStore(CONTACT_STORE);
            }

            // Create reports store with proper structure
            console.log('Creating reports store');
            const reportStore = database.createObjectStore(REPORT_STORE, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            reportStore.createIndex('type', 'type', { unique: false });
            reportStore.createIndex('location', 'location', { unique: false });
            reportStore.createIndex('date', 'date', { unique: false });

            // Create records store
            console.log('Creating records store');
            const recordStore = database.createObjectStore(RECORD_STORE, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            recordStore.createIndex('name', 'name', { unique: false });
            recordStore.createIndex('crimeType', 'crimeType', { unique: false });

            // Create contacts store
            console.log('Creating contacts store');
            const contactStore = database.createObjectStore(CONTACT_STORE, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            contactStore.createIndex('email', 'email', { unique: false });

            console.log('All stores created successfully');
        };
    });
}

// Ensure database is ready
async function ensureDB() {
    if (!db) {
        console.log('Database not initialized, initializing now...');
        await initDB();
    }
    return db;
}

// Fix date format from dd-mm-yyyy to yyyy-mm-dd
function fixDateFormat(dateString) {
    if (!dateString) {
        return new Date().toISOString().split('T')[0];
    }
    
    console.log('Original date:', dateString);
    
    // Check if date is in dd-mm-yyyy format
    if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // Check if it's dd-mm-yyyy format (last part is 4 digits)
            if (parts[2].length === 4 && parts[0].length === 2 && parts[1].length === 2) {
                const fixedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                console.log('Fixed date format:', fixedDate);
                return fixedDate;
            }
        }
    }
    
    return dateString;
}

// Save report function - SIMPLIFIED
async function saveReport(reportData) {
    try {
        console.log('Starting saveReport with data:', reportData);
        
        await ensureDB();

        // Create a clean report object with all required fields
        const report = {
            name: reportData.name || 'Anonymous',
            contact: reportData.contact || 'Not provided',
            location: reportData.location || 'Unknown',
            type: reportData.type || 'Other',
            date: fixDateFormat(reportData.date),
            time: reportData.time || '00:00',
            description: reportData.description || 'No description',
            status: 'Pending',
            timestamp: new Date().toISOString()
        };

        console.log('Final report object to save:', report);

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORT_STORE], 'readwrite');
            const store = transaction.objectStore(REPORT_STORE);
            
            console.log('Adding report to store...');
            const request = store.add(report);

            request.onsuccess = () => {
                console.log('✅ Report saved successfully with ID:', request.result);
                
                // ========== CRITICAL: Notify charts about new report ==========
                console.log('📢 Storage: Notifying charts about new report');
                localStorage.setItem('crimeReportsUpdated', Date.now().toString());
                const event = new CustomEvent('reportsUpdated');
                document.dispatchEvent(event);
                
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('❌ Error saving report:', event.target.error);
                reject(new Error('Failed to save report: ' + event.target.error.message));
            };

            transaction.oncomplete = () => {
                console.log('Transaction completed');
            };

            transaction.onerror = (event) => {
                console.error('Transaction error:', event.target.error);
            };
        });
    } catch (error) {
        console.error('❌ Error in saveReport:', error);
        throw error;
    }
}

// Get all reports - MAKE SURE THIS IS GLOBAL
async function getAllReports() {
    try {
        console.log('🔄 Getting all reports...');
        await ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORT_STORE], 'readonly');
            const store = transaction.objectStore(REPORT_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                console.log(`✅ Retrieved ${request.result.length} reports`);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('❌ Error getting reports:', event.target.error);
                reject(new Error('Failed to get reports: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('❌ Error in getAllReports:', error);
        return [];
    }
}

// Save record function
async function saveRecord(recordData) {
    try {
        console.log('Saving record:', recordData);
        await ensureDB();

        const record = {
            name: recordData.name || 'Unknown',
            alias: recordData.alias || null,
            crimeType: recordData.crimeType || 'Other',
            riskLevel: recordData.riskLevel || 'Medium',
            lastKnownLocation: recordData.lastKnownLocation || null,
            notes: recordData.notes || null,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RECORD_STORE], 'readwrite');
            const store = transaction.objectStore(RECORD_STORE);
            const request = store.add(record);

            request.onsuccess = () => {
                console.log('✅ Record saved with ID:', request.result);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('❌ Error saving record:', event.target.error);
                reject(new Error('Failed to save record: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('❌ Error in saveRecord:', error);
        throw error;
    }
}

// Get all records
async function getAllRecords() {
    try {
        await ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RECORD_STORE], 'readonly');
            const store = transaction.objectStore(RECORD_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                console.log(`✅ Retrieved ${request.result.length} records`);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('❌ Error getting records:', event.target.error);
                reject(new Error('Failed to get records: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('❌ Error in getAllRecords:', error);
        return [];
    }
}

// Save contact function
async function saveContact(contactData) {
    try {
        console.log('Saving contact:', contactData);
        await ensureDB();

        const contact = {
            name: contactData.name || 'Anonymous',
            email: contactData.email || 'No email',
            message: contactData.message || 'No message',
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CONTACT_STORE], 'readwrite');
            const store = transaction.objectStore(CONTACT_STORE);
            const request = store.add(contact);

            request.onsuccess = () => {
                console.log('✅ Contact saved with ID:', request.result);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('❌ Error saving contact:', event.target.error);
                reject(new Error('Failed to save contact: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('❌ Error in saveContact:', error);
        throw error;
    }
}

// Delete functions
async function deleteReport(id) {
    try {
        await ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORT_STORE], 'readwrite');
            const store = transaction.objectStore(REPORT_STORE);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('✅ Report deleted:', id);
                // Notify charts about the deletion
                localStorage.setItem('crimeReportsUpdated', Date.now().toString());
                const event = new CustomEvent('reportsUpdated');
                document.dispatchEvent(event);
                resolve(true);
            };
            request.onerror = (event) => {
                console.error('❌ Error deleting report:', event.target.error);
                reject(new Error('Failed to delete report: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('❌ Error in deleteReport:', error);
        throw error;
    }
}

async function deleteRecord(id) {
    try {
        await ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RECORD_STORE], 'readwrite');
            const store = transaction.objectStore(RECORD_STORE);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('✅ Record deleted:', id);
                resolve(true);
            };
            request.onerror = (event) => {
                console.error('❌ Error deleting record:', event.target.error);
                reject(new Error('Failed to delete record: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('❌ Error in deleteRecord:', error);
        throw error;
    }
}

// Get report by ID
async function getReportById(id) {
    try {
        await ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORT_STORE], 'readonly');
            const store = transaction.objectStore(REPORT_STORE);
            const request = store.get(Number(id));

            request.onsuccess = () => {
                console.log('✅ Report retrieved:', request.result);
                resolve(request.result);
            };
            request.onerror = (event) => {
                console.error('❌ Error getting report:', event.target.error);
                reject(new Error('Failed to get report: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('❌ Error in getReportById:', error);
        throw error;
    }
}

// Clear all data (for testing)
async function clearAllData() {
    try {
        await ensureDB();
        
        const stores = [REPORT_STORE, RECORD_STORE, CONTACT_STORE];
        
        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            });
        }
        
        console.log('✅ All data cleared');
        // Notify charts about the clearance
        localStorage.setItem('crimeReportsUpdated', Date.now().toString());
        const event = new CustomEvent('reportsUpdated');
        document.dispatchEvent(event);
        return true;
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        throw error;
    }
}

// ========== CRITICAL: Make functions globally available ==========
// This ensures charts.js can access these functions
window.saveReport = saveReport;
window.getAllReports = getAllReports;
window.saveRecord = saveRecord;
window.getAllRecords = getAllRecords;
window.saveContact = saveContact;
window.deleteReport = deleteReport;
window.deleteRecord = deleteRecord;
window.getReportById = getReportById;
window.clearAllData = clearAllData;

// Initialize database on load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing database...');
    initDB().then(() => {
        console.log('✅ Database initialized successfully');
    }).catch(error => {
        console.error('❌ Failed to initialize database:', error);
    });
});