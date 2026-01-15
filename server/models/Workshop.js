import mongoose from 'mongoose';

const WorkshopSchema = new mongoose.Schema(
  {
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected", "needs-edits","archived"], 
      default: "pending" 
    },
    reviewNote: { type: String, default: "" },
    published: { type: Boolean, default: false },
    certificatesAutoSent: { type: Boolean, default: false },


    price: { 
      type: Number, 
      default: 0,
      min: 0
    },

    // Registration tracking (UPDATED)
    registrationsCount: { type: Number, default: 0 },
    currentRegistrations: { type: Number, default: 0 }, // NEW: tracks active registrations
    maxCapacity: { type: Number, default: 0 }, // NEW: alias for capacity for clarity
    
    // Registered users details (NEW)
    registeredUsers: [{
      userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
      },
      registeredAt: { 
        type: Date, 
        default: Date.now 
      },
      status: {
        type: String,
        enum: ["registered", "cancelled", "attended", "waitlisted"],
        default: "registered"
      }
    }],
    averageRating: {
  type: Number,
  default: 0,
},


  // Roles allowed to register / view this workshop.
  // Empty array => public (everyone). If non-empty, only users whose role
  // is included (case-insensitive) can see and register for the workshop.
  allowedRoles: { type: [String], default: [] },

    workshopName: { type: String, required: true, trim: true },
    location: {
      type: String,
      enum: ['GUC Cairo', 'GUC Berlin'],
      default: 'GUC Cairo',
      required: true,
    },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    shortDescription: { type: String, default: '' },
    fullAgenda: { type: String, default: '' },
    faculty: {
      type: String,
      enum: ['MET', 'IET', 'SET', 'SCE', 'Other'],
      default: 'Other',
    },
    professors: [{ type: String }],
    budget: { type: Number, default: 0 },
    fundingSource: { type: String, enum: ['external', 'GUC'], default: 'GUC' },
    extraResources: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    registrationDeadline: { type: Date },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', // Making sure this matches your User model name
      required: true 
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for available spots
WorkshopSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.capacity - this.currentRegistrations);
});

// Virtual for registration status
WorkshopSchema.virtual('isFull').get(function() {
  return this.currentRegistrations >= this.capacity;
});

// Virtual for active registrations
WorkshopSchema.virtual('activeRegistrationsList').get(function() {
  return this.registeredUsers.filter(reg => reg.status === "registered");
});

// Virtual for waitlist count
WorkshopSchema.virtual('waitlistCount').get(function() {
  return this.registeredUsers.filter(reg => reg.status === "waitlisted").length;
});

// Method to register a user
WorkshopSchema.methods.registerUser = function(userId) {
  // Check if user is already registered
  const existingRegistration = this.registeredUsers.find(
    reg => reg.userId.toString() === userId.toString() && reg.status === "registered"
  );
  
  if (existingRegistration) {
    throw new Error('User already registered for this workshop');
  }
  
  // Check capacity
  if (this.currentRegistrations >= this.capacity) {
    // Add to waitlist
    this.registeredUsers.push({
      userId: userId,
      status: "waitlisted"
    });
    return this.save().then(workshop => ({ status: "waitlisted", workshop }));
  }
  
  // Register normally
  this.registeredUsers.push({
    userId: userId,
    status: "registered"
  });
  this.currentRegistrations += 1;
  this.registrationsCount += 1;
  
  return this.save().then(workshop => ({ status: "registered", workshop }));
};

// Method to cancel user registration
WorkshopSchema.methods.cancelUserRegistration = function(userId) {
  const registration = this.registeredUsers.find(
    reg => reg.userId.toString() === userId.toString() && reg.status === "registered"
  );
  
  if (!registration) {
    throw new Error('User not registered for this workshop');
  }
  
  registration.status = "cancelled";
  this.currentRegistrations = Math.max(0, this.currentRegistrations - 1);
  
  // Check if we can promote someone from waitlist
  const waitlisted = this.registeredUsers.find(reg => reg.status === "waitlisted");
  if (waitlisted && this.currentRegistrations < this.capacity) {
    waitlisted.status = "registered";
    this.currentRegistrations += 1;
  }
  
  return this.save();
};

// Method to mark user as attended
WorkshopSchema.methods.markAsAttended = function(userId) {
  const registration = this.registeredUsers.find(
    reg => reg.userId.toString() === userId.toString() && reg.status === "registered"
  );
  
  if (!registration) {
    throw new Error('User not registered for this workshop');
  }
  
  registration.status = "attended";
  return this.save();
};

// Static method to find workshops by status
WorkshopSchema.statics.findByStatus = function(status) {
  return this.find({ status: status });
};

// Static method to find workshops with available spots
WorkshopSchema.statics.findWithAvailableSpots = function() {
  return this.find({
    currentRegistrations: { $lt: this.capacity },
    status: "approved",
    published: true
  });
};

// Indexes for better performance
WorkshopSchema.index({ status: 1, published: 1 });
WorkshopSchema.index({ startDateTime: 1 });
WorkshopSchema.index({ 'registeredUsers.userId': 1 });
WorkshopSchema.index({ currentRegistrations: 1 });

export default mongoose.model('Workshop', WorkshopSchema);