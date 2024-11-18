// Global variables
let transactions = [];
const MOCK_BALANCE = 1000;
const SUI_TO_USD_RATE = 25; // Mock rate, replace with actual API call



function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'signup.html#';
}

// Balance Management
function updateBalance(amount) {
    const balanceElement = document.getElementById('balance');
    const usdElement = balanceElement.nextElementSibling;
    const currentBalance = parseFloat(balanceElement.textContent);
    const newBalance = currentBalance + amount;
    
    // Animate balance change
    animateNumber(currentBalance, newBalance, (value) => {
        balanceElement.textContent = `${value.toFixed(2)} SUI`;
        usdElement.textContent = `≈ $${(value * SUI_TO_USD_RATE).toFixed(2)} USD`;
        localStorage.setItem('balance', value.toFixed(2));
    });

    balanceElement.classList.add('balance-update');
    setTimeout(() => balanceElement.classList.remove('balance-update'), 500);
}

function animateNumber(start, end, callback) {
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const value = start + (end - start) * progress;
        callback(value);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Transaction Management
function addTransaction(type, amount, status = 'Completed') {
    const transaction = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type,
        amount,
        status
    };
    
    transactions.unshift(transaction);
    updateTransactionHistory();
    updateRecentActivity();
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function updateTransactionHistory() {
    const history = document.getElementById('transactionHistory');
    history.innerHTML = transactions.map(tx => `
        <tr class="border-b hover:bg-gray-50 transition-colors">
            <td class="py-3 px-4">
                <div class="flex items-center">
                    <i class="fas fa-circle text-xs ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'} mr-2"></i>
                    ${tx.date}
                </div>
            </td>
            <td class="py-3 px-4">
                <span class="flex items-center">
                    <i class="fas ${getTransactionIcon(tx.type)} ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'} mr-2"></i>
                    ${tx.type}
                </span>
            </td>
            <td class="py-3 px-4 ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}">
                ${tx.amount > 0 ? '+' : ''}${tx.amount} SUI
            </td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${getStatusClass(tx.status)} rounded-full text-sm">
                    ${tx.status}
                </span>
            </td>
        </tr>
    `).join('');
}

function updateRecentActivity() {
    const recent = document.getElementById('recentActivity');
    const recentTx = transactions.slice(0, 3);
    
    recent.innerHTML = recentTx.map(tx => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
                <div class="w-8 h-8 rounded-full ${tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center mr-3">
                    <i class="fas ${getTransactionIcon(tx.type)} ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}"></i>
                </div>
                <div>
                    <p class="font-medium">${tx.type}</p>
                    <p class="text-sm text-gray-500">${getTimeAgo(tx.id)}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-medium ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}">
                    ${tx.amount > 0 ? '+' : ''}${tx.amount} SUI
                </p>
                <p class="text-sm text-gray-500">
                    ≈ $${Math.abs(tx.amount * SUI_TO_USD_RATE).toFixed(2)}
                </p>
            </div>
        </div>
    `).join('');
}

// Modal Functions
function showTransactionModal(type) {
    const modal = document.getElementById('transactionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modal.classList.remove('hidden');
    modalTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} SUI`;
    
    switch(type) {
        case 'send':
            modalContent.innerHTML = getSendModalContent();
            document.getElementById('sendForm').onsubmit = handleSend;
            break;
        case 'receive':
            modalContent.innerHTML = getReceiveModalContent();
            break;
        case 'convert':
            modalContent.innerHTML = getConvertModalContent();
            document.getElementById('convertForm').onsubmit = handleConvert;
            document.getElementById('convertAmount').addEventListener('input', updateConvertedAmount);
            break;
        case 'deposit':
            modalContent.innerHTML = getDepositModalContent();
            document.getElementById('depositForm').onsubmit = handleDeposit;
            setupDepositFormListeners();
            break;
    }
}

// Modal Content Templates
function getSendModalContent() {
    return `
        <form id="sendForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                <input type="text" id="recipientAddress" required
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                    placeholder="Enter SUI address">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Amount (SUI)</label>
                <input type="number" id="sendAmount" required
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                    placeholder="0.00" step="0.01" min="0.01">
            </div>
            <div class="flex space-x-4">
                <button type="submit" 
                    class="flex-1 gradient-bg text-white px-4 py-3 rounded-lg hover:opacity-90">
                    Send SUI
                </button>
                <button type="button" onclick="closeModal()"
                    class="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
            </div>
        </form>
    `;
}

function getReceiveModalContent() {
    const address = generateWalletAddress();
    return `
        <div class="space-y-4 text-center">
            <div class="mb-4">
                <div class="qr-code-container mb-4">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${address}" 
                         alt="QR Code" class="mx-auto">
                </div>
                <p class="text-sm text-gray-600 mb-2">Your SUI Wallet Address</p>
                <div class="bg-gray-100 p-4 rounded-lg break-all font-mono text-sm">
                    ${address}
                </div>
            </div>
            <div class="flex space-x-4">
                <button onclick="copyWalletAddress('${address}')" 
                    class="flex-1 gradient-bg text-white px-4 py-3 rounded-lg hover:opacity-90">
                    Copy Address
                </button>
                <button onclick="closeModal()"
                    class="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300">
                    Close
                </button>
            </div>
        </div>
    `;
}

function getConvertModalContent() {
    return `
        <form id="convertForm" class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-600">Current Rate:</span>
                    <span class="text-sm font-medium text-gray-900">1 SUI = $${SUI_TO_USD_RATE} USD</span>
                </div>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <div class="relative">
                        <input type="number" id="convertAmount" 
                            class="w-full p-3 pr-20 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                            placeholder="0.00" step="0.01" min="0.01" required>
                        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span class="text-gray-500">SUI</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-center">
                    <button type="button" onclick="switchConversion()" 
                        class="p-2 rounded-full hover:bg-gray-100">
                        <i class="fas fa-exchange-alt text-gray-600"></i>
                    </button>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <div class="relative">
                        <input type="number" id="convertedAmount" 
                            class="w-full p-3 pr-20 border rounded-lg bg-gray-50" 
                            readonly>
                        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span class="text-gray-500">USD</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex space-x-4">
                <button type="submit" 
                    class="flex-1 gradient-bg text-white px-4 py-3 rounded-lg hover:opacity-90">
                    Convert
                </button>
                <button type="button" onclick="closeModal()"
                    class="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
            </div>
        </form>
    `;
}

function getDepositModalContent() {
    return `
        <form id="depositForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Amount (SUI)</label>
                <input type="number" id="depositAmount" required
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" 
                    placeholder="0.00" step="0.01" min="0.01">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select id="paymentMethod" 
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    onchange="togglePaymentFields()">
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="crypto">Crypto Wallet</option>
                </select>
            </div>

            <div id="cardFields" class="space-y-2">
                <input type="text" id="cardNumber" 
                    class="w-full p-3 border rounded-lg" 
                    placeholder="Card Number"
                    maxlength="19">
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="expiryDate" 
                        class="p-3 border rounded-lg" 
                        placeholder="MM/YY"
                        maxlength="5">
                    <input type="text" id="cvv" 
                        class="p-3 border rounded-lg" 
                        placeholder="CVV"
                        maxlength="4">
                </div>
            </div>

            <div class="flex space-x-4">
                <button type="submit" 
                    class="flex-1 gradient-bg text-white px-4 py-3 rounded-lg hover:opacity-90">
                    Deposit
                </button>
                <button type="button" onclick="closeModal()"
                    class="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
            </div>
        </form>
    `;
}

// Transaction Handlers
function handleSend(event) {
    event.preventDefault();
    const amount = -parseFloat(document.getElementById('sendAmount').value);
    const recipient = document.getElementById('recipientAddress').value;
    
    showLoadingState('Processing transaction...');
    
    setTimeout(() => {
        addTransaction('Sent', amount);
        updateBalance(amount);
        showNotification(`Successfully sent ${Math.abs(amount)} SUI to ${recipient.substring(0, 8)}...`);
        closeModal();
    }, 1500);
}

function handleConvert(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('convertAmount').value);
    const converted = parseFloat(document.getElementById('convertedAmount').value);
    
    showLoadingState('Converting SUI...');
    
    setTimeout(() => {
        addTransaction('Converted', -amount);
        updateBalance(-amount);
        showNotification(`Successfully converted ${amount} SUI to $${converted} USD`);
        closeModal();
    }, 1500);
}

function handleDeposit(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!validatePaymentDetails(paymentMethod)) {
        showNotification('Please fill in all payment details', 'error');
        return;
    }
    
    showLoadingState('Processing deposit...');
    setTimeout(() => {
        addTransaction('Deposit', amount);
        updateBalance(amount);
        showNotification(`Successfully deposited ${amount} SUI via ${paymentMethod}`);
        closeModal();
    }, 2000);
}

// Utility Functions
function generateWalletAddress() {
    return '0x' + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
}

function copyWalletAddress(address) {
    navigator.clipboard.writeText(address).then(() => {
        showNotification('Wallet address copied to clipboard!');
    });
}

function showLoadingState(message) {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p class="text-gray-600">${message}</p>
        </div>
    `;
}

function closeModal() {
    const modal = document.getElementById('transactionModal');
    modal.classList.add('fade-out');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('fade-out');
    }, 300);
}

function showNotification(message, type = 'success') {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: type === 'success' ? "#4CAF50" : "#F44336",
        className: "rounded-lg",
        stopOnFocus: true,
    }).showToast();
}

function getTransactionIcon(type) {
    switch(type) {
        case 'Sent': return 'fa-paper-plane';
        case 'Received': return 'fa-download';
        case 'Converted': return 'fa-exchange-alt';
        case 'Deposit': return 'fa-wallet';
        default: return 'fa-circle';
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Failed': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (let [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'Just now';
}

function setupDepositFormListeners() {
    // Card number formatting
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = value;
        });
    }

    // Expiry date formatting
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }

    // CVV formatting
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
        });
    }
}

function validatePaymentDetails(paymentMethod) {
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        
        if (!cardNumber || !expiryDate || !cvv) return false;
        
        const cardValid = /^\d{16}$/.test(cardNumber);
        const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate);
        const cvvValid = /^\d{3,4}$/.test(cvv);
        
        return cardValid && expiryValid && cvvValid;
    }
    return true;
}

function updateConvertedAmount() {
    const amount = document.getElementById('convertAmount').value;
    const converted = (amount * SUI_TO_USD_RATE).toFixed(2);
    document.getElementById('convertedAmount').value = converted;
}

function switchConversion() {
    const amount = document.getElementById('convertAmount');
    const converted = document.getElementById('convertedAmount');
    const labels = document.querySelectorAll('.text-gray-500');
    
    [amount.value, converted.value] = [
        (converted.value / SUI_TO_USD_RATE).toFixed(2),
        amount.value
    ];
    
    [labels[0].textContent, labels[1].textContent] = 
    [labels[1].textContent, labels[0].textContent];
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Load saved data
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
        updateTransactionHistory();
        updateRecentActivity();
    }
    
    // Set initial balance
    const savedBalance = localStorage.getItem('balance') || MOCK_BALANCE;
    document.getElementById('balance').textContent = `${savedBalance} SUI`;
    
    // Update username
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('username').textContent = username;
        document.getElementById('sidebarUsername').textContent = username;
    }

    // Mobile menu handling
    const sideNavToggle = document.getElementById('sideNavToggle');
    const sideNav = document.getElementById('sideNav');
    const mainContent = document.querySelector('.ml-64');

    sideNavToggle.addEventListener('click', function() {
        sideNav.classList.toggle('-translate-x-full');
        mainContent.classList.toggle('ml-0');
    });

    // Close modal on outside click
    document.getElementById('transactionModal').addEventListener('click', function(event) {
        if (event.target === this) closeModal();
    });

    // Close modal on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') closeModal();
    });
});