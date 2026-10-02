// Careers Portal Component - Job Listings and Application Form

const CareersPortal = {

  deptMeta: {
    "Information Technology":    { icon: "fa-laptop-code",   color: "#3b82f6", bg: "rgba(59,130,246,0.08)"  },
    "Flight Operations":         { icon: "fa-plane-departure", color: "#10b981", bg: "rgba(16,185,129,0.08)"  },
    "Commercial & Marketing":    { icon: "fa-chart-line",    color: "#f59e0b", bg: "rgba(245,158,11,0.08)"   },
    "Information Security":      { icon: "fa-shield-halved", color: "#ef4444", bg: "rgba(239,68,68,0.08)"    },
    "Human Resources":           { icon: "fa-people-group",  color: "#8b5cf6", bg: "rgba(139,92,246,0.08)"   },
    "Ground Services":           { icon: "fa-truck-ramp-box",color: "#06b6d4", bg: "rgba(6,182,212,0.08)"    },
    "Engineering & Maintenance": { icon: "fa-wrench",        color: "#f97316", bg: "rgba(249,115,22,0.08)"   },
    "Customer Affairs":          { icon: "fa-headset",       color: "#ec4899", bg: "rgba(236,72,153,0.08)"   },
    "Cargo Services":            { icon: "fa-box-open",      color: "#84cc16", bg: "rgba(132,204,22,0.08)"   },
  },

  render: function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const jobs = AppState.getJobs();
    const depts = [...new Set(jobs.map(j => j.department))];

    const html = `
      <!-- PIA Logo Watermarks scattered in background -->
      <div class="portal-watermark" aria-hidden="true">
        <img src="pia_logo_new.png" alt="" class="wm-logo wm-logo-1">
        <img src="pia_logo_new.png" alt="" class="wm-logo wm-logo-2">
        <img src="pia_logo_new.png" alt="" class="wm-logo wm-logo-3">
      </div>

      <!-- Hero Banner Section (PIA Banner Image with overlay) -->
      <div class="careers-hero-banner">
        <img src="pia banner 2.png" alt="PIA Careers" class="hero-banner-img">
        <div class="hero-banner-overlay"></div>
        <div class="hero-banner-content">
          <div class="hero-banner-top">
            <img src="pia_logo_new.png" alt="PIA Logo" class="hero-logo">
            <div class="hero-badge-pill"><i class="fa-solid fa-briefcase"></i>&nbsp; We're Hiring</div>
          </div>
          <h1 class="hero-banner-title">Build Your Career with<br><span class="hero-banner-accent">Pakistan International Airlines</span></h1>
          <p class="hero-banner-sub">Great People to Fly With — and to work with. Explore ${jobs.length}+ career opportunities across aviation, technology, operations & more.</p>
          <div class="hero-banner-stats">
            <div class="hbs-item"><span class="hbs-num">${jobs.length}</span><span class="hbs-lbl">Open Positions</span></div>
            <div class="hbs-div"></div>
            <div class="hbs-item"><span class="hbs-num">${depts.length}</span><span class="hbs-lbl">Departments</span></div>
            <div class="hbs-div"></div>
            <div class="hbs-item"><span class="hbs-num">3</span><span class="hbs-lbl">Cities</span></div>
            <div class="hbs-div"></div>
            <div class="hbs-item"><span class="hbs-num">60+</span><span class="hbs-lbl">Years of Legacy</span></div>
          </div>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="portal-filter-section">
        <div class="portal-search-wrap">
          <i class="fa-solid fa-magnifying-glass portal-search-icon"></i>
          <input type="text" id="job-search" class="portal-search-input" placeholder="Search by job title, skill, or keyword..." oninput="CareersPortal.filterJobs()">
        </div>
        <div class="portal-filters">
          <select id="dept-filter" class="portal-select" onchange="CareersPortal.filterJobs()">
            <option value="">All Departments</option>
            ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
          <select id="loc-filter" class="portal-select" onchange="CareersPortal.filterJobs()">
            <option value="">All Locations</option>
            <option value="Karachi (Headquarters)">Karachi</option>
            <option value="Lahore">Lahore</option>
            <option value="Islamabad">Islamabad</option>
          </select>
          <select id="type-filter" class="portal-select" onchange="CareersPortal.filterJobs()">
            <option value="">All Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
      </div>

      <!-- Results Label -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; position:relative; z-index:1;">
        <p id="results-label" style="color:var(--text-muted); font-size:0.9rem;">Showing <strong style="color:var(--text-main)">${jobs.length}</strong> open positions</p>
      </div>

      <!-- Job Grid -->
      <div class="portal-job-grid" id="jobs-container">
        ${this.generateJobCardsHTML(jobs)}
      </div>

      <!-- Application Modal Wrapper -->
      <div id="apply-modal-wrapper"></div>
    `;

    container.innerHTML = html;
    container.style.position = 'relative';
  },

  generateJobCardsHTML: function(jobs) {
    if (jobs.length === 0) {
      return `
        <div style="grid-column: 1 / -1; text-align: center; padding: 5rem 2rem;">
          <i class="fa-solid fa-search" style="font-size:3rem; color:var(--border-color); margin-bottom:1rem;"></i>
          <p style="color:var(--text-muted); font-size:1.1rem; font-weight:600;">No positions found matching your criteria.</p>
          <p style="color:var(--text-muted); font-size:0.85rem; margin-top:0.5rem;">Try adjusting your filters or search terms.</p>
        </div>`;
    }

    return jobs.map(job => {
      const meta = this.deptMeta[job.department] || { icon: 'fa-building', color: '#64748b', bg: 'rgba(100,116,139,0.08)' };
      const topSkills = (job.requirements || []).slice(0, 3);
      
      let isClosed = false;
      if (job.applicationDeadline) {
        const dl = new Date(job.applicationDeadline);
        dl.setHours(23, 59, 59, 999);
        if (new Date() > dl) {
          isClosed = true;
        }
      }

      return `
        <div class="portal-job-card ${isClosed ? 'job-closed' : ''}" ${!isClosed ? `onclick="CareersPortal.openApplyModal('${job.id}')"` : 'style="opacity: 0.7; cursor: default;"'}>
          <div class="pjc-header">
            <div class="pjc-icon-wrap" style="background:${isClosed ? '#e2e8f0' : meta.bg}; color:${isClosed ? '#64748b' : meta.color};">
              <i class="fa-solid ${meta.icon}"></i>
            </div>
            <span class="pjc-type-badge ${isClosed ? 'pjc-badge-contract' : (job.type === 'Contract' ? 'pjc-badge-contract' : 'pjc-badge-fulltime')}" ${isClosed ? 'style="background: #ef4444; color: white;"' : ''}>
              ${isClosed ? 'Closed' : job.type}
            </span>
          </div>
          <h3 class="pjc-title">${job.title}</h3>
          <p class="pjc-dept" style="color:${isClosed ? '#64748b' : meta.color}"><i class="fa-solid fa-layer-group" style="font-size:0.7rem;"></i> ${job.department}</p>
          <p class="pjc-desc">${job.description}</p>
          <div class="pjc-skills">
            ${topSkills.map(s => `<span class="pjc-skill">${s}</span>`).join('')}
            ${job.requirements.length > 3 ? `<span class="pjc-skill pjc-skill-more">+${job.requirements.length - 3}</span>` : ''}
          </div>
          <div class="pjc-footer">
            <div class="pjc-meta-row">
              <span class="pjc-meta"><i class="fa-solid fa-location-dot"></i> ${job.location}</span>
              <span class="pjc-meta"><i class="fa-solid fa-clock"></i> ${job.experienceYears}+ yrs</span>
            </div>
            ${job.applicationDeadline ? `<div class="pjc-meta-row" style="margin-top: 0.25rem;"><span class="pjc-meta ${isClosed ? 'text-red-500' : ''}" ${isClosed ? 'style="color:#ef4444;"' : ''}><i class="fa-solid fa-calendar-days"></i> Last Date: ${job.applicationDeadline.split('T')[0]}</span></div>` : ''}
            <div class="pjc-salary">${job.salary}</div>
            ${!isClosed ? `
            <button class="pjc-apply-btn" onclick="event.stopPropagation(); CareersPortal.openApplyModal('${job.id}')">
              Apply Now <i class="fa-solid fa-arrow-right"></i>
            </button>
            ` : `
            <button class="pjc-apply-btn" style="background: #e2e8f0; color: #64748b; cursor: not-allowed;" onclick="event.stopPropagation();">
              Closed
            </button>
            `}
          </div>
        </div>`;
    }).join('');
  },


  filterJobs: function() {
    const searchVal = document.getElementById('job-search')?.value.toLowerCase() || '';
    const deptVal = document.getElementById('dept-filter')?.value || '';
    const locVal = document.getElementById('loc-filter')?.value || '';
    const typeVal = document.getElementById('type-filter')?.value || '';

    const allJobs = AppState.getJobs().filter(j => j.published !== false);
    const filtered = allJobs.filter(job => {
      const matchSearch = job.title.toLowerCase().includes(searchVal) || 
                          job.description.toLowerCase().includes(searchVal) ||
                          (job.requirements || []).some(r => r.toLowerCase().includes(searchVal));
      const matchDept = deptVal === "" || job.department === deptVal;
      const matchLoc  = locVal  === "" || job.location === locVal;
      const matchType = typeVal === "" || job.type === typeVal;
      return matchSearch && matchDept && matchLoc && matchType;
    });

    document.getElementById('jobs-container').innerHTML = this.generateJobCardsHTML(filtered);
    const label = document.getElementById('results-label');
    if (label) label.innerHTML = `Showing <strong style="color:var(--text-main)">${filtered.length}</strong> open positions`;
  },

  openApplyModal: function(jobId) {
    const job = AppState.getJobById(jobId);
    if (!job) return;

    const wrapper = document.getElementById('apply-modal-wrapper');
    wrapper.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h2 style="color: var(--text-main); font-size: 1.4rem;">Application for ${job.title}</h2>
              <p style="color: var(--text-muted); font-size: 0.85rem;">${job.department} | ${job.location}</p>
            </div>
            <button class="close-btn" onclick="CareersPortal.closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="apply-form" onsubmit="CareersPortal.submitApplication(event, '${job.id}')">
              
              <div class="form-group">
                <label for="cand-name">Full Name *</label>
                <input type="text" id="cand-name" class="form-control" placeholder="Enter your full name" required>
              </div>

              <div class="form-group">
                <label for="cand-email">Email Address *</label>
                <input type="text" id="cand-email" class="form-control" placeholder="name@example.com" required onblur="CareersPortal.validateEmail(this)">
                <span id="cand-email-error" style="color: var(--accent-red); font-size: 0.8rem; display: none; margin-top: 0.25rem;">Please enter a valid email address.</span>
              </div>

              <div class="form-group">
                <label for="cand-phone">Contact Number *</label>
                <input type="tel" id="cand-phone" class="form-control" placeholder="e.g., 0300-1234567" required>
              </div>

              <div class="form-group">
                <label for="cand-picture">Candidate Picture *</label>
                <input type="file" id="cand-picture" class="form-control" accept="image/*" required onchange="CareersPortal.handlePictureUpload(this)">
                <img id="cand-picture-preview" style="display: none; width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-top: 0.5rem; border: 1px solid var(--border-color);">
                <input type="hidden" id="cand-picture-base64">
              </div>

              <div class="form-group">
                <label for="cand-experience">Years of Relevant Experience *</label>
                <input type="number" id="cand-experience" class="form-control" min="0" max="30" value="0" oninput="CareersPortal.calculateLiveATS('${job.id}')">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <label style="margin-bottom: 0;">Resume / CV Upload *</label>
                </div>

                <!-- File Upload Drop Zone -->
                <div id="resume-upload-zone" style="border: 2px dashed var(--border-hover); border-radius: 8px; padding: 1.25rem; text-align: center; cursor: pointer; transition: var(--transition-fast); background: #f8fafc; margin-bottom: 0.75rem;"
                  onclick="document.getElementById('resume-file-input').click()"
                  ondragover="event.preventDefault(); this.style.borderColor='var(--accent-green)'; this.style.background='#e6f4ea';"
                  ondragleave="this.style.borderColor='var(--border-hover)'; this.style.background='#f8fafc';"
                  ondrop="event.preventDefault(); this.style.borderColor='var(--border-hover)'; this.style.background='#f8fafc'; CareersPortal.handleResumeUpload(event.dataTransfer.files[0], '${job.id}');">
                  <div style="font-size:1rem; font-weight:bold; color:var(--accent-green); margin-bottom:0.5rem;">Upload Document</div>
                  <p style="color:var(--text-main); font-size:0.9rem; font-weight:600;">Click to upload or drag & drop your resume</p>
                  <p style="color:var(--text-muted); font-size:0.75rem; margin-top:0.25rem;">Supports PDF, TXT, and Images (PNG/JPG). Text will be auto-extracted.</p>
                  <input type="file" id="resume-file-input" accept=".pdf,.txt,.png,.jpg,.jpeg" style="display:none;" onchange="CareersPortal.handleResumeUpload(this.files[0], '${job.id}')">
                </div>

                <!-- File Upload Status -->
                <div id="resume-upload-status" style="display:none; padding:0.5rem 0.75rem; border-radius:6px; font-size:0.8rem; margin-bottom:0.75rem;"></div>

                <!-- Manual text input fallback -->
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                  <div style="flex:1; height:1px; background:var(--border-color);"></div>
                  <span style="font-size:0.75rem; color:var(--text-muted);">or type/paste manually</span>
                  <div style="flex:1; height:1px; background:var(--border-color);"></div>
                </div>
                <textarea id="cand-resume" class="form-control" rows="4" 
                  placeholder="Paste key skills and experience here (e.g. React, Node.js, 5 years backend development...)"></textarea>
              </div>

              <!-- HR keyword requirements section completely removed from candidate view -->

              <div class="modal-footer" style="padding: 1.5rem 0 0 0;">
                <button type="button" class="btn btn-secondary" onclick="CareersPortal.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Submit Application</button>
              </div>

            </form>
          </div>
        </div>
      </div>
    `;
    
    // Initial live calculation
    this.calculateLiveATS(jobId);
  },

  closeModal: function() {
    const wrapper = document.getElementById('apply-modal-wrapper');
    if (wrapper) wrapper.innerHTML = '';
  },

  validateEmail: function(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errorSpan = document.getElementById('cand-email-error');
    if (input.value && !emailRegex.test(input.value)) {
      errorSpan.style.display = 'block';
      input.style.borderColor = 'var(--accent-red)';
    } else {
      errorSpan.style.display = 'none';
      input.style.borderColor = '';
    }
  },

  handlePictureUpload: function(input) {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function(e) {
        const img = document.getElementById('cand-picture-preview');
        img.src = e.target.result;
        img.style.display = 'block';
        img.style.border = '1px solid var(--border-color)';
        
        const submitBtn = document.querySelector('#apply-modal-wrapper button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Verifying Face...';
        }

        try {
          if (typeof blazeface !== 'undefined') {
            const model = await blazeface.load();
            const imageObj = new Image();
            imageObj.src = e.target.result;
            
            imageObj.onload = async function() {
              const predictions = await model.estimateFaces(imageObj, false);
              
              if (predictions.length === 1) {
                document.getElementById('cand-picture-base64').value = e.target.result;
                img.style.border = '2px solid var(--accent-green)';
              } else {
                alert(predictions.length === 0 ? "No face detected! Please upload a clear picture of your face for verification." : "Multiple faces detected! Please upload a picture with only your face.");
                input.value = "";
                img.style.display = 'none';
                document.getElementById('cand-picture-base64').value = "";
              }
              
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Application';
              }
            };
          } else {
            // Fallback if model not available
            document.getElementById('cand-picture-base64').value = e.target.result;
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Submit Application';
            }
          }
        } catch (err) {
          console.warn("Face verification skipped/failed:", err);
          document.getElementById('cand-picture-base64').value = e.target.result;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
          }
        }
      };
      reader.readAsDataURL(file);
    }
  },

  handleResumeUpload: async function(file, jobId) {
    if (!file) return;

    const statusEl = document.getElementById('resume-upload-status');
    const uploadZone = document.getElementById('resume-upload-zone');
    const textarea = document.getElementById('cand-resume');

    if (!statusEl || !textarea) return;

    // Show loading
    statusEl.style.display = 'block';
    statusEl.style.background = 'rgba(6,182,212,0.1)';
    statusEl.style.border = '1px solid rgba(6,182,212,0.3)';
    statusEl.style.color = '#22d3ee';
    statusEl.textContent = `Parsing ${file.name}... Please wait.`;

    if (uploadZone) {
      uploadZone.style.borderColor = 'var(--accent-cyan)';
    }

    try {
      let extractedText = '';

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Use pdf.js to extract text from PDF
        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        // Configure pdf.js worker
        if (typeof pdfjsLib !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          const pageTexts = [];
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            const pageText = content.items.map(i => i.str).join(' ');
            pageTexts.push(pageText);
          }
          extractedText = pageTexts.join(' ');
        } else {
          extractedText = 'PDF library loading error. Please type your resume manually below.';
        }
      } else if (file.type.startsWith('image/')) {
        // Use Tesseract.js for image OCR
        if (typeof Tesseract !== 'undefined') {
          statusEl.textContent = `Running OCR on image... This might take a few seconds.`;
          const result = await Tesseract.recognize(file, 'eng');
          extractedText = result.data.text;
        } else {
          extractedText = 'OCR library not loaded. Please type your resume manually below.';
        }
      } else {
        // Plain text file
        extractedText = await file.text();
      }

      if (extractedText && extractedText.length > 20) {
        textarea.value = extractedText;
        statusEl.style.background = 'rgba(16,185,129,0.1)';
        statusEl.style.border = '1px solid rgba(16,185,129,0.4)';
        statusEl.style.color = '#34d399';
        statusEl.textContent = `Resume extracted: "${file.name}" (${Math.round(file.size/1024)} KB)`;
        if (uploadZone) uploadZone.style.borderColor = 'var(--accent-green)';
      } else {
        statusEl.style.background = 'rgba(245,158,11,0.1)';
        statusEl.style.border = '1px solid rgba(245,158,11,0.4)';
        statusEl.style.color = '#fbbf24';
        statusEl.textContent = 'Could not auto-extract enough text. Please type your details manually below.';
        if (uploadZone) uploadZone.style.borderColor = 'var(--accent-gold)';
      }
    } catch (err) {
      statusEl.style.background = 'rgba(239,68,68,0.1)';
      statusEl.style.border = '1px solid rgba(239,68,68,0.4)';
      statusEl.style.color = '#f87171';
      statusEl.textContent = `Error reading file: ${err.message}. Please paste your resume text manually.`;
      if (uploadZone) uploadZone.style.borderColor = 'var(--accent-red)';
    }

    // Re-calculate ATS after text is populated
    this.calculateLiveATS(jobId);
  },

  calculateLiveATS: function(jobId) {
    const job = AppState.getJobById(jobId);
    if (!job) return { score: 0, matched: [] };

    const resumeText = (document.getElementById('cand-resume')?.value || "").toLowerCase();
    const expText = document.getElementById('cand-experience')?.value || "0";
    const candidateExp = parseInt(expText, 10) || 0;

    let matchedKeywords = [];
    
    // Check keyword matches silently
    job.requirements.forEach(req => {
      // Simple regex or substring check
      const keywordRegex = new RegExp(`\\b${req.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (keywordRegex.test(resumeText) || resumeText.includes(req.toLowerCase())) {
        matchedKeywords.push(req);
      }
    });

    // Score calculations
    // Base rating: experience match (max 30 points)
    // Keyword match: max 70 points
    let experienceScore = 0;
    if (candidateExp >= job.experienceYears) {
      experienceScore = 30;
    } else {
      experienceScore = (candidateExp / job.experienceYears) * 30;
    }

    const keywordRatio = job.requirements.length > 0 ? (matchedKeywords.length / job.requirements.length) : 1;
    const keywordScore = keywordRatio * 70;

    const totalATS = Math.min(100, Math.round(experienceScore + keywordScore));

    return {
      score: totalATS,
      matched: matchedKeywords
    };
  },

  submitApplication: function(event, jobId) {
    event.preventDefault();
    
    const name = document.getElementById('cand-name').value.trim();
    const emailInput = document.getElementById('cand-email');
    const email = emailInput.value.trim();
    const phone = document.getElementById('cand-phone').value.trim();
    const resumeText = document.getElementById('cand-resume').value.trim();
    const pictureBase64 = document.getElementById('cand-picture-base64').value;
    
    // Validate email before submitting
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.validateEmail(emailInput);
      return;
    }

    if (!pictureBase64) {
      alert("Please upload a picture for verification.");
      return;
    }
    
    const atsResult = this.calculateLiveATS(jobId);
    const job = AppState.getJobById(jobId);

    // Get current HR threshold
    const threshold = AppState.getAtsThreshold();

    // Create Candidate object
    const newCandidate = {
      id: `cand-${Date.now()}`,
      name: name,
      email: email,
      phone: phone,
      jobId: jobId,
      jobTitle: job.title,
      resumeSummary: resumeText,
      atsScore: atsResult.score,
      status: "Applied",
      appliedDate: new Date().toISOString().split('T')[0],
      assessmentScore: null,
      interviewTranscript: [],
      interviewScore: null,
      hrNotes: `Candidate applied. ATS match score calculated as ${atsResult.score}%.`,
      pictureBase64: pictureBase64
    };

    // Save to global state
    AppState.addCandidate(newCandidate);
    
    // Close apply modal
    this.closeModal();

    // Process candidacy (checks threshold, sends notification if pass)
    CareersPortal.evaluateCandidateFunnel(newCandidate.id);
  },

  evaluateCandidateFunnel: function(candId) {
    const cand = AppState.getCandidateById(candId);
    const threshold = AppState.getAtsThreshold();

    if (!cand) return;

    // Build the assessment link URL using the current page location
    const baseUrl = window.location.href.split('?')[0];
    const assessmentLink = `${baseUrl}?view=assessment&candId=${cand.id}`;
    const interviewLink = `${baseUrl}?view=interview&candId=${cand.id}`;

    if (cand.atsScore >= threshold) {
      // Passes ATS - Upgrade to Shortlisted
      AppState.updateCandidateStatus(candId, "Shortlisted");
      AppState.addCandidateNote(candId, `Candidate meets ATS threshold. Waiting for deadline to send assessment.`);
      
      // Show confirmation dialog
      alert(`Application Submitted Successfully!\n\nYour application meets our initial criteria. You will be contacted regarding the next steps after the application deadline.`);
    } else {
      // Fails ATS - Auto Reject
      AppState.updateCandidateStatus(candId, "Rejected");
      AppState.addCandidateNote(candId, `Automatically rejected. Failed to meet the ATS Threshold score of ${threshold}%.`);
      
      // Push Rejected Email
      AppState.sendMockEmail({
        candidateId: cand.id,
        to: cand.email,
        subject: `Update on your application: ${cand.jobTitle}`,
        body: `Dear ${cand.name},

Thank you for your interest in careers at PIA. 

We have reviewed your application for the ${cand.jobTitle} position. Unfortunately, we will not be moving forward with your application at this time as it did not match our current role keywords or years of experience.

We wish you best of luck in your job search.

Regards,
PIA Talent Acquisition Team`,
        type: "rejection"
      });

      alert(`Application Submitted Successfully!\n\nYour application has been received and archived.`);
    }

    // Refresh view/Header counters
    App.refreshCurrentView();
  }
};
