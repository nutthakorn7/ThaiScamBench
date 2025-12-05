// API Configuration
const API_BASE_URL = window.location.origin;
const API_ENDPOINT = '/v1/public/detect/text';

// DOM Elements
const detectionForm = document.getElementById('detectionForm');
const messageInput = document.getElementById('messageInput');
const channelSelect = document.getElementById('channelSelect');
const checkButton = document.getElementById('checkButton');
const charCount = document.getElementById('charCount');
const resultsContainer = document.getElementById('resultsContainer');
const errorContainer = document.getElementById('errorContainer');
const skeletonContainer = document.getElementById('skeletonContainer');
const clearBtn = document.getElementById('clearBtn');

// State
let lastRequestId = null;

// Category names mapping
const CATEGORY_NAMES = {
    'fake_officer': '🚨 แอบอ้างเป็นเจ้าหน้าที่',
    'parcel_scam': '📦 หลอกลวงพัสดุ',
    'loan_scam': '💳 หลอกกู้เงิน',
    'investment_scam': '💰 หลอกลงทุน',
    'otp_phishing': '🔐 ขอรหัส OTP',
    'marketplace_scam': '🛒 หลอกขายของออนไลน์',
    'other_scam': '⚠️ การหลอกลวงอื่นๆ',
    'normal': '✅ ข้อความปกติ'
};

// ===== Navigation Toggle (Hamburger Menu) =====
function toggleNav() {
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.querySelector('.nav-toggle');
    
    navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
    
    // Update aria-expanded
    const isOpen = navLinks.classList.contains('open');
    navToggle.setAttribute('aria-expanded', isOpen);
    navToggle.setAttribute('aria-label', isOpen ? 'ปิดเมนู' : 'เปิดเมนู');
}

// Close nav when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (navLinks && navToggle && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
    }
});

// ===== Collapsible Sections =====
function toggleCollapsible(id) {
    const content = document.getElementById(id + 'Content');
    const trigger = content.previousElementSibling;
    
    content.classList.toggle('open');
    trigger.classList.toggle('active');
    
    const isOpen = content.classList.contains('open');
    trigger.setAttribute('aria-expanded', isOpen);
}

// ===== Clear Textarea =====
function clearTextarea() {
    messageInput.value = '';
    messageInput.dispatchEvent(new Event('input'));
    messageInput.focus();
    updateClearButtonVisibility();
}

function updateClearButtonVisibility() {
    if (clearBtn) {
        if (messageInput.value.length > 0) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }
    }
}

// ===== Skeleton Loader =====
function showSkeleton() {
    if (skeletonContainer) {
        skeletonContainer.style.display = 'block';
        skeletonContainer.setAttribute('aria-hidden', 'false');
    }
}

function hideSkeleton() {
    if (skeletonContainer) {
        skeletonContainer.style.display = 'none';
        skeletonContainer.setAttribute('aria-hidden', 'true');
    }
}

// ===== Character Counter =====
if (messageInput) {
    messageInput.addEventListener('input', () => {
        const length = messageInput.value.length;
        charCount.textContent = length;
        
        if (length > 4500) {
            charCount.style.color = '#ef4444';
        } else {
            charCount.style.color = '#cbd5e1';
        }
        
        updateClearButtonVisibility();
    });
}

// ===== Form Submission =====
if (detectionForm) {
    detectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) {
            showError('กรุณากรอกข้อความที่ต้องการตรวจสอบ');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        showSkeleton();
        hideResults();
        hideError();
        
        try {
            const response = await fetch(API_BASE_URL + API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    channel: channelSelect.value || null
                })
            });
            
            if (response.status === 429) {
                const data = await response.json();
                showError(data.message || 'คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            lastRequestId = data.request_id;
            displayResults(data);
            
        } catch (error) {
            console.error('Error:', error);
            showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoadingState(false);
            hideSkeleton();
        }
    });
}

// ===== Loading State =====
function setLoadingState(isLoading) {
    const btnText = checkButton.querySelector('.btn-text');
    const btnLoader = checkButton.querySelector('.btn-loader');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        checkButton.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        checkButton.disabled = false;
    }
}

// ===== Display Results =====
function displayResults(data) {
    const riskLevel = getRiskLevel(data.risk_score);
    
    // Update risk indicator
    const riskFill = document.getElementById('riskFill');
    const riskLabel = document.getElementById('riskLabel');
    const riskScore = document.getElementById('riskScore');
    const riskBar = riskFill.parentElement;
    
    riskFill.style.width = `${data.risk_score * 100}%`;
    riskFill.className = `risk-fill ${riskLevel}`;
    
    riskLabel.textContent = getRiskLabelText(riskLevel);
    riskLabel.className = `risk-label ${riskLevel}`;
    
    riskScore.textContent = `คะแนน: ${(data.risk_score * 100).toFixed(0)}%`;
    
    // Update aria for progress bar
    riskBar.setAttribute('aria-valuenow', Math.round(data.risk_score * 100));
    
    // Update category
    const categoryBadge = document.getElementById('categoryBadge');
    categoryBadge.textContent = CATEGORY_NAMES[data.category] || data.category;
    
    // Update reason
    const reasonText = document.getElementById('reasonText');
    reasonText.textContent = data.reason;
    
    // Update advice
    const adviceText = document.getElementById('adviceText');
    adviceText.textContent = data.advice;
    
    // Update model version
    const modelVersion = document.getElementById('modelVersion');
    modelVersion.textContent = data.model_version;
    
    // Show feedback section
    const feedbackSection = document.getElementById('feedbackSection');
    if (feedbackSection) {
        feedbackSection.style.display = 'block';
        // Re-enable feedback buttons
        const buttons = feedbackSection.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = false);
    }
    
    // Hide feedback message
    const feedbackMessage = document.getElementById('feedbackMessage');
    if (feedbackMessage) {
        feedbackMessage.style.display = 'none';
    }
    
    // Show results
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== Risk Level Helpers =====
function getRiskLevel(score) {
    if (score < 0.3) return 'low';
    if (score <= 0.7) return 'medium';
    return 'high';
}

function getRiskLabelText(level) {
    const labels = {
        'low': '🟢 ความเสี่ยงต่ำ',
        'medium': '🟡 ควรระวัง',
        'high': '🔴 เสี่ยงสูงมาก'
    };
    return labels[level] || '';
}

// ===== Feedback =====
async function submitFeedback(feedbackType) {
    if (!lastRequestId) {
        showFeedbackMessage('❌ ไม่พบ request ID กรุณาตรวจสอบข้อความใหม่', 'error');
        return;
    }

    const buttons = document.querySelectorAll('#feedbackSection button');
    buttons.forEach(btn => btn.disabled = true);

    try {
        const response = await fetch('/v1/public/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                request_id: lastRequestId,
                feedback_type: feedbackType,
                comment: null
            })
        });

        if (response.ok) {
            if (feedbackType === 'correct') {
                showFeedbackMessage('✅ ขอบคุณสำหรับ feedback! ระบบจะแม่นยำขึ้น', 'success');
            } else {
                showFeedbackMessage('✅ ขอบคุณที่แจ้ง! เราจะนำไปปรับปรุงระบบ', 'success');
            }
            
            setTimeout(() => {
                const feedbackSection = document.getElementById('feedbackSection');
                if (feedbackSection) {
                    feedbackSection.style.display = 'none';
                }
            }, 2000);
            
        } else {
            const error = await response.json();
            showFeedbackMessage(`❌ เกิดข้อผิดพลาด: ${error.detail || 'ไม่สามารถส่ง feedback ได้'}`, 'error');
            buttons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        console.error('Feedback error:', error);
        showFeedbackMessage('❌ เกิดข้อผิดพลาดในการส่ง feedback', 'error');
        buttons.forEach(btn => btn.disabled = false);
    }
}

function showFeedbackMessage(message, type) {
    const messageDiv = document.getElementById('feedbackMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        messageDiv.style.color = type === 'success' ? '#10b981' : '#ef4444';
        messageDiv.style.marginTop = '1rem';
        messageDiv.style.fontWeight = '600';
        messageDiv.style.textAlign = 'center';
    }
}

// ===== Error Handling =====
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResults() {
    resultsContainer.style.display = 'none';
}

function hideError() {
    errorContainer.style.display = 'none';
}

// ===== Reset Form =====
function resetForm() {
    detectionForm.reset();
    charCount.textContent = '0';
    hideResults();
    hideError();
    hideSkeleton();
    updateClearButtonVisibility();
    messageInput.focus();
    
    // Scroll to form
    const detector = document.getElementById('detector');
    if (detector) {
        detector.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===== Load Example Message =====
function loadExample(exampleMessage) {
    messageInput.value = exampleMessage;
    messageInput.dispatchEvent(new Event('input'));
    messageInput.focus();
    
    // Scroll to form
    const detector = document.getElementById('detector');
    if (detector) {
        detector.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    updateClearButtonVisibility();
});
