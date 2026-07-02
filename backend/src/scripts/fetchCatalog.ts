import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getArchiveDirectUrl(identifier: string): string {
  const cleanId = identifier.replace(/^\/|\/$/g, '').split('/').pop() || identifier;
  const baseName = cleanId.split('.')[0];
  return `https://archive.org/download/${cleanId}/${baseName}.mp4`;
}

let videoIdx = 0;
const SAMPLE_VIDEOS = [
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

function getSampleVideoForShow(_rating: any): string {
  return SAMPLE_VIDEOS[videoIdx++ % SAMPLE_VIDEOS.length];
}

// ── Internet Archive: real public-domain watchable movies ──────────────────
async function fetchArchiveMovies(): Promise<any[]> {
  console.log('📽  Fetching movies from Internet Archive...');
  const url = `https://archive.org/advancedsearch.php?q=mediatype:movies+AND+subject:(feature+film)&fl[]=identifier,title,description,year,subject&rows=60&output=json&sort[]=downloads+desc`;
  const res = await axios.get(url, { timeout: 15000 });
  const docs: any[] = res.data?.response?.docs || [];

  const movies: any[] = [];
  for (const doc of docs) {
    if (!doc.identifier || !doc.title) continue;
    const id = doc.identifier;
    const posterUrl = `https://archive.org/services/img/${id}`;
    movies.push({
      title: String(doc.title).substring(0, 100),
      overview: doc.description
        ? String(Array.isArray(doc.description) ? doc.description[0] : doc.description).substring(0, 500)
        : 'A classic public domain film from the Internet Archive.',
      releaseYear: parseInt(doc.year) || 1970,
      posterUrl,
      backdropUrl: posterUrl,
      videoSource: 'DIRECT_MP4',
      sourceId: getArchiveDirectUrl(id),
    });
  }
  console.log(`   Found ${movies.length} Archive movies`);
  return movies;
}

// ── Fetch episodes for a TV show ─────────────────────────────────────────────
async function fetchEpisodes(showId: number): Promise<any[]> {
  try {
    const res = await axios.get(`https://api.tvmaze.com/shows/${showId}/episodes`, { timeout: 10000 });
    const episodes: any[] = res.data || [];
    return episodes.map((ep: any) => ({
      number: ep.season,
      episode: ep.number,
      title: ep.name || `Episode ${ep.number}`,
      overview: ep.summary ? ep.summary.replace(/<[^>]*>/g, '').substring(0, 300) : '',
      airDate: ep.airdate || '',
      videoSource: 'DIRECT_MP4',
      sourceId: getSampleVideoForShow(null),
    }));
  } catch (e) {
    console.warn(`   Failed to fetch episodes for show ${showId}`);
    return [];
  }
}

// ── TVMaze: real TV shows with posters and episodes ───────────────────────────
async function fetchTVShows(): Promise<any[]> {
  console.log('📺  Fetching TV shows from TVMaze...');
  const allShows: any[] = [];

  for (let page = 0; page <= 2; page++) {
    try {
      const res = await axios.get(`https://api.tvmaze.com/shows?page=${page}`, { timeout: 10000 });
      const shows: any[] = res.data || [];
      for (const show of shows) {
        if (!show.name || !show.image?.original) continue;
        const poster = show.image.original || show.image.medium;
        allShows.push({
          id: show.id,
          title: show.name,
          overview: show.summary
            ? show.summary.replace(/<[^>]*>/g, '').substring(0, 500)
            : `${show.genres?.join(', ') || 'Drama'} series.`,
          releaseYear: show.premiered ? parseInt(show.premiered.split('-')[0]) : 2000,
          posterUrl: poster,
          backdropUrl: poster,
          videoSource: 'DIRECT_MP4',
          sourceId: getSampleVideoForShow(show.rating?.average),
        });
      }
    } catch (e) {
      console.warn(`   TVMaze page ${page} failed, skipping`);
    }
  }
  console.log(`   Found ${allShows.length} TV shows`);
  return allShows;
}

// ── Seed ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Starting catalog import...\n');

  await prisma.episode.deleteMany();
  await prisma.season.deleteMany();
  await prisma.room.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      username: 'WatchPartyAdmin',
      bio: 'The ultimate watch party host!',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  const [archiveMovies, tvShows] = await Promise.all([
    fetchArchiveMovies(),
    fetchTVShows(),
  ]);

  const allItems = [...archiveMovies, ...tvShows];
  console.log(`\n💾 Saving ${allItems.length} titles to database...`);

  let saved = 0;
  const seen = new Set<string>();

  for (const item of allItems) {
    if (seen.has(item.title)) continue;
    seen.add(item.title);

    try {
      const movie = await prisma.movie.create({ data: { ...item, seasons: undefined } });
      
      if (item.id) {
        const episodes = await fetchEpisodes(item.id);
        const seasonMap = new Map<number, any[]>();
        for (const ep of episodes) {
          const seasonNum = ep.number;
          if (!seasonMap.has(seasonNum)) seasonMap.set(seasonNum, []);
          seasonMap.get(seasonNum)!.push(ep);
        }
        
        for (const [seasonNum, eps] of seasonMap) {
          const season = await prisma.season.create({
            data: {
              number: seasonNum,
              movieId: movie.id,
            },
          });
          
          for (const ep of eps) {
            await prisma.episode.create({
              data: {
                number: ep.episode,
                title: ep.title,
                overview: ep.overview || '',
                airDate: ep.airDate || '',
                videoSource: ep.videoSource,
                sourceId: ep.sourceId,
                seasonId: season.id,
              },
            });
          }
        }
      }
      
      // @ts-ignore
      process.stdout.write(`\r   ✓ ${++saved} saved`);
    } catch (e: any) {
      // skip duplicates silently
    }
  }

  console.log(`\n\n🎬 Done! ${saved} titles imported into your catalog.\n`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    // @ts-ignore
    process.exit(1);
  });