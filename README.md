# ✈️ PIA Careers – AI-Powered Recruitment Portal

An end-to-end, AI-assisted talent acquisition platform built during my **AI internship at Pakistan International Airlines (PIA)**. Candidates can browse jobs, apply with a resume, take a proctored online assessment and complete an AI interview, while HR gets a dashboard to manage jobs, screen applicants and rank candidates.

---

## 📌 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [How the Hiring Pipeline Works](#-how-the-hiring-pipeline-works)
- [Security Notes](#-security-notes)
- [Author](#-author)

---

## ✨ Features

### 👤 Candidate Side
- **Careers portal** – browse published job openings with department, location, salary and requirements.
- **Online application** – upload a resume (PDF or image); text is extracted in the browser using **PDF.js** and **Tesseract.js (OCR)**.
- **Automatic ATS screening** – resume is matched against the job requirements and given an ATS score; candidates below the job's threshold are screened out.
- **Proctored assessment** – timed MCQ test (AI/technical, HR and job-specific sections) with webcam-based proctoring and a configurable maximum number of violations.
- **AI interview room** – spoken interview using **Text-to-Speech** and **Speech-to-Text**, with face-detection proctoring during the session.
- **Email notifications** – assessment invitations sent through **EmailJS**.

### 🧑‍💼 HR Side
- **Secure HR login** and password change.
- **Pipeline view** – all candidates with ATS score, test score, interview score and a weighted **overall score**.
- **Job management** – create, edit, publish and delete jobs, including deadlines, ATS threshold, assessment weights and proctoring settings.
- **ATS & AI settings** – configure global selection weights (ATS / assessment / interview).

### 🛡️ Proctoring
- Face detection and multi-face detection with **TensorFlow.js** (BlazeFace, COCO-SSD) and **face-api.js**.
- Camera requirement and violation limits configurable per job.

### 💾 Dual-sync Storage
- Primary storage in **PostgreSQL** via the Node.js REST API.
- Automatic **fallback to `localStorage`** when the API is unreachable, so the front end keeps working offline.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Front end | HTML5, CSS3, Vanilla JavaScript |
| Back end | Node.js, Express 5, CORS, dotenv |
| Database | PostgreSQL (`pg`), JSONB columns |
| AI / CV | TensorFlow.js, BlazeFace, COCO-SSD, face-api.js |
| Document processing | PDF.js, Tesseract.js |
| Speech | Web Speech API (TTS + STT) |
| Email | EmailJS |
| Icons | Font Awesome |

---

## 📁 Project Structure

```
Khadija_PIA_Intern_SMIU/
├── index.html              # Single-page app entry point
├── style.css               # Global styles
├── app.js                  # App state, routing and navigation
├── db.js                   # Front-end data layer (API + localStorage fallback)
├── careers_portal.js       # Job listings and application flow
├── hr_dashboard.js         # HR dashboard (pipeline, jobs, settings)
├── assessment_center.js    # Proctored online assessment
├── ai_interview.js         # AI interview room (TTS/STT + face proctoring)
├── emailService.js         # EmailJS integration
├── mock_data.js            # Question banks and sample data
├── generate_questions.js   # Script to generate question banks
├── pia_*.jpg / *.png       # Logos and banners
└── server/
    ├── server.js           # Express REST API
    ├── db.js               # PostgreSQL connection pool
    ├── init_db.js          # Creates database tables
    ├── seed_data.js        # Seeds default jobs, HR users and settings
    ├── test_connection.js  # Checks the database connection
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- [PostgreSQL](https://www.postgresql.org/) installed and running
- A modern browser (Chrome recommended for speech recognition and webcam access)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Khadija_PIA_Intern_SMIU.git
cd Khadija_PIA_Intern_SMIU
```

### 2. Create the database
```sql
CREATE DATABASE pia_recruitment;
```

### 3. Configure environment variables
Create `server/.env` (see [Configuration](#-configuration)).

### 4. Install dependencies and set up tables
```bash
cd server
npm install
node test_connection.js   # optional: verify DB connection
node init_db.js           # create tables
```

### 5. Start the API server
```bash
npm start
```
The API runs on `http://localhost:5000`.

### 6. Seed default data (in a second terminal)
```bash
cd server
npm run seed
```

### 7. Run the front end
Serve the project root with any static server (needed for camera/microphone access):
```bash
# from the project root
npx serve .
# or
python -m http.server 8080
```
Then open the printed URL (e.g. `http://localhost:8080`) in your browser.

---

## ⚙️ Configuration

Create `server/.env`:

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pia_recruitment
PORT=5000
```

**EmailJS** – in `index.html` and `emailService.js`, replace the public key, service ID and template ID with your own from the [EmailJS dashboard](https://www.emailjs.com/).

**API URL** – the front end calls `http://localhost:5000/api` (set in `db.js`). Change `API_BASE_URL` if you deploy the server elsewhere.

---

## 🔌 API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server and database health check |
| GET | `/jobs` | List all jobs |
| GET | `/jobs/count` | Number of jobs |
| POST | `/jobs` | Create or update a job |
| DELETE | `/jobs/:id` | Delete a job |
| GET | `/candidates` | List all candidates |
| POST | `/candidates` | Create or update a candidate |
| DELETE | `/candidates/:id` | Delete a candidate |
| GET | `/hr_users/:username` | Get an HR user |
| POST | `/hr_users` | Create an HR user |
| POST | `/hr_users/login` | HR login |
| POST | `/hr_users/change-password` | Change HR password |
| GET | `/settings/global` | Get global settings |
| POST | `/settings/global` | Save global settings |

---

## 🔄 How the Hiring Pipeline Works

```
Apply + Resume  →  ATS Screening  →  Online Assessment  →  AI Interview  →  Weighted Ranking (HR)
```

1. The candidate applies and uploads a resume.
2. The ATS compares the resume with the job requirements and produces a match score.
3. Candidates above the threshold receive an assessment link by email.
4. The proctored assessment and AI interview produce test and interview scores.
5. HR sees an **overall score** = ATS × weight + Assessment × weight + Interview × weight, with weights set in the dashboard.

---

## 🔒 Security Notes

- **Never commit `server/.env`.** Add it to `.gitignore` and rotate any credentials that were previously pushed.
- Move EmailJS keys out of the source if the repository is public.
- Before production use, hash HR passwords, add token-based authentication to the API and restrict CORS.

---

## 👩‍💻 Author

**Khadija-tul-Kubra**
Student at Sindh Madressatul Islam University (SMIU) · AI Intern at Pakistan International Airlines (PIA)

---

## 📄 License

This project was developed during an internship at PIA and is shared for educational purposes.
