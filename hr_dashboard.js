// HR Dashboard Component - Applicant Tracking, Settings, Custom Questions

const HRDashboard = {
  activeTab: "pipeline", // pipeline, jobs, settings

  render: function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const candidates = AppState.getCandidates();
    const jobs = AppState.getJobs();
    const threshold = AppState.getAtsThreshold();

    // Calculate quick stats
    const totalCount = candidates.length;
    const hiredCount = candidates.filter(c => c.status === "Hired").length;
    const reviewCount = candidates.filter(c => c.status !== "Hired" && c.status !== "Rejected").length;
    const interviewCount = candidates.filter(c => c.interviewScore != null).length;

    let html = `
      <div class="dashboard-grid">
        <!-- Sidebar Navigation -->
        <div class="dashboard-sidebar">
          <div class="glass-card" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; height: 100%;">
            <h3 style="color: var(--accent-gold); font-size: 1rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; padding-left: 0.5rem;">HR Console</h3>
            
            <div class="sidebar-link ${this.activeTab === 'pipeline' ? 'active' : ''}" onclick="HRDashboard.switchTab('pipeline')">
              Pipeline Management
            </div>
            
            <div class="sidebar-link ${this.activeTab === 'jobs' ? 'active' : ''}" onclick="HRDashboard.switchTab('jobs')">
              Manage Jobs
            </div>
            
            <div class="sidebar-link ${this.activeTab === 'settings' ? 'active' : ''}" onclick="HRDashboard.switchTab('settings')">
            ATS & AI Settings
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="dashboard-content">
          <!-- Overview Cards -->
          <div class="stat-card-row">
            <div class="stat-card glass-card">
              <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">Total Applicants</p>
              <h2 class="stat-num">${totalCount}</h2>
            </div>
            <div class="stat-card glass-card">
              <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">Under Review</p>
              <h2 class="stat-num" style="color: var(--accent-cyan);">${reviewCount}</h2>
            </div>
            <div class="stat-card glass-card">
              <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">Interviews Done</p>
              <h2 class="stat-num" style="color: #c084fc;">${interviewCount}</h2>
            </div>
            <div class="stat-card glass-card">
              <p style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">Hired Offers</p>
              <h2 class="stat-num" style="color: var(--accent-green);">${hiredCount}</h2>
            </div>
          </div>

          <!-- Dynamic Panel based on Active Tab -->
          <div id="hr-subpanel">
            ${this.renderSubpanel(candidates, jobs, threshold)}
          </div>
        </div>
      </div>

      <!-- Candidate Inspector Modal Wrapper -->
      <div id="inspector-modal-wrapper"></div>
    `;

    container.innerHTML = html;
  },

  switchTab: function (tabName) {
    this.activeTab = tabName;
    this.render('view-container');
  },

  renderSubpanel: function (candidates, jobs, threshold) {
    if (this.activeTab === "pipeline") {
      return this.renderPipelinePanel(candidates);
    } else if (this.activeTab === "jobs") {
      return this.renderJobsPanel(jobs);
    } else if (this.activeTab === "settings") {
      return this.renderSettingsPanel(threshold);
    }
    return "";
  },

  pipelineFilters: { jobTitle: "All", status: "All" },
  pipelineSearchQuery: "",

  jobsFilters: { department: "All", status: "All" },
  jobsSearchQuery: "",

  setPipelineFilter: function(type, value) {
    this.pipelineFilters[type] = value;
    this.render('view-container');
  },

  setPipelineSearchQuery: function(val) {
    this.pipelineSearchQuery = val;
    this.render('view-container');
  },

  setJobsFilter: function(type, value) {
    this.jobsFilters[type] = value;
    this.render('view-container');
  },

  setJobsSearchQuery: function(val) {
    this.jobsSearchQuery = val;
    this.render('view-container');
  },

  viewJobCandidates: function(jobTitle) {
    this.pipelineFilters.jobTitle = jobTitle;
    this.activeTab = "pipeline";
    this.render('view-container');
  },

  renderPipelinePanel: function (candidates) {
    const weights = AppState.getSelectionWeights();
    
    const uniqueJobs = [...new Set(candidates.map(c => c.jobTitle))].sort();
    const uniqueStatuses = [...new Set(candidates.map(c => c.status))].sort();

    const searchLower = (this.pipelineSearchQuery || "").toLowerCase().trim();

    let filteredCandidates = candidates.filter(c => {
      const matchJob = (this.pipelineFilters.jobTitle === "All" || c.jobTitle === this.pipelineFilters.jobTitle);
      const matchStatus = (this.pipelineFilters.status === "All" || c.status === this.pipelineFilters.status);
      const matchSearch = !searchLower || 
        c.name.toLowerCase().includes(searchLower) || 
        c.email.toLowerCase().includes(searchLower) || 
        c.jobTitle.toLowerCase().includes(searchLower);
      return matchJob && matchStatus && matchSearch;
    });

    let rows = filteredCandidates.map(c => {
      const scoreClass = c.atsScore >= 75 ? 'score-high' : (c.atsScore >= 50 ? 'score-medium' : 'score-low');
      const testScore = c.assessmentScore != null ? `${c.assessmentScore}%` : '-';
      const intScore = c.interviewScore != null ? `${c.interviewScore}%` : '-';

      let overallScore = '-';
      if (c.assessmentScore != null && c.interviewScore != null) {
        const total = (c.atsScore * (weights.ats / 100)) + 
                      (c.assessmentScore * (weights.assessment / 100)) + 
                      (c.interviewScore * (weights.interview / 100));
        overallScore = `${total.toFixed(1)}%`;
      }

      const isRejected = c.status === 'Rejected';

      return `
        <tr>
          <td style="font-weight: 600; color: var(--text-main);">${c.name}<br><span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">${c.email}</span></td>
          <td>${c.jobTitle}</td>
          <td><span class="score-pill ${scoreClass}">${c.atsScore}%</span></td>
          <td style="text-align: center;">${testScore}</td>
          <td style="text-align: center;">${intScore}</td>
          <td style="text-align: center; font-weight: bold; color: var(--accent-gold);">${overallScore}</td>
          <td><span class="status-badge status-${c.status.toLowerCase().replace(/ /g, '-')}">${c.status}</span></td>
          <td>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;" onclick="HRDashboard.openInspector('${c.id}')">Inspect</button>
              ${isRejected ? `
                <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; background: linear-gradient(135deg, #0284c7, #06b6d4); border: 1px solid #06b6d4;" onclick="HRDashboard.reinviteCandidateToAssessment('${c.id}')" title="Re-invite rejected candidate to assessment">Re-Invite</button>
              ` : ''}
              <select class="form-control" style="width: auto; padding: 0.3rem 0.5rem; font-size: 0.75rem; background: #fff;" onchange="HRDashboard.overrideStatus('${c.id}', this.value); this.value='';" title="Override candidate status">
                <option value="" disabled selected>Status</option>
                <option value="Applied">Applied</option>
                <option value="Assessment Invited">Assessment Invited</option>
                <option value="Assessment Completed">Assessment Completed</option>
                <option value="Interview Invited">Interview Invited</option>
                <option value="Interview Completed">Interview Completed</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (filteredCandidates.length === 0) {
      rows = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">No candidates match your filters or search query.</td></tr>`;
    }

    return `
      <div class="glass-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="color: var(--text-main); margin: 0; display: inline-flex; align-items: center; gap: 0.5rem;">
              Candidate Pipeline
              <span class="badge" style="font-size: 0.75rem; background: var(--accent-gold-glow); color: var(--accent-gold); border: 1px solid var(--accent-gold); padding: 0.2rem 0.6rem; border-radius: 12px;">${filteredCandidates.length} of ${candidates.length}</span>
            </h3>
          </div>
          
          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            <input type="text" class="form-control" style="width: 220px; padding: 0.4rem 0.8rem; font-size: 0.85rem;" placeholder="Search candidate..." value="${this.pipelineSearchQuery || ''}" oninput="HRDashboard.setPipelineSearchQuery(this.value)">
            
            <button class="btn btn-primary" style="font-size: 0.8rem;" onclick="HRDashboard.bulkSendAssessments()">Bulk Send Assessments</button>
            <button class="btn btn-primary" style="font-size: 0.8rem; background: linear-gradient(135deg, #7c3aed, #a855f7); border: none;" onclick="HRDashboard.bulkSendInterviews()">Bulk Send Interviews</button>
            
            <select class="form-control" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem;" onchange="HRDashboard.setPipelineFilter('jobTitle', this.value)">
              <option value="All">All Positions</option>
              ${uniqueJobs.map(job => `<option value="${job}" ${this.pipelineFilters.jobTitle === job ? 'selected' : ''}>${job}</option>`).join('')}
            </select>
            
            <select class="form-control" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem;" onchange="HRDashboard.setPipelineFilter('status', this.value)">
              <option value="All">All Statuses</option>
              ${uniqueStatuses.map(status => `<option value="${status}" ${this.pipelineFilters.status === status ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="candidate-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied For</th>
                <th>ATS Match</th>
                <th style="text-align: center;">Test Score</th>
                <th style="text-align: center;">AI Interview</th>
                <th style="text-align: center;">Overall Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderJobsPanel: function (jobs) {
    return `
      <div class="glass-card" style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="color: var(--text-main);">Active Job Positions</h3>
          <button class="btn btn-primary" onclick="HRDashboard.openCreateJobModal()">+ Post New Job</button>
        </div>
        
        <div class="table-responsive">
          <table class="candidate-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Experience Reqd</th>
                <th>Last Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${jobs.map(job => `
                <tr>
                  <td style="font-weight: 600; color: var(--text-main);">${job.title}</td>
                  <td>${job.department}</td>
                  <td>${job.experienceYears} Years</td>
                  <td>${job.applicationDeadline ? job.applicationDeadline.split('T')[0] : 'N/A'}</td>
                  <td>
                    <span class="status-badge ${job.published ? 'status-hired' : 'status-rejected'}">${job.published ? 'Published' : 'Draft'}</span>
                  </td>
                  <td>
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="HRDashboard.toggleJobPublish('${job.id}', ${!job.published})">
                      ${job.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin-right: 0.5rem; background: var(--accent-gold); color: black;" onclick="HRDashboard.openCreateJobModal('${job.id}')">
                      Edit
                    </button>
                    <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="HRDashboard.deleteJob('${job.id}')">
                      Delete
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSettingsPanel: function (threshold) {
    const hrQuestions = AppState.getHrQuestions();
    const hrMcqBank = AppState.getHrMcqBank();
    const mcqMix = AppState.getMcqMixConfig(); // { bankCount, aiCount }
    const weights = AppState.getSelectionWeights(); // { ats, assessment, interview }

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- ATS Score Settings -->
        <div class="glass-card">
          <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">ATS Screener Settings</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Configure the baseline parameters for resume keyword evaluation. Applicants scoring below this threshold are automatically archived/rejected.
          </p>

          <div class="form-group" style="max-width: 300px;">
            <label for="ats-threshold-input">Minimum ATS Match Score (%)</label>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <input type="number" id="ats-threshold-input" class="form-control" min="1" max="100" value="${threshold}">
              <button class="btn btn-primary" onclick="HRDashboard.saveAtsThreshold()">Save</button>
            </div>
            <p style="font-size:0.75rem; color:var(--accent-gold); margin-top:0.4rem;">Default standard is 50% match.</p>
          </div>
        </div>

        <!-- Selection Weightages -->
        <div class="glass-card">
          <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">Selection Weightages</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Configure the percentage weight of each recruitment stage to calculate the Overall Candidate Score. Must sum to 100%.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label for="weight-ats">ATS Score (%)</label>
              <input type="number" id="weight-ats" class="form-control" min="0" max="100" value="${weights.ats}">
            </div>
            <div class="form-group">
              <label for="weight-assessment">Assessment (%)</label>
              <input type="number" id="weight-assessment" class="form-control" min="0" max="100" value="${weights.assessment}">
            </div>
            <div class="form-group">
              <label for="weight-interview">AI Interview (%)</label>
              <input type="number" id="weight-interview" class="form-control" min="0" max="100" value="${weights.interview}">
            </div>
          </div>
          <button class="btn btn-primary" onclick="HRDashboard.saveSelectionWeights()">Save Weightages</button>
        </div>

        <!-- Custom HR Interview Questions -->
        <div class="glass-card">
          <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">AI Interview Custom Questions</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
            These questions will be injected dynamically into the AI interviewer session for all candidates. AI will analyze details of candidate answers.
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;" id="hr-questions-list">
            ${hrQuestions.map((q, idx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 6px;">
                <span style="font-size: 0.9rem; color: var(--text-main);">${idx + 1}. ${q}</span>
                <button class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="HRDashboard.deleteQuestion(${idx})">Delete</button>
              </div>
            `).join('')}
          </div>

          <div class="form-group">
            <label for="new-question-input">Add New HR Standard Question</label>
            <div style="display: flex; gap: 1rem;">
              <input type="text" id="new-question-input" class="form-control" placeholder="Enter custom interview question...">
              <button class="btn btn-primary" onclick="HRDashboard.addQuestion()">Add</button>
            </div>
          </div>
        </div>

        <!-- Assessment MCQ Bank -->
        <div class="glass-card">
          <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">Assessment MCQ Bank</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Define custom multiple-choice questions for candidate assessments. Below you control exactly how many questions come from this HR bank vs. AI-generated (based on job skills).
          </p>

          <!-- MCQ Mix Ratio Control -->
          <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 1.25rem; border-radius: 8px; border: 1px dashed var(--border-color); margin-bottom: 1.5rem;">
            <h4 style="color: #fff; margin-bottom: 1rem; font-size: 0.95rem;">Assessment Question Mix</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label for="mcq-bank-count">Questions from HR / Bank *</label>
                <input type="number" id="mcq-bank-count" class="form-control" min="0" max="50" value="${mcqMix.bankCount}">
                <p style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">Picked from your custom bank below (HR-written questions get priority, remaining slots filled randomly from bank).</p>
              </div>
              <div>
                <label for="mcq-ai-count">Questions from AI (Gemini) *</label>
                <input type="number" id="mcq-ai-count" class="form-control" min="0" max="50" value="${mcqMix.aiCount}">
                <p style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">Auto-generated fresh per candidate, based on the job's required skills/keywords.</p>
              </div>
            </div>
            <button class="btn btn-primary" onclick="HRDashboard.saveMcqMixConfig()">Save Mix Settings</button>
            <p style="font-size:0.75rem; color:var(--accent-gold); margin-top:0.5rem;">Total questions per assessment: <strong id="mcq-total-preview">${mcqMix.bankCount + mcqMix.aiCount}</strong></p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;" id="hr-mcq-list">
            ${hrMcqBank.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.85rem;">No custom HR MCQs defined yet.</p>' : hrMcqBank.map((q, idx) => `
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 6px;">
                <div style="flex: 1;">
                  <span style="font-size: 0.95rem; color: var(--text-main); font-weight: 600; display: block; margin-bottom: 0.5rem;">Q${idx + 1}. ${q.question}</span>
                  <ul style="list-style-type: none; padding-left: 0; margin: 0;">
                    ${q.options.map((opt, oIdx) => `
                      <li style="font-size: 0.85rem; color: ${oIdx === q.correct ? 'var(--accent-green)' : 'var(--text-muted)'}; margin-bottom: 0.25rem;">
                        ${oIdx === q.correct ? '[Correct]' : ''} ${opt}
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-left: 1rem;" onclick="HRDashboard.deleteHrMcq(${idx})">Delete</button>
              </div>
            `).join('')}
          </div>

          <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; border: 1px dashed var(--border-color);">
            <h4 style="color: #fff; margin-bottom: 1rem; font-size: 1rem;">Add New MCQ</h4>
            
            <label for="new-mcq-question">Question Text *</label>
            <input type="text" id="new-mcq-question" class="form-control" style="margin-bottom: 1rem;" placeholder="E.g., What is our primary corporate value?">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label for="new-mcq-opt0">Option 1 *</label>
                <input type="text" id="new-mcq-opt0" class="form-control" placeholder="First option">
              </div>
              <div>
                <label for="new-mcq-opt1">Option 2 *</label>
                <input type="text" id="new-mcq-opt1" class="form-control" placeholder="Second option">
              </div>
              <div>
                <label for="new-mcq-opt2">Option 3 *</label>
                <input type="text" id="new-mcq-opt2" class="form-control" placeholder="Third option">
              </div>
              <div>
                <label for="new-mcq-opt3">Option 4 *</label>
                <input type="text" id="new-mcq-opt3" class="form-control" placeholder="Fourth option">
              </div>
            </div>

            <label for="new-mcq-correct">Correct Option *</label>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <select id="new-mcq-correct" class="form-control" style="max-width: 200px;">
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
              </select>
              <button class="btn btn-primary" onclick="HRDashboard.addHrMcq()">Add MCQ</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  saveSelectionWeights: function () {
    const ats = parseInt(document.getElementById('weight-ats').value, 10);
    const assessment = parseInt(document.getElementById('weight-assessment').value, 10);
    const interview = parseInt(document.getElementById('weight-interview').value, 10);

    if (isNaN(ats) || isNaN(assessment) || isNaN(interview)) {
      alert("Please enter valid numbers for all weights.");
      return;
    }

    if (ats + assessment + interview !== 100) {
      alert(`The weights must sum up to exactly 100%. Current sum: ${ats + assessment + interview}%`);
      return;
    }

    AppState.setSelectionWeights({ ats, assessment, interview });
    alert("Selection weightages updated successfully.");
    this.render('view-container');
  },

  saveAtsThreshold: function () {
    const input = document.getElementById('ats-threshold-input');
    const val = parseInt(input.value, 10);
    if (val >= 1 && val <= 100) {
      AppState.setAtsThreshold(val);
      alert(`ATS Threshold score successfully updated to ${val}%. Candidates below this match rate will be automatically filtered.`);
      this.render('view-container');
    } else {
      alert("Please enter a valid percentage threshold between 1 and 100.");
    }
  },

  saveMcqMixConfig: function () {
    const bankCount = parseInt(document.getElementById('mcq-bank-count').value, 10);
    const aiCount = parseInt(document.getElementById('mcq-ai-count').value, 10);

    if (isNaN(bankCount) || isNaN(aiCount) || bankCount < 0 || aiCount < 0) {
      alert("Please enter valid numbers for both bank and AI question counts.");
      return;
    }
    if (bankCount + aiCount === 0) {
      alert("Total assessment questions cannot be zero. Please set at least 1 question.");
      return;
    }

    AppState.setMcqMixConfig({ bankCount, aiCount });
    alert(`Assessment mix saved: ${bankCount} from HR/Bank + ${aiCount} AI-generated = ${bankCount + aiCount} total questions per candidate.`);
    this.render('view-container');
  },

  addQuestion: function () {
    const input = document.getElementById('new-question-input');
    const val = input.value.trim();
    if (val) {
      AppState.addHrQuestion(val);
      input.value = "";
      this.render('view-container');
    }
  },

  deleteQuestion: function (idx) {
    AppState.deleteHrQuestion(idx);
    this.render('view-container');
  },

  addHrMcq: function() {
    const qText = document.getElementById('new-mcq-question').value.trim();
    const opt0 = document.getElementById('new-mcq-opt0').value.trim();
    const opt1 = document.getElementById('new-mcq-opt1').value.trim();
    const opt2 = document.getElementById('new-mcq-opt2').value.trim();
    const opt3 = document.getElementById('new-mcq-opt3').value.trim();
    const correctIdx = parseInt(document.getElementById('new-mcq-correct').value, 10);

    if (!qText || !opt0 || !opt1 || !opt2 || !opt3) {
      alert("Please fill out the question and all 4 options.");
      return;
    }

    const newMcq = {
      question: qText,
      options: [opt0, opt1, opt2, opt3],
      correct: correctIdx
    };

    AppState.addHrMcq(newMcq);
    alert("New custom MCQ added to Assessment Bank.");
    this.render('view-container');
  },

  deleteHrMcq: function(idx) {
    if (confirm("Are you sure you want to delete this MCQ?")) {
      AppState.deleteHrMcq(idx);
      this.render('view-container');
    }
  },

  openInspector: function (candId) {
    const c = AppState.getCandidateById(candId);
    if (!c) return;

    const wrapper = document.getElementById('inspector-modal-wrapper');
    const scoreClass = c.atsScore >= 75 ? 'score-high' : (c.atsScore >= 50 ? 'score-medium' : 'score-low');
    const threshold = AppState.getAtsThreshold();
    const weights = AppState.getSelectionWeights();
    
    let overallScoreHTML = '';
    if (c.assessmentScore != null && c.interviewScore != null) {
      const total = (c.atsScore * (weights.ats / 100)) + 
                    (c.assessmentScore * (weights.assessment / 100)) + 
                    (c.interviewScore * (weights.interview / 100));
      overallScoreHTML = `
        <div style="background: rgba(124, 58, 237, 0.1); padding: 1rem; border-radius: 6px; border: 1px solid rgba(124, 58, 237, 0.3); margin-top: 1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:600; color:#a855f7;">Overall Weighted Score:</span>
            <span style="font-size:1.2rem; font-weight:bold; color:var(--text-main);">${total.toFixed(1)}%</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem; display:flex; justify-content:space-between;">
            <span>ATS: ${(c.atsScore * (weights.ats/100)).toFixed(1)} (${weights.ats}%)</span>
            <span>Test: ${(c.assessmentScore * (weights.assessment/100)).toFixed(1)} (${weights.assessment}%)</span>
            <span>Int: ${(c.interviewScore * (weights.interview/100)).toFixed(1)} (${weights.interview}%)</span>
          </div>
        </div>
      `;
    }

    // Check if interview transcripts are populated
    let transcriptHTML = `
      <p style="color:var(--text-muted); font-style:italic; font-size:0.9rem;">No interview transcript available for this candidate.</p>
    `;
    if (c.interviewTranscript && c.interviewTranscript.length > 0) {
      transcriptHTML = c.interviewTranscript.map(t => `
        <div style="margin-bottom: 0.75rem;">
          <strong style="color:${t.sender === 'AI' ? 'var(--accent-gold)' : 'var(--accent-cyan)'}; font-size:0.85rem;">${t.sender}:</strong>
          <p style="color:var(--text-main); font-size:0.9rem; background:rgba(255,255,255,0.02); padding:0.5rem; border-radius:6px; margin-top:0.25rem;">${t.text}</p>
        </div>
      `).join('');
    }

    // Determine whether "Send Assessment Invite" should show
    const eligibleForAssessment = c.atsScore >= threshold && c.assessmentScore === null && c.status !== 'Rejected' && c.status !== 'Hired';

    wrapper.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <div>
              <h2 style="color: #fff;">Candidate Assessment File</h2>
              <p style="color: var(--text-muted); font-size: 0.85rem;">Review details, tests & AI transcript</p>
            </div>
            <button class="close-btn" onclick="HRDashboard.closeInspector()">&times;</button>
          </div>
          <div class="modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-height: 70vh; overflow-y: auto;">
            
            <!-- Left Column: Bio & Summary -->
            <div>
              <h4 style="color: var(--accent-gold); margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Basic Information</h4>
              <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                ${c.pictureBase64 ? `<div style="text-align: center;"><img src="${c.pictureBase64}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);"><p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">Application</p></div>` : ''}
                ${c.assessmentPictureBase64 ? `<div style="text-align: center;"><img src="${c.assessmentPictureBase64}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);"><p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">Assessment Start</p></div>` : ''}
              </div>
              <p style="font-size:0.9rem;"><strong>Name:</strong> ${c.name}</p>
              <p style="font-size:0.9rem;"><strong>Email:</strong> ${c.email}</p>
              <p style="font-size:0.9rem;"><strong>Phone:</strong> ${c.phone}</p>
              <p style="font-size:0.9rem;"><strong>Applied Date:</strong> ${c.appliedDate}</p>
              
              <h4 style="color: var(--accent-gold); margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Extracted CV / Resume</h4>
              <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.5; background: #f8fafc; border: 1px solid var(--border-color); padding: 1rem; border-radius: 6px; white-space: pre-wrap; max-height: 250px; overflow-y: auto; font-family: monospace;">
                ${c.resumeSummary || 'No CV text available.'}
              </div>

              <h4 style="color: var(--accent-gold); margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Funnel Results</h4>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                  <span>ATS Match Rating:</span>
                  <span class="score-pill ${scoreClass}">${c.atsScore}%</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                  <span>Assessment Score:</span>
                  <span style="font-weight:bold; color:var(--text-main);">${c.assessmentScore != null ? `${c.assessmentScore}%` : 'Not Attempted'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                  <span>AI Interview Performance:</span>
                  <span style="font-weight:bold; color:var(--accent-gold);">${c.interviewScore != null ? `${c.interviewScore}%` : 'Not Completed'}</span>
                </div>
              </div>
              ${overallScoreHTML}

              <h4 style="color: var(--accent-gold); margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Evaluation Notes</h4>
              <textarea id="hr-notes-box" class="form-control" rows="3" style="font-size:0.85rem;" placeholder="Add private feedback notes...">${c.hrNotes || ''}</textarea>
              <button class="btn btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; margin-top: 0.5rem;" onclick="HRDashboard.saveNotes('${c.id}')">Save Notes</button>

              <!-- Proctoring Report -->
              ${c.proctoringData ? `
                <h4 style="color: var(--danger-color); margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">AI Proctoring Report</h4>
                <div style="font-size:0.85rem; background: ${c.proctoringData.isDisqualified ? 'rgba(220, 38, 38, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; padding: 1rem; border-radius: 6px; border: 1px solid ${c.proctoringData.isDisqualified ? '#dc2626' : '#22c55e'};">
                  <p style="margin-bottom:0.4rem;"><strong>Status:</strong> <span style="color: ${c.proctoringData.isDisqualified ? '#dc2626' : '#22c55e'}; font-weight: bold;">${c.proctoringData.isDisqualified ? 'Disqualified (Violations)' : 'Clean Record'}</span></p>
                  <p style="margin-bottom:0.4rem;"><strong>Tab Switches:</strong> ${c.proctoringData.tabSwitches} / 3 allowed</p>
                  <p style="margin-bottom:0.4rem;"><strong>Multi-Face Detections:</strong> ${c.proctoringData.multipleFaceViolations || 0} / 3 allowed</p>
                  <p style="margin-bottom:0.75rem;"><strong>Copy/Paste Attempts:</strong> ${c.proctoringData.copyPasteAttempts}</p>
                  <div style="max-height:100px; overflow-y:auto; font-family:monospace; font-size:0.72rem; background: #0f172a; color: #4ade80; padding: 0.5rem; border-radius: 4px; line-height:1.6;">
                    ${c.proctoringData.logs.map(l => `[${l.time}] ${l.event}`).join('<br>')}
                  </div>
                </div>
              ` : `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:1rem; font-style:italic;">No proctoring data (interview not yet completed).</p>`}
            </div>

            <!-- Right Column: AI Interview Transcript & Assessment details -->
            <div style="border-left: 1px solid var(--border-color); padding-left: 1.5rem; display: flex; flex-direction: column; height: 100%;">
              ${c.assessmentDetails ? `
                <h4 style="color: var(--accent-gold); margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Assessment Responses</h4>
                <div style="overflow-y: auto; max-height: 200px; padding-right: 0.5rem; margin-bottom: 1rem; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;">
                  ${c.assessmentDetails.map((a, i) => `
                    <div style="margin-bottom: 0.75rem;">
                      <p style="font-size: 0.85rem; color: var(--text-main); font-weight: bold;">Q${i+1}. ${a.question}</p>
                      <ul style="list-style: none; padding-left: 0; margin-top: 0.25rem;">
                        ${a.options.map((opt, oIdx) => {
                          let color = 'var(--text-muted)';
                          let icon = '';
                          if (oIdx === a.correct) { color = 'var(--accent-green)'; icon = '(Correct)'; }
                          else if (oIdx === a.selected) { color = 'var(--accent-red)'; icon = '(Selected)'; }
                          return `<li style="font-size: 0.75rem; color: ${color};">${icon} ${opt}</li>`;
                        }).join('')}
                      </ul>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              
              <h4 style="color: var(--accent-gold); margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">AI Interview Transcript</h4>
              <div style="flex: 1; overflow-y: auto; max-height: ${c.assessmentDetails ? '280px' : '480px'}; padding-right: 0.5rem;">
                ${transcriptHTML}
              </div>
            </div>

          </div>
          <div class="modal-footer" style="flex-wrap: wrap; gap: 0.5rem; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Status Override:</span>
              <select class="form-control" style="width: auto; padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #fff;" onchange="HRDashboard.overrideStatus('${c.id}', this.value)">
                ${['Applied', 'Shortlisted', 'Assessment Invited', 'Assessment Completed', 'Interview Invited', 'Interview Completed', 'Hired', 'Rejected'].map(st => `
                  <option value="${st}" ${c.status === st ? 'selected' : ''}>${st}</option>
                `).join('')}
              </select>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
              <button class="btn btn-secondary" onclick="HRDashboard.closeInspector()">Close</button>
              
              ${c.status === 'Rejected' ? `
                <button class="btn btn-primary" style="background: linear-gradient(135deg, #0284c7, #06b6d4); border: 1px solid #06b6d4;" onclick="HRDashboard.reinviteCandidateToAssessment('${c.id}')">
                  Re-Invite to Assessment
                </button>
              ` : ''}

              ${c.status !== 'Hired' && c.status !== 'Rejected' ? `
                <button class="btn btn-danger" onclick="HRDashboard.finalizeCandidate('${c.id}', 'Rejected')">Reject Candidate</button>
              ` : ''}

              ${eligibleForAssessment && c.status !== 'Assessment Invited' ? `
                <button class="btn btn-primary" style="background: linear-gradient(135deg, #0891b2, #06b6d4); border:1px solid #06b6d4;" onclick="HRDashboard.sendAssessmentInvitation('${c.id}')">
                  Send Assessment Invite
                </button>
              ` : c.status === 'Assessment Invited' ? `
                <span style="font-size:0.8rem; color:#06b6d4; font-weight:600; align-self:center;">Assessment invite active</span>
              ` : ''}

              ${c.assessmentScore != null && c.status !== 'Interview Invited' && c.status !== 'Hired' ? `
                <button class="btn btn-primary" style="background: linear-gradient(135deg, #7c3aed, #a855f7); border:1px solid #a855f7;" onclick="HRDashboard.sendInterviewInvitation('${c.id}')">
                  Send HR Interview Invite
                </button>
              ` : c.status === 'Interview Invited' ? `
                <span style="font-size:0.8rem; color:#a855f7; font-weight:600; align-self:center;">Interview invite active</span>
              ` : ''}

              ${c.status !== 'Hired' ? `
                <button class="btn btn-primary" style="background:var(--accent-green); color:white;" onclick="HRDashboard.finalizeCandidate('${c.id}', 'Hired')">Hire Candidate</button>
              ` : `<span style="font-weight:bold; color:var(--accent-green); font-size:0.9rem; align-self:center;">Candidate Hired</span>`}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  closeInspector: function () {
    const wrapper = document.getElementById('inspector-modal-wrapper');
    if (wrapper) wrapper.innerHTML = '';
  },

  overrideStatus: function(candId, newStatus) {
    const c = AppState.getCandidateById(candId);
    if (!c || !newStatus || c.status === newStatus) return;

    if (confirm(`Change status of ${c.name} from "${c.status}" to "${newStatus}"?`)) {
      const oldStatus = c.status;
      AppState.updateCandidateStatus(candId, newStatus);
      AppState.addCandidateNote(candId, `HR Manual Override: Status changed from "${oldStatus}" to "${newStatus}".`);
      alert(`Candidate status updated to "${newStatus}".`);
      this.closeInspector();
      this.render('view-container');
      if (typeof App !== 'undefined' && App.renderHeader) App.renderHeader();
    }
  },

  reinviteCandidateToAssessment: async function (candId) {
    const c = AppState.getCandidateById(candId);
    if (!c) return;

    if (!confirm(`Are you sure you want to re-invite ${c.name} to the Assessment stage?\n\nThis will update candidate status to "Assessment Invited" and dispatch a new assessment link.`)) {
      return;
    }

    const previousStatus = c.status;
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    c.assessmentToken = token;
    c.assessmentExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    
    // Update candidate status to Assessment Invited
    AppState.updateCandidateStatus(candId, 'Assessment Invited');
    AppState.addCandidateNote(candId, `HR Override: Candidate status updated from "${previousStatus}" to "Assessment Invited". Fresh assessment link dispatched.`);

    const baseUrl = window.location.href.split('?')[0];
    const assessmentLink = `${baseUrl}?view=assessment&candId=${c.id}&token=${token}`;

    try {
      if (typeof window.sendAssessmentEmail === 'function') {
        realEmailSent = await window.sendAssessmentEmail(c, assessmentLink);
      }
    } catch (err) {
      console.error('EmailJS assessment email failed:', err);
    }

    // Log in simulated in-app inbox
    AppState.sendMockEmail({
      candidateId: c.id,
      to: c.email,
      subject: `Assessment Invitation (Re-Opened): ${c.jobTitle} at PIA`,
      body: `Dear ${c.name},

Our HR Evaluation Team has re-reviewed your application for the ${c.jobTitle} position at Pakistan International Airlines (PIA).

You are invited to complete our online technical assessment using the link below:

Assessment Link: ${assessmentLink}

This link is valid for 48 hours. Please complete it in one sitting.

If you face any issues, please contact careers@pia.aero.

Warm regards,
PIA Talent Acquisition Team`,
      type: 'assessment',
      actionLink: assessmentLink,
      actionLabel: 'Start Assessment'
    });

    if (realEmailSent) {
      alert(`Candidate status updated to "Assessment Invited"!\nInvitation emailed to ${c.email} and logged in inbox.`);
    } else {
      alert(`Candidate status updated to "Assessment Invited"!\nInvitation link logged in candidate inbox.`);
    }

    this.closeInspector();
    this.render('view-container');
    if (typeof App !== 'undefined' && App.renderHeader) App.renderHeader();
  },

  saveNotes: function (candId) {
    const text = document.getElementById('hr-notes-box').value;
    AppState.addCandidateNote(candId, text);
    alert("HR feedback notes updated.");
    this.render('view-container');
    this.closeInspector();
  },

  finalizeCandidate: function (candId, decision) {
    AppState.updateCandidateStatus(candId, decision);
    AppState.addCandidateNote(candId, `Application finalized by HR. Decision: ${decision}.`);

    const c = AppState.getCandidateById(candId);

    // Simulated final notification
    AppState.sendMockEmail({
      candidateId: c.id,
      to: c.email,
      subject: decision === 'Hired' ? `Job Offer: ${c.jobTitle} at PIA` : `Application Status Update: ${c.jobTitle}`,
      body: decision === 'Hired' ?
        `Dear ${c.name},

Congratulations! We are delighted to offer you the position of ${c.jobTitle} at PIA. 

Our team was thoroughly impressed by your credentials, assessment responses, and performance during the AI Interview evaluation.

We will share details of the contract and onboarding schedule in a subsequent email. Welcome aboard!

Warm regards,
PIA Careers Team` :
        `Dear ${c.name},

Thank you for participating in the technical testing and AI interview round for the ${c.jobTitle} position.

While our evaluation team appreciated your effort, we regret to inform you that we will not be extending an offer of employment at this time. We will keep your profile in our talent pool for future vacancies.

Sincerely,
PIA Talent Acquisition`,
      type: decision === 'Hired' ? "offer" : "rejection"
    });

    alert(`Candidate marked as ${decision}. Notification email dispatched.`);
    this.render('view-container');
    this.closeInspector();
  },

  // ---------------------------------------------------------
  // NEW: Send Assessment Invitation (real email via EmailJS
  // + mock inbox entry + status update)
  // ---------------------------------------------------------
  sendAssessmentInvitation: async function (candId) {
    const c = AppState.getCandidateById(candId);
    if (!c) return;

    if (c.status === 'Assessment Invited' || c.status === 'Assessment Completed' || c.status === 'Interview Invited' || c.status === 'Interview Completed') {
      alert('An assessment invitation has already been sent to this candidate.');
      return;
    }

    const job = AppState.getJobById(c.jobId);
    if (job && job.applicationDeadline && new Date() < new Date(job.applicationDeadline)) {
      alert('Cannot send assessment link yet. The application deadline has not passed.');
      return;
    }

    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    c.assessmentToken = token;
    // Set expiry to 48 hours from now
    c.assessmentExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    AppState.save();

    const baseUrl = window.location.href.split('?')[0];
    const assessmentLink = `${baseUrl}?view=assessment&candId=${c.id}&token=${token}`;

    // 1. Send the REAL email via EmailJS (defined in emailService.js)
    let realEmailSent = false;
    try {
      if (typeof window.sendAssessmentEmail === 'function') {
        realEmailSent = await window.sendAssessmentEmail(c, assessmentLink);
      }
    } catch (err) {
      console.error('EmailJS assessment email failed:', err);
    }

    // 2. Update candidate status
    AppState.updateCandidateStatus(candId, 'Assessment Invited');

    // 3. Also log into the simulated in-app inbox so HR/demo flow still works
    AppState.sendMockEmail({
      candidateId: c.id,
      to: c.email,
      subject: `Assessment Invitation: ${c.jobTitle} at PIA`,
      body: `Dear ${c.name},

Thank you for applying for the ${c.jobTitle} position at Pakistan International Airlines (PIA). Your profile has cleared our initial ATS screening.

You are now invited to complete our online technical assessment. The assessment includes a mix of HR-curated and AI-generated multiple choice questions relevant to this role.

Assessment Link: ${assessmentLink}

This link is valid for 48 hours. Please complete it in one sitting in a quiet environment with a stable internet connection.

If you face any issues accessing the assessment, please contact careers@pia.aero.

Warm regards,
PIA Talent Acquisition Team`,
      type: 'assessment',
      actionLink: assessmentLink,
      actionLabel: 'Start Assessment'
    });

    if (realEmailSent) {
      alert(`Assessment invitation emailed to ${c.email} and logged in the candidate inbox.`);
    } else {
      alert(`Assessment invitation successfully logged in candidate's inbox and status updated.`);
    }

    this.closeInspector();
    this.render('view-container');
    if (typeof App !== 'undefined' && App.renderHeader) App.renderHeader();
  },

  sendInterviewInvitation: function (candId) {
    const c = AppState.getCandidateById(candId);
    if (!c) return;

    // Prevent double-sending
    if (c.status === 'Interview Invited' || c.status === 'Interview Completed') {
      alert('An interview invitation has already been sent to this candidate.');
      return;
    }

    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    c.interviewToken = token;
    AppState.save();

    // Update status
    AppState.updateCandidateStatus(candId, 'Interview Invited');
    
    const baseUrl = window.location.href.split('?')[0];
    const interviewLink = `${baseUrl}?view=interview&candId=${c.id}&token=${token}`;

    // Send email into the simulated candidate inbox
    AppState.sendMockEmail({
      candidateId: c.id,
      to: c.email,
      subject: `HR Interview Invitation: ${c.jobTitle} at PIA`,
      body: `Dear ${c.name},

We are pleased to inform you that you have successfully cleared the assessment stage for the ${c.jobTitle} position at Pakistan International Airlines (PIA).

You are now invited to proceed with our AI-powered HR Interview round.

Position: ${c.jobTitle}
Department: ${c.department || 'PIA'}
Mode: AI Video Interview (On-demand)

To begin your HR interview, please click the "Open AI Interview" button below. The session will be conducted by our AI interviewer and your responses will be reviewed by our HR team.

Tips for success:
• Find a quiet, well-lit environment
• Speak clearly and confidently
• Keep your answers concise and structured (2–3 minutes each)

This invitation is valid for 48 hours. If you face any technical difficulties, please contact careers@pia.aero.

Warm regards,
PIA Talent Acquisition Team
Pakistan International Airlines`,
      type: 'interview',
      actionLink: interviewLink,
      actionLabel: 'Start AI Interview'
    });

    alert(`HR Interview invitation successfully sent to ${c.email}!\n\nCandidate can now access the AI Interview from their inbox.`);
    this.closeInspector();
    this.render('view-container');
    App.renderHeader();   // refresh inbox badge count
  },

  autoExtractJobKeywords: function() {
    const title = document.getElementById('job-title')?.value || '';
    const dept = document.getElementById('job-dept')?.value || '';
    const desc = document.getElementById('job-desc')?.value || '';

    const keywords = this.extractKeywordsFromText(title, dept, desc);
    const kwInput = document.getElementById('job-keywords');
    if (kwInput) {
      kwInput.value = keywords.join(', ');
      const feedback = document.getElementById('kw-auto-feedback');
      if (feedback) {
        feedback.textContent = `Auto-extracted ${keywords.length} keywords from job details!`;
        feedback.style.display = 'inline';
        setTimeout(() => { feedback.style.display = 'none'; }, 4000);
      }
    }
  },

  extractKeywordsFromText: function(title, dept, desc) {
    const combined = `${title} ${dept} ${desc}`.toLowerCase();
    
    // Domain knowledge base for PIA recruitment
    const domainDictionary = [
      "React", "Node.js", "Express", "MongoDB", "SQL", "Git", "REST APIs", "AWS", "Docker", "JavaScript", "TypeScript",
      "Customer Service", "First Aid", "Communication", "Conflict Resolution", "Safety Procedures", "Teamwork",
      "SEO", "Copywriting", "Digital Marketing", "Social Media", "Google Analytics", "Content Strategy",
      "Cybersecurity", "Penetration Testing", "Firewalls", "SIEM", "Incident Response", "Linux", "Network Security",
      "ATPL", "IR Rating", "Multi-Engine", "Crew Resource Management", "ATC Communication", "Boeing 777", "Airbus A320",
      "HR Strategy", "Talent Management", "Labour Law", "Performance Management", "HRIS", "Employee Relations",
      "Ramp Safety", "GSE Operations", "Airline Operations", "IATA Ground Ops", "Team Leadership",
      "Revenue Management", "Data Analysis", "Excel", "GDS Systems", "Forecasting", "Pricing Strategy",
      "PCAA AME License", "B1/B2 Rating", "NDT", "CAMO", "MRO Operations", "Aviation Regulations",
      "Python", "TensorFlow", "Scikit-learn", "NLP", "MLOps", "Tableau", "Data Visualization",
      "Problem Solving", "Management", "Operations", "Compliance", "Strategy", "Quality Assurance"
    ];

    let extracted = [];
    domainDictionary.forEach(term => {
      if (combined.includes(term.toLowerCase())) {
        extracted.push(term);
      }
    });

    if (extracted.length < 3) {
      const words = combined.match(/\b[a-z]{4,}\b/g) || [];
      const stopWords = new Set(["with", "from", "that", "this", "have", "will", "your", "their", "about", "which", "seeking", "looking", "degree", "years", "work", "team", "responsibilities"]);
      words.forEach(w => {
        if (!stopWords.has(w) && extracted.length < 8) {
          const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
          if (!extracted.some(e => e.toLowerCase() === w)) {
            extracted.push(capitalized);
          }
        }
      });
    }

    return extracted.length > 0 ? extracted : ["Communication", "Problem Solving", "Teamwork", "Operations"];
  },

  openCreateJobModal: function (jobId = null) {
    const wrapper = document.getElementById('inspector-modal-wrapper');
    const job = jobId ? AppState.getJobById(jobId) : null;
    const isEdit = !!job;
    const atsThreshold = job ? (job.atsThreshold || 50) : 50;
    const wAi = job && job.assessmentWeights ? job.assessmentWeights.ai : 40;
    const wHr = job && job.assessmentWeights ? job.assessmentWeights.hr : 30;
    const wJd = job && job.assessmentWeights ? job.assessmentWeights.jd : 30;
    
    wrapper.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h2 style="color: #fff;">${isEdit ? 'Edit Job Opening' : 'Post a New Career Opening'}</h2>
            <button class="close-btn" onclick="HRDashboard.closeInspector()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="create-job-form" onsubmit="HRDashboard.submitNewJob(event, '${jobId || ''}')">
              <div class="form-group">
                <label for="job-title">Job Title *</label>
                <input type="text" id="job-title" class="form-control" placeholder="e.g. Flight Dispatch Specialist" value="${job ? job.title : ''}" required>
              </div>

              <div class="form-group">
                <label for="job-dept">Department *</label>
                <select id="job-dept" class="form-control" required>
                  <option value="Information Technology" ${job && job.department === 'Information Technology' ? 'selected' : ''}>Information Technology</option>
                  <option value="Flight Operations" ${job && job.department === 'Flight Operations' ? 'selected' : ''}>Flight Operations</option>
                  <option value="Commercial & Marketing" ${job && job.department === 'Commercial & Marketing' ? 'selected' : ''}>Commercial & Marketing</option>
                  <option value="Information Security" ${job && job.department === 'Information Security' ? 'selected' : ''}>Information Security</option>
                </select>
              </div>

              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label for="job-exp">Required Experience (Years) *</label>
                  <input type="number" id="job-exp" class="form-control" min="0" max="20" value="${job ? job.experienceYears : 2}" required>
                </div>
                <div>
                  <label for="job-type">Job Type *</label>
                  <select id="job-type" class="form-control" required>
                    <option value="Full-Time" ${job && job.type === 'Full-Time' ? 'selected' : ''}>Full-Time</option>
                    <option value="Contract" ${job && job.type === 'Contract' ? 'selected' : ''}>Contract</option>
                  </select>
                </div>
              </div>

              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label for="job-salary">Salary Budget Range</label>
                  <input type="text" id="job-salary" class="form-control" placeholder="e.g. PKR 150,000 - 200,000" value="${job ? job.salary : ''}">
                </div>
                <div>
                  <label for="job-loc">Location *</label>
                  <input type="text" id="job-loc" class="form-control" value="${job ? job.location : 'Karachi (Headquarters)'}" required>
                </div>
              </div>

              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label for="job-app-deadline">Application Deadline *</label>
                  <input type="date" id="job-app-deadline" class="form-control" value="${job && job.applicationDeadline ? job.applicationDeadline.split('T')[0] : ''}" min="${new Date().toISOString().split('T')[0]}" required>
                </div>
              </div>

              <div class="form-group">
                <label for="job-desc">Job Description *</label>
                <textarea id="job-desc" class="form-control" rows="3" placeholder="Briefly describe responsibilities..." required>${job ? job.description : ''}</textarea>
              </div>

              <div class="form-group">
                <label for="job-keywords">ATS Screening Keywords (Optional, Comma-separated)</label>
                <input type="text" id="job-keywords" class="form-control" placeholder="e.g. Python, SQL, Cloud, Docker (Leave blank to auto-generate)" value="${job ? job.requirements.join(', ') : ''}">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.35rem;">
                  <button type="button" class="btn btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.75rem; background: linear-gradient(135deg, #004d26, #006633); color: white; border: none; border-radius: 4px;" onclick="HRDashboard.autoExtractJobKeywords()">Auto-Extract Keywords from Details</button>
                  <span id="kw-auto-feedback" style="font-size:0.75rem; color:var(--accent-green); font-weight: 600; display:none;"></span>
                </div>
                <p style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">Optional. If left blank, our AI engine will automatically extract screening keywords from the job description.</p>
              </div>
              
              <h4 style="color: var(--accent-gold); margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">ATS & Assessment Settings</h4>
              
              <div class="form-group">
                  <label for="job-ats-threshold">Minimum ATS Threshold (%) *</label>
                  <input type="number" id="job-ats-threshold" class="form-control" min="1" max="100" value="${atsThreshold}" required>
                  <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Candidates scoring below this will be rejected automatically.</p>
              </div>
              
              <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 1.25rem; border-radius: 8px; border: 1px dashed var(--border-color);">
                <label>Assessment Question Mix (Must sum to 100%)</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
                    <div>
                        <label style="font-size: 0.8rem;" for="job-weight-ai">AI/Technical (%)</label>
                        <input type="number" id="job-weight-ai" class="form-control" min="0" max="100" value="${wAi}">
                    </div>
                    <div>
                        <label style="font-size: 0.8rem;" for="job-weight-hr">HR/Mindset (%)</label>
                        <input type="number" id="job-weight-hr" class="form-control" min="0" max="100" value="${wHr}">
                    </div>
                    <div>
                        <label style="font-size: 0.8rem;" for="job-weight-jd">Job Specific (%)</label>
                        <input type="number" id="job-weight-jd" class="form-control" min="0" max="100" value="${wJd}">
                    </div>
                </div>
              </div>

              <div class="modal-footer" style="padding: 1rem 0 0 0;">
                <button type="button" class="btn btn-secondary" onclick="HRDashboard.closeInspector()">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Opening'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  submitNewJob: function (event, jobId) {
    event.preventDefault();

    const title = document.getElementById('job-title').value.trim();
    const dept = document.getElementById('job-dept').value;
    const exp = parseInt(document.getElementById('job-exp').value, 10);
    const type = document.getElementById('job-type').value;
    const salary = document.getElementById('job-salary').value.trim() || "PKR Negotiable";
    const loc = document.getElementById('job-loc').value.trim();
    const desc = document.getElementById('job-desc').value.trim();
    const appDeadline = document.getElementById('job-app-deadline').value;

    // Split keywords (if empty, auto-generate from title & description)
    const keywordsRaw = document.getElementById('job-keywords').value.trim();
    let requirements = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];
    if (requirements.length === 0) {
      requirements = this.extractKeywordsFromText(title, dept, desc);
    }
    
    // ATS & Assessment
    const atsThreshold = parseInt(document.getElementById('job-ats-threshold').value, 10);
    const wAi = parseInt(document.getElementById('job-weight-ai').value, 10);
    const wHr = parseInt(document.getElementById('job-weight-hr').value, 10);
    const wJd = parseInt(document.getElementById('job-weight-jd').value, 10);
    
    if (new Date(appDeadline) < new Date(new Date().setHours(0,0,0,0))) {
       alert("Application Deadline cannot be in the past.");
       return;
    }

    if (wAi + wHr + wJd !== 100) {
       alert("Assessment Weights must sum to 100%");
       return;
    }

    if (jobId) {
        // Edit existing
        AppState.updateJob(jobId, {
            title, department: dept, experienceYears: exp, type, salary, location: loc, description: desc, requirements,
            applicationDeadline: appDeadline,
            atsThreshold, assessmentWeights: { ai: wAi, hr: wHr, jd: wJd }
        });
        alert("Job updated successfully!");
    } else {
        // Create new
        const newJob = {
          id: `job-${Date.now()}`,
          title: title,
          department: dept,
          location: loc,
          type: type,
          experienceYears: exp,
          salary: salary,
          description: desc,
          requirements: requirements,
          applicationDeadline: appDeadline,
          duties: ["Fulfill standard organizational policies and execution requirements."],
          published: true,
          atsThreshold: atsThreshold,
          assessmentWeights: { ai: wAi, hr: wHr, jd: wJd },
          assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }
        };
        AppState.addJob(newJob);
        alert("New job opening listed successfully! Candidates can now apply.");
    }
    this.closeInspector();
    this.render('view-container');
  },
  
  toggleJobPublish: function(jobId, publishState) {
     AppState.updateJob(jobId, { published: publishState });
     this.render('view-container');
  },
  
  deleteJob: function(jobId) {
     if (confirm("Are you sure you want to delete this job posting? All related applications might be orphaned.")) {
         AppState.deleteJob(jobId);
         this.render('view-container');
     }
  },

  bulkSendAssessments: function(silent = false) {
    const candidates = AppState.getCandidates();
    const jobs = AppState.getJobs();
    let sentCount = 0;
    
    candidates.forEach(c => {
      if (c.status === 'Shortlisted') {
        const job = jobs.find(j => j.id === c.jobId);
        if (job && job.applicationDeadline && new Date() >= new Date(job.applicationDeadline)) {
          this.sendAssessmentInvitation(c.id);
          sentCount++;
        }
      }
    });
    
    if (sentCount > 0) {
      if (!silent) alert(`Sent ${sentCount} assessment invitations.`);
      this.render('view-container');
    } else {
      if (!silent) alert('No eligible candidates found for bulk assessment invitations (Check application deadlines).');
    }
  },

  bulkSendInterviews: function(silent = false) {
    const candidates = AppState.getCandidates();
    const jobs = AppState.getJobs();
    let sentCount = 0;
    
    candidates.forEach(c => {
      if (c.status === 'Assessment Passed') {
        const job = jobs.find(j => j.id === c.jobId);
        if (job && job.assessmentDeadline && new Date() >= new Date(job.assessmentDeadline)) {
          this.sendInterviewInvitation(c.id);
          sentCount++;
        }
      }
    });
    
    if (sentCount > 0) {
      if (!silent) alert(`Sent ${sentCount} interview invitations.`);
      this.render('view-container');
    } else {
      if (!silent) alert('No eligible candidates found for bulk interview invitations (Check assessment deadlines).');
    }
  }
};