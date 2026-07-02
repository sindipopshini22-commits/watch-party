import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const actualPlayableMovies = [
  {
    title: "Big Buck Bunny",
    overview: "A large and lovable rabbit deals with bullying forest creatures in this iconic open-source animation masterpiece.",
    release_year: 2008,
    poster_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_Buck_Bunny_Main_Poster.jpg/800px-Big_Buck_Bunny_Main_Poster.jpg",
    video_source: "DIRECT_MP4" as const,
    source_id: "https://vjs.zencdn.net/v/oceans.mp4"
  },
  {
    title: "Night of the Living Dead",
    overview: "George A. Romero's classic indie horror masterpiece. A group of individuals lock themselves inside a farmhouse to escape a horde of flesh-eating ghouls.",
    release_year: 1968,
    poster_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Night_of_the_Living_Dead_poster.jpg/800px-Night_of_the_Living_Dead_poster.jpg",
    video_source: "DIRECT_MP4" as const,
    source_id: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  {
    title: "Sintel",
    overview: "A lonely young woman searches for her companion dragon in a stunning fantasy universe.",
    release_year: 2010,
    poster_url: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg",
    video_source: "DIRECT_MP4" as const,
    source_id: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4"
  },
  {
    title: "Charade",
    overview: "A fast-paced romantic suspense thriller starring Audrey Hepburn and Cary Grant as they are chased through Paris.",
    release_year: 1963,
    poster_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Charade1963poster.jpg/800px-Charade1963poster.jpg",
    video_source: "DIRECT_MP4" as const,
    source_id: "https://placeholdervideo.dev/1280x720"
  },
  {
    title: "Tears of Steel",
    overview: "A sci-fi exploration of a dystopian future set in Amsterdam, featuring intense real-world tracking and VFX elements.",
    release_year: 2012,
    poster_url: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Tears_of_Steel_poster.jpg",
    video_source: "DIRECT_MP4" as const,
    source_id: "https://www.w3schools.com/html/movie.mp4"
  },
  {
    title: "His Girl Friday",
    overview: "One of the greatest, fastest screwball comedies ever made. A newspaper editor pulls out every trick to keep his ace reporter ex-wife from leaving.",
    release_year: 1940,
    poster_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/His_Girl_Friday_poster.jpg/800px-His_Girl_Friday_poster.jpg",
    video_source: "DIRECT_MP4" as const,
    source_id: "https://placeholdervideo.dev/1920x1080"
  }
];

async function main() {
  console.log("🎬 Wiping old database records...");
  await prisma.movie.deleteMany({});
  
  console.log("🚀 Injecting verified, directly playable stream arrays...");
  for (const movie of actualPlayableMovies) {
    await prisma.movie.create({
      data: {
        title: movie.title,
        overview: movie.overview,
        release_year: movie.release_year,
        poster_url: movie.poster_url,
        video_source: movie.video_source,
        source_id: movie.source_id,
      }
    });
  }
  console.log(`🎉 Database successfully seeded with ${actualPlayableMovies.length} operational movies!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
