// Script to apply resource UI improvements to volunteer resources screen
// This script updates the volunteer resources to match organization changes

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/(volunteerTabs)/resources.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('🔄 Applying resource UI improvements to volunteer resources screen...');

// 1. Update getCurrentData function
const oldGetCurrentData = `  const getCurrentData = () => {
    switch (activeTab) {
      case 'browseOffers':
        return browseOffers;
      case 'browseRequests':
        return browseRequests;
      case 'myOffers':
        return myOffers;
      case 'myRequests':
        return myRequests;
      case 'requestedFromOthers':
        return requestedFromOthers;
      case 'helpOffered':
        return helpOffered;
      default:
        return [];
    }
  };`;

const newGetCurrentData = `  const getCurrentData = () => {
    let data: resourceService.Resource[] = [];
    
    switch (activeTab) {
      case 'browseOffers':
        data = browseOffers;
        if (showMyOffersOnly && user) {
          data = data.filter(r => r.ownerId === user.id);
        }
        break;
      case 'browseRequests':
        data = browseRequests;
        if (showMyRequestsOnly && user) {
          data = data.filter(r => r.ownerId === user.id);
        }
        break;
      case 'requestedFromOthers':
        data = requestedFromOthers;
        break;
      case 'helpOffered':
        data = helpOffered;
        break;
      default:
        data = [];
    }
    
    return data;
  };`;

content = content.replace(oldGetCurrentData, newGetCurrentData);

// 2. Update getEmptyMessage function
const oldGetEmptyMessage = `  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'browseOffers':
        return 'No offers available';
      case 'browseRequests':
        return 'No requests available';
      case 'myOffers':
        return 'You haven\\'t created any offers yet';
      case 'myRequests':
        return 'You haven\\'t created any requests yet';
      case 'requestedFromOthers':
        return 'You haven\\'t requested any resources yet';
      case 'helpOffered':
        return 'You haven\\'t offered help yet';
      default:
        return 'No resources found';
    }
  };`;

const newGetEmptyMessage = `  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'browseOffers':
        return showMyOffersOnly ? 'You haven\\'t created any offers yet' : 'No offers available';
      case 'browseRequests':
        return showMyRequestsOnly ? 'You haven\\'t created any requests yet' : 'No requests available';
      case 'requestedFromOthers':
        return 'You haven\\'t requested any resources yet';
      case 'helpOffered':
        return 'You haven\\'t offered help yet';
      default:
        return 'No resources found';
    }
  };`;

content = content.replace(oldGetEmptyMessage, newGetEmptyMessage);

// Write the updated content
fs.writeFileSync(filePath, content, 'utf-8');

console.log('✅ Successfully updated volunteer resources screen!');
console.log('📝 Changes applied:');
console.log('   - Added filter support for browse tabs');
console.log('   - Updated getCurrentData function');
console.log('   - Updated getEmptyMessage function');

