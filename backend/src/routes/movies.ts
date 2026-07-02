import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Fetch all movies for the catalog
router.get('/movies', async (req, res) => {
  try {
    const movies = await prisma.movie.findMany();
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// Initialize a room
router.post('/rooms', async (req, res) => {
  const { movieId, episodeId } = req.body;
  try {
    const room = await prisma.room.create({
      data: {
        host_id: `host_${Date.now()}`,
        current_movie_id: movieId,
        current_episode_id: episodeId || null,
        is_playing: false,
        current_timestamp: 0,
      },
      include: {
        current_movie: true
      }
    });

    res.json({ roomId: room.id, movie: room.current_movie, episode: room.current_episode_id ? { id: room.current_episode_id } : null });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Fetch room metadata
router.get('/rooms/:roomId', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.roomId },
      include: { current_movie: true }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      ...room,
      current_episode_id: room.current_episode_id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room metadata' });
  }
});

// Fetch seasons for a movie
router.get('/movies/:movieId/seasons', async (req, res) => {
  try {
    const seasons = await prisma.season.findMany({
      where: { movie_id: req.params.movieId },
      orderBy: { number: 'asc' }
    });
    res.json(seasons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seasons' });
  }
});

// Fetch episodes for a season
router.get('/seasons/:seasonId/episodes', async (req, res) => {
  try {
    const episodes = await prisma.episode.findMany({
      where: { season_id: req.params.seasonId },
      orderBy: { number: 'asc' }
    });
    res.json(episodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

export default router;
