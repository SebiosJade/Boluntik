const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start all scheduled jobs
  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting scheduler service...');

    // Schedule campaign completion check every hour
    this.scheduleCampaignCompletion();
    
    logger.info('Scheduler service started successfully');
  }

  // Stop all scheduled jobs
  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    this.jobs.forEach((job, name) => {
      job.destroy();
      logger.info(`Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    logger.info('Scheduler service stopped');
  }

  // Schedule campaign completion check
  scheduleCampaignCompletion() {
    const jobName = 'campaign-completion-check';
    
    // Run every hour at minute 0
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running scheduled campaign completion check...');
        await this.completeExpiredCampaigns();
      } catch (error) {
        logger.error('Error in scheduled campaign completion check:', error);
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'UTC'
    });

    this.jobs.set(jobName, job);
    job.start();
    
    logger.info(`Scheduled campaign completion check to run every hour`);
  }

  // Complete expired campaigns
  async completeExpiredCampaigns() {
    try {
      const completedCampaigns = await Campaign.completeExpiredCampaigns();
      
      if (completedCampaigns.length > 0) {
        logger.info(`Automatically completed ${completedCampaigns.length} expired campaigns`);
        
        // Log details of completed campaigns
        completedCampaigns.forEach(campaign => {
          logger.info(`Campaign completed: ${campaign.title} (${campaign.id}) - Raised: ${campaign.currentAmount}/${campaign.goalAmount}`);
        });

        // TODO: Send notifications to organizations about completed campaigns
        // This would require implementing the notification system
        
      } else {
        logger.info('No expired campaigns found to complete');
      }
      
      return completedCampaigns;
    } catch (error) {
      logger.error('Error completing expired campaigns:', error);
      throw error;
    }
  }

  // Manual trigger for campaign completion (for testing)
  async triggerCampaignCompletion() {
    logger.info('Manually triggering campaign completion check...');
    return await this.completeExpiredCampaigns();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
