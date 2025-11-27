const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const virtualEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  organizationId: {
    type: String,
    required: true,
    index: true
  },
  organizationName: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['webinar', 'workshop', 'training', 'meeting', 'conference', 'other'],
    default: 'webinar'
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  platform: {
    type: String,
    enum: ['in-app', 'zoom', 'google-meet', 'teams'],
    default: 'in-app'
  },
  maxParticipants: {
    type: Number,
    min: 1,
    max: 1000,
    default: 100
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  requirements: {
    type: String,
    maxlength: 500,
    default: ''
  },
  hasChat: {
    type: Boolean,
    default: true
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  recordingUrl: {
    type: String,
    default: ''
  },
  googleMeetLink: {
    type: String,
    default: ''
  },
  tasks: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    assignedTo: {
      type: String, // userId
      required: true
    },
    assignedToName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'overdue'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    dueDate: {
      type: Date
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileSize: Number,
      fileType: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    links: [{
      title: String,
      url: String,
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    outputs: [{
      fileName: String,
      fileUrl: String,
      fileSize: Number,
      fileType: String,
      links: [{
        title: String,
        url: String
      }],
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      uploadedBy: String, // userId of volunteer
      uploadedByName: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
virtualEventSchema.index({ organizationId: 1, status: 1 });
virtualEventSchema.index({ date: 1, time: 1 });
virtualEventSchema.index({ status: 1 });

// Pre-save middleware
virtualEventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods for task management
virtualEventSchema.methods.addTask = function(taskData) {
  const task = {
    id: require('uuid').v4(),
    ...taskData,
    createdAt: new Date()
  };
  this.tasks.push(task);
  return this.save();
};

virtualEventSchema.methods.updateTask = function(taskId, updateData) {
  const task = this.tasks.find(t => t.id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  Object.assign(task, updateData);
  if (updateData.status === 'completed') {
    task.completedAt = new Date();
  }
  
  return this.save();
};

virtualEventSchema.methods.deleteTask = function(taskId) {
  const taskIndex = this.tasks.findIndex(t => t.id === taskId);
  if (taskIndex > -1) {
    this.tasks.splice(taskIndex, 1);
  }
  return this.save();
};

virtualEventSchema.methods.getTasksByUser = function(userId) {
  return this.tasks.filter(task => task.assignedTo === userId);
};

module.exports = mongoose.model('VirtualEvent', virtualEventSchema);


