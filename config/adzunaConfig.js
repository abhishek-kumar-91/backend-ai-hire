import dotenv from "dotenv";
dotenv.config();

const ADZUNA_API_URL = "https://api.adzuna.com/v1/api/jobs";
const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const COUNTRY = ""; // Change to your preferred country

export { ADZUNA_API_URL, APP_ID, APP_KEY, COUNTRY };
