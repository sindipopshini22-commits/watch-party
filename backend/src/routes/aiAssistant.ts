import { Router } from 'express';

const router = Router();

router.post('/chat', async (req, res) => {
  const { message, context } = req.body;
  
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured.' });
  }

  try {
    const mockResponse = `(AI Assistant) You asked: "${message}". Context: ${JSON.stringify(context)}. I am forbidden from spoiling the movie ending!`;
    res.json({ reply: mockResponse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process AI request.' });
  }
});

export default router;
