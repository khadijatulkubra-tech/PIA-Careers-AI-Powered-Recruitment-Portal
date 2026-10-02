const fs = require('fs');
const path = require('path');

function generateAI(count) {
  const topics = ['Machine Learning', 'Deep Learning', 'React State', 'Node.js', 'Docker', 'AWS Lambda', 'Git branching', 'RESTful APIs', 'SQL Joins', 'Microservices'];
  const actions = ['implementing', 'optimizing', 'debugging', 'deploying', 'testing', 'designing'];
  const contexts = ['a high-traffic web application', 'a legacy monolithic system', 'a real-time data pipeline', 'an edge-computing device', 'a serverless architecture'];
  
  const bank = [];
  for (let i = 0; i < count; i++) {
    const t = topics[Math.floor(Math.random() * topics.length)];
    const a = actions[Math.floor(Math.random() * actions.length)];
    const c = contexts[Math.floor(Math.random() * contexts.length)];
    
    bank.push({
      question: `[AI Technical] When ${a} ${t} in ${c}, which approach ensures maximum scalability and performance?`,
      options: [
        `Using caching layers and asynchronous processing where appropriate.`,
        `Relying solely on synchronous monolithic architecture.`,
        `Increasing the hardware specs without code optimization.`,
        `Ignoring network latency and deploying directly to main branch.`
      ],
      correct: 0,
      type: 'AI'
    });
    // Shuffle options for realism
    const correctAns = bank[i].options[0];
    bank[i].options = bank[i].options.sort(() => 0.5 - Math.random());
    bank[i].correct = bank[i].options.indexOf(correctAns);
  }
  return bank;
}

function generateHR(count) {
  const scenarios = ['a colleague disagrees with you', 'a project deadline is missed', 'a passenger is extremely dissatisfied', 'you notice a safety violation', 'a team member is underperforming'];
  const traits = ['empathy', 'leadership', 'accountability', 'conflict resolution', 'time management'];
  
  const bank = [];
  for (let i = 0; i < count; i++) {
    const s = scenarios[Math.floor(Math.random() * scenarios.length)];
    const t = traits[Math.floor(Math.random() * traits.length)];
    
    bank.push({
      question: `[HR & Psychology] If ${s}, how would you demonstrate ${t} while resolving the situation?`,
      options: [
        `Address the issue privately, listen actively, and collaborate on a constructive solution.`,
        `Report the issue to management immediately without attempting to resolve it first.`,
        `Ignore the situation to avoid conflict.`,
        `Publicly call out the issue to set an example.`
      ],
      correct: 0,
      type: 'HR'
    });
    const correctAns = bank[i].options[0];
    bank[i].options = bank[i].options.sort(() => 0.5 - Math.random());
    bank[i].correct = bank[i].options.indexOf(correctAns);
  }
  return bank;
}

function generateJD(count) {
  const roles = ['Flight Attendant', 'Senior Full-Stack Developer', 'Marketing Specialist', 'Cyber Security Analyst'];
  const duties = ['ensure passenger safety protocols', 'develop robust React architectures', 'design nationwide marketing campaigns', 'monitor SIEM events for threats'];
  
  const bank = [];
  for (let i = 0; i < count; i++) {
    const r = roles[Math.floor(Math.random() * roles.length)];
    const d = duties[Math.floor(Math.random() * duties.length)];
    
    bank.push({
      question: `[Job Specific] As a ${r}, one of your core responsibilities might be to ${d}. What is the most critical first step?`,
      options: [
        `Assess the current state, review standard operating procedures, and align with team goals.`,
        `Immediately execute the task without planning.`,
        `Delegate the responsibility to a junior team member.`,
        `Wait for direct micromanagement before acting.`
      ],
      correct: 0,
      type: 'JD'
    });
    const correctAns = bank[i].options[0];
    bank[i].options = bank[i].options.sort(() => 0.5 - Math.random());
    bank[i].correct = bank[i].options.indexOf(correctAns);
  }
  return bank;
}

const ai = generateAI(1000);
const hr = generateHR(1000);
const jd = generateJD(1000);

const filePath = path.join(__dirname, 'mock_data.js');
let mockData = fs.readFileSync(filePath, 'utf8');

const newContent = `\n\nconst AI_QUESTION_BANK = ${JSON.stringify(ai, null, 2)};\nconst HR_QUESTION_BANK = ${JSON.stringify(hr, null, 2)};\nconst JD_QUESTION_BANK = ${JSON.stringify(jd, null, 2)};\n`;

// Only append if not already there
if (!mockData.includes('const AI_QUESTION_BANK')) {
  fs.appendFileSync(filePath, newContent);
  console.log('Successfully generated 3000 questions and appended to mock_data.js');
} else {
  console.log('Questions already exist in mock_data.js');
}
