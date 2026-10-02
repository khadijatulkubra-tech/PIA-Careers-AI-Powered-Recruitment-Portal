// App State Manager and Navigation Controller

const AppState = {
  // Initialize state from local storage or defaults
  state: {
    jobs: [],
    candidates: [],
    hrQuestions: [], 
    hrMcqBank: [], 
    mcqMixConfig: { bankCount: 5, aiCount: 5 },
    selectionWeights: { ats: 30, assessment: 30, interview: 40 },
    atsThreshold: 50,
    currentView: "careers",
    currentRole: "candidate",
    hrLoggedIn: false,
    activeCandidateId: null,
    emails: [
      {
        id: "email-1",
        candidateId: "cand-4",
        to: "bilal.khan@example.com",
        subject: "Assessment Invitation: Marketing Specialist",
        body: `Dear Bilal Khan,\n\nThank you for applying to PIA. Your resume match score is 55%. Please take your assessment test by clicking below.\n\n[Start Assessment Link]`,
        type: "assessment",
        read: false,
        date: "2026-07-14"
      }
    ]
  },

  init: async function () {
    if (typeof DB !== 'undefined') {
      const isOnline = await DB.isOnline();

      if (isOnline) {
        // DB is available — it is the single source of truth
        await DB.seedDatabase(DEFAULT_JOBS, INITIAL_CANDIDATES, typeof DEFAULT_HR_USERS !== 'undefined' ? DEFAULT_HR_USERS : []);
        
        const jobs = await DB.getJobs();
        this.state.jobs = (jobs && jobs.length > 0) ? jobs : [...DEFAULT_JOBS];
        
        const candidates = await DB.getCandidates();
        this.state.candidates = (candidates && candidates.length > 0) ? candidates : [...INITIAL_CANDIDATES];

        // Reconcile: ensure every candidate has a correct jobTitle from the jobs list
        const jobMap = {};
        this.state.jobs.forEach(j => { jobMap[j.id] = j.title; });
        this.state.candidates.forEach(c => {
          if (c.jobId && jobMap[c.jobId]) {
            c.jobTitle = jobMap[c.jobId];
          }
        });

        const settings = await DB.getSettings();
        if (settings) {
           this.state.hrQuestions = settings.hrQuestions || [...DEFAULT_HR_QUESTIONS];
           this.state.hrMcqBank = settings.hrMcqBank || [...DEFAULT_HR_MCQ_BANK];
           this.state.mcqMixConfig = settings.mcqMixConfig || { bankCount: 5, aiCount: 5 };
           this.state.selectionWeights = settings.selectionWeights || { ats: 30, assessment: 30, interview: 40 };
           this.state.atsThreshold = settings.atsThreshold || 50;
        } else {
           this.state.hrQuestions = [...DEFAULT_HR_QUESTIONS];
           this.state.hrMcqBank = [...DEFAULT_HR_MCQ_BANK];
        }

        // Sync to localStorage so offline fallback is up-to-date
        localStorage.setItem('pia_recruitment_state', JSON.stringify(this.state));
      } else {
        // DB offline — fall back to localStorage or defaults
        const saved = localStorage.getItem('pia_recruitment_state');
        if (saved) {
          this.state = JSON.parse(saved);
        } else {
          this.state.jobs = [...DEFAULT_JOBS];
          this.state.candidates = [...INITIAL_CANDIDATES];
          this.state.hrQuestions = [...DEFAULT_HR_QUESTIONS];
          this.state.hrMcqBank = [...DEFAULT_HR_MCQ_BANK];
          this.save();
        }
      }
    } else {
      const saved = localStorage.getItem('pia_recruitment_state');
      if (saved) {
        this.state = JSON.parse(saved);
      } else {
        this.state.jobs = [...DEFAULT_JOBS];
        this.state.candidates = [...INITIAL_CANDIDATES];
        this.state.hrQuestions = [...DEFAULT_HR_QUESTIONS];
        this.state.hrMcqBank = [...DEFAULT_HR_MCQ_BANK];
        this.save();
      }
    }

    // Auto-migrate any cached jobs to have the new future deadlines
    if (this.state.jobs) {
      let needsSave = false;
      this.state.jobs.forEach(j => {
        if (!j.applicationDeadline || j.applicationDeadline === "2026-07-30") {
          j.applicationDeadline = "2026-08-25";
          needsSave = true;
        }
      });
      if (needsSave) this.save();
    }
  },

  save: function () {
    localStorage.setItem('pia_recruitment_state', JSON.stringify(this.state));
    if (typeof DB !== 'undefined') {
       DB.saveSettings({
           hrQuestions: this.state.hrQuestions,
           hrMcqBank: this.state.hrMcqBank,
           mcqMixConfig: this.state.mcqMixConfig,
           selectionWeights: this.state.selectionWeights,
           atsThreshold: this.state.atsThreshold
       });
    }
  },

  // Getters
  getJobs: () => AppState.state.jobs || [],
  getJobById: (id) => (AppState.state.jobs || []).find(j => j.id === id),
  getCandidates: () => AppState.state.candidates || [],
  getCandidateById: function(id) {
    let cand = (this.state.candidates || []).find(c => c.id === id);
    if (!cand && id && id.startsWith('cand-')) {
      // Auto-create a fallback candidate for cross-device or isolated file:// demo
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || 'demo-token';
      
      cand = {
        id: id,
        name: "Demo Candidate",
        email: "khadijatulkubrashakeel@gmail.com",
        jobId: "job-1",
        jobTitle: "Senior Full-Stack Developer",
        atsScore: 75,
        status: "Assessment Invited",
        assessmentToken: token,
        interviewToken: token,
        assessmentExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        appliedDate: new Date().toISOString().split('T')[0],
        proctoringData: null
      };
      this.addCandidate(cand);
    }
    return cand;
  },
  getHrQuestions: () => AppState.state.hrQuestions || [],
  getHrMcqBank: () => AppState.state.hrMcqBank || [],
  getMcqMixConfig: () => AppState.state.mcqMixConfig || { bankCount: 5, aiCount: 5 },
  setMcqMixConfig: function(config) {
    this.state.mcqMixConfig = config;
    this.save();
  },
  getSelectionWeights: () => AppState.state.selectionWeights || { ats: 30, assessment: 30, interview: 40 },
  setSelectionWeights: function(weights) {
    this.state.selectionWeights = weights;
    this.save();
  },
  getAtsThreshold: () => AppState.state.atsThreshold || 50,
  getCurrentView: () => AppState.state.currentView,
  getActiveCandidateId: () => AppState.state.activeCandidateId,
  getEmails: () => AppState.state.emails || [],
  getCurrentRole: () => AppState.state.currentRole,
  isHrLoggedIn: () => AppState.state.hrLoggedIn,

  hrLogin: async function (username, password) {
    if (typeof DB !== 'undefined') {
      const success = await DB.hrLogin(username, password);
      if (success) {
         this.state.hrLoggedIn = true;
         this.state.currentRole = 'hr';
         this.state.currentView = 'hr';
         this.save();
         return true;
      }
    }


    const HR_CREDENTIALS = [
      { user: 'hr.admin', pass: 'PIA@HR2026' },
      { user: 'recruiter', pass: 'Recruit@123' }
    ];
    const valid = HR_CREDENTIALS.find(c => c.user === username && c.pass === password);
    if (valid) {
      this.state.hrLoggedIn = true;
      this.state.currentRole = 'hr';
      this.state.currentView = 'hr';
      this.save();
      return true;
    }
    return false;
  },

  hrLogout: function () {
    this.state.hrLoggedIn = false;
    this.state.currentRole = 'candidate';
    this.state.currentView = 'careers';
    this.save();
  },

  // Setters/Mutations
  setCurrentView: function (view) {
    this.state.currentView = view;
    this.save();
  },

  setCurrentRole: function (role) {
    this.state.currentRole = role;
    this.save();
  },

  setActiveCandidate: function (id) {
    this.state.activeCandidateId = id;
    this.save();
  },

  setAtsThreshold: function (val) {
    this.state.atsThreshold = val;
    this.save();
  },

  addJob: function (job) {
    this.state.jobs.unshift(job);
    this.save();
    if (typeof DB !== 'undefined') DB.saveJob(job);
  },

  updateJob: function(jobId, updates) {
    const job = this.getJobById(jobId);
    if (job) {
       Object.assign(job, updates);
       this.save();
       if (typeof DB !== 'undefined') DB.saveJob(job);
    }
  },

  deleteJob: function(jobId) {
    this.state.jobs = this.state.jobs.filter(j => j.id !== jobId);
    this.save();
    if (typeof DB !== 'undefined') DB.deleteJob(jobId);
  },

  addCandidate: function (cand) {
    this.state.candidates.unshift(cand);
    this.save();
    if (typeof DB !== 'undefined') DB.saveCandidate(cand);
  },

  updateCandidateStatus: function (id, status) {
    const cand = this.getCandidateById(id);
    if (cand) {
      cand.status = status;
      this.save();
      if (typeof DB !== 'undefined') DB.saveCandidate(cand);
    }
  },

  addCandidateAssessmentScore: function (id, score) {
    const cand = this.getCandidateById(id);
    if (cand) {
      cand.assessmentScore = score;
      this.save();
      if (typeof DB !== 'undefined') DB.saveCandidate(cand);
    }
  },

  addCandidateInterviewResults: function (id, transcript, score) {
    const cand = this.getCandidateById(id);
    if (cand) {
      cand.interviewTranscript = transcript;
      cand.interviewScore = score;
      this.save();
      if (typeof DB !== 'undefined') DB.saveCandidate(cand);
    }
  },

  saveProctoringData: function (id, proctoringObj) {
    const cand = this.getCandidateById(id);
    if (cand) {
      cand.proctoringData = proctoringObj;
      this.save();
      if (typeof DB !== 'undefined') DB.saveCandidate(cand);
    }
  },

  addCandidateNote: function (id, note) {
    const cand = this.getCandidateById(id);
    if (cand) {
      cand.hrNotes = note;
      this.save();
      if (typeof DB !== 'undefined') DB.saveCandidate(cand);
    }
  },

  addHrQuestion: function (q) {
    this.state.hrQuestions.push(q);
    this.save();
  },

  deleteHrQuestion: function (idx) {
    this.state.hrQuestions.splice(idx, 1);
    this.save();
  },

  addHrMcq: function (q) {
    if (!this.state.hrMcqBank) this.state.hrMcqBank = [];
    this.state.hrMcqBank.push(q);
    this.save();
  },

  deleteHrMcq: function (idx) {
    this.state.hrMcqBank.splice(idx, 1);
    this.save();
  },


  sendMockEmail: function (emailObj) {
    const newEmail = {
      id: `email-${Date.now()}`,
      candidateId: emailObj.candidateId,
      to: emailObj.to,
      subject: emailObj.subject,
      body: emailObj.body,
      type: emailObj.type,
      actionLink: emailObj.actionLink || '',
      read: false,
      date: new Date().toISOString().split('T')[0]
    };
    this.state.emails.unshift(newEmail);
    this.save();

    // Trigger real EmailJS send if available
    if (typeof emailjs !== 'undefined') {
      const serviceID = 'service_1f8d7am';
      const templateID = 'template_e9b7q9n';

      const templateParams = {
        to_email: emailObj.to,
        subject: emailObj.subject,
        message: emailObj.body,
        action_link: emailObj.actionLink || '',
        action_label: emailObj.actionLabel || ''
      };

      emailjs.send(serviceID, templateID, templateParams)
        .then(() => {
          console.log(`Real email sent to ${emailObj.to} via EmailJS.`);
        })
        .catch((err) => {
          console.warn('EmailJS failed to send. Check credentials or template setup.', err);
        });
    }
  },

  markEmailsAsRead: function () {
    this.state.emails.forEach(e => e.read = true);
    this.save();
  },

  resetAllState: function () {
    localStorage.removeItem('pia_recruitment_state');
    this.init();
    alert("System state has been reset to defaults!");
    location.reload();
  }
};

const App = {
  init: async function () {
    await AppState.init();

    // Parse URL params for direct links
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const candParam = params.get('candId');
    const tokenParam = params.get('token');
    
    if (viewParam && candParam) {
      const candidate = AppState.getCandidateById(candParam);
      if (candidate) {
        let isAuthorized = true;
        if (viewParam === 'assessment') {
          // Demo healing: If token is missing but present in URL, auto-adopt it to handle isolated file:// origins
          if (!candidate.assessmentToken && tokenParam) {
            candidate.assessmentToken = tokenParam;
            candidate.assessmentExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
            AppState.save();
          }
          const isExpired = candidate.assessmentExpiresAt && new Date() > new Date(candidate.assessmentExpiresAt);
          if (isExpired || candidate.assessmentToken !== tokenParam || candidate.status === 'Assessment Completed' || candidate.status === 'Interview Invited' || candidate.status === 'Interview Completed') {
            isAuthorized = false;
            if (isExpired) alert('This assessment link has expired.');
          }
        } else if (viewParam === 'interview') {
          // Demo healing
          if (!candidate.interviewToken && tokenParam) {
            candidate.interviewToken = tokenParam;
            AppState.save();
          }
          if (candidate.interviewToken !== tokenParam || candidate.status === 'Interview Completed' || candidate.status === 'Hired' || candidate.status === 'Rejected') {
            isAuthorized = false;
          }
        }
        
        if (isAuthorized) {
          AppState.setCurrentView(viewParam);
          AppState.setActiveCandidate(candParam);
        } else {
          alert('This link is invalid or has already been used.');
          AppState.setCurrentView('careers');
        }
      }
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Set up automatic email dispatch checker (every 60 seconds)
    setInterval(() => {
      if (typeof HRDashboard !== 'undefined') {
        HRDashboard.bulkSendAssessments(true); // true = silent
        HRDashboard.bulkSendInterviews(true);
      }
    }, 60000);

    this.renderHeader();
    this.refreshCurrentView();
  },

  renderHeader: function () {
    const role = AppState.getCurrentRole();
    const emails = AppState.getEmails();
    const unreadEmails = emails.filter(e => !e.read).length;

    const hrLoggedIn = AppState.isHrLoggedIn();

    // Render top info/action bar
    const switcher = document.getElementById('role-switcher-container');
    if (switcher) {
      switcher.innerHTML = `
        <div class="role-switcher-banner">
          <div><span style="background: var(--accent-green); color: white; border-radius: 50%; padding: 0 4px; margin-right: 4px; font-weight: bold; font-style: italic;">i</span> For Passenger Sales and Virtual Agent Registration - Please Click Here</div>
        </div>
      `;
    }

    // Render Header branding
    const header = document.getElementById('app-header-container');
    if (header) {
      header.innerHTML = `
        <div class="brand" style="display: flex; align-items: center;">
          <img src="pia_logo_new.png" alt="PIA Logo" style="height: 100px; width: auto; object-fit: contain; margin: 5px 0;">
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="nav-link" onclick="App.navigateToView('careers')">Careers Portal</button>
          <button class="btn-award" onclick="App.openHrLogin()">HR Admin Console</button>
          ${hrLoggedIn ? `<button class="nav-link" style="color: var(--accent-red); font-size: 0.8rem; margin-left: 0.5rem;" onclick="App.hrLogout()">Logout HR</button>` : ''}
          <button onclick="AppState.resetAllState()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.75rem; text-decoration:underline; margin-left: 0.5rem;">Reset Demo</button>
        </div>
      `;
    }

    this.renderInboxDrawer();
  },

  switchRole: function (role) {
    AppState.setCurrentRole(role);
    if (role === "hr") {
      AppState.setCurrentView("hr");
    } else {
      AppState.setCurrentView("careers");
    }
    this.renderHeader();
    this.refreshCurrentView();
  },

  navigateToView: function (view) {
    if (view === "hr") {
      // Gate HR dashboard behind login
      if (!AppState.isHrLoggedIn()) {
        this.openHrLogin();
        return;
      }
      AppState.setCurrentRole("hr");
    } else {
      AppState.setCurrentRole("candidate");
    }
    AppState.setCurrentView(view);
    this.renderHeader();
    this.refreshCurrentView();
  },

  openHrLogin: function () {
    // If already logged in, just navigate
    if (AppState.isHrLoggedIn()) {
      AppState.setCurrentView('hr');
      this.renderHeader();
      this.refreshCurrentView();
      return;
    }

    const wrapper = document.getElementById('hr-login-modal-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = `
      <div class="modal-overlay" id="hr-login-overlay">
        <div style="background: #ffffff; border-radius: 12px; max-width: 420px; width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.25); overflow: hidden;">
          <div style="background: var(--accent-green); padding: 2rem 1.5rem 1.5rem; text-align: center;">
            <img src="pia_logo_new.png" alt="PIA Logo" style="height: 60px; margin-bottom: 0.75rem; background: white; padding: 5px; border-radius: 8px;">
            <h2 style="color: #ffffff; font-size: 1.3rem; margin-bottom: 0.25rem;">HR Secure Login</h2>
            <p style="color: rgba(255,255,255,0.8); font-size: 0.85rem;">Access restricted to authorized HR personnel only</p>
          </div>
          <div style="padding: 1.5rem;">
            <div id="hr-login-error" style="display:none; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.4); color:#dc2626; border-radius:8px; padding:0.75rem 1rem; margin-bottom:1rem; font-size:0.85rem;">
              Invalid credentials. Please try again.
            </div>

            <div class="form-group">
              <label for="hr-username" style="color: #333;">HR Username</label>
              <input type="text" id="hr-username" class="form-control" placeholder="Enter HR username" autocomplete="username" style="background: #f8fafc; color: #1e293b; border: 1px solid #cbd5e1;">
            </div>
            <div class="form-group">
              <label for="hr-password" style="color: #333;">Password</label>
              <div style="position:relative;">
                <input type="password" id="hr-password" class="form-control" placeholder="Enter password" autocomplete="current-password" onkeydown="if(event.key==='Enter') App.submitHrLogin();" style="background: #f8fafc; color: #1e293b; border: 1px solid #cbd5e1;">
                <span onclick="App.togglePasswordVisibility()" style="position:absolute; right:1rem; top:50%; transform:translateY(-50%); cursor:pointer; color:#64748b; font-size:0.8rem;" id="pwd-toggle-icon">[Show]</span>
              </div>
            </div>

            <div style="background: #f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:0.75rem 1rem; margin-top:0.5rem;">
              <p style="font-size:0.75rem; color:#166534; margin-bottom:0.25rem; font-weight:600;">Demo Credentials:</p>
              <p style="font-size:0.8rem; color:#15803d;">Username: <strong>hr.admin</strong> &nbsp;|&nbsp; Password: <strong>PIA@HR2026</strong></p>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0;">
            <button class="btn btn-secondary" onclick="App.closeHrLogin()">Cancel</button>
            <button class="btn btn-primary" onclick="App.submitHrLogin()">Login to HR Console</button>
          </div>
        </div>
      </div>
    `;
  },

  closeHrLogin: function () {
    const wrapper = document.getElementById('hr-login-modal-wrapper');
    if (wrapper) wrapper.innerHTML = '';
  },

  submitHrLogin: async function () {
    const username = document.getElementById('hr-username')?.value.trim();
    const password = document.getElementById('hr-password')?.value;
    const errorBox = document.getElementById('hr-login-error');

    if (!username || !password) {
      if (errorBox) { errorBox.style.display = 'block'; errorBox.textContent = 'Please enter both username and password.'; }
      return;
    }

    const success = await AppState.hrLogin(username, password);
    if (success) {
      this.closeHrLogin();
      this.renderHeader();
      this.refreshCurrentView();
    } else {
      if (errorBox) errorBox.style.display = 'block';
      document.getElementById('hr-password').value = '';
    }
  },

  togglePasswordVisibility: function () {
    const pwd = document.getElementById('hr-password');
    const icon = document.getElementById('pwd-toggle-icon');
    if (pwd.type === 'password') {
      pwd.type = 'text';
      icon.textContent = '[Hide]';
    } else {
      pwd.type = 'password';
      icon.textContent = '[Show]';
    }
  },

  hrLogout: function () {
    AppState.hrLogout();
    this.renderHeader();
    this.refreshCurrentView();
  },

  refreshCurrentView: function () {
    const view = AppState.getCurrentView();
    const containerId = "view-container";

    // Clear container
    document.getElementById(containerId).innerHTML = "";

    if (view === "careers") {
      CareersPortal.render(containerId);
    } else if (view === "hr") {
      // Auth guard: only logged-in HR can access dashboard
      if (!AppState.isHrLoggedIn()) {
        AppState.setCurrentView("careers");
        CareersPortal.render(containerId);
        this.openHrLogin();
        return;
      }
      HRDashboard.render(containerId);
    } else if (view === "assessment") {
      AssessmentCenter.render(containerId, AppState.getActiveCandidateId());
    } else if (view === "interview") {
      AIInterview.render(containerId, AppState.getActiveCandidateId());
    }
  },

  toggleInboxDrawer: function () {
    const drawer = document.getElementById('inbox-drawer');
    if (drawer) {
      drawer.classList.toggle('open');
    }
    AppState.markEmailsAsRead();
    this.renderHeader();
  },

  renderInboxDrawer: function () {
    const emails = AppState.getEmails();
    const container = document.getElementById('inbox-drawer');
    if (!container) return;

    let emailsHTML = emails.map(e => `
      <div class="email-card ${!e.read ? 'unread' : ''}" onclick="App.handleEmailClick('${e.id}')">
        <div class="email-subj">${e.subject}</div>
        <div style="font-size:0.7rem; color:var(--accent-gold); margin-top:0.1rem;">To: ${e.to} | ${e.date}</div>
        <div class="email-body">${e.body.replace(/\n/g, '<br>')}</div>
        ${e.type === 'assessment' ? `<button class="btn btn-primary" style="font-size:0.75rem; padding:0.3rem 0.6rem; margin-top:0.5rem; width:100%; justify-content:center;">Start Assessment</button>` : ''}
        ${e.type === 'interview' ? `<button class="btn btn-primary" style="font-size:0.75rem; padding:0.3rem 0.6rem; margin-top:0.5rem; width:100%; justify-content:center; background:#8b5cf6;">Start AI Interview</button>` : ''}
      </div>
    `).join('');

    if (emails.length === 0) {
      emailsHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem; font-size:0.85rem;">Simulated candidate inbox is empty.</p>`;
    }

    container.innerHTML = `
      <div class="inbox-header">
        <h3 style="color:#fff;">Candidate Inbox Sim</h3>
        <button class="close-btn" onclick="App.toggleInboxDrawer()">&times;</button>
      </div>
      <div class="inbox-list">
        ${emailsHTML}
      </div>
    `;
  },

  handleEmailClick: function (emailId) {
    const email = AppState.getEmails().find(e => e.id === emailId);
    if (!email) return;

    // If it has action links
    if (email.type === "assessment") {
      this.toggleInboxDrawer();
      AppState.setCurrentRole("candidate");
      AppState.setActiveCandidate(email.candidateId);
      AppState.setCurrentView("assessment");
      this.renderHeader();
      this.refreshCurrentView();
    } else if (email.type === "interview") {
      this.toggleInboxDrawer();
      AppState.setCurrentRole("candidate");
      AppState.setActiveCandidate(email.candidateId);
      AppState.setCurrentView("interview");
      this.renderHeader();
      this.refreshCurrentView();
    }
  }
};

// Initialize application on window load
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
