const axios = require('axios');

/**
 * WHAT THIS IS:
 * Job Service - Fetches and matches jobs from Adzuna API
 *
 * HOW IT WORKS:
 * 1. Extract skills from user's resume
 * 2. Search for jobs matching those skills
 * 3. Calculate compatibility score
 * 4. Return top matched jobs
 */

/**
 * Estimate salary range for Indian jobs based on job title keywords
 */
const estimateIndiaSalary = (title) => {
  const t = title.toLowerCase();

  if (t.includes('senior') || t.includes('lead') || t.includes('principal') || t.includes('architect') || t.includes('staff')) {
    return '₹15.0 - ₹30.0 LPA (Est.)';
  }
  if (t.includes('manager') || t.includes('director') || t.includes('head') || t.includes('vp')) {
    return '₹20.0 - ₹40.0 LPA (Est.)';
  }
  if (t.includes('junior') || t.includes('intern') || t.includes('trainee') || t.includes('fresher') || t.includes('entry')) {
    return '₹3.0 - ₹6.0 LPA (Est.)';
  }
  return '₹6.0 - ₹15.0 LPA (Est.)';
};

/**
 * Format salary based on location
 */
const formatSalary = (minSalary, maxSalary, location) => {
  if ((!minSalary && !maxSalary) || (minSalary === 0 && maxSalary === 0)) {
    return null;
  }

  const min = minSalary || maxSalary;
  const max = maxSalary || minSalary;

  if (location === 'in') {
    const minINR = Math.round(min);
    const maxINR = Math.round(max);

    if (minINR >= 100000) {
      const minLakhs = (minINR / 100000).toFixed(1);
      const maxLakhs = (maxINR / 100000).toFixed(1);
      return `₹${minLakhs} - ₹${maxLakhs} LPA`;
    }

    return `₹${minINR.toLocaleString('en-IN')} - ₹${maxINR.toLocaleString('en-IN')}`;
  }

  return `$${Math.round(min).toLocaleString('en-US')} - $${Math.round(max).toLocaleString('en-US')}`;
};

/**
 * Fetch jobs from Adzuna API
 */
const fetchJobsFromAPI = async ({ query, location = 'us', page = 1 }) => {
  try {
    console.log(`🌍 Fetching jobs for location: ${location}, query: ${query}`);
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_API_KEY;

    if (!appId || !appKey || appId === 'your-app-id-here') {
      console.warn('⚠️ Adzuna API credentials not configured. Using mock data.');
      return getMockJobs();
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${location}/search/${page}`;

    const response = await axios.get(url, {
      params: {
        app_id: appId,
        app_key: appKey,
        what: query,
        results_per_page: 10,
        sort_by: 'relevance',
        salary_include_unknown: 1,
      },
    });

    const jobs = response.data.results.map((job) => {
      const formattedSalary = formatSalary(job.salary_min, job.salary_max, location);

      return {
        id: job.id,
        title: job.title,
        company: job.company?.display_name || 'Company not listed',
        location: job.location?.display_name || location,
        description: job.description,
        url: job.redirect_url,
        salary: formattedSalary || (location === 'in' ? estimateIndiaSalary(job.title) : 'Not specified'),
        postedDate: job.created,
        category: job.category?.label || 'General',
        source: 'Adzuna',
      };
    });

    if (jobs.length === 0) {
      return getMockJobs();
    }

    return jobs;
  } catch (error) {
    console.error('Error fetching jobs from Adzuna:', error.message);
    return getMockJobs();
  }
};

/**
 * Match jobs with user's resume
 */
const matchJobsWithResume = async (resume, options = {}) => {
  try {
    const userSkills = extractSkills(resume);
    console.log('📊 Extracted skills:', userSkills);

    const searchQuery = buildSearchQuery(userSkills);
    console.log('🔍 Search query:', searchQuery);

    const jobs = await fetchJobsFromAPI({
      query: searchQuery,
      location: options.location || 'in',
      page: options.page || 1,
    });
    console.log('💼 Jobs fetched:', jobs.length);

    const matchedJobs = jobs.map((job) => {
      const matchScore = calculateMatchScore(job, userSkills);
      const matchedSkills = findMatchedSkills(job, userSkills);

      return {
        ...job,
        matchScore,
        matchedSkills,
        missingSkills: userSkills.hardSkills.filter(
          (skill) => !matchedSkills.includes(skill)
        ),
      };
    });

    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    return matchedJobs;
  } catch (error) {
    console.error('Error matching jobs:', error.message);
    throw error;
  }
};

/**
 * Extract skills from resume analysis
 */
const extractSkills = (resume) => {
  const analysis = resume.analysis || {};

  return {
    hardSkills: analysis.foundKeywords?.hardSkills || [],
    softSkills: analysis.foundKeywords?.softSkills || [],
    certifications: analysis.foundKeywords?.certifications || [],
    allSkills: [
      ...(analysis.foundKeywords?.hardSkills || []),
      ...(analysis.foundKeywords?.softSkills || []),
    ],
  };
};

/**
 * Build search query from user's top skills
 */
const buildSearchQuery = (skills) => {
  const topSkills = skills.hardSkills.slice(0, 3);

  if (topSkills.length === 0) {
    return 'software developer';
  }

  return topSkills.join(' ');
};

/**
 * Calculate match score between job and resume
 */
const calculateMatchScore = (job, userSkills) => {
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  let matchedCount = 0;
  let totalSkills = userSkills.allSkills.length;

  if (totalSkills === 0) return 50;

  userSkills.allSkills.forEach((skill) => {
    if (jobText.includes(skill.toLowerCase())) {
      matchedCount++;
    }
  });

  const score = Math.round((matchedCount / totalSkills) * 100);
  return Math.min(100, Math.max(0, score));
};

/**
 * Find which skills match the job
 */
const findMatchedSkills = (job, userSkills) => {
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const matched = [];

  userSkills.allSkills.forEach((skill) => {
    if (jobText.includes(skill.toLowerCase())) {
      matched.push(skill);
    }
  });

  return matched;
};

/**
 * Mock jobs for testing
 */
const getMockJobs = () => {
  return [
    {
      id: 'mock-1',
      title: 'Frontend Developer',
      company: 'Tech Corp India',
      location: 'Bangalore, India',
      description:
        'We are looking for a Frontend Developer with experience in React, JavaScript, HTML, CSS. Must have strong problem-solving skills.',
      url: 'https://example.com/jobs/1',
      salary: '₹8.0 - ₹12.0 LPA (Est.)',
      postedDate: new Date().toISOString(),
      category: 'IT Jobs',
      source: 'Mock',
    },
    {
      id: 'mock-2',
      title: 'Full Stack Developer',
      company: 'Startup India Pvt Ltd',
      location: 'Mumbai, India',
      description:
        'Full Stack Developer needed. Skills: Node.js, React, MongoDB, Express. Experience with REST APIs and cloud deployment.',
      url: 'https://example.com/jobs/2',
      salary: '₹10.0 - ₹15.0 LPA (Est.)',
      postedDate: new Date().toISOString(),
      category: 'IT Jobs',
      source: 'Mock',
    },
    {
      id: 'mock-3',
      title: 'Software Engineer',
      company: 'Tech Solutions India',
      location: 'Hyderabad, India',
      description:
        'Looking for Software Engineer with Java, Python, or C++ experience. Data structures and algorithms knowledge required.',
      url: 'https://example.com/jobs/3',
      salary: '₹12.0 - ₹18.0 LPA (Est.)',
      postedDate: new Date().toISOString(),
      category: 'IT Jobs',
      source: 'Mock',
    },
  ];
};

module.exports = {
  fetchJobsFromAPI,
  matchJobsWithResume,
};
