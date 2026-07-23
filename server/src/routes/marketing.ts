import { Router } from 'express';
import { AIMarketingService } from '../services/aiMarketingService.js';

const router = Router();

// GET /api/marketing/generate
router.get('/generate', async (req, res) => {
  try {
    const { platform, campaignType, genre, trackId } = req.query;
    const post = await AIMarketingService.generateSocialPost({
      platform: platform as any,
      campaignType: campaignType as string,
      genre: genre as string,
      trackId: trackId as string,
    });
    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate post' });
  }
});

// POST /api/marketing/generate
router.post('/generate', async (req, res) => {
  try {
    const { platform, campaignType, genre, trackId } = req.body;
    const post = await AIMarketingService.generateSocialPost({
      platform,
      campaignType,
      genre,
      trackId,
    });
    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate post' });
  }
});

// GET /api/marketing/weekly-plan
router.get('/weekly-plan', async (_req, res) => {
  try {
    const plan = await AIMarketingService.getWeeklyMarketingPlan();
    res.json({ success: true, plan });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate weekly plan' });
  }
});

export default router;
