import axios from "axios";

const talentAPIBaseURL = process.env.NEXT_PUBLIC_TALENT_API || "http://localhost:8000";
const interviewAPIBaseURL = process.env.NEXT_PUBLIC_INTERVIEW_API || "http://localhost:8001";

export const talentAPI = axios.create({
  baseURL: talentAPIBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// For FormData (e.g. file upload), let the browser set Content-Type with boundary
talentAPI.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export const interviewAPI = axios.create({
  baseURL: interviewAPIBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptors for error handling
talentAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("TalentMatchAI API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

interviewAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("InterviewAIx API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
