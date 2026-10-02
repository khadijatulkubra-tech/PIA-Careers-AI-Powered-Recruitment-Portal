// seed_data.js - Seeds default jobs, HR users and settings into PostgreSQL via the API

const API_BASE = 'http://localhost:5000/api';

async function post(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Connection': 'close'
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${json.error}`);
  return json;
}

async function get(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Connection': 'close'
    }
  });
  return res.json();
}

const DEFAULT_JOBS = [
  { id: "job-1", title: "Senior Full-Stack Developer", department: "Information Technology", location: "Karachi (Headquarters)", type: "Full-Time", experienceYears: 5, salary: "PKR 250,000 - 350,000", description: "We are seeking a skilled Senior Full-Stack Developer to design, build, and maintain our next-generation passenger booking and operations portal.", requirements: ["React", "Node.js", "Express", "MongoDB", "SQL", "Git", "REST APIs", "AWS", "Docker", "JavaScript", "TypeScript"], duties: ["Develop robust front-end architectures using React and state management libraries.", "Build scalable REST and GraphQL APIs using Node.js and Express.", "Collaborate with UX/UI designers to implement clean, glassmorphic interfaces.", "Mentor junior developer staff and conduct thorough code reviews."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-2", title: "Cabin Crew (Flight Attendant)", department: "Flight Operations", location: "Lahore", type: "Full-Time", experienceYears: 1, salary: "PKR 120,000 - 180,000", description: "Join our elite cabin crew team.", requirements: ["Customer Service", "First Aid", "Communication", "Conflict Resolution", "Safety Procedures", "Teamwork"], duties: ["Conduct pre-flight briefings.", "Welcome passengers.", "Provide premium catering services.", "Manage in-cabin emergencies."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-3", title: "Marketing Specialist", department: "Commercial & Marketing", location: "Karachi (Headquarters)", type: "Full-Time", experienceYears: 3, salary: "PKR 150,000 - 200,000", description: "We are looking for a creative Marketing Specialist.", requirements: ["SEO", "Copywriting", "Digital Marketing", "Social Media", "Google Analytics", "Content Strategy"], duties: ["Design and execute nationwide marketing campaigns.", "Analyze passenger booking data.", "Manage social media handles.", "Create high-conversion copy."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-4", title: "Cyber Security Analyst", department: "Information Security", location: "Karachi (Headquarters)", type: "Contract", experienceYears: 4, salary: "PKR 200,000 - 300,000", description: "Monitor, analyze, and secure our digital infrastructure.", requirements: ["Cybersecurity", "Penetration Testing", "Firewalls", "SIEM", "Incident Response"], duties: ["Monitor security events 24/7.", "Conduct network vulnerability scans.", "Ensure compliance with aviation security standards.", "Develop incident response playbooks."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-5", title: "First Officer (Co-Pilot)", department: "Flight Operations", location: "Islamabad", type: "Full-Time", experienceYears: 3, salary: "PKR 450,000 - 650,000", description: "PIA is seeking a highly qualified First Officer.", requirements: ["ATPL", "IR Rating", "Multi-Engine", "Crew Resource Management", "ATC Communication", "Boeing 777"], duties: ["Assist the Captain in all flight operations.", "Conduct pre-flight checks.", "Maintain strict compliance with PCAA and ICAO regulations.", "File flight plans."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-6", title: "HR Business Partner", department: "Human Resources", location: "Karachi (Headquarters)", type: "Full-Time", experienceYears: 5, salary: "PKR 180,000 - 260,000", description: "Strategic HR Business Partner role.", requirements: ["HR Strategy", "Talent Management", "Labour Law", "Performance Management", "HRIS"], duties: ["Partner with business leaders.", "Oversee full-cycle recruitment.", "Manage employee relations.", "Drive performance management cycles."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-7", title: "Ground Operations Supervisor", department: "Ground Services", location: "Lahore", type: "Full-Time", experienceYears: 3, salary: "PKR 130,000 - 190,000", description: "Supervise all ground handling activities.", requirements: ["Ramp Safety", "GSE Operations", "Airline Operations", "IATA Ground Ops", "Team Leadership"], duties: ["Supervise and coordinate all ramp operations.", "Ensure all ground equipment is serviceable.", "Liaise with cockpit crew and cabin crew.", "Manage a team of ground agents."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-8", title: "Revenue Management Analyst", department: "Commercial & Marketing", location: "Karachi (Headquarters)", type: "Full-Time", experienceYears: 2, salary: "PKR 160,000 - 220,000", description: "Drive profitability through dynamic pricing.", requirements: ["Revenue Management", "Data Analysis", "Excel", "GDS Systems", "Forecasting"], duties: ["Monitor booking curves.", "Implement revenue management strategies.", "Analyze competitor pricing.", "Provide weekly revenue performance reports."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-9", title: "Aircraft Maintenance Engineer (AME)", department: "Engineering & Maintenance", location: "Karachi (Headquarters)", type: "Full-Time", experienceYears: 6, salary: "PKR 300,000 - 420,000", description: "Ensure the airworthiness of PIA's fleet.", requirements: ["PCAA AME License", "B1/B2 Rating", "Boeing 777", "Airbus A320", "NDT"], duties: ["Perform maintenance checks.", "Investigate and rectify technical defects.", "Ensure all work is within PCAA regulations.", "Maintain accurate maintenance records."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" },
  { id: "job-10", title: "Data Scientist - AI & Analytics", department: "Information Technology", location: "Karachi (Headquarters)", type: "Full-Time", experienceYears: 3, salary: "PKR 280,000 - 380,000", description: "Build cutting-edge AI/ML models.", requirements: ["Python", "TensorFlow", "Scikit-learn", "SQL", "NLP", "MLOps", "Tableau"], duties: ["Design and deploy machine learning models.", "Build NLP pipelines.", "Collaborate with engineering teams.", "Create executive-level dashboards."], published: true, atsThreshold: 50, assessmentWeights: { ai: 40, hr: 30, jd: 30 }, assessmentConfig: { proctoring: true, cameraRequired: true, maxViolations: 3 }, applicationDeadline: "2026-08-25", assessmentDeadline: "2026-09-05" }
];

const DEFAULT_HR_USERS = [
  { username: 'hr.admin', email: 'admin@pia.com.pk', role: 'Super Admin', password: 'PIA@HR2026' },
  { username: 'recruiter', email: 'recruiter@pia.com.pk', role: 'Recruiter', password: 'Recruit@123' }
];

const DEFAULT_SETTINGS = {
  hrQuestions: [
    "Why do you want to join our organization specifically?",
    "Describe a time when you faced a difficult situation at work.",
    "Where do you see yourself professionally in the next three years?"
  ],
  mcqMixConfig: { bankCount: 5, aiCount: 5 },
  selectionWeights: { ats: 30, assessment: 30, interview: 40 },
  atsThreshold: 50
};

const INITIAL_CANDIDATES = [
  {
    id: "cand-1", name: "Zainab Ahmed", email: "zainab.ahmed@example.com", phone: "0300-1234567",
    jobId: "job-1", jobTitle: "Senior Full-Stack Developer",
    resumeSummary: "Experienced Web Developer with 6 years of expertise. Proficient in React, Node.js, Express, and SQL databases. Developed multiple enterprise booking platforms with Docker and AWS.",
    atsScore: 82, status: "Hired", appliedDate: "2026-07-10",
    assessmentScore: 88, interviewScore: 90,
    hrNotes: "Outstanding candidate. Highly skilled in React and Node.js. Fit for the senior role.",
    interviewTranscript: [
      { sender: "AI", text: "Welcome Zainab. Can you explain the caching strategies you used?" },
      { sender: "Candidate", text: "I implemented Redis caching for flight availability queries to reduce DB hits." },
      { sender: "AI", text: "Why do you want to join our organization specifically?" },
      { sender: "Candidate", text: "I want to work with the national carrier because it poses unique scaling challenges." }
    ],
    proctoringData: { tabSwitches: 0, mobileDetected: 0, headMovementViolations: 0, copyPasteAttempts: 0, isDisqualified: false, logs: [{ time: "10:00 AM", event: "Interview started securely." }] }
  },
  {
    id: "cand-2", name: "Ali Raza", email: "ali.raza@example.com", phone: "0321-7654321",
    jobId: "job-1", jobTitle: "Senior Full-Stack Developer",
    resumeSummary: "Aspiring developer with 2 years of experience. Knows basic JavaScript, HTML, CSS. Limited experience in scalable server-side systems.",
    atsScore: 45, status: "Rejected", appliedDate: "2026-07-12",
    assessmentScore: null, interviewScore: null, interviewTranscript: [],
    hrNotes: "Failed to meet initial ATS keyword and experience requirements.",
    proctoringData: null
  },
  {
    id: "cand-3", name: "Ayesha Malik", email: "ayesha.malik@example.com", phone: "0312-9876543",
    jobId: "job-2", jobTitle: "Cabin Crew (Flight Attendant)",
    resumeSummary: "Customer Service professional with 3 years in luxury hospitality. First aid certified, skilled in conflict resolution and safety operations.",
    atsScore: 78, status: "Interview Invited", appliedDate: "2026-07-13",
    assessmentScore: 90, interviewScore: null, interviewTranscript: [],
    hrNotes: "Awaiting interview attempt. Scored exceptionally well on the Customer Hospitality assessment.",
    proctoringData: null
  },
  {
    id: "cand-4", name: "Bilal Khan", email: "bilal.khan@example.com", phone: "0333-5556677",
    jobId: "job-3", jobTitle: "Marketing Specialist",
    resumeSummary: "Junior marketer specializing in social media content. Familiar with Canva, basic digital writing, and SEO.",
    atsScore: 55, status: "Assessment Invited", appliedDate: "2026-07-14",
    assessmentScore: null, interviewScore: null, interviewTranscript: [],
    hrNotes: "Candidate passed ATS threshold. Assessment link has been dispatched.",
    proctoringData: null
  }
];

async function seed() {
  console.log('Starting database seeding...');

  // Check current job count
  const { count } = await get('/jobs/count');
  console.log(`Current jobs in DB: ${count}`);

  if (count === 0) {
    console.log('Seeding jobs...');
    for (const job of DEFAULT_JOBS) {
      await post('/jobs', job);
      console.log(`  - Job saved: ${job.title}`);
    }
  } else {
    console.log(`Jobs already seeded (${count} found), skipping.`);
  }

  console.log('Seeding HR users...');
  for (const user of DEFAULT_HR_USERS) {
    await post('/hr_users', user);
    console.log(`  - HR User saved: ${user.username}`);
  }

  console.log('Seeding demo candidates...');
  for (const cand of INITIAL_CANDIDATES) {
    await post('/candidates', cand);
    console.log(`  - Candidate saved: ${cand.name} (${cand.status})`);
  }

  console.log('Seeding default settings...');
  await post('/settings/global', DEFAULT_SETTINGS);
  console.log('  - Settings saved.');

  console.log('\nDatabase seeding complete!');
}

seed().catch(err => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
