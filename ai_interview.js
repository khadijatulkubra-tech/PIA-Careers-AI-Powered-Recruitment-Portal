// AI Interview Room - Instructions Page + TTS/STT + Face Detection Proctoring

const AIInterview = {
  candidateId: null,
  candObj: null,
  jobObj: null,
  transcript: [],
  questionPool: [],
  currentQIndex: 0,
  totalQuestions: 6,
  proctoringData: null,
  videoStream: null,
  videoEl: null,
  faceModel: null,
  faceCheckInterval: null,
  synth: window.speechSynthesis || null,
  recognition: null,
  isListening: false,
  currentSpeechBuffer: "",

  GENERAL_QUESTIONS: [
    "Tell me about yourself and what motivates you professionally.",
    "Where do you see yourself in the next three to five years?",
    "Describe a time you had to work under a very tight deadline. How did you manage it?",
    "What is your greatest professional strength, and can you give a concrete example?",
    "Tell me about a situation where you had a conflict with a colleague. How was it resolved?",
    "Why are you leaving your current position?",
    "How do you prioritize tasks when you have multiple urgent items on your plate?",
    "Describe a project you are most proud of and explain your contribution to its success.",
    "How do you keep yourself updated with industry trends and new technologies?",
    "What does teamwork mean to you, and how do you contribute to a team environment?"
  ],
  TECH_QUESTIONS: [
    "Explain the difference between synchronous and asynchronous programming with a practical example.",
    "How do you approach debugging a production issue that you cannot reproduce locally?",
    "What strategies do you use to ensure your code is maintainable and readable by other developers?",
    "Walk me through your process when designing a new database schema for a scalable application.",
    "How do you handle API versioning in a microservices environment?",
    "What is the difference between SQL and NoSQL databases and when would you choose one over the other?",
    "Explain the concept of CI/CD and how you have implemented it in a past project.",
    "How do you secure a REST API against unauthorized access?",
    "What are the SOLID principles and can you give an example of applying one of them?",
    "Describe how you would optimize a slow-loading web page. What tools and techniques would you use?"
  ],
  CABIN_CREW_QUESTIONS: [
    "How would you calm a passenger who is extremely nervous about flying for the first time?",
    "Describe a time you went above and beyond to make a customer feel special.",
    "How do you handle a situation where a passenger is rude or aggressive?",
    "What would you do if you noticed a colleague was not following safety procedures?",
    "Describe your approach to managing inflight service when it is very busy and understaffed.",
    "How do you maintain composure and professionalism during a medical emergency onboard?",
    "How would you handle a passenger who refuses to fasten their seatbelt during turbulence?",
    "What languages do you speak and how has this helped you in a customer-facing role?",
    "Give an example of a time you successfully de-escalated a tense situation.",
    "Why do you want to represent PIA as cabin crew specifically?"
  ],
  MARKETING_QUESTIONS: [
    "How would you measure the success of a digital marketing campaign?",
    "Describe a campaign you designed from scratch. What was your strategy and what were the results?",
    "How do you approach creating content for different audience segments?",
    "What is your experience with SEO and how have you used it to grow organic traffic?",
    "How do you stay up to date with changes in social media algorithms?",
    "Walk me through how you would conduct a competitive analysis before launching a product.",
    "What metrics do you consider most important when analyzing email marketing performance?",
    "How do you handle a situation where a campaign is underperforming?",
    "Describe your experience with paid advertising platforms like Google Ads or Meta Ads.",
    "How would you build a brand identity for an airline from the ground up?"
  ],
  SECURITY_QUESTIONS: [
    "Walk me through how you would respond to a ransomware attack on a corporate network.",
    "How do you perform a vulnerability assessment on a web application?",
    "What is the difference between symmetric and asymmetric encryption?",
    "Describe your experience with SIEM platforms and how you used them for threat detection.",
    "How do you stay current with new CVEs and emerging threat actors?",
    "Explain how a SQL injection attack works and how you would prevent it.",
    "What steps would you take to harden a Linux server for production deployment?",
    "Describe a penetration testing engagement you led. What was your methodology?",
    "How do you balance security requirements with the need for operational efficiency?",
    "What is zero-trust architecture and how would you implement it in an enterprise?"
  ],

  buildQuestionPool: function () {
    const title = (this.candObj.jobTitle || "").toLowerCase();
    let roleBank = this.GENERAL_QUESTIONS;
    if (title.includes("developer") || title.includes("technology") || title.includes("engineer")) roleBank = this.TECH_QUESTIONS;
    else if (title.includes("cabin") || title.includes("crew") || title.includes("attendant")) roleBank = this.CABIN_CREW_QUESTIONS;
    else if (title.includes("marketing") || title.includes("commercial")) roleBank = this.MARKETING_QUESTIONS;
    else if (title.includes("security") || title.includes("analyst")) roleBank = this.SECURITY_QUESTIONS;
    const hrQs = AppState.getHrQuestions() || [];
    const shuffled = [...roleBank].sort(() => Math.random() - 0.5);
    this.questionPool = [...hrQs.slice(0, 2), ...shuffled.slice(0, 4)];
    this.totalQuestions = this.questionPool.length;
    this.currentQIndex = 0;
  },

  render: function (containerId, candidateId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    this.candObj = AppState.getCandidateById(candidateId);
    if (!this.candObj) { container.innerHTML = '<div class="glass-card"><p style="color:red;">Candidate not found.</p></div>'; return; }
    this.candidateId = candidateId;
    this.jobObj = AppState.getJobById(this.candObj.jobId);
    this.transcript = [];
    this.isListening = false;
    this.currentSpeechBuffer = "";
    this.buildQuestionPool();
    this.initSpeechRecognition();
    this.renderInstructions(container);
  },

  renderInstructions: function (container) {
    container.innerHTML = `
      <div style="max-width:820px;margin:0 auto;animation:fadeInUp 0.5s ease;">
        <div style="text-align:center;margin-bottom:2rem;">
          <span class="brand-badge" style="display:inline-block;margin-bottom:1rem;font-size:0.85rem;">AI Interview Portal - PIA</span>
          <h2 style="color:var(--text-main);font-size:1.8rem;margin:0;">Before You Begin</h2>
          <p style="color:var(--text-muted);margin-top:0.5rem;font-size:0.95rem;">
            Hello, <strong>${this.candObj.name}</strong>. You are about to start your AI-proctored interview for <strong>${this.candObj.jobTitle}</strong>.
            Please read all instructions carefully before proceeding.
          </p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">
          <div class="glass-card" style="padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem;">
            <h4 style="color:var(--text-main);margin:0;display:flex;align-items:center;gap:0.5rem;">
              <span style="font-size:1.1rem;">&#128247;</span> Camera Check
            </h4>
            <div style="position:relative;border-radius:10px;overflow:hidden;background:#000;aspect-ratio:4/3;">
              <video id="preview-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;"></video>
              <div id="camera-status-overlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);color:#fff;font-size:0.85rem;text-align:center;padding:1rem;">
                Requesting camera access...
              </div>
            </div>
            <p id="cam-msg" style="font-size:0.78rem;color:var(--text-muted);margin:0;">Make sure your face is clearly visible, well-lit, and centered.</p>
          </div>
          <div class="glass-card" style="padding:1.25rem;">
            <h4 style="color:var(--text-main);margin:0 0 1rem 0;display:flex;align-items:center;gap:0.5rem;">
              <span style="font-size:1.1rem;">&#128203;</span> Interview Rules
            </h4>
            <div style="display:flex;flex-direction:column;gap:0.65rem;font-size:0.84rem;">
              <div style="display:flex;gap:0.6rem;align-items:flex-start;">
                <span style="color:#22c55e;font-size:1rem;flex-shrink:0;">&#10004;</span>
                <span>Sit in a <strong>well-lit, quiet room</strong>. Only you should be visible on camera.</span>
              </div>
              <div style="display:flex;gap:0.6rem;align-items:flex-start;">
                <span style="color:#22c55e;font-size:1rem;flex-shrink:0;">&#10004;</span>
                <span>Use a laptop or desktop. Do <strong>not</strong> use a mobile device.</span>
              </div>
              <div style="display:flex;gap:0.6rem;align-items:flex-start;">
                <span style="color:#22c55e;font-size:1rem;flex-shrink:0;">&#10004;</span>
                <span>You may <strong>speak your answers</strong> using the mic button or type them.</span>
              </div>
              <div style="display:flex;gap:0.6rem;align-items:flex-start;">
                <span style="color:#ef4444;font-size:1rem;flex-shrink:0;">&#10006;</span>
                <span><strong>Do not switch tabs</strong> or minimize. 3 violations = disqualification.</span>
              </div>
              <div style="display:flex;gap:0.6rem;align-items:flex-start;">
                <span style="color:#ef4444;font-size:1rem;flex-shrink:0;">&#10006;</span>
                <span><strong>Do not copy, paste, or right-click</strong> during the interview.</span>
              </div>
              <div style="display:flex;gap:0.6rem;align-items:flex-start;">
                <span style="color:#ef4444;font-size:1rem;flex-shrink:0;">&#10006;</span>
                <span><strong>No other people</strong> in frame. Multiple faces = violation (3 = disqualification).</span>
              </div>
              <div style="display:flex;gap:0.6rem;align-items:flex-start;">
                <span style="color:#ef4444;font-size:1rem;flex-shrink:0;">&#10006;</span>
                <span><strong>No notes, calculators, phones, or reference materials.</strong></span>
              </div>
            </div>
          </div>
        </div>
        <div class="glass-card" style="padding:1.25rem;margin-bottom:1.5rem;">
          <h4 style="color:var(--text-main);margin:0 0 0.75rem 0;display:flex;align-items:center;gap:0.5rem;">
            <span style="font-size:1.1rem;">&#129302;</span> What to Expect
          </h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;text-align:center;font-size:0.82rem;">
            <div style="background:rgba(14,165,233,0.06);padding:0.85rem;border-radius:8px;border:1px solid var(--border-color);">
              <div style="font-size:1.4rem;margin-bottom:0.4rem;">&#128483;</div>
              <strong>AI speaks</strong><br><span style="color:var(--text-muted);">Questions are read aloud</span>
            </div>
            <div style="background:rgba(14,165,233,0.06);padding:0.85rem;border-radius:8px;border:1px solid var(--border-color);">
              <div style="font-size:1.4rem;margin-bottom:0.4rem;">&#127908;</div>
              <strong>You respond</strong><br><span style="color:var(--text-muted);">Speak or type - ${this.totalQuestions} questions</span>
            </div>
            <div style="background:rgba(14,165,233,0.06);padding:0.85rem;border-radius:8px;border:1px solid var(--border-color);">
              <div style="font-size:1.4rem;margin-bottom:0.4rem;">&#128202;</div>
              <strong>AI evaluates</strong><br><span style="color:var(--text-muted);">Transcript sent to HR</span>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:1rem;">
          <label style="display:flex;align-items:center;gap:0.6rem;cursor:pointer;font-size:0.88rem;color:var(--text-main);">
            <input type="checkbox" id="consent-check" style="width:16px;height:16px;accent-color:var(--accent-color);">
            I have read and understood all rules. I consent to camera monitoring and AI evaluation.
          </label>
          <button id="start-interview-btn" onclick="AIInterview.startInterview()"
            style="padding:0.9rem 3rem;font-size:1rem;font-weight:600;border-radius:10px;
                   background:linear-gradient(135deg,var(--accent-color),#0284c7);
                   color:#fff;border:none;cursor:not-allowed;opacity:0.5;transition:all 0.2s;
                   box-shadow:0 4px 15px rgba(14,165,233,0.35);"
            disabled>Start Interview</button>
          <p style="font-size:0.75rem;color:var(--text-muted);">Button activates once you accept consent and camera is ready.</p>
        </div>
      </div>
    `;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        this.videoStream = stream;
        const vid = document.getElementById('preview-video');
        const overlay = document.getElementById('camera-status-overlay');
        const msg = document.getElementById('cam-msg');
        if (vid) vid.srcObject = stream;
        if (overlay) overlay.style.display = 'none';
        if (msg) { msg.textContent = 'Camera is working. Your face is visible.'; msg.style.color = '#22c55e'; }
        this._checkReady();
      })
      .catch(() => {
        const overlay = document.getElementById('camera-status-overlay');
        if (overlay) overlay.innerHTML = 'Camera access denied.<br>Please allow camera.';
      });
    setTimeout(() => {
      const cb = document.getElementById('consent-check');
      if (cb) cb.addEventListener('change', () => this._checkReady());
    }, 200);
  },

  _checkReady: function () {
    const cb = document.getElementById('consent-check');
    const btn = document.getElementById('start-interview-btn');
    if (!cb || !btn) return;
    const ok = cb.checked && !!this.videoStream;
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '0.5';
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
  },

  startInterview: function () {
    if (this.videoStream) { this.videoStream.getTracks().forEach(t => t.stop()); this.videoStream = null; }
    const container = document.getElementById('view-container');
    if (container) this.renderInterviewRoom(container);
  },

  renderInterviewRoom: function (container) {
    container.innerHTML = `
      <div class="interview-split">
        <div class="glass-card ai-avatar-container" style="display:flex;flex-direction:column;align-items:center;gap:1.1rem;">
          <div style="text-align:center;width:100%;">
            <span class="brand-badge" id="proctor-badge" style="display:inline-block;margin-bottom:0.5rem;">&#128308; Live Proctoring</span>
            <h3 style="color:var(--text-main);margin:0;font-size:1rem;">AeroEval-AI</h3>
            <p style="color:var(--text-muted);font-size:0.75rem;margin-top:0.15rem;">${this.candObj.jobTitle}</p>
          </div>
          <div style="width:100%;max-width:260px;aspect-ratio:4/3;background:#000;border-radius:10px;overflow:hidden;border:2px solid var(--border-color);position:relative;">
            <video id="candidate-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;"></video>
            <span style="position:absolute;bottom:6px;left:8px;font-size:0.58rem;background:rgba(0,0,0,0.65);color:#fff;padding:2px 6px;border-radius:3px;">LIVE</span>
            <span id="face-count-badge" style="position:absolute;top:6px;right:8px;font-size:0.65rem;background:rgba(0,0,0,0.7);color:#4ade80;padding:2px 8px;border-radius:10px;display:none;">1 face</span>
          </div>
          <div class="ai-pulse-circle speaking" id="ai-pulse" style="width:52px;height:52px;">
            <svg class="ai-icon-img" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
          </div>
          <div class="waveform" style="transform:scale(0.78);">
            <div class="wave-bar" style="height:10px;"></div>
            <div class="wave-bar" style="height:24px;"></div>
            <div class="wave-bar" style="height:38px;"></div>
            <div class="wave-bar" style="height:16px;"></div>
            <div class="wave-bar" style="height:28px;"></div>
            <div class="wave-bar" style="height:10px;"></div>
          </div>
          <div id="mic-status-row" style="display:flex;align-items:center;gap:0.4rem;font-size:0.76rem;color:var(--text-muted);">
            <span id="mic-dot" style="width:7px;height:7px;border-radius:50%;background:#6b7280;display:inline-block;flex-shrink:0;"></span>
            <span id="mic-status-text">Mic: Idle</span>
          </div>
          <div style="width:100%;display:flex;flex-direction:column;gap:0.35rem;font-size:0.75rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;background:#fef2f2;padding:0.3rem 0.6rem;border-radius:6px;border:1px solid #fecaca;">
              <span>Tab Switches</span> <span id="v-tabs" style="font-weight:700;color:#dc2626;">0 / 3</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;background:#fef2f2;padding:0.3rem 0.6rem;border-radius:6px;border:1px solid #fecaca;">
              <span>Multi-Face</span> <span id="v-faces" style="font-weight:700;color:#dc2626;">0 / 3</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;background:#fef2f2;padding:0.3rem 0.6rem;border-radius:6px;border:1px solid #fecaca;">
              <span>Copy / Paste</span> <span id="v-copy" style="font-weight:700;color:#dc2626;">0</span>
            </div>
          </div>
          <div style="width:100%;background:#e5e7eb;border-radius:99px;height:5px;margin-top:auto;">
            <div id="interview-progress-bar" style="width:0%;height:100%;background:var(--accent-color);border-radius:99px;transition:width 0.5s;"></div>
          </div>
          <p id="interview-progress-label" style="font-size:0.71rem;color:var(--text-muted);margin:0;">Q 0 / ${this.totalQuestions}</p>
        </div>
        <div class="dialogue-pane">
          <div style="padding:0.85rem 1rem;border-bottom:1px solid var(--border-color);background:#f8fafc;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;">
            <span style="font-weight:600;color:var(--text-main);font-size:0.95rem;">Interview Console</span>
            <span id="interview-status-tag" style="font-size:0.74rem;color:var(--text-muted);">Starting...</span>
          </div>
          <div class="dialogue-history" id="dialogue-history-box"></div>
          <div class="dialogue-footer" style="gap:0.5rem;flex-wrap:nowrap;">
            <input type="text" id="candidate-reply-input" placeholder="Speak or type your answer..."
              onkeydown="AIInterview.handleKeydown(event)" disabled style="flex:1;">
            <button id="mic-btn" title="Toggle microphone" onclick="AIInterview.toggleMic()"
              style="padding:0.5rem 0.7rem;border-radius:8px;border:1px solid var(--border-color);background:#fff;cursor:pointer;font-size:1.05rem;transition:background 0.2s;flex-shrink:0;" disabled>
              &#127908;
            </button>
            <button class="btn btn-primary" id="interview-submit-btn"
              onclick="AIInterview.submitAnswer()" disabled>Send</button>
          </div>
        </div>
      </div>
    `;
    this.initProctoring();
    setTimeout(() => {
      var greeting = 'Hello ' + this.candObj.name.split(' ')[0] + '! I am AeroEval, your AI interviewer for PIA. Your camera and mic are active. This session is monitored. I will ask you ' + this.totalQuestions + ' questions. You can speak or type. Let us begin!';
      this.addAIBubble(greeting, true);
      setTimeout(() => this.askNextQuestion(), 3500);
    }, 800);
  },

  initProctoring: function () {
    this.proctoringData = {
      tabSwitches: 0,
      copyPasteAttempts: 0,
      multipleFaceViolations: 0,
      isDisqualified: false,
      logs: [{ time: new Date().toLocaleTimeString(), event: "Interview session started." }]
    };
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        this.videoStream = stream;
        this.videoEl = document.getElementById('candidate-video');
        if (this.videoEl) this.videoEl.srcObject = stream;
        this.logEvent("Camera access granted.");
        var fb = document.getElementById('face-count-badge');
        if (fb) fb.style.display = 'block';
        this.loadFaceModel();
      })
      .catch(() => {
        this.logEvent("Camera denied.", true);
        this.showToast("Camera access denied.", "warning");
      });

    this._onVisibility = () => {
      if (document.hidden && !this.proctoringData.isDisqualified) {
        this.proctoringData.tabSwitches++;
        this.logEvent('Tab switch #' + this.proctoringData.tabSwitches + '.');
        this.updateViolationUI();
        var left = 3 - this.proctoringData.tabSwitches;
        if (left > 0) this.showToast('Tab switch warning! ' + left + ' more will disqualify you.', 'danger');
        if (this.proctoringData.tabSwitches >= 3) this.disqualifyAndEnd("repeated tab switching");
      }
    };
    this._onCopyPaste = (e) => {
      e.preventDefault();
      if (!this.proctoringData.isDisqualified) {
        this.proctoringData.copyPasteAttempts++;
        this.logEvent('Copy/Paste blocked #' + this.proctoringData.copyPasteAttempts + '.');
        this.updateViolationUI();
        this.showToast("Copying and pasting is not allowed.", "danger");
      }
    };
    document.addEventListener("visibilitychange", this._onVisibility);
    document.addEventListener("copy", this._onCopyPaste);
    document.addEventListener("paste", this._onCopyPaste);
    document.addEventListener("contextmenu", this._onCopyPaste);
  },

  loadFaceModel: async function () {
    try {
      if (typeof blazeface !== 'undefined') {
        this.faceModel = await blazeface.load();
        this.logEvent("Face detection model loaded.");
        this.startFaceLoop();
      } else {
        this.logEvent("BlazeFace not available.", true);
      }
    } catch (e) {
      this.logEvent("Face model load error.", true);
    }
  },

  startFaceLoop: function () {
    this.faceCheckInterval = setInterval(async () => {
      if (!this.faceModel || !this.videoEl || this.proctoringData.isDisqualified) return;
      try {
        var predictions = await this.faceModel.estimateFaces(this.videoEl, false);
        var count = predictions.length;
        var badge = document.getElementById('face-count-badge');
        if (badge) {
          badge.textContent = count + ' face' + (count !== 1 ? 's' : '');
          badge.style.color = count === 1 ? '#4ade80' : '#ef4444';
          badge.style.background = count === 1 ? 'rgba(0,0,0,0.65)' : 'rgba(220,38,38,0.85)';
        }
        if (count > 1) {
          this.proctoringData.multipleFaceViolations++;
          this.logEvent('Multiple faces (' + count + '). Violation #' + this.proctoringData.multipleFaceViolations + '.');
          this.updateViolationUI();
          this.showToast('Multiple people detected! Violation ' + this.proctoringData.multipleFaceViolations + '/3.', 'danger');
          if (this.proctoringData.multipleFaceViolations >= 3) this.disqualifyAndEnd("multiple people detected in frame");
        }
      } catch (e) {}
    }, 3000);
  },

  stopProctoring: function () {
    if (this.faceCheckInterval) clearInterval(this.faceCheckInterval);
    document.removeEventListener("visibilitychange", this._onVisibility);
    document.removeEventListener("copy", this._onCopyPaste);
    document.removeEventListener("paste", this._onCopyPaste);
    document.removeEventListener("contextmenu", this._onCopyPaste);
    if (this.videoStream) this.videoStream.getTracks().forEach(t => t.stop());
    if (this.synth) this.synth.cancel();
    if (this.recognition && this.isListening) { try { this.recognition.stop(); } catch(e){} }
    this.logEvent("Proctoring stopped.");
  },

  updateViolationUI: function () {
    var t = document.getElementById('v-tabs');
    var f = document.getElementById('v-faces');
    var c = document.getElementById('v-copy');
    if (t) t.textContent = this.proctoringData.tabSwitches + ' / 3';
    if (f) f.textContent = this.proctoringData.multipleFaceViolations + ' / 3';
    if (c) c.textContent = this.proctoringData.copyPasteAttempts;
  },

  disqualifyAndEnd: function (reason) {
    if (this.proctoringData.isDisqualified) return;
    this.proctoringData.isDisqualified = true;
    var badge = document.getElementById("proctor-badge");
    if (badge) { badge.style.background = "#dc2626"; badge.style.color = "#fff"; badge.textContent = "Disqualified"; }
    this.setInputEnabled(false);
    var msg = 'This interview has been terminated due to ' + reason + '. Your record has been flagged and submitted to HR.';
    this.speak(msg);
    this.addAIBubble('<strong style="color:#dc2626;">Interview Terminated.</strong><br>You have been disqualified due to <strong>' + reason + '</strong>.<br>Session ended and flagged in your HR record.');
    this.logEvent('DISQUALIFIED: ' + reason + '.');
    setTimeout(() => {
      this.stopProctoring();
      AppState.addCandidateInterviewResults(this.candidateId, this.transcript, 0);
      AppState.updateCandidateStatus(this.candidateId, "Rejected");
      AppState.addCandidateNote(this.candidateId, 'DISQUALIFIED during AI interview. Reason: ' + reason + '. Score: 0.');
      AppState.saveProctoringData(this.candidateId, this.proctoringData);
      alert('Your interview has been terminated.\n\nReason: ' + reason + '\n\nYou will receive an email from HR.');
      AppState.setCurrentView("careers");
      App.refreshCurrentView();
    }, 6500);
  },

  logEvent: function (msg, critical) {
    if (!this.proctoringData) return;
    this.proctoringData.logs.push({ time: new Date().toLocaleTimeString(), event: msg, critical: !!critical });
  },

  speak: function (text) {
    if (!this.synth) return;
    this.synth.cancel();
    var utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.93; utter.pitch = 1.05; utter.volume = 1;
    var voices = this.synth.getVoices();
    var preferred = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utter.voice = preferred;
    this.synth.speak(utter);
  },

  initSpeechRecognition: function () {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { this.recognition = null; return; }
    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.onstart = () => { this.isListening = true; this.setMicUI(true); };
    this.recognition.onend = () => { this.isListening = false; this.setMicUI(false); };
    this.recognition.onresult = (event) => {
      var interim = "", final = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t; else interim += t;
      }
      var input = document.getElementById('candidate-reply-input');
      if (input) input.value = (this.currentSpeechBuffer + final + interim).trim();
      if (final) this.currentSpeechBuffer += final;
    };
    this.recognition.onerror = (e) => { if (e.error !== 'no-speech') this.setMicUI(false); };
  },

  toggleMic: function () {
    if (!this.recognition) { this.showToast("Speech recognition requires Chrome or Edge.", "warning"); return; }
    if (this.isListening) {
      this.recognition.stop(); this.currentSpeechBuffer = "";
    } else {
      this.currentSpeechBuffer = "";
      var input = document.getElementById('candidate-reply-input');
      if (input) input.value = "";
      try { this.recognition.start(); } catch(e) {}
    }
  },

  setMicUI: function (active) {
    var btn = document.getElementById('mic-btn');
    var dot = document.getElementById('mic-dot');
    var txt = document.getElementById('mic-status-text');
    if (btn) btn.style.background = active ? '#fee2e2' : '#fff';
    if (dot) dot.style.background = active ? '#ef4444' : '#6b7280';
    if (txt) txt.textContent = active ? 'Mic: Listening...' : 'Mic: Idle';
  },

  addAIBubble: function (html, doSpeak) {
    var box = document.getElementById('dialogue-history-box');
    var pulse = document.getElementById('ai-pulse');
    if (pulse) pulse.classList.add('speaking');
    var bubble = document.createElement('div');
    bubble.className = "bubble ai"; bubble.innerHTML = html;
    if (box) { box.appendChild(bubble); box.scrollTop = box.scrollHeight; }
    var plainText = bubble.textContent;
    this.transcript.push({ sender: "AI", text: plainText });
    if (doSpeak) this.speak(plainText);
    var dur = Math.max(1500, plainText.length * 26);
    setTimeout(() => { if (pulse) pulse.classList.remove('speaking'); }, dur);
  },

  addCandidateBubble: function (text) {
    var box = document.getElementById('dialogue-history-box');
    var bubble = document.createElement('div');
    bubble.className = "bubble candidate"; bubble.textContent = text;
    if (box) { box.appendChild(bubble); box.scrollTop = box.scrollHeight; }
    this.transcript.push({ sender: "Candidate", text: text });
  },

  showTypingIndicator: function () {
    var box = document.getElementById('dialogue-history-box');
    var div = document.createElement('div');
    div.className = "bubble ai bubble-indicator"; div.id = "typing-indicator";
    div.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    if (box) { box.appendChild(div); box.scrollTop = box.scrollHeight; }
  },
  removeTypingIndicator: function () { var el = document.getElementById('typing-indicator'); if (el) el.remove(); },

  setInputEnabled: function (enabled) {
    ['candidate-reply-input','interview-submit-btn','mic-btn'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.disabled = !enabled;
    });
    var input = document.getElementById('candidate-reply-input');
    if (input && enabled) input.focus();
  },

  updateProgress: function () {
    var pct = Math.round((this.currentQIndex / this.totalQuestions) * 100);
    var bar = document.getElementById('interview-progress-bar');
    var label = document.getElementById('interview-progress-label');
    var tag = document.getElementById('interview-status-tag');
    if (bar) bar.style.width = pct + "%";
    if (label) label.textContent = 'Q ' + this.currentQIndex + ' / ' + this.totalQuestions;
    if (tag) tag.textContent = 'Q' + this.currentQIndex + ' / ' + this.totalQuestions;
  },

  showToast: function (msg, type) {
    var toast = document.createElement('div');
    var bg = type === "danger" ? "#dc2626" : "#b45309";
    toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:0.9rem 1.3rem;background:' + bg + ';color:#fff;border-radius:10px;font-size:0.86rem;font-weight:500;box-shadow:0 8px 20px rgba(0,0,0,0.3);max-width:340px;line-height:1.5;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { if (document.body.contains(toast)) toast.remove(); }, 5000);
  },

  askNextQuestion: function () {
    if (this.proctoringData && this.proctoringData.isDisqualified) return;
    if (this.currentQIndex >= this.totalQuestions) { this.concludeInterview(); return; }
    var question = this.questionPool[this.currentQIndex];
    this.currentQIndex++;
    this.updateProgress();
    this.showTypingIndicator();
    var self = this;
    setTimeout(function() {
      self.removeTypingIndicator();
      self.addAIBubble('<strong>Question ' + self.currentQIndex + ':</strong> ' + question, true);
      self.setInputEnabled(true);
    }, 1000);
  },

  handleKeydown: function (e) { if (e.key === 'Enter') this.submitAnswer(); },

  submitAnswer: function () {
    if (this.recognition && this.isListening) { try { this.recognition.stop(); } catch(e){} }
    var input = document.getElementById('candidate-reply-input');
    var text = (input ? input.value : "").trim();
    if (!text) return;
    this.setInputEnabled(false);
    this.addCandidateBubble(text);
    if (input) input.value = "";
    this.currentSpeechBuffer = "";
    this.showTypingIndicator();
    var self = this;
    setTimeout(function() {
      self.removeTypingIndicator();
      var acks = ["Got it, thank you.", "Understood, noted.", "Appreciate your response.",
        "Good, moving on.", "Thank you for sharing that.", "That is helpful, thank you."];
      self.addAIBubble(acks[Math.floor(Math.random() * acks.length)], true);
      setTimeout(function() { self.askNextQuestion(); }, 1700);
    }, 1300);
  },

  concludeInterview: function () {
    var tag = document.getElementById('interview-status-tag');
    if (tag) tag.textContent = "Complete";
    var closing = "That completes all questions. Thank you for your time and thoughtful responses. Your transcript has been submitted to our HR team for review. We will be in touch soon. Good luck!";
    this.addAIBubble(closing, true);
    var input = document.getElementById('candidate-reply-input');
    var btn = document.getElementById('interview-submit-btn');
    var mic = document.getElementById('mic-btn');
    if (input) input.disabled = true;
    if (mic) mic.disabled = true;
    if (btn) { btn.textContent = "Finish & Exit"; btn.disabled = false; btn.onclick = function() { AIInterview.finalizeAndExit(); }; }
  },

  finalizeAndExit: function () {
    this.stopProctoring();
    var answers = this.transcript.filter(function(t) { return t.sender === "Candidate"; }).map(function(t) { return t.text.toLowerCase(); });
    var keywords = ["react","node","express","sql","aws","docker","safety","emergency",
      "hospitality","seo","analytics","security","compliance","cors","database",
      "team","project","deadline","strategy","communication","leadership","problem"];
    var totalLen = 0, hits = 0;
    answers.forEach(function(a) {
      totalLen += a.length;
      keywords.forEach(function(k) { if (a.includes(k)) hits++; });
    });
    var lenScore = Math.min(50, (totalLen / (this.totalQuestions * 80)) * 50);
    var kwScore  = Math.min(50, hits * 8);
    var score = Math.round(lenScore + kwScore);

    AppState.addCandidateInterviewResults(this.candidateId, this.transcript, score);
    AppState.updateCandidateStatus(this.candidateId, "Interview Completed");
    AppState.addCandidateNote(this.candidateId, 'AI Interview completed. Score: ' + score + '%. No major violations.');
    AppState.saveProctoringData(this.candidateId, this.proctoringData);

    alert("Interview Submitted!\n\nYour responses have been recorded. HR will review your profile and be in touch.\n\nThank you for interviewing with PIA.");
    AppState.setCurrentView("careers");
    App.refreshCurrentView();
  }
};
