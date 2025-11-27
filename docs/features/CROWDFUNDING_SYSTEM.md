# Crowdfunding System - Complete Implementation Guide

## 🎯 Overview

A complete crowdfunding platform with three user roles: **Admin**, **Organization**, and **Volunteer (Donor)**. The system allows organizations to create fundraising campaigns while maintaining transparency through admin verification and automatic QR code integration.

---

## 📋 Key Features

### 1. **Admin Panel** (`/app/(adminTabs)/crowdfunding.tsx`)

#### Payment Settings
- **Single QR Code Upload**: Admin uploads one QR code (GCash or Bank Transfer)
- **Platform Fee Configuration**: Set percentage fee (default: 5%)
- **Account Details**: Configure account name and number
- All campaigns automatically use admin's payment details

#### Campaign Management
- View all campaigns (active, completed, disbursed)
- Monitor campaign progress and statistics
- View campaign details and donor transparency

#### Donation Verification
- Review pending donations with screenshots
- Verify or reject donations with reasons
- Match donations by reference number, date, and amount
- Automatic campaign total updates upon verification

#### Fund Disbursement
- View campaigns ready for disbursement
- Calculate platform fee and net amount
- Manually disburse funds to organizations
- Track disbursement history with notes

### 2. **Organization Dashboard** (`/app/(organizationTabs)/crowdfundingorg.tsx`)

#### Campaign Creation
- **Required Fields**:
  - Title
  - Description
  - Category (Education, Healthcare, Environment, etc.)
  - Goal Amount
  - Due Date
- **Optional**: Campaign image upload
- **Auto-attached**: Admin's QR code (organizations don't upload their own)

#### Campaign Management
- View active and completed campaigns
- Edit campaign details (before disbursement)
- Delete campaigns (only if no verified donations)
- Track donations (pending and verified)
- View disbursement details

#### Metrics Dashboard
- Total raised across all campaigns
- Active vs completed campaign counts
- Total donor count
- Individual campaign progress bars

### 3. **Volunteer/Donor Interface** (`/app/(volunteerTabs)/crowdfunding.tsx`)

#### Campaign Discovery
- Browse active campaigns
- Search by title or organization
- Filter by category
- View urgency indicators (days left)
- Detailed campaign view with donor transparency

#### Donation Submission
- **Donor Information**:
  - Full Name (required)
  - Email (optional)
  - Donation Amount (required)
- **Payment Proof**:
  - Reference Number (required)
  - Screenshot Upload (required)
  - Optional message of support
- View admin's QR code and payment details
- Quick amount buttons ($10, $25, $50, $100)

---

## 🔧 Technical Architecture

### Backend Structure

#### Models
1. **PaymentSettings** (`Backend/models/PaymentSettings.js`)
   - QR Code URL
   - Payment Method (GCash/Bank)
   - Account Name & Number
   - Platform Fee Percentage
   - Singleton pattern (only one settings document)

2. **Campaign** (`Backend/models/Campaign.js`)
   - Campaign details (title, description, category, goal, due date)
   - Organization information
   - Current amount (calculated from verified donations)
   - Status (active, completed, cancelled, disbursed)
   - Nested donations array
   - Disbursement details

3. **Donation** (Subdocument in Campaign)
   - Donor information
   - Amount and reference number
   - Screenshot URL
   - Status (pending, verified, rejected)
   - Verification details
   - Submission timestamp

#### Controllers
1. **paymentSettingsController.js**
   - `getSettings`: Retrieve payment settings
   - `updateSettings`: Update payment configuration

2. **campaignController.js**
   - `getAllCampaigns`: Public campaign list (with filters)
   - `getCampaign`: Single campaign with payment settings
   - `getOrgCampaigns`: Organization's campaigns
   - `createCampaign`: Create new campaign
   - `updateCampaign`: Update campaign details
   - `deleteCampaign`: Delete campaign (with restrictions)
   - `submitDonation`: Submit donation (public)
   - `getAllDonations`: Admin view all donations
   - `verifyDonation`: Admin verify/reject donations
   - `disburseFunds`: Admin disburse campaign funds

3. **fileUploadController.js**
   - `uploadQRCode`: QR code file upload (admin only)
   - `uploadCampaignImage`: Campaign image upload (org only)
   - `uploadDonationScreenshot`: Screenshot upload (public)

#### Routes (`Backend/crowdfunding/routes.js`)
```
GET    /api/crowdfunding/payment-settings
PUT    /api/crowdfunding/payment-settings (admin)
POST   /api/crowdfunding/upload/qr-code (admin)
POST   /api/crowdfunding/upload/campaign-image (org)
POST   /api/crowdfunding/upload/donation-screenshot (public)
GET    /api/crowdfunding/campaigns
GET    /api/crowdfunding/campaigns/:id
GET    /api/crowdfunding/org/campaigns (org)
POST   /api/crowdfunding/campaigns (org)
PUT    /api/crowdfunding/campaigns/:id (org)
DELETE /api/crowdfunding/campaigns/:id (org)
POST   /api/crowdfunding/campaigns/:id/donate (public)
GET    /api/crowdfunding/admin/donations (admin)
PUT    /api/crowdfunding/admin/campaigns/:campaignId/donations/:donationId/verify (admin)
POST   /api/crowdfunding/admin/campaigns/:campaignId/disburse (admin)
```

### Frontend Structure

#### Service Layer (`Frontend/services/crowdfundingService.ts`)
- TypeScript interfaces for type safety
- Axios-based API calls
- Token authentication
- FormData handling for file uploads
- Error handling and logging

#### UI Components
- **Admin**: 4 tabs (Settings, Campaigns, Donations, Disbursements)
- **Organization**: Campaign cards with progress bars, modals for create/edit/details
- **Volunteer**: Campaign discovery, detailed view, donation modal with QR display

---

## 💾 Database Schema

### PaymentSettings Collection
```javascript
{
  _id: ObjectId,
  qrCodeUrl: String,
  paymentMethod: "gcash" | "bank",
  accountName: String,
  accountNumber: String,
  platformFeePercentage: Number,
  updatedAt: Date,
  updatedBy: String
}
```

### Campaign Collection
```javascript
{
  _id: ObjectId,
  id: String (UUID),
  organizationId: String,
  organizationName: String,
  title: String,
  description: String,
  category: String,
  goalAmount: Number,
  currentAmount: Number,
  imageUrl: String,
  dueDate: Date,
  status: "active" | "completed" | "cancelled" | "disbursed",
  donations: [
    {
      id: String (UUID),
      donorName: String,
      donorEmail: String,
      amount: Number,
      referenceNumber: String,
      screenshotUrl: String,
      message: String,
      status: "pending" | "verified" | "rejected",
      verifiedBy: String,
      verifiedAt: Date,
      rejectionReason: String,
      submittedAt: Date
    }
  ],
  disbursementDetails: {
    platformFee: Number,
    netAmount: Number,
    disbursedAt: Date,
    disbursedBy: String,
    notes: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Security & Permissions

### Role-Based Access Control
- **Admin Only**:
  - Payment settings management
  - Donation verification
  - Fund disbursement
  - QR code upload

- **Organization Only**:
  - Campaign creation/editing/deletion
  - View own campaigns
  - Campaign image upload

- **Public**:
  - View campaigns
  - Submit donations
  - Upload donation screenshots

### Data Validation
- Required field checks
- Amount validation (positive numbers)
- Date validation (due date must be in future)
- File type validation (images only)
- Campaign status checks before modifications

---

## 📊 Workflow

### Complete Campaign Lifecycle

1. **Setup** (Admin)
   - Admin uploads QR code
   - Sets payment method and account details
   - Configures platform fee

2. **Campaign Creation** (Organization)
   - Organization fills campaign details
   - Admin's QR code automatically attached
   - Campaign goes live immediately

3. **Donation Process** (Volunteer)
   - Donor selects campaign
   - Views QR code and payment details
   - Makes payment via GCash/Bank
   - Submits donation with screenshot and reference number
   - Donation status: **Pending**

4. **Verification** (Admin)
   - Admin checks bank/GCash account manually
   - Matches donation by reference number, date, and amount
   - Verifies or rejects with reason
   - Verified donations:
     - Update campaign total
     - Update progress bar
     - Show in transparency list

5. **Disbursement** (Admin)
   - After campaign ends or reaches goal
   - Admin views total raised
   - System calculates platform fee
   - Admin disburses net amount (95% if 5% fee)
   - Campaign marked as **Disbursed**

---

## 🎨 UI/UX Features

### Progress Visualization
- Real-time progress bars
- Percentage completion
- Goal vs raised display
- Donor count badges

### Transparency
- Public donor lists (verified donations only)
- Donation amounts visible
- Pending donation counts
- Disbursement details for completed campaigns

### Responsive Design
- Mobile-first approach
- Modal-based forms
- Image previews
- Loading states
- Error handling with alerts

### User Feedback
- Success/error messages
- Loading indicators
- Confirmation dialogs
- Status badges (pending, verified, rejected, active, disbursed)

---

## 🚀 Getting Started

### Prerequisites
- MongoDB database
- Node.js backend server
- React Native/Expo frontend

### Installation

1. **Backend Setup**
   ```bash
   cd Backend
   npm install
   # Ensure these packages are installed:
   # - multer (file uploads)
   # - mongoose (MongoDB)
   # - uuid (unique IDs)
   ```

2. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   # Ensure these packages are installed:
   # - expo-image-picker
   # - react-native-modal-datetime-picker
   # - axios
   ```

3. **Start Services**
   ```bash
   # Backend
   cd Backend
   npm start

   # Frontend
   cd Frontend
   npx expo start
   ```

### First-Time Configuration

1. **Admin Login**
   - Navigate to Admin Panel → Crowdfunding
   - Go to Settings tab
   - Upload QR code (GCash or Bank)
   - Enter account details
   - Set platform fee
   - Save settings

2. **Organization Setup**
   - Login as organization
   - Navigate to Crowdfunding section
   - Click "New Campaign"
   - Fill campaign details
   - Submit to go live

3. **Test Donation**
   - Login as volunteer
   - Browse campaigns
   - Click "Donate"
   - Fill donation form
   - Upload screenshot
   - Submit

4. **Verify Donation** (Admin)
   - Go to Donations tab
   - Select pending donation
   - View screenshot
   - Verify or reject

---

## 📁 File Structure

```
App/
├── Backend/
│   ├── models/
│   │   ├── PaymentSettings.js
│   │   └── Campaign.js
│   ├── crowdfunding/
│   │   ├── controllers/
│   │   │   ├── paymentSettingsController.js
│   │   │   ├── campaignController.js
│   │   │   └── fileUploadController.js
│   │   └── routes.js
│   ├── utils/
│   │   ├── appError.js
│   │   └── catchAsync.js
│   ├── uploads/
│   │   └── crowdfunding/
│   │       ├── qr-codes/
│   │       ├── campaigns/
│   │       └── donations/
│   └── index.js
└── Frontend/
    ├── services/
    │   └── crowdfundingService.ts
    └── app/
        ├── (adminTabs)/
        │   └── crowdfunding.tsx
        ├── (organizationTabs)/
        │   └── crowdfundingorg.tsx
        └── (volunteerTabs)/
            └── crowdfunding.tsx
```

---

## 🔍 Key Methods & Functions

### Backend Instance Methods (Campaign Model)
```javascript
campaign.updateCurrentAmount()    // Recalculate from verified donations
campaign.isExpired()              // Check if past due date
campaign.getVerifiedDonationsCount() // Count verified donations
campaign.calculateDisbursement(feePercentage) // Calculate fee and net amount
```

### Backend Static Methods (PaymentSettings Model)
```javascript
PaymentSettings.getSettings()     // Get current settings (singleton)
PaymentSettings.updateSettings(data) // Update or create settings
```

### Frontend Service Methods
```javascript
getPaymentSettings()              // Get admin payment configuration
uploadQRCode(file)                // Upload QR code (admin)
uploadCampaignImage(file)         // Upload campaign image (org)
uploadDonationScreenshot(file)    // Upload donation proof (public)
getAllCampaigns(filters)          // Get campaigns with optional filters
getCampaign(id)                   // Get single campaign with payment settings
createCampaign(data)              // Create new campaign (org)
updateCampaign(id, data)          // Update campaign (org)
deleteCampaign(id)                // Delete campaign (org)
submitDonation(campaignId, data)  // Submit donation (public)
verifyDonation(campaignId, donationId, status) // Verify donation (admin)
disburseFunds(campaignId, notes)  // Disburse funds (admin)
```

---

## ✅ System Validations

### Campaign Creation
- ✓ Title, description, category, goal, due date required
- ✓ Goal amount must be positive
- ✓ Due date must be in future
- ✓ Payment settings must exist (admin configured)

### Donation Submission
- ✓ Donor name, amount, reference number, screenshot required
- ✓ Amount must be positive
- ✓ Campaign must be active
- ✓ Campaign must not be expired

### Donation Verification
- ✓ Donation must be pending
- ✓ Rejection requires reason
- ✓ Auto-updates campaign current amount

### Campaign Deletion
- ✓ Only owner can delete
- ✓ Cannot delete if verified donations exist
- ✓ Cannot delete if disbursed

### Fund Disbursement
- ✓ Campaign must have funds
- ✓ Cannot disburse twice
- ✓ Calculates platform fee automatically
- ✓ Records disbursement details

---

## 🎯 Best Practices Implemented

1. **Separation of Concerns**: Clear separation between models, controllers, and routes
2. **Type Safety**: TypeScript interfaces in frontend service layer
3. **Error Handling**: Try-catch blocks with user-friendly error messages
4. **Security**: Role-based access control, file validation, input sanitization
5. **UX**: Loading states, success/error feedback, confirmation dialogs
6. **Scalability**: Modular structure, reusable components, service layer abstraction
7. **Maintainability**: Clear file organization, consistent naming, comprehensive comments

---

## 🐛 Troubleshooting

### Common Issues

1. **"Payment settings not configured"**
   - Solution: Admin must upload QR code and configure settings first

2. **File upload fails**
   - Check file size (limit: 5MB)
   - Verify file type (images only)
   - Ensure upload directories exist

3. **Donation not updating campaign total**
   - Donation must be verified by admin first
   - Check donation status

4. **Cannot delete campaign**
   - Check for verified donations
   - Check campaign status (cannot delete if disbursed)

---

## 📈 Future Enhancements

- [ ] Email notifications for donation status
- [ ] Export donation reports (CSV/PDF)
- [ ] Campaign sharing via social media
- [ ] Recurring donations
- [ ] Campaign comments/updates
- [ ] Multiple payment methods per campaign
- [ ] Automatic campaign end when goal reached
- [ ] Donor leaderboards
- [ ] Organization verification badges

---

## 📝 License & Credits

Built with:
- **Backend**: Node.js, Express, MongoDB, Mongoose, Multer
- **Frontend**: React Native, Expo, TypeScript, Axios
- **UI**: React Native components with custom styling

---

## 🎉 System Complete!

All features implemented and ready for production use. The crowdfunding system provides a complete, transparent, and secure platform for organizations to raise funds with proper admin oversight and donor confidence.

