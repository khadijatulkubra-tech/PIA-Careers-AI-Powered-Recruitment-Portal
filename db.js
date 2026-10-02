// db.js - Dual-sync database layer (PostgreSQL via Node.js API + localStorage)

const API_BASE_URL = 'http://localhost:5000/api';

const DB = {
  isOnline: async function() {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/count`);
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // Jobs
  getJobs: async function() {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`);
      if (res.ok) {
        return await res.json();
      }
    } catch(e) {
      console.warn("Error getting jobs from PostgreSQL API, falling back to local.", e);
    }
    const state = JSON.parse(localStorage.getItem('pia_recruitment_state')) || {};
    return state.jobs || [];
  },

  saveJob: async function(job) {
    try {
      await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });
    } catch (e) {
      console.warn("Error saving job to PostgreSQL API.", e);
    }
  },

  deleteJob: async function(jobId) {
    try {
      await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn("Error deleting job from PostgreSQL API.", e);
    }
  },

  // Candidates
  getCandidates: async function() {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates`);
      if (res.ok) {
        return await res.json();
      }
    } catch(e) {
      console.warn("Error getting candidates from PostgreSQL API, falling back to local.", e);
    }
    const state = JSON.parse(localStorage.getItem('pia_recruitment_state')) || {};
    return state.candidates || [];
  },

  saveCandidate: async function(cand) {
    try {
      await fetch(`${API_BASE_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cand)
      });
    } catch (e) {
      console.warn("Error saving candidate to PostgreSQL API.", e);
    }
  },

  // Settings
  getSettings: async function() {
    try {
      const res = await fetch(`${API_BASE_URL}/settings/global`);
      if (res.ok) {
        const data = await res.json();
        return data; // Might be null if empty
      }
    } catch (e) {
      console.warn("Error getting settings from PostgreSQL API.", e);
    }
    return null;
  },

  saveSettings: async function(settingsObj) {
    try {
      await fetch(`${API_BASE_URL}/settings/global`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsObj)
      });
    } catch (e) {
      console.warn("Error saving settings to PostgreSQL API.", e);
    }
  },

  // Initialize Database with default data if empty
  seedDatabase: async function(jobs, candidates, hrUsers) {
    const isOnline = await this.isOnline();
    if (!isOnline) {
      console.warn("API is offline, skipping seeding.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/count`);
      if (res.ok) {
        const { count } = await res.json();
        if (count === 0) {
          console.log("Seeding database via PostgreSQL API...");
          for (const job of jobs) {
            await this.saveJob(job);
          }
          for (const cand of candidates) {
            await this.saveCandidate(cand);
          }
          for (const user of hrUsers) {
            await fetch(`${API_BASE_URL}/hr_users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(user)
            });
          }
          console.log("Database seeded successfully.");
        }
      }
    } catch (e) {
      console.error("Error seeding DB", e);
    }
  },

  // HR Login - verifies credentials against PostgreSQL via /login endpoint
  hrLogin: async function(username, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/hr_users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        return data.success === true;
      }
    } catch (e) {
      console.error("Error logging in via API.", e);
    }
    return false;
  }
};

window.DB = DB;
