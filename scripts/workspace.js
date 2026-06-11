// workspace.js

let currentCredit = 0;
let userPlan = '';
let isExpired = false;

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const skillToggleBtn = document.getElementById('skill-toggle-btn');
    const skillDropdown = document.getElementById('skill-dropdown');
    const skillItems = document.querySelectorAll('.skill-item:not(.model-item)');
    const activeSkillLabel = document.getElementById('active-skill-label');
    
    const modelToggleBtn = document.getElementById('model-toggle-btn');
    const modelDropdown = document.getElementById('model-dropdown');
    const modelItems = document.querySelectorAll('.model-item');
    const activeModelName = document.getElementById('active-model-name');
    
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    const canvasArea = document.getElementById('canvas-area');
    const closeCanvasBtn = document.getElementById('close-canvas');
    const canvasTabs = document.getElementById('canvas-tabs');
    const canvasContent = document.getElementById('canvas-content');
    
    // State
    let activeSkill = 'chat'; // default
    
    // --- Skill Selector Logic ---
    
    skillToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        skillDropdown.classList.toggle('hidden');
        modelDropdown.classList.add('hidden'); // Close other dropdown
    });
    
    skillItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update Active Class
            skillItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Update State
            activeSkill = item.dataset.skill;
            
            // Update Label
            const skillName = item.querySelector('h4').textContent;
            activeSkillLabel.textContent = skillName;
            
            // Close Dropdown
            skillDropdown.classList.add('hidden');
        });
    });
    
    // --- Model Selector Logic ---
    
    modelToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdown.classList.toggle('hidden');
        skillDropdown.classList.add('hidden'); // Close other dropdown
    });
    
    modelItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update Active Class
            modelItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Update Label
            const modelName = item.dataset.model;
            activeModelName.textContent = modelName;
            
            // Close Dropdown
            modelDropdown.classList.add('hidden');
        });
    });
    
    // Global click to close dropdowns
    document.addEventListener('click', (e) => {
        if (!skillDropdown.contains(e.target) && e.target !== skillToggleBtn) {
            skillDropdown.classList.add('hidden');
        }
        if (!modelDropdown.contains(e.target) && e.target !== modelToggleBtn) {
            modelDropdown.classList.add('hidden');
        }
    });
    
    // --- Subscription & Auth Logic ---
    async function loadSubscription() {
        const user = window.auth.currentUser;
        if (!user) {
            window.location.href = `/login.html?redirect=${encodeURIComponent('/workspace.html')}`;
            return;
        }
        
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${window.APP_CONFIG.FUNCTIONS_BASE}/check-subscription`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                currentCredit = data.credit;
                userPlan = data.plan;
                isExpired = data.subscriptionStatus === 'expired';
                
                document.getElementById('ui-plan-name').textContent = data.packageName || data.plan;
                document.getElementById('ui-credit').textContent = data.credit;
                
                if (data.subscriptionEndAt) {
                    const date = new Date(data.subscriptionEndAt._seconds * 1000);
                    document.getElementById('ui-expired').textContent = date.toLocaleDateString('id-ID');
                } else if (data.plan === 'free') {
                    document.getElementById('ui-expired').textContent = 'Harian';
                }
                
                if (isExpired) {
                    alert("Paket Anda sudah expired. Silakan perpanjang paket di halaman Harga.");
                    window.location.href = '/harga.html';
                }
            }
        } catch (e) {
            console.error("Gagal memuat info subscription:", e);
        }
    }
    
    // Auth observer to trigger load
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            loadSubscription();
        } else {
            window.location.href = `/login.html?redirect=${encodeURIComponent('/workspace.html')}`;
        }
    });

    // --- Chat Logic ---
    
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    
    sendBtn.addEventListener('click', handleSend);
    
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        // Prevent if expired or no credits
        if (isExpired) {
            alert("Paket Anda expired. Silakan perpanjang.");
            return;
        }
        
        // Asumsi generateCost = 10 (validasi ketat di backend)
        if (currentCredit < 10) {
            alert("Credit tidak cukup! Silakan upgrade paket Anda.");
            return;
        }
        
        // Add User Message
        appendMessage('user', text);
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Show typing
        const loadingId = appendLoading();
        
        // Call Netlify Function for actual generation (Mocked here, but calls the real backend)
        try {
            const token = await window.auth.currentUser.getIdToken();
            const response = await fetch(`${window.APP_CONFIG.FUNCTIONS_BASE}/generate-ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appId: 'workspace',
                    prompt: text,
                    skill: activeSkill
                })
            });
            const result = await response.json();
            
            removeLoading(loadingId);
            
            if (result.success) {
                // Update local credit directly to avoid waiting for reload
                currentCredit = result.remainingCredit;
                document.getElementById('ui-credit').textContent = currentCredit;
                
                appendMessage('ai', result.aiResponse || "Baik, hasil telah digenerate.");
                
                // Open canvas mapping
                if (activeSkill === 'chat') {
                    generateCanvas_ChatBiasa();
                } else if (activeSkill === 'ceklis') {
                    generateCanvas_PembuatCeklis();
                } else if (activeSkill === 'generator') {
                    generateCanvas_GeneratorEDS();
                }
                openCanvas();
            } else {
                appendMessage('ai', "Error: " + result.error);
            }
        } catch (e) {
            removeLoading(loadingId);
            appendMessage('ai', "Terjadi kesalahan jaringan saat terhubung ke server.");
        }
    }
    
    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `avatar ${role}-avatar`;
        
        if (role === 'ai') {
            avatarDiv.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 7.477 2 12 2z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>`;
        } else {
            avatarDiv.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        }
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'msg-bubble';
        bubbleDiv.innerHTML = `<p>${text}</p>`;
        
        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(bubbleDiv);
        
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }
    
    function appendLoading() {
        const id = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ai-message`;
        msgDiv.id = id;
        
        msgDiv.innerHTML = `
            <div class="avatar ai-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 7.477 2 12 2z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
            </div>
            <div class="msg-bubble" style="display: flex; align-items: center; gap: 4px; padding: 1rem;">
                <div style="width:6px;height:6px;background:var(--ws-orange);border-radius:50%;animation:pulse 1.5s infinite"></div>
                <div style="width:6px;height:6px;background:var(--ws-orange);border-radius:50%;animation:pulse 1.5s infinite;animation-delay:0.2s"></div>
                <div style="width:6px;height:6px;background:var(--ws-orange);border-radius:50%;animation:pulse 1.5s infinite;animation-delay:0.4s"></div>
            </div>
        `;
        
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }
    
    function removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // --- Canvas Logic ---
    
    function openCanvas() {
        canvasArea.classList.add('open');
    }
    
    closeCanvasBtn.addEventListener('click', () => {
        canvasArea.classList.remove('open');
    });
    
    // Rules for Canvas Generation
    
    function generateCanvas_ChatBiasa() {
        // Tab: Project
        canvasTabs.innerHTML = `<span class="canvas-tab active">Project</span>`;
        
        // Content
        canvasContent.innerHTML = `
            <div class="canvas-section">
                <h3 class="canvas-title">Dokumen Project</h3>
                <div class="doc-text">
                    <p>Ini adalah tampilan dokumen project standar dari sesi obrolan Anda.</p>
                    <br>
                    <p>Rangkuman AI akan ditulis di sini secara dinamis.</p>
                </div>
            </div>
        `;
    }
    
    function generateCanvas_PembuatCeklis() {
        // Tab: Project > Pembuat Ceklis
        canvasTabs.innerHTML = `
            <span class="canvas-tab">Project</span>
            <span class="separator">></span>
            <span class="canvas-tab active">Pembuat Ceklis</span>
        `;
        
        // Content
        canvasContent.innerHTML = `
            <div class="canvas-section">
                <h3 class="canvas-title">Ceklis Persiapan</h3>
                
                <div class="check-list-item">
                    <div class="check-box"></div>
                    <div class="check-text">Tentukan tujuan utama dari proyek</div>
                </div>
                <div class="check-list-item">
                    <div class="check-box"></div>
                    <div class="check-text">Kumpulkan aset desain dan referensi</div>
                </div>
                <div class="check-list-item">
                    <div class="check-box"></div>
                    <div class="check-text">Buat draf skenario atau alur cerita</div>
                </div>
                <div class="check-list-item">
                    <div class="check-box"></div>
                    <div class="check-text">Lakukan revisi dengan tim</div>
                </div>
            </div>
        `;
        
        attachCheckboxListeners();
    }
    
    function generateCanvas_GeneratorEDS() {
        // Tab: Project > Ceklis Pembuatan > Ultimate Workflow
        canvasTabs.innerHTML = `
            <span class="canvas-tab">Project</span>
            <span class="separator">></span>
            <span class="canvas-tab">Ceklis Pembuatan</span>
            <span class="separator">></span>
            <span class="canvas-tab active">Ultimate Workflow</span>
        `;
        
        // Content (3 sections)
        canvasContent.innerHTML = `
            <div class="canvas-section">
                <h3 class="canvas-title">1. Project</h3>
                <div class="doc-text">
                    <p><strong>Nama Project:</strong> Aplikasi Baru</p>
                    <p><strong>Deskripsi:</strong> Rencana komprehensif yang dirancang oleh AI Planner.</p>
                </div>
            </div>
            
            <div class="canvas-section">
                <h3 class="canvas-title">2. Ceklis Pembuatan</h3>
                <div class="check-list-item">
                    <div class="check-box"></div>
                    <div class="check-text">Fase 1: Riset & Konsep</div>
                </div>
                <div class="check-list-item">
                    <div class="check-box"></div>
                    <div class="check-text">Fase 2: Desain UI/UX</div>
                </div>
                <div class="check-list-item">
                    <div class="check-box"></div>
                    <div class="check-text">Fase 3: Implementasi MVP</div>
                </div>
            </div>
            
            <div class="canvas-section">
                <h3 class="canvas-title">3. Ultimate Workflow</h3>
                <div class="doc-text">
                    <p>Alur kerja yang disarankan: Dimulai dari pemetaan ide di EDS Workspace, lalu diproses menjadi storyboard, dan akhirnya diekspor ke modul produksi visual.</p>
                </div>
            </div>
        `;
        
        attachCheckboxListeners();
    }
    
    function attachCheckboxListeners() {
        const items = document.querySelectorAll('.check-list-item');
        items.forEach(item => {
            item.querySelector('.check-box').addEventListener('click', () => {
                item.classList.toggle('checked');
            });
        });
    }

});

