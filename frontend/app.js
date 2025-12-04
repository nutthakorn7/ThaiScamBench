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

// Category translations
function translateCategory(category) {
    const translations = {
        'fake_officer': '🚨 แอบอ้างเป็นเจ้าหน้าที่',
        'parcel_scam': '📦 หลอกลวงพัสดุ',
        'loan_scam': '💳 หลอกกู้เงิน',
        'investment_scam': '💰 หลอกลงทุน',
        'otp_phishing': '🔐 ขอรหัส OTP',
        'marketplace_scam': '🛒 หลอกขายของออนไลน์',
        'other_scam': '⚠️ การหลอกลวงอื่นๆ',
        'normal': '✅ ข้อความปกติ'
    };
    return translations[category] || category;
}

/**
 * Submit user feedback on detection result
 */
async function submitFeedback(feedbackType) {
    if (!lastRequestId) {
        showFeedbackMessage('❌ ไม่พบ request ID กรุณาตรวจสอบข้อความใหม่', 'error');
        return;
    }

    // Disable buttons to prevent double-click
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
            const result = await response.json();
            
            if (feedbackType === 'correct') {
                showFeedbackMessage('✅ ขอบคุณสำหรับ feedback! ระบบจะแม่นยำขึ้น', 'success');
            } else {
                showFeedbackMessage('✅ ขอบคุณที่แจ้ง! เราจะนำไปปรับปรุงระบบ', 'success');
            }
            
            // Hide feedback buttons after submission
            setTimeout(() => {
                document.getElementById('feedbackSection').style.display = 'none';
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

/**
 * Show feedback message
 */
function showFeedbackMessage(message, type) {
    const messageDiv = document.getElementById('feedbackMessage');
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    messageDiv.style.color = type === 'success' ? '#10b981' : '#ef4444';
}

// Character counter
messageInput.addEventListener('input', () => {
    const length = messageInput.value.length;
    charCount.textContent = length;
    
    if (length > 4500) {
        charCount.style.color = '#ef4444';
    } else {
        charCount.style.color = '#cbd5e1';
    }
});

// Form submission
detectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) {
        showError('กรุณากรอกข้อความที่ต้องการตรวจสอบ');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
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
            // Rate limit exceeded
            const data = await response.json();
            showError(data.message || 'คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
        setLoadingState(false);
    }
});

// Set loading state
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

// Display results
function displayResults(data) {
    // Get risk level
    const riskLevel = getRiskLevel(data.risk_score);
    
    // Update risk indicator
    const riskFill = document.getElementById('riskFill');
    const riskLabel = document.getElementById('riskLabel');
    const riskScore = document.getElementById('riskScore');
    
    riskFill.style.width = `${data.risk_score * 100}%`;
    riskFill.className = `risk-fill ${riskLevel}`;
    
    riskLabel.textContent = getRiskLabelText(riskLevel);
    riskLabel.className = `risk-label ${riskLevel}`;
    
    riskScore.textContent = `คะแนน: ${(data.risk_score * 100).toFixed(0)}%`;
    
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
    
    // Show results
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Get risk level based on score
function getRiskLevel(score) {
    if (score < 0.3) return 'low';
    if (score <= 0.7) return 'medium';
    return 'high';
}

// Get risk label text
function getRiskLabelText(level) {
    const labels = {
        'low': '🟢 ความเสี่ยงต่ำ',
        'medium': '🟡 ควรระวัง',
        'high': '🔴 เสี่ยงสูงมาก'
    };
    return labels[level] || '';
}

// Show error
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide results
function hideResults() {
    resultsContainer.style.display = 'none';
}

// Hide error
function hideError() {
    errorContainer.style.display = 'none';
}

// Reset form
function resetForm() {
    detectionForm.reset();
    charCount.textContent = '0';
    hideResults();
    hideError();
    messageInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Example message loader (for testing)
function loadExample(exampleMessage) {
    messageInput.value = exampleMessage;
    messageInput.dispatchEvent(new Event('input'));
    messageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
