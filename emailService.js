// emailService.js
window.sendAssessmentEmail = async (candidate, customAssessmentLink) => {
  const assessmentLink = customAssessmentLink || `${window.location.href.split('?')[0]}?view=assessment&candId=${candidate.id}`;

  const templateParams = {
    to_name: candidate.name,
    to_email: candidate.email,
    job_title: candidate.jobTitle,
    assessment_link: assessmentLink,
    company_name: "Pakistan International Airlines",
  };

  try {
    const result = await emailjs.send(
      "service_1f8d7am",
      "template_e9b7q9n",
      templateParams,
      "h_lT3KDKgQm8yV1-U"
    );
    console.log("Assessment email sent:", result.text);
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
};