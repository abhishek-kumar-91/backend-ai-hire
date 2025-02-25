import axios from "axios";
import { ADZUNA_API_URL, APP_ID, APP_KEY } from "../config/adzunaConfig.js";

export const getJobs = async (req, res) => {
  try {
    const { search, location, type, postedWithin, country, page = 1 } = req.query;
    const resultsPerPage = 10; // You can change this as per requirement

    let apiUrl = `${ADZUNA_API_URL}`;

    // ✅ Add country if the user selects one, otherwise default to 'gb' (United Kingdom)
    if (country) {
      apiUrl += `/${encodeURIComponent(country.toLowerCase())}`;
    } else {
      apiUrl += "/gb";
    }

    // ✅ Append page number dynamically
    apiUrl += `/search/${page}?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=${resultsPerPage}`;

    if (search) apiUrl += `&what=${encodeURIComponent(search)}`;
    if (location) apiUrl += `&where=${encodeURIComponent(location)}`;
    if (type) apiUrl += `&full_time=${type.toLowerCase() === "fulltime" ? 1 : 0}`;
    if (postedWithin) apiUrl += `&max_days_old=${parseInt(postedWithin)}`;

    const { data } = await axios.get(apiUrl);

    if (!data.results.length) {
      return res.status(200).json({ message: "No jobs found matching your criteria.", jobs: [] });
    }

    const formattedJobs = data.results.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location?.display_name || "Location not specified",
      category: job.category?.label || "Not specified",
      company: job.company?.name || "Company not disclosed",
      salaryPredicted: job.salary_is_predicted === "1" ? "Predicted Salary Available" : "No Salary Data",
      jobLink: job.redirect_url,
      coordinates: job.latitude && job.longitude ? { latitude: job.latitude, longitude: job.longitude } : null,
    }));

    res.json({ jobs: formattedJobs, nextPage: parseInt(page) + 1 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: error.message });
  }
};
