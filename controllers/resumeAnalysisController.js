import { model } from '../config/geminiConfig.js';
import PDFParser from 'pdf2json';
import Resume from '../Schema/resumeSchema.js';

const analyzeResume = async (req, res) => {
  try {
       // Check if file exists for upload.single('resume')
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded. Ensure the file is sent with key "resume".',
      });
    }

    const { jobProfile, experienceLevel } = req.body;
    const resumeFile = req.file; // Use req.file instead of req.files.resume

    // Validate file type
    if (resumeFile.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are supported',
      });
    }

    if (!resumeFile.buffer || !Buffer.isBuffer(resumeFile.buffer)) {
      throw new Error('Resume file data is not a valid Buffer');
    }

    console.log('PDF file received:', {
      filename: resumeFile.originalname,
      size: resumeFile.size,
      mimetype: resumeFile.mimetype,
    });

    // Extract text from PDF
    const pdfParser = new PDFParser();
    const pdfData = await new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        
        resolve(pdfData);
      });
      pdfParser.on('pdfParser_dataError', (errData) => {
        
        reject(new Error(`Failed to parse PDF: ${errData.parserError}`));
      });
      pdfParser.parseBuffer(resumeFile.buffer);
    });

    // Extract text from pdfData
    let resumeText = '';
    if (pdfData && pdfData.Pages) {
      pdfData.Pages.forEach((page) => {
        if (page.Texts) {
          page.Texts.forEach((text) => {
            resumeText += decodeURIComponent(text.R[0].T) + ' ';
          });
        }
      });
    }

    if (!resumeText.trim()) {
      throw new Error('No text extracted from the PDF. The PDF may be empty or not contain readable text.');
    }

   

    // Analyze with Gemini
    const prompt = `
      Act as an expert ATS (Applicant Tracking System) analyzer with deep knowledge of resume optimization.
      Analyze the following resume text against the job profile "${jobProfile}" and experience level "${experienceLevel}".
      Provide:
      1. A resume score (0-100) based on ATS compatibility, keyword relevance, and structure.
      2. A list of missing keywords or skills critical for the job profile and experience level.
      3. Detailed suggestions for improvement to increase the ATS score, including specific changes to content, structure, or formatting.
      Ensure the analysis is precise and tailored to a competitive job market.
      
      Resume Text: "${resumeText}"
      
      Expected Response Structure:
      {
        "score": <number>,
        "missingKeywords": [<string>, <string>, ...],
        "suggestions": [<string>, <string>, ...]
      }
    `;

   

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    

    let analysis;
    try {
      // Attempt to parse the response directly
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      // If direct parsing fails, clean the text and try again
      
      const cleanedText = analysisText
        .replace(/```json|```/g, '') // Remove markdown code blocks
        .replace(/[\n\r\s]+/g, ' ') // Normalize whitespace
        .trim();
      try {
        analysis = JSON.parse(cleanedText);
      } catch (cleanParseError) {
        throw new Error(`Failed to parse Gemini response: ${cleanParseError.message}. Response: ${cleanedText}`);
      }
    }

    // Validate analysis structure
    if (!analysis.score || !Array.isArray(analysis.missingKeywords) || !Array.isArray(analysis.suggestions)) {
      throw new Error('Invalid Gemini response format. Expected structure: { score: number, missingKeywords: string[], suggestions: string[] }');
    }

    

    // Store PDF and analysis in MongoDB
    const resumeDoc = new Resume({
      filename: resumeFile.originalname,
      pdfData: resumeFile.buffer,
      jobProfile,
      experienceLevel,
      analysis: {
        score: analysis.score,
        missingKeywords: analysis.missingKeywords,
        suggestions: analysis.suggestions,
      },
    });

    await resumeDoc.save();
    

    // Send response
    res.status(200).json({
      success: true,
      analysis: {
        score: analysis.score,
        missingKeywords: analysis.missingKeywords,
        suggestions: analysis.suggestions,
      },
      resumeId: resumeDoc._id,
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error.message,
    });
  }
};

export { analyzeResume };