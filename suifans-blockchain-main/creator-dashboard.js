// Global Variables
let isChatOpen = false;
let unreadMessages = 0;
let conversationContext = {
    lastTopic: null,
    messageHistory: []
};

// Predefined responses for different message patterns
const responsePatterns = {
    greeting: {
        patterns: ['hello', 'hi', 'hey', 'howdy', 'hola', 'good morning', 'good afternoon', 'good evening'],
        responses: [
            "Hi! I'm excited to connect with you! Are you a creator or a fan?",
            "Hello there! Welcome to our creative space! Are you here as a creator or a fan?",
            "Hey! Great to see you! Let me know if you're a creator or a fan!",
            "Welcome! Are you joining us as a creator or a fan today?"
        ]
    },
    // ... (keeping all the existing response patterns)
};

// Initial messages sequence
const initialMessages = [
    {
        text: "👋 Welcome to our creative community!",
        delay: 1000
    },
    {
        text: "I'm here to help connect creators and fans.",
        delay: 2000
    },
    {
        text: "Are you joining us as a creator or a fan today?",
        delay: 3000
    }
];

function toggleChat() {
    const chatContent = document.getElementById('chatContent');
    const chatToggleIcon = document.getElementById('chatToggleIcon');
    
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        chatContent.classList.remove('hidden');
        chatToggleIcon.classList.remove('fa-chevron-down');
        chatToggleIcon.classList.add('fa-chevron-up');
        unreadMessages = 0;
        document.getElementById('unreadBadge').classList.add('hidden');
    } else {
        chatContent.classList.add('hidden');
        chatToggleIcon.classList.remove('fa-chevron-up');
        chatToggleIcon.classList.add('fa-chevron-down');
    }
}

function addMessage(text, isUser) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    
    messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
    messageDiv.innerHTML = `
        <div class="max-w-[75%] rounded-lg px-4 py-2 ${
            isUser ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'
        }">
            ${text}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    if (!isChatOpen) {
        unreadMessages++;
        const unreadBadge = document.getElementById('unreadBadge');
        unreadBadge.textContent = unreadMessages;
        unreadBadge.classList.remove('hidden');
    }
}

function processMessage(message) {
    message = message.toLowerCase();
    
    for (const category in responsePatterns) {
        if (category === 'default') continue;
        
        const patterns = responsePatterns[category].patterns;
        if (patterns && patterns.some(pattern => message.includes(pattern))) {
            const responses = responsePatterns[category].responses;
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }
    
    return responsePatterns.default[Math.floor(Math.random() * responsePatterns.default.length)];
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message) {
        addMessage(message, true);
        messageInput.value = '';
        
        // Store message in context
        conversationContext.messageHistory.push({
            type: 'user',
            message: message
        });
        
        // Get and send bot response
        const response = processMessage(message);
        setTimeout(() => {
            addMessage(response, false);
            conversationContext.messageHistory.push({
                type: 'bot',
                message: response
            });
        }, 1000);
    }
}

function sendInitialMessages() {
    initialMessages.forEach((message, index) => {
        setTimeout(() => {
            addMessage(message.text, false);
        }, message.delay);
    });
}

// Initialize chat on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Send initial messages sequence
    sendInitialMessages();
});

// Mobile menu toggle
document.getElementById('sideNavToggle').addEventListener('click', function() {
    const sideNav = document.getElementById('sideNav');
    sideNav.classList.toggle('mobile-menu-open');
});