// assets/js/auth.js - FIXED VERSION WITH PASSWORD FIX
console.log("🔐 Loading enhanced auth.js");

// User management functions
const AUTH_STORAGE_KEY = 'crimeSenseUsers';
const CURRENT_USER_KEY = 'crimeSenseCurrentUser';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Initialize users storage - FIXED VERSION
function initAuth() {
    console.log("🔄 Checking user storage...");
    
    // Always create admin account to ensure it exists
    const defaultUsers = [{
        id: "1",
        firstName: "Admin",
        lastName: "User",
        email: "admin@crimesense.com",
        password: "admin123",
        createdAt: new Date().toISOString(),
        role: "admin",
        lastLogin: null
    }];
    
    const existingUsers = getAllUsers();
    
    // If no users exist or admin doesn't exist, create default users
    if (existingUsers.length === 0 || !existingUsers.find(user => user.email === 'admin@crimesense.com')) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUsers));
        console.log("✅ Created default admin account");
        console.log("📧 Email: admin@crimesense.com");
        console.log("🔑 Password: admin123");
    } else {
        console.log("✅ Users storage already initialized");
    }
}

// Get all users
function getAllUsers() {
    try {
        const users = localStorage.getItem(AUTH_STORAGE_KEY);
        return users ? JSON.parse(users) : [];
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
}

// Find user by email - FIXED VERSION
function findUserByEmail(email) {
    const users = getAllUsers();
    const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    
    // Debug logging
    console.log("🔍 Searching for user:", email);
    console.log("📋 Available users:", users.map(u => u.email));
    console.log("✅ Found user:", user ? user.email : "None");
    
    return user;
}

// Check if user exists
function userExists(email) {
    return !!findUserByEmail(email);
}

// Validate password strength
function checkPasswordStrength(password) {
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength <= 1) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
}

// Register new user - FIXED VERSION
async function registerUser(userData) {
    console.log("👤 Registering user:", userData.email);
    
    // Validate data
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
        throw new Error('All fields are required');
    }
    
    if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    
    if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
    }
    
    if (userExists(userData.email)) {
        throw new Error('User with this email already exists');
    }
    
    if (!userData.agreeTerms) {
        throw new Error('You must agree to the Terms of Service');
    }
    
    // Create user object - FIXED: Ensure password is stored exactly as entered
    const user = {
        id: Date.now().toString(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password, // Store exactly as entered
        createdAt: new Date().toISOString(),
        role: 'user',
        lastLogin: null
    };
    
    console.log("💾 Saving user with password:", user.password);
    
    // Save user
    if (saveUser(user)) {
        // Auto-login after registration
        setCurrentUser(user);
        return user;
    } else {
        throw new Error('Failed to create user account');
    }
}

// Save user - FIXED VERSION
function saveUser(user) {
    try {
        const users = getAllUsers();
        users.push(user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
        console.log("✅ User saved:", user.email);
        console.log("🔐 Password stored as:", user.password);
        return true;
    } catch (error) {
        console.error('Error saving user:', error);
        return false;
    }
}

// Login user - FIXED VERSION
async function loginUser(email, password) {
    console.log("🔑 Attempting login for:", email);
    console.log("📝 Password provided:", password);
    
    if (!email || !password) {
        throw new Error('Email and password are required');
    }
    
    const user = findUserByEmail(email);
    
    if (!user) {
        console.log("❌ User not found:", email);
        throw new Error('Invalid email or password');
    }
    
    console.log("🔐 Stored password:", user.password);
    console.log("🔐 Password match check:", user.password === password);
    
    // FIXED: Direct string comparison
    if (user.password !== password) {
        console.log("❌ Password mismatch!");
        console.log("Stored:", user.password);
        console.log("Provided:", password);
        throw new Error('Invalid email or password');
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    updateUser(user);
    
    // Set current user
    setCurrentUser(user);
    console.log("✅ Login successful for:", user.email);
    return user;
}

// Update user
function updateUser(updatedUser) {
    try {
        const users = getAllUsers();
        const index = users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
}

// Set current user with session management
function setCurrentUser(user) {
    const session = {
        user: user,
        timestamp: Date.now(),
        expires: Date.now() + SESSION_TIMEOUT
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    console.log("✅ User logged in:", user.email);
    console.log("👤 User role:", user.role);
    
    // Dispatch login event
    const event = new CustomEvent('userLoggedIn', { detail: user });
    document.dispatchEvent(event);
}

// Get current user with session validation
function getCurrentUser() {
    try {
        const session = localStorage.getItem(CURRENT_USER_KEY);
        if (!session) return null;
        
        const sessionData = JSON.parse(session);
        
        // Check if session expired
        if (Date.now() > sessionData.expires) {
            logoutUser();
            return null;
        }
        
        return sessionData.user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Logout user
function logoutUser() {
    const currentUser = getCurrentUser();
    localStorage.removeItem(CURRENT_USER_KEY);
    console.log("✅ User logged out");
    
    // Dispatch logout event
    const event = new CustomEvent('userLoggedOut', { detail: currentUser });
    document.dispatchEvent(event);
    
    return currentUser;
}

// Check if user is logged in
function isLoggedIn() {
    return !!getCurrentUser();
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    const isAdmin = user && user.role === 'admin';
    console.log("🔍 Admin check:", isAdmin ? "YES - Admin user" : "NO - Regular user");
    return isAdmin;
}

// Update navigation based on auth status
function updateNavigation() {
    const currentUser = getCurrentUser();
    const navElement = document.querySelector('.navbar-nav');
    
    if (!navElement) return;
    
    if (currentUser) {
        // User is logged in
        const userLinks = `
            <li class="nav-item"><a class="nav-link ${isActive('index.html')}" href="index.html">Home</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('about.html')}" href="about.html">About</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('report.html')}" href="report.html">Report Crime</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('view-reports.html')}" href="view-reports.html">View Reports</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('analytics.html')}" href="analytics.html">Analytics</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('records.html')}" href="records.html">Police Records</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('faq.html')}" href="faq.html">FAQ</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('contact.html')}" href="contact.html">Contact</a></li>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                    <span class="me-2">👤</span>
                    <div class="d-none d-sm-block">
                        <div class="small fw-bold">${currentUser.firstName}</div>
                        <div class="x-small text-muted">${currentUser.role}</div>
                    </div>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><span class="dropdown-item-text small">
                        <div>${currentUser.firstName} ${currentUser.lastName}</div>
                        <div class="text-muted">${currentUser.email}</div>
                        <div class="text-info"><small>Role: ${currentUser.role}</small></div>
                    </span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="profile.html">Profile Settings</a></li>
                    ${isAdmin() ? '<li><a class="dropdown-item text-warning" href="#"><strong>Admin Panel</strong></a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()">Logout</a></li>
                </ul>
            </li>
        `;
        navElement.innerHTML = userLinks;
    } else {
        // User is not logged in
        const guestLinks = `
            <li class="nav-item"><a class="nav-link ${isActive('index.html')}" href="index.html">Home</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('about.html')}" href="about.html">About</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('login.html')}" href="login.html">Login</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('register.html')}" href="register.html">Register</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('faq.html')}" href="faq.html">FAQ</a></li>
            <li class="nav-item"><a class="nav-link ${isActive('contact.html')}" href="contact.html">Contact</a></li>
        `;
        navElement.innerHTML = guestLinks;
    }
}

// Helper function to check active page
function isActive(page) {
    const currentPage = window.location.pathname.split('/').pop();
    return currentPage === page ? 'active' : '';
}

// Global logout function
window.logout = function() {
    if (logoutUser()) {
        window.location.href = 'index.html';
    }
};

// Route protection
function requireAuth(redirectTo = 'login.html') {
    if (!isLoggedIn()) {
        window.location.href = redirectTo + '?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    return true;
}

function requireAdmin(redirectTo = 'index.html') {
    if (!isAdmin()) {
        showAlert('Access Denied', 'Administrator access required!', 'warning');
        return false;
    }
    return true;
}

// Show alert function
function showAlert(title, message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <strong>${title}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔐 Initializing auth system");
    initAuth();
    updateNavigation();
    
    // Log current users for debugging
    const users = getAllUsers();
    console.log("📊 Current users:", users);
    
    // Apply route protection
    const protectedPages = ['report.html', 'view-reports.html', 'analytics.html', 'records.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
        return;
    }
    
    // Listen for auth events
    document.addEventListener('userLoggedIn', function(event) {
        console.log("🔄 User logged in event received");
        console.log("👤 Logged in as:", event.detail.email, "Role:", event.detail.role);
        updateNavigation();
        
        // Redirect if there's a redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        if (redirect) {
            window.location.href = redirect;
        }
    });
    
    document.addEventListener('userLoggedOut', function() {
        console.log("🔄 User logged out event received");
        updateNavigation();
    });
    
    // Check session on page load
    if (isLoggedIn()) {
        const user = getCurrentUser();
        console.log("🔐 User session active:", user.email, "Role:", user.role);
    }
});

// Password strength indicator
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthBar = document.getElementById('passwordStrength');
    
    if (passwordInput && strengthBar) {
        passwordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            strengthBar.className = 'password-strength strength-' + strength;
            
            // Update strength text
            const strengthText = document.getElementById('passwordStrengthText');
            if (strengthText) {
                const texts = { weak: 'Weak', medium: 'Medium', strong: 'Strong' };
                strengthText.textContent = 'Password strength: ' + texts[strength];
                strengthText.className = 'form-text strength-' + strength;
            }
        });
    }
});

// Register form handler
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const alert = document.getElementById('registerAlert');
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';
                alert.classList.add('d-none');
                
                const formData = {
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    email: document.getElementById('registerEmail').value,
                    password: document.getElementById('registerPassword').value,
                    confirmPassword: document.getElementById('confirmPassword').value,
                    agreeTerms: document.getElementById('agreeTerms').checked
                };
                
                const user = await registerUser(formData);
                
                // Show success and redirect
                alert.classList.remove('alert-danger', 'd-none');
                alert.classList.add('alert-success');
                alert.innerHTML = '<strong>Success!</strong> Account created successfully! Redirecting...';
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } catch (error) {
                console.error('Registration error:', error);
                alert.classList.remove('d-none');
                alert.classList.add('alert-danger');
                alert.innerHTML = `<strong>Error!</strong> ${error.message}`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

// Login form handler - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const alert = document.getElementById('loginAlert');
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing In...';
                if (alert) alert.classList.add('d-none');
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                console.log("🔄 Login attempt with:", email);
                
                const user = await loginUser(email, password);
                
                // Show success and redirect
                if (alert) {
                    alert.classList.remove('alert-danger', 'd-none');
                    alert.classList.add('alert-success');
                    alert.innerHTML = '<strong>Success!</strong> Login successful! Redirecting...';
                }
                
                setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    window.location.href = redirect || 'index.html';
                }, 1500);
                
            } catch (error) {
                console.error('Login error:', error);
                if (alert) {
                    alert.classList.remove('d-none');
                    alert.classList.add('alert-danger');
                    alert.innerHTML = `<strong>Error!</strong> ${error.message}`;
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

console.log("✅ auth.js loaded successfully");