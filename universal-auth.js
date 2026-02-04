// ===================================
// UNIVERSAL AUTHENTICATION SYSTEM
// Complete Firebase Auth with Profile Management
// ===================================

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAYuU0xDNgUNyqVf4bSCBBs4Qg1hJQ3F1Q",
    authDomain: "crumblcrafts-9764b.firebaseapp.com",
    databaseURL: "https://crumblcrafts-9764b-default-rtdb.firebaseio.com",
    projectId: "crumblcrafts-9764b",
    storageBucket: "crumblcrafts-9764b.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcd1234efgh5678ijkl90"
};

// Global variables
let auth, database, storage;
let currentUser = null;
let isFirebaseInitialized = false;
let usernameCheckTimeout;
let isInitializing = false;

// ===================================
// FIREBASE INITIALIZATION
// ===================================

async function initializeFirebase() {
    if (isFirebaseInitialized || isInitializing) return true;
    isInitializing = true;
    
    try {
        console.log('🔄 Initializing Firebase...');
        
        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js');
        const firebaseAuth = await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js');
        const firebaseDB = await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js');
        const firebaseStorage = await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js');
        
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        auth = firebaseAuth.getAuth(app);
        database = firebaseDB.getDatabase(app);
        storage = firebaseStorage.getStorage(app);
        
        // Store modules globally
        window.firebaseModules = {
            auth: firebaseAuth,
            database: firebaseDB,
            storage: firebaseStorage
        };
        
        window.firebaseInstances = {
            auth,
            database,
            storage
        };
        
        // Set up auth state listener
        firebaseAuth.onAuthStateChanged(auth, handleAuthStateChange);
        
        isFirebaseInitialized = true;
        isInitializing = false;
        console.log('✅ Firebase initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        isInitializing = false;
        return false;
    }
}

// ===================================
// AUTH STATE MANAGEMENT
// ===================================

async function handleAuthStateChange(user) {
    currentUser = user;
    updateAllAuthUI(user);
    
    if (user) {
        console.log('👤 User signed in:', user.displayName || user.email);
        
        // Store auth data for cross-page persistence
        const authData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            timestamp: Date.now()
        };
        localStorage.setItem('crumblAuthState', JSON.stringify(authData));
        
        // Update last login
        try {
            const { ref, update, serverTimestamp } = window.firebaseModules.database;
            await update(ref(database, `users/${user.uid}`), {
                lastLogin: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
        
    } else {
        console.log('👋 User signed out');
        localStorage.removeItem('crumblAuthState');
        currentUser = null;
    }
    
    // Broadcast auth change to other tabs
    window.postMessage({ type: 'AUTH_STATE_CHANGED', user: user }, '*');
}

// ===================================
// UI MANAGEMENT
// ===================================

function injectAuthStyles() {
    if (document.getElementById('universal-auth-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'universal-auth-styles';
    styles.textContent = `
        /* Auth Modal Styles Only - Positioning handled by HTML/CSS */
        
        /* Auth Modal */
        .auth-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 15000;
            align-items: center;
            justify-content: center;
        }
        
        .auth-modal.show {
            display: flex;
            animation: modalFadeIn 0.3s ease-out;
        }
        
        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .auth-modal-content {
            background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 45, 0.95));
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 32px;
            width: 90%;
            max-width: 420px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .auth-modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            color: white;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .auth-modal-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }
        
        .auth-form {
            display: none;
        }
        
        .auth-form.active {
            display: block;
        }
        
        .auth-modal-title {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #FF1744, #FF5722);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-align: center;
        }
        
        .auth-modal-subtitle {
            color: rgba(255, 255, 255, 0.7);
            text-align: center;
            margin-bottom: 24px;
            font-size: 0.9rem;
        }
        
        .auth-form-group {
            margin-bottom: 20px;
        }
        
        .auth-form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: white;
            font-size: 0.85rem;
        }
        
        .auth-form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            color: white;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        
        .auth-form-input:focus {
            outline: none;
            border-color: #FF1744;
            box-shadow: 0 0 0 3px rgba(255, 23, 68, 0.2);
            background: rgba(255, 255, 255, 0.08);
        }
        
        .auth-form-input.error {
            border-color: #f44336;
            box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.2);
        }
        
        .auth-error-msg {
            color: #f44336;
            font-size: 0.75rem;
            margin-top: 4px;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.2s ease;
        }
        
        .auth-error-msg.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .auth-submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #FF1744, #FF5722);
            border: none;
            color: white;
            padding: 14px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .auth-submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 23, 68, 0.4);
        }
        
        .auth-submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        .auth-divider {
            display: flex;
            align-items: center;
            margin: 20px 0;
            gap: 12px;
        }
        
        .auth-divider::before,
        .auth-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .auth-social-buttons {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .auth-social-btn {
            width: 100%;
            padding: 12px 16px;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .google-btn {
            background: linear-gradient(135deg, #4285F4, #357AE8);
            color: white;
        }
        
        .guest-btn {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
        }
        
        .auth-social-btn:hover {
            transform: translateY(-1px);
            opacity: 0.9;
        }
        
        .auth-switch {
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.8rem;
        }
        
        .auth-link {
            color: #FF1744;
            cursor: pointer;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        
        .auth-link:hover {
            color: #FF5722;
            text-decoration: underline;
        }
        
        .profile-pic-upload {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }
        
        .profile-pic-preview {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid #FF1744;
            object-fit: cover;
        }
        
        .profile-pic-btn {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.8rem;
        }
        
        .profile-pic-btn:hover {
            background: rgba(255, 255, 255, 0.15);
        }
        
        .username-check {
            font-size: 0.75rem;
            margin-top: 4px;
            font-weight: 600;
        }
        
        .username-check.available {
            color: #4CAF50;
        }
        
        .username-check.taken {
            color: #f44336;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .universal-auth-container.floating {
                --auth-top-offset: 12px;
                --auth-right-offset: 12px;
                gap: 8px;
            }
            
            .universal-auth-container.floating.header-present {
                --auth-top-offset: 70px;
            }
            
            .universal-auth-container.floating.cooking-page {
                --auth-top-offset: 80px;
                --auth-right-offset: 16px;
            }
            
            .universal-auth-container.floating.building-page {
                --auth-top-offset: 60px;
                --auth-right-offset: 12px;
            }
            
            .universal-auth-container.dedicated-space {
                gap: 8px;
            }
            
            .auth-modal-content {
                width: 95%;
                padding: 24px;
                margin: 20px;
            }
            
            .auth-modal-title {
                font-size: 1.6rem;
            }
        }
        
        @media (max-width: 480px) {
            .universal-auth-container.floating {
                --auth-top-offset: 8px;
                --auth-right-offset: 8px;
                position: fixed;
                left: auto;
                width: auto;
                justify-content: flex-end;
                background: none;
            }
            
            .universal-auth-container.floating.header-present {
                --auth-top-offset: 50px;
            }
            
            .universal-auth-container.floating.cooking-page {
                --auth-top-offset: 60px;
            }
            
            .universal-auth-container.floating.building-page {
                --auth-top-offset: 45px;
            }
            
            .universal-auth-container.dedicated-space {
                gap: 6px;
                flex-wrap: wrap;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

function createAuthContainer() {
    // Auth elements are now hardcoded in HTML, this function only handles modal creation
    createAuthModal();
}

// No longer needed - auth elements are hardcoded in HTML

function updateAllAuthUI(user) {
    const authBtn = document.getElementById('authButton');
    const userProfile = document.getElementById('userProfile');
    
    if (user) {
        // Hide sign up button, show profile
        if (authBtn) authBtn.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            const avatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');
            if (avatar) avatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=FF1744&color=fff&size=80`;
            if (userName) userName.textContent = user.displayName || 'User';
        }
    } else {
        // Show sign up button, hide profile
        if (authBtn) authBtn.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
    
    // Update any other UI elements that depend on auth state
    updatePageSpecificAuthUI(user);
}

function updatePageSpecificAuthUI(user) {
    // This function can be overridden by individual pages
    if (typeof window.customAuthUIUpdate === 'function') {
        window.customAuthUIUpdate(user);
    }
}

// ===================================
// MODAL CONTROL FUNCTIONS
// ===================================

function createAuthModal() {
    if (document.getElementById('universalAuthModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'universalAuthModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <button class="auth-modal-close" onclick="closeAuthModal()">×</button>
            
            <!-- Sign Up Form -->
            <div id="signupForm" class="auth-form active">
                <h2 class="auth-modal-title">Create Account</h2>
                <p class="auth-modal-subtitle">Join the Crumbl Crafts community</p>
                
                <div class="auth-form-group">
                    <label class="auth-form-label" for="signupUsername">Username</label>
                    <input type="text" id="signupUsername" class="auth-form-input" placeholder="Username (no spaces)" maxlength="20" oninput="validateUsernameInput(this)">
                    <p style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); margin-top: 4px;">3-20 characters, no spaces allowed</p>
                    <div id="usernameCheck" class="username-check"></div>
                    <div id="signupUsernameError" class="auth-error-msg"></div>
                </div>
                
                <div class="auth-form-group">
                    <label class="auth-form-label" for="signupEmail">Email</label>
                    <input type="email" id="signupEmail" class="auth-form-input" placeholder="your@email.com">
                    <div id="signupEmailError" class="auth-error-msg"></div>
                </div>
                
                <div class="auth-form-group">
                    <label class="auth-form-label" for="signupPassword">Password</label>
                    <input type="password" id="signupPassword" class="auth-form-input" placeholder="Minimum 6 characters">
                    <div id="signupPasswordError" class="auth-error-msg"></div>
                </div>
                
                <div class="auth-form-group">
                    <label class="auth-form-label" for="signupConfirmPassword">Confirm Password</label>
                    <input type="password" id="signupConfirmPassword" class="auth-form-input" placeholder="Re-enter password">
                    <div id="signupConfirmError" class="auth-error-msg"></div>
                </div>
                
                <div class="auth-form-group">
                    <label class="auth-form-label" for="signupProfilePic">Profile Picture (Optional)</label>
                    <div class="profile-pic-upload">
                        <img id="signupProfilePreview" class="profile-pic-preview" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23333'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23fff' font-size='40' font-family='Arial'%3E%3F%3C/text%3E%3C/svg%3E" alt="Profile">
                        <input type="file" id="signupProfilePic" accept="image/*" style="display: none;">
                        <button type="button" class="profile-pic-btn" onclick="document.getElementById('signupProfilePic').click()">
                            <i class="fas fa-upload"></i> Upload Photo
                        </button>
                    </div>
                </div>
                
                <button id="signupSubmitBtn" class="auth-submit-btn" onclick="handleSignup()">
                    <i class="fas fa-user-plus"></i> Create Account
                </button>
                
                <div class="auth-divider">OR</div>
                
                <div class="auth-social-buttons">
                    <button class="auth-social-btn google-btn" onclick="handleGoogleSignIn()">
                        <i class="fab fa-google"></i> Continue with Google
                    </button>
                    <button class="auth-social-btn guest-btn" onclick="handleAnonymousSignIn()">
                        <i class="fas fa-user-secret"></i> Continue as Guest
                    </button>
                </div>
                
                <div class="auth-switch">
                    Already have an account? <span class="auth-link" onclick="showSignIn()">Sign In</span>
                </div>
            </div>
            
            <!-- Sign In Form -->
            <div id="signinForm" class="auth-form">
                <h2 class="auth-modal-title">Welcome Back</h2>
                <p class="auth-modal-subtitle">Sign in to your account</p>
                
                <div class="auth-form-group">
                    <label class="auth-form-label">Email</label>
                    <input type="email" id="signinEmail" class="auth-form-input" placeholder="your@email.com">
                    <div id="signinEmailError" class="auth-error-msg"></div>
                </div>
                
                <div class="auth-form-group">
                    <label class="auth-form-label">Password</label>
                    <input type="password" id="signinPassword" class="auth-form-input" placeholder="Enter your password">
                    <div id="signinPasswordError" class="auth-error-msg"></div>
                </div>
                
                <button id="signinSubmitBtn" class="auth-submit-btn" onclick="handleSignIn()">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
                
                <div class="auth-divider">OR</div>
                
                <div class="auth-social-buttons">
                    <button class="auth-social-btn google-btn" onclick="handleGoogleSignIn()">
                        <i class="fab fa-google"></i> Continue with Google
                    </button>
                    <button class="auth-social-btn guest-btn" onclick="handleAnonymousSignIn()">
                        <i class="fas fa-user-secret"></i> Continue as Guest
                    </button>
                </div>
                
                <div class="auth-switch">
                    <span class="auth-link" onclick="showForgotPassword()">Forgot Password?</span> · 
                    <span class="auth-link" onclick="showSignUp()">Create Account</span>
                </div>
            </div>
            
            <!-- Forgot Password Form -->
            <div id="forgotPasswordForm" class="auth-form">
                <h2 class="auth-modal-title">Reset Password</h2>
                <p class="auth-modal-subtitle">We'll send you a reset link</p>
                
                <div class="auth-form-group">
                    <label class="auth-form-label">Email</label>
                    <input type="email" id="resetEmail" class="auth-form-input" placeholder="your@email.com">
                    <div id="resetEmailError" class="auth-error-msg"></div>
                </div>
                
                <button id="resetSubmitBtn" class="auth-submit-btn" onclick="handlePasswordReset()">
                    <i class="fas fa-envelope"></i> Send Reset Link
                </button>
                
                <div class="auth-switch">
                    <span class="auth-link" onclick="showSignIn()">Back to Sign In</span>
                </div>
            </div>

            <!-- Profile Edit Form -->
            <div id="profileEditForm" class="auth-form">
                <h2 class="auth-modal-title">Edit Profile</h2>
                <p class="auth-modal-subtitle">Update your information</p>
                
                <div class="auth-form-group">
                    <label class="auth-form-label">Profile Picture</label>
                    <div class="profile-pic-upload">
                        <img id="editProfilePreview" class="profile-pic-preview" src="" alt="Profile">
                        <input type="file" id="editProfilePic" accept="image/*" style="display: none;">
                        <button type="button" class="profile-pic-btn" onclick="document.getElementById('editProfilePic').click()">
                            <i class="fas fa-camera"></i> Change Photo
                        </button>
                    </div>
                </div>
                
                <div class="auth-form-group">
                    <label class="auth-form-label">Username</label>
                    <input type="text" id="editUsername" class="auth-form-input" placeholder="alphanumeric and _ only" maxlength="20" oninput="validateUsernameInput(this)">
                    <div id="editUsernameCheck" class="username-check"></div>
                    <div id="editUsernameError" class="auth-error-msg"></div>
                </div>
                
                <button id="profileSaveBtn" class="auth-submit-btn" onclick="handleProfileUpdate()">
                    <i class="fas fa-save"></i> Save Changes
                </button>
                
                <div class="auth-switch">
                    <span class="auth-link" onclick="closeAuthModal()">Cancel</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setupProfilePicturePreviews();
}

function setupProfilePicturePreviews() {
    // Sign up profile preview
    const signupPicInput = document.getElementById('signupProfilePic');
    if (signupPicInput) {
        signupPicInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('signupProfilePreview');
                    if (preview) preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Edit profile preview
    const editPicInput = document.getElementById('editProfilePic');
    if (editPicInput) {
        editPicInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('editProfilePreview');
                    if (preview) preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function openAuthModal() {
    createAuthModal();
    const modal = document.getElementById('universalAuthModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('universalAuthModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

function showSignUp() {
    openAuthModal();
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.classList.add('active');
}

function showSignIn() {
    openAuthModal();
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    const signinForm = document.getElementById('signinForm');
    if (signinForm) signinForm.classList.add('active');
}

function showForgotPassword() {
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) forgotForm.classList.add('active');
}

function showProfileEdit() {
    if (!currentUser) return;
    
    openAuthModal();
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    const profileForm = document.getElementById('profileEditForm');
    if (profileForm) profileForm.classList.add('active');
    
    // Pre-fill current values
    const editPreview = document.getElementById('editProfilePreview');
    const editUsername = document.getElementById('editUsername');
    if (editPreview) editPreview.src = currentUser.photoURL || '';
    if (editUsername) editUsername.placeholder = currentUser.displayName || 'Enter new username';
    
    closeProfileDropdown();
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('#userProfile')) {
                closeProfileDropdown();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

function closeProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function viewAccount() {
    closeProfileDropdown();
    alert('Account settings coming soon!');
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function validateUsername(username) {
    return username.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '');
}

function validateUsernameInput(input) {
    const cleaned = validateUsername(input.value);
    if (input.value !== cleaned) {
        input.value = cleaned;
    }
    
    // Real-time username availability check
    if (input.id === 'signupUsername' && cleaned.length >= 3) {
        checkUsernameAvailabilityRealtime(cleaned, 'usernameCheck');
    } else if (input.id === 'editUsername' && cleaned.length >= 3) {
        checkUsernameAvailabilityRealtime(cleaned, 'editUsernameCheck');
    }
}

async function checkUsernameAvailabilityRealtime(username, checkElementId) {
    clearTimeout(usernameCheckTimeout);
    const checkEl = document.getElementById(checkElementId);
    
    if (!checkEl) return;
    
    checkEl.textContent = 'Checking...';
    checkEl.className = 'username-check';
    
    usernameCheckTimeout = setTimeout(async () => {
        const available = await checkUsernameAvailability(username);
        if (available) {
            checkEl.textContent = '✓ Username available';
            checkEl.className = 'username-check available';
        } else {
            checkEl.textContent = '✗ Username taken';
            checkEl.className = 'username-check taken';
        }
    }, 500);
}

async function checkUsernameAvailability(username) {
    if (!isFirebaseInitialized) return false;
    
    try {
        const { ref, get } = window.firebaseModules.database;
        const snapshot = await get(ref(database, `usernames/${username.toLowerCase()}`));
        return !snapshot.exists();
    } catch (error) {
        console.error('Error checking username:', error);
        return false;
    }
}

function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    
    if (input) input.classList.add('error');
    if (error) {
        error.textContent = message;
        error.classList.add('show');
    }
}

function clearErrors() {
    document.querySelectorAll('.auth-error-msg').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.auth-form-input').forEach(el => el.classList.remove('error'));
}

// ===================================
// AUTHENTICATION HANDLERS
// ===================================

window.handleSignup = async function() {
    if (!isFirebaseInitialized) return;
    
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const profilePicFile = document.getElementById('signupProfilePic').files[0];
    
    clearErrors();
    
    // Validation
    let hasError = false;
    const cleanUsername = validateUsername(username);
    
    if (cleanUsername.length < 3) {
        showError('signupUsername', 'signupUsernameError', 'Username must be at least 3 characters');
        hasError = true;
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('signupEmail', 'signupEmailError', 'Please enter a valid email');
        hasError = true;
    }
    
    if (password.length < 6) {
        showError('signupPassword', 'signupPasswordError', 'Password must be at least 6 characters');
        hasError = true;
    }
    
    if (password !== confirmPassword) {
        showError('signupConfirmPassword', 'signupConfirmError', 'Passwords do not match');
        hasError = true;
    }
    
    if (hasError) return;
    
    // Check username availability
    const usernameAvailable = await checkUsernameAvailability(cleanUsername);
    if (!usernameAvailable) {
        showError('signupUsername', 'signupUsernameError', 'Username is already taken');
        return;
    }
    
    const btn = document.getElementById('signupSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        const { createUserWithEmailAndPassword, updateProfile } = window.firebaseModules.auth;
        const { ref, set, serverTimestamp } = window.firebaseModules.database;
        const { ref: storageRef, uploadBytes, getDownloadURL } = window.firebaseModules.storage;
        
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        let photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=FF1744&color=fff&size=200`;
        
        // Upload profile picture if provided
        if (profilePicFile) {
            const profileRef = storageRef(storage, `profiles/${user.uid}/${Date.now()}_${profilePicFile.name}`);
            await uploadBytes(profileRef, profilePicFile);
            photoURL = await getDownloadURL(profileRef);
        }
        
        // Update Firebase Auth profile
        await updateProfile(user, {
            displayName: cleanUsername,
            photoURL: photoURL
        });
        
        // Store user data in database
        await set(ref(database, `users/${user.uid}`), {
            username: cleanUsername,
            email: email,
            photoURL: photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });
        
        // Reserve username
        await set(ref(database, `usernames/${cleanUsername.toLowerCase()}`), user.uid);
        
        closeAuthModal();
        alert('🎉 Account created successfully! Welcome to Crumbl Crafts!');
        
    } catch (error) {
        console.error('Sign up error:', error);
        let errorMsg = 'Failed to create account';
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = 'Email is already registered';
            showError('signupEmail', 'signupEmailError', errorMsg);
        } else {
            alert(errorMsg + ': ' + error.message);
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
};

window.handleSignIn = async function() {
    if (!isFirebaseInitialized) return;
    
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    
    clearErrors();
    
    let hasError = false;
    
    if (!email) {
        showError('signinEmail', 'signinEmailError', 'Email is required');
        hasError = true;
    }
    
    if (!password) {
        showError('signinPassword', 'signinPasswordError', 'Password is required');
        hasError = true;
    }
    
    if (hasError) return;
    
    const btn = document.getElementById('signinSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    try {
        const { signInWithEmailAndPassword } = window.firebaseModules.auth;
        await signInWithEmailAndPassword(auth, email, password);
        closeAuthModal();
        
    } catch (error) {
        console.error('Sign in error:', error);
        let errorMsg = 'Invalid email or password';
        if (error.code === 'auth/user-not-found') {
            errorMsg = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
            errorMsg = 'Incorrect password';
        }
        showError('signinPassword', 'signinPasswordError', errorMsg);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
};

window.handleGoogleSignIn = async function() {
    if (!isFirebaseInitialized) return;
    
    try {
        const { GoogleAuthProvider, signInWithPopup } = window.firebaseModules.auth;
        const { ref, get, set, update, serverTimestamp } = window.firebaseModules.database;
        
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user exists in database
        const userSnapshot = await get(ref(database, `users/${user.uid}`));
        
        if (!userSnapshot.exists()) {
            // New Google user - create profile
            let username = user.displayName || user.email.split('@')[0];
            username = validateUsername(username);
            
            await set(ref(database, `users/${user.uid}`), {
                username: username,
                email: user.email,
                photoURL: user.photoURL,
                provider: 'google',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
            
            // Reserve username
            await set(ref(database, `usernames/${username.toLowerCase()}`), user.uid);
        } else {
            // Update last login
            await update(ref(database, `users/${user.uid}`), {
                lastLogin: serverTimestamp()
            });
        }
        
        closeAuthModal();
        
    } catch (error) {
        console.error('Google sign in error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            // User closed popup, no error needed
        } else if (error.code === 'auth/popup-blocked') {
            alert('Pop-up blocked. Please allow pop-ups for this site.');
        } else {
            alert('Failed to sign in with Google: ' + error.message);
        }
    }
};

window.handleAnonymousSignIn = async function() {
    if (!isFirebaseInitialized) return;
    
    try {
        const { signInAnonymously } = window.firebaseModules.auth;
        const { ref, set, serverTimestamp } = window.firebaseModules.database;
        
        const userCredential = await signInAnonymously(auth);
        
        // Generate random guest username
        let guestUsername = 'Guest_' + Math.random().toString(36).substr(2, 6);
        guestUsername = validateUsername(guestUsername);
        
        // Store guest user info
        await set(ref(database, `users/${userCredential.user.uid}`), {
            username: guestUsername,
            isAnonymous: true,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });
        
        closeAuthModal();
        alert(`Welcome ${guestUsername}! You're browsing as a guest.`);
        
    } catch (error) {
        console.error('Anonymous sign in error:', error);
        alert('Failed to sign in anonymously: ' + error.message);
    }
};

window.handlePasswordReset = async function() {
    if (!isFirebaseInitialized) return;
    
    const email = document.getElementById('resetEmail').value.trim();
    
    clearErrors();
    
    if (!email) {
        showError('resetEmail', 'resetEmailError', 'Email is required');
        return;
    }
    
    const btn = document.getElementById('resetSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        const { sendPasswordResetEmail } = window.firebaseModules.auth;
        await sendPasswordResetEmail(auth, email);
        alert('Password reset link sent! Check your email.');
        showSignIn();
    } catch (error) {
        console.error('Password reset error:', error);
        showError('resetEmail', 'resetEmailError', 'Failed to send reset link');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-envelope"></i> Send Reset Link';
    }
};

window.handleProfileUpdate = async function() {
    if (!isFirebaseInitialized || !currentUser) return;
    
    const newUsername = document.getElementById('editUsername').value.trim();
    const profilePicFile = document.getElementById('editProfilePic').files[0];
    
    clearErrors();
    
    const btn = document.getElementById('profileSaveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        const { updateProfile } = window.firebaseModules.auth;
        const { ref, get, set, update, remove, serverTimestamp } = window.firebaseModules.database;
        const { ref: storageRef, uploadBytes, getDownloadURL } = window.firebaseModules.storage;
        
        let updates = {};
        let authUpdates = {};
        
        // Handle username change
        if (newUsername && newUsername !== currentUser.displayName) {
            const cleanUsername = validateUsername(newUsername);
            
            if (cleanUsername.length < 3) {
                showError('editUsername', 'editUsernameError', 'Username must be at least 3 characters');
                return;
            }
            
            // Check username availability
            const available = await checkUsernameAvailability(cleanUsername);
            if (!available) {
                showError('editUsername', 'editUsernameError', 'Username is already taken');
                return;
            }
            
            // Remove old username reservation
            if (currentUser.displayName) {
                await remove(ref(database, `usernames/${currentUser.displayName.toLowerCase()}`));
            }
            
            // Reserve new username
            await set(ref(database, `usernames/${cleanUsername.toLowerCase()}`), currentUser.uid);
            
            updates.username = cleanUsername;
            authUpdates.displayName = cleanUsername;
        }
        
        // Handle profile picture upload
        if (profilePicFile) {
            const profileRef = storageRef(storage, `profiles/${currentUser.uid}/${Date.now()}_${profilePicFile.name}`);
            await uploadBytes(profileRef, profilePicFile);
            const photoURL = await getDownloadURL(profileRef);
            
            updates.photoURL = photoURL;
            authUpdates.photoURL = photoURL;
        }
        
        // Update Firebase Auth profile
        if (Object.keys(authUpdates).length > 0) {
            await updateProfile(currentUser, authUpdates);
        }
        
        // Update database
        if (Object.keys(updates).length > 0) {
            await update(ref(database, `users/${currentUser.uid}`), updates);
        }
        
        closeAuthModal();
        alert('✅ Profile updated successfully!');
        
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Failed to update profile: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
};

window.handleSignOut = async function() {
    if (!isFirebaseInitialized) return;
    
    try {
        const { signOut } = window.firebaseModules.auth;
        await signOut(auth);
        closeProfileDropdown();
        alert('👋 Signed out successfully');
        
        // Refresh page to reset any page-specific state
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out: ' + error.message);
    }
};

// ===================================
// INITIALIZATION
// ===================================

async function initUniversalAuth() {
    console.log('🚀 Initializing Universal Auth...');
    
    // Inject CSS styles
    injectAuthStyles();
    
    // Create auth container
    createAuthContainer();
    
    // Initialize Firebase
    const success = await initializeFirebase();
    if (!success) {
        console.error('❌ Failed to initialize Universal Auth');
        return;
    }
    
    // Listen for cross-tab auth changes
    window.addEventListener('message', (event) => {
        if (event.data.type === 'AUTH_STATE_CHANGED') {
            updateAllAuthUI(event.data.user);
        }
    });
    
    // Check for existing auth state from localStorage
    const storedAuth = localStorage.getItem('crumblAuthState');
    if (storedAuth) {
        try {
            const authData = JSON.parse(storedAuth);
            // Validate stored auth (not older than 24 hours)
            if (Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) {
                console.log('📦 Found stored auth data');
                updateAllAuthUI(authData);
            }
        } catch (e) {
            localStorage.removeItem('crumblAuthState');
        }
    }
    
    // No positioning logic needed since auth elements are hardcoded in HTML
    
    console.log('✅ Universal Authentication System initialized successfully');
}

// ===================================
// GLOBAL EXPORTS
// ===================================

// Make functions globally available
window.showSignUp = showSignUp;
window.showSignIn = showSignIn;
window.showForgotPassword = showForgotPassword;
window.showProfileEdit = showProfileEdit;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleProfileDropdown = toggleProfileDropdown;
window.closeProfileDropdown = closeProfileDropdown;
window.viewAccount = viewAccount;
window.validateUsernameInput = validateUsernameInput;

// ===================================
// AUTO INITIALIZATION
// ===================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUniversalAuth);
} else {
    initUniversalAuth();
}
