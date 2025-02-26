import { model } from "../config/geminiConfig.js";

const generateCoverLetter = async (req, res) => {
  try {
    const { jobDescription, userDetails } = req.body;

    // Default user details if not provided
    const defaultDetails = {
      name: "Alex Smith",
      email: "alex.smith@example.com",
      phone: "(555) 123-4567",
      experience: "3+ years in software development with expertise in JavaScript and Python",
    };

    const finalUserDetails = {
      ...defaultDetails,
      ...userDetails, // Override defaults with provided details
    };

    // ATS-friendly prompt for Gemini
    const prompt = `
      Generate an ATS-friendly cover letter based on the following:
      Job Description: "${jobDescription}"
      User Details: Name: ${finalUserDetails.name}, Email: ${finalUserDetails.email}, Phone: ${finalUserDetails.phone}, Experience: ${finalUserDetails.experience}.
      Keep it professional, concise (200-300 words), and include keywords from the job description. Avoid fancy formatting—just plain text with clear sections (greeting, intro, body, closing).
    `;

    const result = await model.generateContent(prompt);
    const coverLetter = result.response.text();

    res.status(200).json({
      success: true,
      coverLetter,
    });
  } catch (error) {
    console.error("Error generating cover letter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate cover letter",
      error: error.message,
    });
  }
};

export { generateCoverLetter };