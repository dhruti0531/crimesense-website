const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Mock data storage (in production this would be IndexedDB on client-side)
let mockData = {
  reports: [
    {
      id: 1,
      name: 'John Doe',
      contact: 'john@example.com',
      location: 'Central Park',
      type: 'Theft',
      date: '2023-10-15',
      time: '14:30',
      description: 'Wallet stolen near fountain',
      status: 'Pending',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Jane Smith',
      contact: '555-1234',
      location: 'Main Street',
      type: 'Vandalism',
      date: '2023-10-14',
      time: '20:15',
      description: 'Graffiti on storefront',
      status: 'Under Investigation',
      created_at: new Date().toISOString()
    }
  ],
  records: [
    {
      id: 1,
      name: 'Michael Johnson',
      alias: 'Mikey',
      crime_type: 'Burglary',
      risk_level: 'High',
      last_known_location: 'West District',
      notes: 'Multiple break-ins',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Sarah Williams',
      alias: null,
      crime_type: 'Fraud',
      risk_level: 'Medium',
      last_known_location: 'Downtown',
      notes: 'Credit card scams',
      created_at: new Date().toISOString()
    }
  ],
  contacts: []
};

console.log('Server initialized with mock data storage');

// ========== ALL YOUR API ENDPOINTS ==========

// Reports endpoints
app.get('/api/reports', (req, res) => {
  const { type, search } = req.query;
  let filteredReports = [...mockData.reports];

  if (type) {
    filteredReports = filteredReports.filter(report => report.type === type);
  }

  if (search) {
    const searchTerm = search.toLowerCase();
    filteredReports = filteredReports.filter(report =>
      report.location.toLowerCase().includes(searchTerm) ||
      report.description.toLowerCase().includes(searchTerm) ||
      report.type.toLowerCase().includes(searchTerm)
    );
  }

  // Sort by created_at DESC
  filteredReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(filteredReports);
});

app.post('/api/reports', (req, res) => {
  const { name, contact, location, type, date, time, photo, description } = req.body;
  
  const newReport = {
    id: mockData.reports.length + 1,
    name: name || null,
    contact: contact || null,
    location,
    type,
    date,
    time,
    photo: photo || null,
    description,
    status: 'Pending',
    created_at: new Date().toISOString()
  };

  mockData.reports.push(newReport);
  res.json({ id: newReport.id });
});

app.get('/api/reports/:id', (req, res) => {
  const report = mockData.reports.find(r => r.id === parseInt(req.params.id));
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

// Records endpoints
app.get('/api/records', (req, res) => {
  const { search } = req.query;
  let filteredRecords = [...mockData.records];

  if (search) {
    const searchTerm = search.toLowerCase();
    filteredRecords = filteredRecords.filter(record =>
      record.name.toLowerCase().includes(searchTerm) ||
      (record.alias && record.alias.toLowerCase().includes(searchTerm)) ||
      record.crime_type.toLowerCase().includes(searchTerm) ||
      (record.last_known_location && record.last_known_location.toLowerCase().includes(searchTerm))
    );
  }

  // Sort by created_at DESC
  filteredRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(filteredRecords);
});

app.post('/api/records', (req, res) => {
  const { name, alias, crimeType, riskLevel, lastKnownLocation, notes } = req.body;
  
  const newRecord = {
    id: mockData.records.length + 1,
    name,
    alias: alias || null,
    crime_type: crimeType,
    risk_level: riskLevel,
    last_known_location: lastKnownLocation || null,
    notes: notes || null,
    created_at: new Date().toISOString()
  };

  mockData.records.push(newRecord);
  res.json({ id: newRecord.id });
});

// Analytics endpoints
app.get('/api/analytics/type-distribution', (req, res) => {
  const typeCounts = {};
  mockData.reports.forEach(report => {
    typeCounts[report.type] = (typeCounts[report.type] || 0) + 1;
  });

  const result = Object.keys(typeCounts).map(type => ({
    type,
    count: typeCounts[type]
  }));

  res.json(result);
});

app.get('/api/analytics/location-distribution', (req, res) => {
  const locationCounts = {};
  mockData.reports.forEach(report => {
    locationCounts[report.location] = (locationCounts[report.location] || 0) + 1;
  });

  const result = Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json(result);
});

app.get('/api/analytics/reports-over-time', (req, res) => {
  const dateCounts = {};
  mockData.reports.forEach(report => {
    dateCounts[report.date] = (dateCounts[report.date] || 0) + 1;
  });

  const result = Object.keys(dateCounts)
    .sort()
    .map(date => ({
      date,
      count: dateCounts[date]
    }));

  res.json(result);
});

// Contact endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  const newContact = {
    id: mockData.contacts.length + 1,
    name,
    email,
    message,
    created_at: new Date().toISOString()
  };

  mockData.contacts.push(newContact);
  res.json({ id: newContact.id });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET  /api/reports');
  console.log('- POST /api/reports');
  console.log('- GET  /api/records');
  console.log('- POST /api/records');
  console.log('- GET  /api/analytics/type-distribution');
  console.log('- GET  /api/analytics/location-distribution');
  console.log('- GET  /api/analytics/reports-over-time');
  console.log('- POST /api/contact');
});