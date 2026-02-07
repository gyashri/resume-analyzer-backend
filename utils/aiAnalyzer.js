const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * WHAT THIS IS:
 * AI Analyzer Utility - Uses Google Gemini AI to analyze resumes
 *
 * WHY WE NEED IT:
 * - AI provides intelligent analysis of resume quality
 * - Identifies missing keywords and skills
 * - Generates actionable improvement tips
 *
 * WHY GEMINI:
 * - More cost-effective than OpenAI (often free tier available)
 * - Excellent performance on text analysis tasks
 * - Native JSON output support
 * - Free tier: 15 requests per minute, 1500 per day
 *
 * HOW IT WORKS:
 * 1. Sends resume text + job description to Gemini API
 * 2. Uses structured prompt to get consistent JSON response
 * 3. Parses AI response into our data model
 */

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze resume against job description
 *
 * PARAMETERS:
 * - resumeText: Extracted text from resume
 * - jobDescription: Optional job posting to compare against
 *
 * RETURNS:
 * - matchScore: 0-100% compatibility
 * - missingKeywords: Skills/tools not found in resume
 * - foundKeywords: Skills/tools found in resume
 * - actionableTips: Specific improvement suggestions
 * - aiSummary: Overall assessment
 */
const analyzeResume = async (resumeText, jobDescription = '') => {
  try {
    // Get Gemini model
    // Try gemini-2.0-flash first, fall back to gemma-3-27b-it if quota exceeded
    let model;
    let useGemma = false;

    try {
      model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      });

      // Test with a quick call - if quota exceeded, switch to fallback
      const testResult = await model.generateContent('respond with: {"test":true}');
      testResult.response.text(); // Will throw if quota exceeded
    } catch (quotaError) {
      if (quotaError.message.includes('429') || quotaError.message.includes('quota')) {
        console.log('⚠️ Gemini quota exceeded, switching to gemma-3-27b-it fallback model');
        useGemma = true;
        model = genAI.getGenerativeModel({
          model: 'gemma-3-27b-it',
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        });
      } else {
        throw quotaError;
      }
    }

    // Construct prompt for AI
    const prompt = buildAnalysisPrompt(resumeText, jobDescription);

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // For Gemma models, extract JSON from response (may include markdown fences)
    if (useGemma) {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        text = jsonMatch[1].trim();
      }
    }

    // Parse AI response
    let aiResponse;
    try {
      aiResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text.substring(0, 500));
      throw new Error('AI returned invalid JSON response');
    }

    // Structure response to match our Resume model
    return {
      matchScore: aiResponse.matchScore || 0,
      missingKeywords: {
        hardSkills: aiResponse.missingKeywords?.hardSkills || [],
        softSkills: aiResponse.missingKeywords?.softSkills || [],
        certifications: aiResponse.missingKeywords?.certifications || [],
      },
      foundKeywords: {
        hardSkills: aiResponse.foundKeywords?.hardSkills || [],
        softSkills: aiResponse.foundKeywords?.softSkills || [],
        certifications: aiResponse.foundKeywords?.certifications || [],
      },
      actionableTips: (aiResponse.actionableTips || []).map((tip) => {
        const validCategories = ['formatting', 'content', 'keywords', 'impact', 'structure'];
        return {
          ...tip,
          category: validCategories.includes(tip.category) ? tip.category : 'content',
        };
      }),
      aiSummary: aiResponse.summary || '',
    };
  } catch (error) {
    console.error('Gemini API Error Details:');
    console.error('- Message:', error.message);
    console.error('- Stack:', error.stack);
    console.error('- Full Error:', error);

    // Provide specific error messages for common issues
    if (error.message.includes('API key') || error.message.includes('API_KEY_INVALID')) {
      throw new Error('Invalid or missing Gemini API key. Check your .env file.');
    }
    if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    }

    // Return the actual error message for debugging
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

/**
 * Build structured prompt for AI
 *
 * WHY STRUCTURED PROMPTS:
 * - Ensures consistent JSON output
 * - Clearly defines expected fields
 * - Improves AI response quality
 *
 * GEMINI-SPECIFIC NOTES:
 * - Gemini handles JSON output natively with responseMimeType
 * - Clear structure in prompt helps maintain consistency
 */
const buildAnalysisPrompt = (resumeText, jobDescription) => {
  let prompt = `You are an expert resume analyst and career coach. Analyze resumes and provide detailed, actionable feedback.

Analyze the following resume and provide a detailed assessment in JSON format. Current year is 2026 , avoid commenting on any dates

**RESUME TEXT:**
${resumeText}

`;

  if (jobDescription) {
    prompt += `**JOB DESCRIPTION:**
${jobDescription}

Compare the resume against this job description.
`;
  }

  prompt += `**REQUIRED JSON OUTPUT FORMAT:**
{
  "matchScore": <number 0-100>,
  "missingKeywords": {
    "hardSkills": [<array of technical skills/tools missing>],
    "softSkills": [<array of soft skills missing>],
    "certifications": [<array of certifications that would help>]
  },
  "foundKeywords": {
    "hardSkills": [<array of technical skills/tools found>],
    "softSkills": [<array of soft skills found>],
    "certifications": [<array of certifications found>]
  },
  "actionableTips": [
    {
      "category": "<formatting|content|keywords|impact|structure>",
      "suggestion": "<specific actionable tip>",
      "priority": "<high|medium|low>"
    }
  ],
  "summary": "<2-3 sentence overall assessment>"
}

**ANALYSIS CRITERIA:**
1. **Match Score**: If job description provided, score compatibility (0-100). Otherwise, score overall resume quality.
2. **Keywords**: Identify technical skills, soft skills, and certifications.
3. **Tips**: Focus on:
   - Formatting improvements (bullet points, consistency)
   - Content enhancements (quantify achievements, action verbs)
   - Keyword optimization (ATS compatibility)
   - Impact statements (results-oriented language)
   - Structure (clear sections, logical flow)
4. **Summary**: Provide constructive, encouraging feedback.

Return ONLY valid JSON matching the exact format above.`;

  return prompt;
};

module.exports = { analyzeResume };
