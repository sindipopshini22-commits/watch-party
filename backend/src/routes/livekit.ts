import { Router } from 'express';
import { AccessToken } from 'livekit-server-sdk';

const router = Router();

router.get('/token', async (req, res) => {
  const { roomId, userId } = req.query;

  if (!roomId || !userId) {
    return res.status(400).json({ error: 'roomId and userId are required' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId as string,
    ttl: '2h',
  });

  token.addGrant({
    roomJoin: true,
    room: roomId as string,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();
  res.json({ token: jwt });
});

export default router;
