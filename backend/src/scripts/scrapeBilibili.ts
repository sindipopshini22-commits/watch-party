import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function autoScroll(page: any) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // Stop if we hit the bottom, or just safely timeout to prevent infinite scroll
        if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 15000) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}

async function scrapeBilibili() {
  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set a standard viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to Bilibili TV Movies channel
  console.log('Navigating to Bilibili TV Movies...');
  await page.goto('https://www.bilibili.tv/en/channel/movies', { waitUntil: 'networkidle2' });

  // Scroll to trigger lazy loading
  console.log('Scrolling to load lazy elements...');
  await autoScroll(page);
  
  // Wait a moment for the actual image src tokens to load after scroll
  await new Promise(r => setTimeout(r, 1000));

  console.log('Extracting video items...');
  const movies = await page.evaluate(() => {
    // Attempting to select general Bilibili TV grid cards
    const cards = document.querySelectorAll('.bstar-video-card, li.v-card, .video-card');
    const results: any[] = [];
    
    cards.forEach(card => {
      // 1. Title Extraction
      const titleEl = card.querySelector('.bstar-video-card__title-text, .title, .t, .bstar-video-card__title');
      const title = titleEl ? titleEl.textContent?.trim() : null;
      
      // 2. Poster Extraction (Checking data-src for lazy loaded images)
      const imgEl = card.querySelector('img');
      const posterUrl = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src')) : null;
      
      // 3. Source ID Extraction
      const linkEl = card.querySelector('a');
      const href = linkEl ? linkEl.getAttribute('href') : null;
      let sourceId = null;
      if (href) {
        // e.g. /en/video/2045610034 -> extract the ID
        const match = href.match(/\/video\/(\d+)/);
        if (match) sourceId = match[1];
      }

      if (title && posterUrl) {
        results.push({ title, posterUrl, sourceId });
      }
    });

    return results;
  });

  console.log(`Found ${movies.length} movies on the page.`);
  await browser.close();

  console.log('Saving to database...');
  let savedCount = 0;

  for (const movie of movies) {
    // 5. Upsert Guard: Check if movie already exists by title
    const existing = await prisma.movie.findFirst({
      where: { title: movie.title }
    });

    if (!existing) {
      // Clean up protocol relative URLs if any (e.g., //s.bstar.com/...)
      const cleanedPoster = movie.posterUrl.startsWith('//') 
        ? `https:${movie.posterUrl}` 
        : movie.posterUrl;

      await prisma.movie.create({
        data: {
          title: movie.title,
          // Store extracted bilibili ID in the overview for reference
          overview: `Extracted Bilibili Video ID: ${movie.sourceId || 'Unknown'}`,
          releaseYear: new Date().getFullYear(),
          posterUrl: cleanedPoster,
          backdropUrl: cleanedPoster,
          // 4. Force to BILIBILI to use the embed iframe
          videoSource: 'BILIBILI',
          sourceId: movie.sourceId || 'Unknown'
        }
      });
      savedCount++;
    }
  }

  console.log(`Successfully scraped and inserted ${savedCount} new movies!`);
}

scrapeBilibili()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during scraping:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
