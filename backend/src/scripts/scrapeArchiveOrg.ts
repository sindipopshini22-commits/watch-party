import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ArchiveItem {
  identifier: string;
  title: string;
  description: string;
  year?: string;
  image?: string;
  format?: string;
  files?: { name: string; format: string; link?: string }[];
}

async function searchArchiveOrg(query: string, maxResults = 20): Promise<ArchiveItem[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl=identifier,title,description,year,image&rows=${maxResults}&output=json`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Archive.org search failed: ${res.status}`);
  
  const json = await res.json();
  return (json.response?.docs || []).map((doc: any) => ({
    identifier: doc.identifier,
    title: doc.title || 'Untitled',
    description: doc.description || '',
    year: doc.year,
    image: doc.image ? `https://archive.org/services/img/${doc.identifier}` : undefined,
  }));
}

async function getItemFiles(identifier: string): Promise<{ name: string; format: string; link?: string }[]> {
  const url = `https://archive.org/metadata/${identifier}/files`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  const files = (json.result || json || []) as any[];
  return files.slice(0, 50);
}

async function findPlayableVideo(identifier: string): Promise<{ source: string; link: string } | null> {
  const files = await getItemFiles(identifier);
  
  const mp4File = files.find(f => f.format === 'MP4' || (f.name && f.name.endsWith('.mp4')));
  if (mp4File) {
    const link = `https://archive.org/download/${identifier}/${encodeURIComponent(mp4File.name)}`;
    return { source: 'DIRECT_MP4', link };
  }
  
  return null;
}

async function main() {
  console.log('🔍 Scraping archive.org for public domain movies...');
  
  const queries = [
    'full movie public domain',
    'classic film public domain',
    'open source movie',
    'creative commons movie',
  ];
  
  const seen = new Set<string>();
  const candidates: any[] = [];
  
  for (const query of queries) {
    try {
      const items = await searchArchiveOrg(query, 10);
      for (const item of items) {
        if (seen.has(item.identifier)) continue;
        seen.add(item.identifier);
        candidates.push(item);
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`Search failed for "${query}":`, (e as Error).message);
    }
  }
  
  console.log(`Found ${candidates.length} candidate items. Checking playability...`);
  
  const playable: any[] = [];
  for (const item of candidates.slice(0, 20)) {
    try {
      const playableVideo = await findPlayableVideo(item.identifier);
      if (playableVideo) {
        playable.push({
          title: item.title,
          overview: (item.description as string).replace(/<[^>]+>/g, '').slice(0, 300),
          release_year: parseInt(item.year || '1900') || 1900,
          poster_url: item.image || 'https://picsum.photos/seed/' + item.identifier + '/600/900',
          video_source: 'DIRECT_MP4',
          source_id: playableVideo.link,
        });
        console.log(`  ✓ ${item.title}`);
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      // skip
    }
  }
  
  if (playable.length === 0) {
    console.log('No new playable movies found. Keeping existing catalog.');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`\n🎬 Seeding ${playable.length} playable movies...`);
  for (const movie of playable) {
    await prisma.movie.upsert({
      where: { source_id: movie.source_id },
      update: {
        title: movie.title,
        overview: movie.overview,
        release_year: movie.release_year,
        poster_url: movie.poster_url,
        video_source: movie.video_source,
      },
      create: movie,
    });
    console.log(`  ✓ ${movie.title}`);
  }
  
  console.log('\n🎉 Archive.org scraping complete!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
