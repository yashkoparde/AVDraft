document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const textInput = document.getElementById('text-input');
    const simplifyBtn = document.getElementById('simplify-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const resultArea = document.getElementById('result-area');
    const simplifiedTextDiv = document.getElementById('simplified-text');
    const ocrSpinner = document.getElementById('ocr-spinner');
    const confidenceBadge = document.getElementById('confidence-badge');
    const ttsBtn = document.getElementById('tts-btn');
    const quizBtn = document.getElementById('quiz-btn');
    const quizArea = document.getElementById('quiz-area');
    const pdfBtn = document.getElementById('pdf-btn');
    const historyPanel = document.getElementById('history-panel');
    const toggleHistoryBtn = document.getElementById('toggle-history');
    const closeHistoryBtn = document.getElementById('close-history');
    const historyList = document.getElementById('history-list');

    // --- State ---
    let currentSimplifiedText = "";

    // --- Animations (Scroll Reveal) ---
    const reveals = document.querySelectorAll('.reveal');
    
    function reveal() {
        const windowHeight = window.innerHeight;
        const elementVisible = 150;
        
        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', reveal);
    reveal(); // Trigger once on load

    // --- Accordion ---
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(acc => {
        acc.addEventListener('click', () => {
            const content = acc.nextElementSibling;
            content.classList.toggle('open');
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                acc.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                acc.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');
            }
        });
    });

    // --- File Upload / Drag & Drop ---
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    async function handleFile(file) {
        if (!file) return;
        
        // Show spinner
        ocrSpinner.style.display = 'block';
        dropZone.style.opacity = '0.7';
        
        try {
            // Tesseract OCR
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(file);
            await worker.terminate();
            
            textInput.value = ret.data.text;
            // Scroll to text area
            textInput.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            console.error(err);
            alert("Failed to extract text. Please try pasting manually.");
        } finally {
            ocrSpinner.style.display = 'none';
            dropZone.style.opacity = '1';
        }
    }

    // --- Sample Text ---
    sampleBtn.addEventListener('click', () => {
        const sample = `The patient has a history of Hypertension and is at risk for Myocardial Infarction. Anesthesia will be administered prior to the procedure. Consent has been obtained.`;
        textInput.value = sample;
        window.scrollTo({ top: dropZone.offsetTop, behavior: 'smooth' });
    });

    // --- Simplify Logic ---
    simplifyBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) {
            alert("Please enter some text first.");
            return;
        }

        // Loading state
        simplifyBtn.disabled = true;
        simplifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        resultArea.style.display = 'none';
        quizArea.style.display = 'none';
        quizArea.innerHTML = '';

        try {
            const response = await fetch('/api/simplify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            currentSimplifiedText = data.simplified;
            
            // Render
            simplifiedTextDiv.textContent = data.simplified;
            
            // Confidence Badge
            // If model is local, medium. If openai, high (or parsed).
            // Backend returns confidence field.
            const conf = data.confidence || 'medium';
            confidenceBadge.className = `confidence-tag conf-${conf.toLowerCase()}`;
            confidenceBadge.textContent = conf.charAt(0).toUpperCase() + conf.slice(1);
            
            resultArea.style.display = 'block';
            resultArea.scrollIntoView({ behavior: 'smooth' });
            
            // Add to History (Local)
            addToHistory(text, data.simplified);
            
        } catch (err) {
            console.error(err);
            alert("Simplification failed. Please check the backend connection.");
        } finally {
            simplifyBtn.disabled = false;
            simplifyBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Simplify & Read';
        }
    });

    // --- TTS (Client Side) ---
    ttsBtn.addEventListener('click', () => {
        if (!currentSimplifiedText) return;
        
        const utterance = new SpeechSynthesisUtterance(currentSimplifiedText);
        utterance.rate = 0.9;
        window.speechSynthesis.cancel(); // Stop previous
        window.speechSynthesis.speak(utterance);
    });

    // --- PDF Generation ---
    pdfBtn.addEventListener('click', async () => {
        if (!currentSimplifiedText) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("ArogyaVani Simplified Report", 10, 10);
        
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(currentSimplifiedText, 180);
        doc.text(splitText, 10, 30);
        
        doc.save("simplified-health-report.pdf");
    });

    // --- Quiz Logic ---
    quizBtn.addEventListener('click', async () => {
        if (!currentSimplifiedText) return;
        
        quizBtn.disabled = true;
        quizBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        
        try {
            const response = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ simplified: currentSimplifiedText })
            });
            
            const data = await response.json();
            renderQuiz(data.questions);
            quizArea.style.display = 'block';
            
        } catch (err) {
            console.error(err);
            alert("Quiz generation failed.");
        } finally {
            quizBtn.disabled = false;
            quizBtn.innerHTML = 'Check Understanding';
        }
    });

    function renderQuiz(questions) {
        quizArea.innerHTML = '';
        questions.forEach((q, index) => {
            const qDiv = document.createElement('div');
            qDiv.style.marginBottom = '1rem';
            qDiv.innerHTML = `
                <p style="font-weight:600; margin-bottom:0.5rem;">${index + 1}. ${q.q}</p>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-outline quiz-ans" data-q="${index}" data-ans="yes">Yes</button>
                    <button class="btn btn-outline quiz-ans" data-q="${index}" data-ans="no">No</button>
                </div>
            `;
            quizArea.appendChild(qDiv);
        });
        
        // Add listeners to new buttons
        document.querySelectorAll('.quiz-ans').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Visual feedback
                e.target.style.backgroundColor = 'var(--primary-color)';
                e.target.style.color = 'white';
                
                // Log to audit
                fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'quiz_response',
                        question: questions[e.target.dataset.q].q,
                        answer: e.target.dataset.ans
                    })
                });
            });
        });
    }

    // --- History (Local Storage) ---
    function addToHistory(original, simplified) {
        let history = JSON.parse(localStorage.getItem('arogyavani_history') || '[]');
        const entry = {
            id: Date.now(),
            original: original.substring(0, 30) + '...',
            timestamp: new Date().toLocaleTimeString()
        };
        history.unshift(entry);
        if (history.length > 5) history.pop();
        localStorage.setItem('arogyavani_history', JSON.stringify(history));
        updateHistoryUI();
    }

    function updateHistoryUI() {
        let history = JSON.parse(localStorage.getItem('arogyavani_history') || '[]');
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<p style="color:var(--text-gray); font-size:0.9rem;">No history yet.</p>';
            return;
        }
        
        history.forEach(item => {
            const div = document.createElement('div');
            div.style.padding = '0.5rem 0';
            div.style.borderBottom = '1px solid #f1f5f9';
            div.innerHTML = `
                <div style="font-size:0.8rem; color:var(--text-gray);">${item.timestamp}</div>
                <div style="font-weight:500; font-size:0.9rem;">${item.original}</div>
            `;
            historyList.appendChild(div);
        });
    }

    toggleHistoryBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('visible');
        updateHistoryUI();
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyPanel.classList.remove('visible');
    });

});
