import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import emailValidator from 'email-validator';
puppeteer.use(StealthPlugin());

const EMAIL_PATTERNS = [
  'hr@{domain}',
  'careers@{domain}',
  'recruitment@{domain}',
  'jobs@{domain}',
  '{first}.{last}@{domain}',
  '{first}{last}@{domain}',
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;

// Get company domain from Google search
async function getCompanyDomain(companyName) {
  const query = `${companyName} official website`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  
  console.log(`Searching Google for domain: ${searchUrl}`);
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    const html = await page.content();
    console.log('Google HTML length:', html.length);
    await browser.close();

    const $ = cheerio.load(html);
    const firstLink = $('div.g a').first().attr('href');
    console.log('First link found:', firstLink);
    const url = firstLink?.match(/https?:\/\/(www\.)?([-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6})\b/)?.[2];
    const domain = url || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
    console.log(`Using domain: ${domain}`);
    return domain;
  } catch (error) {
    console.error('Error finding domain:', error.message);
    return `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
  }
}

// Crawl a single page and extract emails
async function crawlPage(url, emails, visited) {
  if (visited.has(url)) return;
  visited.add(url);

  console.log(`Crawling: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract emails
    const text = $('body').text();
    const foundEmails = text.match(EMAIL_REGEX) || [];
    console.log(`Emails found on ${url}:`, foundEmails);
    foundEmails.forEach(email => {
      if (emailValidator.validate(email) && 
          (email.toLowerCase().includes('hr') || 
           email.includes('career') || 
           email.includes('recruit') || 
           email.includes('job'))) {
        emails.add({ email, source: url, confidence: 0.9 });
      }
    });

    // Find links to crawl further
    const links = [];
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.includes('mailto')) {
        links.push(new URL(href, url).href);
      } else if (href && href.startsWith('http') && href.includes(new URL(url).hostname)) {
        links.push(href);
      }
    });
    return links;
  } catch (error) {
    console.error(`Error crawling ${url}:`, error.message);
    return [];
  }
}

// Crawl all pages on the company site
async function crawlCompanySite(domain) {
  const emails = new Set();
  const visited = new Set();
  const baseUrl = `https://${domain}`;
  let urlsToCrawl = [baseUrl];

  while (urlsToCrawl.length > 0 && visited.size < 50) { // Limit to 50 pages to avoid infinite loops
    const newUrls = [];
    for (const url of urlsToCrawl) {
      const links = await crawlPage(url, emails, visited);
      newUrls.push(...links.filter(link => !visited.has(link)));
    }
    urlsToCrawl = newUrls;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to avoid rate limiting
  }

  console.log('Total emails found on site:', Array.from(emails));
  return emails;
}

async function findHREmails({ name, companyName }) {
  let emails = new Set();
  let domain = '';

  // Step 1: Get domain if companyName provided
  if (companyName) {
    domain = await getCompanyDomain(companyName);
  }

  // Step 2: Generate email patterns if both name and domain are provided
  let first = '', last = '';
  if (name) {
    [first, last] = name.split(' ').map(part => part.toLowerCase());
  }
  if (domain && name) {
    for (const pattern of EMAIL_PATTERNS) {
      let email = pattern
        .replace('{domain}', domain)
        .replace('{first}', first)
        .replace('{last}', last);
      if (emailValidator.validate(email)) {
        emails.add({ email, source: 'Pattern inference', confidence: 0.5 });
        console.log(`Generated email: ${email}`);
      }
    }
  }

  // Step 3: Crawl company website if domain exists
  if (domain) {
    const siteEmails = await crawlCompanySite(domain);
    siteEmails.forEach(email => emails.add(email));
  }

  // Step 4: Search Google for name-only if no companyName
  if (name && !companyName) {
    const query = `${name} HR email contact`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    console.log(`Searching Google for name-only: ${searchUrl}`);
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      const html = await page.content();
      console.log('Name-only HTML length:', html.length);
      await browser.close();

      const $ = cheerio.load(html);
      const text = $('body').text();
      const foundEmails = text.match(EMAIL_REGEX) || [];
      console.log(`Emails from name-only search:`, foundEmails);
      foundEmails.forEach(email => {
        if (emailValidator.validate(email)) {
          emails.add({ email, source: 'Web search', confidence: 0.6 });
        }
      });
    } catch (error) {
      console.error('Error in name-only search:', error.message);
    }
  }

  const emailArray = Array.from(emails);
  console.log('Final emails collected:', emailArray);
  return emailArray;
}

export { findHREmails };