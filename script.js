document.addEventListener('DOMContentLoaded', () => {
    // Element selectors
    const taskButtons = document.querySelectorAll('.task-btn');
    const langSelect = document.getElementById('lang-select');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const errorMessage = document.getElementById('error-message');
    const robos = document.querySelectorAll('.cognivo-robo');
    const cameraBtn = document.getElementById('camera-btn');
    const fileBtn = document.getElementById('file-btn');
    const linkBtn = document.getElementById('link-btn');
    const chatMessages = document.querySelector('.chat-messages');
    const fileInput = document.getElementById('file-input'); // Add this line

    let selectedTask = null;
    let isMouseDown = false;

    // --- Task button selection logic ---
    taskButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentActive = document.querySelector('.task-btn.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            button.classList.add('active');
            selectedTask = button.dataset.task;
            hideError();
        });
    });

    // --- Language selection ---
    langSelect.addEventListener('change', hideError);

    // --- Chat form submission ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSubmit();
    });

    // --- Handle Enter/Shift+Enter ---
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });

    // --- Auto-resize textarea ---
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';

        if (chatInput.value.trim() !== '') {
            setRoboState('thinking');
        } else {
            setRoboState('neutral');
        }
    });

    // --- Icon Buttons ---
    cameraBtn.addEventListener('click', () => {
        // Optionally, trigger file input for images only
        fileInput.accept = 'image/*';
        fileInput.click();
    });

    fileBtn.addEventListener('click', () => {
        // Allow all file types
        fileInput.accept = '';
        fileInput.click();
    });

    linkBtn.addEventListener('click', () => {
        const url = prompt('Paste a link to attach:');
        if (url && url.trim() !== '') {
            chatInput.value += ` ${url.trim()}`;
            chatInput.dispatchEvent(new Event('input'));
        }
    });

    // --- Handle file input change ---
    fileInput.addEventListener('change', async () => {
        if (fileInput.files.length > 0) {
            // Optionally, show file name in chat input
            chatInput.value += ` [Attached: ${fileInput.files[0].name}]`;
            chatInput.dispatchEvent(new Event('input'));
        }
    });

    // --- Handle submit ---
    async function handleSubmit() {
        const userText = chatInput.value.trim();

        if (!selectedTask) {
            showError('Please select a task from the sidebar.');
            setRoboState('sad');
            return;
        }

        if (!langSelect.value) {
            showError('Please select a language.');
            setRoboState('sad');
            return;
        }

        if (userText === '') {
            showError('The input field cannot be empty.');
            setRoboState('sad');
            return;
        }

        hideError();

        // Add user message to chat
        addMessage(userText, 'user');

        // Prepare payload
        let inputType = "text";
        const file = fileInput.files[0];
        if (file) {
            const fileType = file.type;
            if (fileType.startsWith("image/")) {
                inputType = "image+text";
            } else if (fileType.startsWith("video/")) {
                inputType = "video+text";
            } else if (
                fileType === "text/plain" ||
                fileType === "application/pdf" ||
                fileType.includes("word")
            ) {
                inputType = "article+text";
            }
        }

        const payload = {
            message: userText,
            task: selectedTask,
            lang: langSelect.value,
            inputType: inputType
        };

        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload)); // JSON as a string field
        if (file) {
            formData.append('file', file, file.name);
        }

        // Clear input and file
        chatInput.value = '';
        chatInput.style.height = 'auto';
        fileInput.value = '';
        setRoboState('thinking');

        // Send to backend (replace with your webhook URL)
        try {
            const res = await fetch('https://n8n-x6rr.onrender.com/webhook-test/text-call', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.error) {
                showError(data.error);
                setRoboState('sad');
            } else {
                addMessage(data.reply || 'File sent!', 'ai');
                setRoboState('neutral');
            }
        } catch (err) {
            showError('Failed to connect to AI backend.');
            setRoboState('sad');
        }
    }

    // --- Add messages to chat ---
    function addMessage(text, sender) {
        const msg = document.createElement('div');
        msg.classList.add('message', 'glass-panel', sender === 'user' ? 'user-message' : 'ai-message');
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Error helpers ---
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
        setRoboState('neutral');
    }

    // --- Robo states ---
    function setRoboState(state) {
        robos.forEach(robo => {
            robo.classList.remove('thinking', 'sad');
            if (state === 'thinking' || state === 'sad') {
                robo.classList.add(state);
            }
        });
    }

    // --- Robo fly-away ---
    document.body.addEventListener('mousedown', () => { isMouseDown = true; });
    document.body.addEventListener('mouseup', () => {
        isMouseDown = false;
        robos.forEach(r => r.classList.remove('fly-away'));
    });
    document.body.addEventListener('mousemove', (e) => {
        if (isMouseDown && e.clientY < window.innerHeight / 2) {
            robos.forEach(r => r.classList.add('fly-away'));
        }
    });
});

// --- Helper for base64 ---
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = (error) => reject(error);
    });
}