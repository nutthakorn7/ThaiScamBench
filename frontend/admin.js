// Admin Dashboard JavaScript

const API_BASE = window.location.origin;
let adminToken = null;
let dailyChart = null;
let categoryChart = null;

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const timeRangeSelect = document.getElementById('timeRange');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');

// Check for saved token on load
const savedToken = sessionStorage.getItem('adminToken');
if (savedToken) {
    adminToken = savedToken;
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm();
    setupRefreshButton();
    setupLogoutButton();
    setupTimeRangeSelect(); // Ensure this is set up
    
    // Auto-login if token saved
    if (adminToken) {
        showDashboard();
        loadAllData();
    }
});

// Setup login form
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const tokenInput = document.getElementById('adminToken');
        const token = tokenInput.value.trim();
        
        if (!token) {
            showError('Please enter admin token');
            return;
        }
        
        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="btn-text">🔄 Logging in...</span>';
        submitBtn.disabled = true;
        
        // Test token by making API call
        try {
            const response = await fetch(`${API_BASE}/admin/stats/summary`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                adminToken = token;
                sessionStorage.setItem('adminToken', token);
                showDashboard();
                loadAllData();
            } else {
                showError('❌ Invalid admin token. Please try again.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            showError('❌ Failed to connect to server');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Setup logout button
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function logout() {
    adminToken = null;
    sessionStorage.removeItem('adminToken');
    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('adminToken').value = '';
}

// Setup refresh button
function setupRefreshButton() {
    refreshBtn.addEventListener('click', () => {
        loadAllData();
    });
}

// Setup time range select
function setupTimeRangeSelect() {
    timeRangeSelect.addEventListener('change', () => {
        loadAllData();
    });
}

// Show dashboard
function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    logoutBtn.style.display = 'block';
}

// Load all dashboard data
async function loadAllData() {
    const days = timeRangeSelect.value;
    
    // Show loading state
    document.querySelectorAll('.stat-value').forEach(el => {
        el.textContent = '⏳';
    });
    
    try {
        await Promise.all([
            loadSummaryStats(days),
            loadPartnerStats(),
            loadCategoryStats()
        ]);
        hideError();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('❌ Failed to load dashboard data. Check your connection.');
        
        // Reset to error state
        document.querySelectorAll('.stat-value').forEach(el => {
            el.textContent = '❌';
        });
    }
}

// Load and update summary stats
async function loadSummaryStats(days) {
    const summaryResponse = await fetch(`${API_BASE}/admin/stats/summary?days=${days}`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    
    if (!summaryResponse.ok) {
        throw new Error('Failed to load summary stats');
    }
    
    const summary = await summaryResponse.json();
    updateSummaryStats(summary);
    updateDailyChart(summary.requests_per_day);
}

// Load and update category stats
async function loadCategoryStats() {
    const categoryResponse = await fetch(`${API_BASE}/admin/stats/categories`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    
    if (!categoryResponse.ok) {
        throw new Error('Failed to load category stats');
    }
    
    const categoryData = await categoryResponse.json();
    updateCategoryChart(categoryData.categories);
}

// Load and update partner stats
async function loadPartnerStats() {
    const partnerResponse = await fetch(`${API_BASE}/admin/stats/partners`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    
    if (!partnerResponse.ok) {
        throw new Error('Failed to load partner stats');
    }
    
    const partnerData = await partnerResponse.json();
    updatePartnerTable(partnerData.partners);
    updatePartnerStats(partnerData);
}

// Update summary stats cards
function updateSummaryStats(summary) {
    document.getElementById('totalRequests').textContent = summary.total_requests.toLocaleString();
    document.getElementById('scamRatio').textContent = (summary.scam_ratio * 100).toFixed(1) + '%';
    document.getElementById('publicRequests').textContent = summary.public_requests.toLocaleString();
}

// Update partner stats
function updatePartnerStats(data) {
    document.getElementById('totalPartners').textContent = data.active_partners;
}

// Update daily requests chart
function updateDailyChart(data) {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    if (dailyChart) {
        dailyChart.destroy();
    }
    
    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Requests',
                data: data.map(d => d.count),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: '#334155'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: '#334155'
                    }
                }
            }
        }
    });
}

// Update category chart
function updateCategoryChart(categories) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const colors = [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
    ];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => formatCategoryName(c.category)),
            datasets: [{
                data: categories.map(c => c.count),
                backgroundColor: colors,
                borderColor: '#1e293b',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#cbd5e1',
                        padding: 15
                    }
                }
            }
        }
    });
}

// Update partner table
function updatePartnerTable(partners) {
    const tbody = document.getElementById('partnerTableBody');
    
    if (partners.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No partners found</td></tr>';
        return;
    }
    
    tbody.innerHTML = partners.map(p => `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
            <td>${p.rate_limit}/min</td>
            <td>${p.total_requests.toLocaleString()}</td>
            <td>${p.scam_count.toLocaleString()}</td>
            <td>${(p.scam_ratio * 100).toFixed(1)}%</td>
            <td>${p.avg_risk_score.toFixed(2)}</td>
        </tr>
    `).join('');
}

// Format category name for display
function formatCategoryName(category) {
    const names = {
        'parcel_scam': '📦 Parcel',
        'banking_scam': '🏦 Banking',
        'prize_scam': '🎁 Prize',
        'investment_scam': '💰 Investment',
        'impersonation_scam': '👮 Impersonation',
        'safe': '✅ Safe'
    };
    return names[category] || category;
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide error
function hideError() {
    errorContainer.style.display = 'none';
}
