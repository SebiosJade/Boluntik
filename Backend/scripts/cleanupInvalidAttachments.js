const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Connect to MongoDB
mongoose.connect(config.mongoUri);

const VirtualEvent = require('../models/VirtualEvent');

async function cleanupInvalidAttachments() {
  try {
    console.log('🔍 Searching for tasks with invalid attachments...');
    
    const events = await VirtualEvent.find({});
    let totalCleaned = 0;
    
    for (const event of events) {
      let eventUpdated = false;
      
      for (const task of event.tasks) {
        if (task.attachments && task.attachments.length > 0) {
          const validAttachments = [];
          
          for (const attachment of task.attachments) {
            const filePath = path.join(__dirname, '../', attachment.fileUrl);
            const decodedPath = path.join(__dirname, '../', decodeURIComponent(attachment.fileUrl));
            
            if (fs.existsSync(filePath) || fs.existsSync(decodedPath)) {
              validAttachments.push(attachment);
            } else {
              console.log(`❌ Removing invalid: ${attachment.fileName} (${attachment.fileUrl})`);
              totalCleaned++;
              eventUpdated = true;
            }
          }
          
          task.attachments = validAttachments;
        }
      }
      
      if (eventUpdated) {
        await event.save();
        console.log(`✅ Updated event: ${event.title}`);
      }
    }
    
    console.log(`\n✅ Cleanup complete! Removed ${totalCleaned} invalid attachments.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupInvalidAttachments();





