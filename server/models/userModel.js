import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // 🧍‍♂️ Basic user info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    // 🏫 GUC-specific field
    studentId: {
      type: String,
      trim: true,
      default: "",
    },

    // 📧 Email & password
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },

    // 👤 Role-based access (default: student)
    role: {
      type: String,
      enum: ["student", "staff", "ta", "professor", "vendor", "Admin", "EventOffice"],
      default: "student",
    },

    // 🔒 Email verification
    verifyToken: { type: String, default: "" },
    verifyTokenExpiry: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    isAccountVerified: { type: Boolean, default: false },

    // 🔁 Password reset
    resetOtp: { type: String, default: "" },
    resetOtpExpireAt: { type: Number, default: 0 },
    
    // 💰 Wallet system for payments and refunds
    walletBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    transactionHistory: [{
      type: {
        type: String,
        enum: ['deposit', 'payment', 'refund', 'withdrawal'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      description: String,
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
      },
      eventType: {
        type: String,
        enum: ['workshop', 'trip']
      },
      eventId: {
        type: mongoose.Schema.Types.ObjectId
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // 🎯 Attended events & Registrations
    attendedEvents: {
      workshops: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Workshop",
        },
      ],
      trips: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Trip",
        },
      ],
      confreences:[
        {
         type: mongoose.Schema.Types.ObjectId,
          ref: "conference",
        }
      ]
    },

    // 📝 Event Registrations (for tracking current registrations with payment info)
    eventRegistrations: {
      workshops: [{
        workshopId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Workshop" 
        },
        
        registeredAt: { 
          type: Date, 
          default: Date.now 
        },
        status: {
          type: String,
          enum: ["registered", "cancelled", "attended", "waitlisted"],
          default: "registered"
        },
        paymentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment'
        },
        amountPaid: {
          type: Number,
          default: 0
        },
        certificateSent: {
          type: Boolean,
          default: false
        }
      }]
      ,
      trips: [{
        tripId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Trip" 
        },
        registeredAt: { 
          type: Date, 
          default: Date.now 
        },
        status: {
          type: String,
          enum: ["registered", "cancelled", "attended"],
          default: "registered"
        },
        paymentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment'
        },
        amountPaid: {
          type: Number,
          default: 0
        }
      }],
        conferences: [{ // 🆕 Conference Registration
        confId: { type: mongoose.Schema.Types.ObjectId, ref: "Conference" },
        registeredAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["registered", "cancelled", "attended"], default: "registered" },
        amountPaid: { type: Number, default: 0 }
      }]
    },

    // ⭐ Favorites system
    favorites: {
      workshops: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Workshop",
        }
      ],
      trips: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Trip",
        }
      ]
    },
    
    // ⚠️ Warnings and blocking system
    warnings: [{
      reason: { type: String, required: true },
      commentContent: { type: String },
      deletedAt: { type: Date, default: Date.now },
      warningDate: { type: Date, default: Date.now }
    }],
    
    isBlocked: { type: Boolean, default: false },
    blockedUntil: { type: Date },
    
    // Additional info
    phone: { type: String, default: "" },
    department: { type: String, default: "" },
    profilePicture: { type: String, default: "" }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for checking if user is currently blocked
userSchema.virtual('isCurrentlyBlocked').get(function() {
  if (!this.isBlocked) return false;
  
  if (this.blockedUntil) {
    return this.blockedUntil > new Date();
  }
  
  return true; // Permanent block
});

// Virtual for active registrations
userSchema.virtual('activeRegistrations').get(function() {
  const workshops = this.eventRegistrations?.workshops || [];
  const trips = this.eventRegistrations?.trips || [];

  const activeWorkshops = workshops.filter(
    reg => reg.status === "registered" || reg.status === "waitlisted"
  );

  const activeTrips = trips.filter(
    reg => reg.status === "registered"
  );

  return {
    workshops: activeWorkshops,
    trips: activeTrips,
    total: activeWorkshops.length + activeTrips.length
  };
});

userSchema.virtual('paidRegistrations').get(function() {
  const workshops = this.eventRegistrations?.workshops || [];
  const trips = this.eventRegistrations?.trips || [];

  const paidWorkshops = workshops.filter(reg => reg.amountPaid > 0);
  const paidTrips = trips.filter(reg => reg.amountPaid > 0);

  return {
    workshops: paidWorkshops,
    trips: paidTrips,
    total: paidWorkshops.length + paidTrips.length
  };
});


userSchema.virtual('favoritesCount').get(function() {
  const workshopCount = this.favorites?.workshops?.length || 0;
  const tripCount = this.favorites?.trips?.length || 0;
  return workshopCount + tripCount;
});

userSchema.virtual('totalSpent').get(function() {
  const workshops = this.eventRegistrations?.workshops || [];
  const trips = this.eventRegistrations?.trips || [];

  const workshopSpent = workshops.reduce(
    (sum, reg) => sum + (reg.amountPaid || 0), 
    0
  );

  const tripSpent = trips.reduce(
    (sum, reg) => sum + (reg.amountPaid || 0), 
    0
  );

  return workshopSpent + tripSpent;
});

userSchema.virtual('totalRefunds').get(function() {
  const refundTransactions = this.transactionHistory?.filter(
    t => t.type === 'refund'
  ) || [];

  return refundTransactions.reduce((sum, t) => sum + t.amount, 0);
});


userSchema.virtual('availableRefundAmount').get(function() {
  const workshops = this.eventRegistrations?.workshops || [];
  const trips = this.eventRegistrations?.trips || [];

  const cancellable = [...workshops, ...trips].filter(
    reg => reg.status === "registered" && reg.amountPaid > 0
  );

  return cancellable.reduce((sum, reg) => sum + reg.amountPaid, 0);
});


// Method to check block status
userSchema.methods.checkBlockStatus = function() {
  if (!this.isBlocked) {
    return { isBlocked: false };
  }
  
  const now = new Date();
  if (this.blockedUntil && this.blockedUntil > now) {
    return { 
      isBlocked: true, 
      type: 'temporary',
      blockedUntil: this.blockedUntil,
      message: `Account blocked until ${this.blockedUntil.toLocaleString()}`
    };
  } else if (this.blockedUntil && this.blockedUntil <= now) {
    // Auto-unblock if time has passed
    this.isBlocked = false;
    this.blockedUntil = null;
    return this.save().then(() => ({ isBlocked: false }));
  } else {
    return { 
      isBlocked: true, 
      type: 'permanent',
      message: 'Account permanently blocked'
    };
  }
};

// 🆕 CANCELLATION POLICY METHOD
userSchema.methods.canCancelRegistration = function(eventType, eventId, eventStartDate = null) {
  const registrationList = eventType === 'workshop' ? this.eventRegistrations.workshops : this.eventRegistrations.trips;
  const idField = eventType === 'workshop' ? 'workshopId' : 'tripId';
  
  const registration = registrationList.find(
    reg => reg[idField] && reg[idField].toString() === eventId.toString() && 
           (reg.status === "registered" || reg.status === "waitlisted")
  );
  
  if (!registration) {
    return { 
      canCancel: false, 
      reason: 'Registration not found or not active' 
    };
  }
  
  let eventDate;
  
  // If eventStartDate is provided, use it directly
  if (eventStartDate) {
    eventDate = new Date(eventStartDate);
  } 
  // Otherwise try to get from populated registration
  else if (registration[idField] && registration[idField].startDateTime) {
    eventDate = new Date(registration[idField].startDateTime);
  } 
  else {
    return { 
      canCancel: false, 
      reason: 'Event date information not available' 
    };
  }
  
  const now = new Date();
  const twoWeeksBefore = new Date(eventDate.getTime() - (14 * 24 * 60 * 60 * 1000));
  const daysRemaining = Math.ceil((twoWeeksBefore - now) / (1000 * 60 * 60 * 24));
  
  if (now > twoWeeksBefore) {
    return { 
      canCancel: false, 
      reason: 'Cancellation not allowed. Must cancel at least 2 weeks before event.',
      cutoffDate: twoWeeksBefore,
      daysRemaining: 0,
      eventDate: eventDate
    };
  }
  
  return { 
    canCancel: true, 
    cutoffDate: twoWeeksBefore,
    daysRemaining: daysRemaining,
    eventDate: eventDate,
    registration: registration
  };
};

// 🆕 PAYMENT & WALLET METHODS

// Method to add funds to wallet
userSchema.methods.addToWallet = function(amount, description = 'Wallet top-up') {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  this.walletBalance += amount;
  this.transactionHistory.push({
    type: 'deposit',
    amount: amount,
    description: description,
    createdAt: new Date()
  });

  return this.save();
};

// Method to deduct from wallet for payment
userSchema.methods.deductFromWallet = function(amount, description, paymentId, eventType, eventId) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (this.walletBalance < amount) {
    throw new Error('Insufficient wallet balance');
  }

  this.walletBalance -= amount;
  this.transactionHistory.push({
    type: 'payment',
    amount: -amount,
    description: description,
    paymentId: paymentId,
    eventType: eventType,
    eventId: eventId,
    createdAt: new Date()
  });

  return this.save();
};

// Method to add refund to wallet
userSchema.methods.addRefund = function(amount, description, paymentId, eventType, eventId) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  this.walletBalance += amount;
  this.transactionHistory.push({
    type: 'refund',
    amount: amount,
    description: description,
    paymentId: paymentId,
    eventType: eventType,
    eventId: eventId,
    createdAt: new Date()
  });

  return this.save();
};

// Method to register for workshop with payment
userSchema.methods.registerForWorkshop = function(workshopId, paymentId = null, amountPaid = 0, status = "registered") {
  // Check if already registered
  const alreadyRegistered = this.eventRegistrations.workshops.some(
    reg => reg.workshopId.toString() === workshopId.toString() && 
          (reg.status === "registered" || reg.status === "waitlisted")
  );
  
  if (alreadyRegistered) {
    throw new Error('Already registered for this workshop');
  }
  
  this.eventRegistrations.workshops.push({
    workshopId: workshopId,
    status: status,
    paymentId: paymentId,
    amountPaid: amountPaid,
    registeredAt: new Date()
  });
  
  // Also add to attended events for backward compatibility
  if (!this.attendedEvents.workshops.includes(workshopId)) {
    this.attendedEvents.workshops.push(workshopId);
  }
  
  return this.save();
};

// Method to register for trip with payment
userSchema.methods.registerForTrip = function(tripId, paymentId = null, amountPaid = 0) {
  // Check if already registered
  const alreadyRegistered = this.eventRegistrations.trips.some(
    reg => reg.tripId.toString() === tripId.toString() && reg.status === "registered"
  );
  
  if (alreadyRegistered) {
    throw new Error('Already registered for this trip');
  }
  
  this.eventRegistrations.trips.push({
    tripId: tripId,
    status: "registered",
    paymentId: paymentId,
    amountPaid: amountPaid,
    registeredAt: new Date()
  });
  
  // Also add to attended events for backward compatibility
  if (!this.attendedEvents.trips.includes(tripId)) {
    this.attendedEvents.trips.push(tripId);
  }
  
  return this.save();
};

// Method to cancel workshop registration with refund tracking
userSchema.methods.cancelWorkshopRegistration = function(workshopId, refundAmount = 0) {
  const registration = this.eventRegistrations.workshops.find(
    reg => reg.workshopId.toString() === workshopId.toString() && 
          reg.status !== "cancelled" // Allow cancellation if not already cancelled
  );
  
  if (!registration) {
    throw new Error('Active registration not found for this workshop');
  }
  
  registration.status = "cancelled";
  
  // Remove from attended events - this is an array of ObjectIds, not registration objects
  // It's primarily for backward compatibility, so removing the ID is still appropriate
  this.attendedEvents.workshops = this.attendedEvents.workshops.filter(
    id => id.toString() !== workshopId.toString()
  );
  
  return this.save();
};

// Method to cancel trip registration with refund tracking
userSchema.methods.cancelTripRegistration = function(tripId, refundAmount = 0) {
  const registration = this.eventRegistrations.trips.find(
    reg => reg.tripId.toString() === tripId.toString() && 
          reg.status !== "cancelled" // Allow cancellation if not already cancelled
  );
  
  if (!registration) {
    throw new Error('Active registration not found for this trip');
  }
  
  registration.status = "cancelled";
  
  // Remove from attended events
  this.attendedEvents.trips = this.attendedEvents.trips.filter(
    id => id.toString() !== tripId.toString()
  );
  
  return this.save();
};

// Method to mark workshop as attended and send certificate
userSchema.methods.markWorkshopAttended = function(workshopId) {
  const registration = this.eventRegistrations.workshops.find(
    reg => reg.workshopId.toString() === workshopId.toString() && reg.status === "registered"
  );
  
  if (!registration) {
    throw new Error('Not registered for this workshop');
  }
  
  registration.status = "attended";
  return this.save();
};

// Method to mark certificate as sent
userSchema.methods.markCertificateSent = function(workshopId) {
  const registration = this.eventRegistrations.workshops.find(
    reg => reg.workshopId.toString() === workshopId.toString()
  );
  
  if (!registration) {
    throw new Error('Registration not found');
  }
  
  registration.certificateSent = true;
  return this.save();
};

// Method to get registration by payment ID
userSchema.methods.getRegistrationByPaymentId = function(paymentId) {
  const workshopReg = this.eventRegistrations.workshops.find(
    reg => reg.paymentId && reg.paymentId.toString() === paymentId.toString()
  );
  
  if (workshopReg) {
    return { type: 'workshop', registration: workshopReg };
  }
  
  const tripReg = this.eventRegistrations.trips.find(
    reg => reg.paymentId && reg.paymentId.toString() === paymentId.toString()
  );
  
  if (tripReg) {
    return { type: 'trip', registration: tripReg };
  }
  
  return null;
};

// Method to get cancellable registrations
userSchema.methods.getCancellableRegistrations = async function() {
  const cancellable = {
    workshops: [],
    trips: []
  };
  
  // Check workshops
  for (const reg of this.eventRegistrations.workshops) {
    if (reg.status === "registered" && reg.amountPaid > 0) {
      const canCancel = await this.canCancelRegistration('workshop', reg.workshopId);
      if (canCancel.canCancel) {
        cancellable.workshops.push({
          registration: reg,
          cancellationInfo: canCancel
        });
      }
    }
  }
  
  // Check trips
  for (const reg of this.eventRegistrations.trips) {
    if (reg.status === "registered" && reg.amountPaid > 0) {
      const canCancel = await this.canCancelRegistration('trip', reg.tripId);
      if (canCancel.canCancel) {
        cancellable.trips.push({
          registration: reg,
          cancellationInfo: canCancel
        });
      }
    }
  }
  
  return cancellable;
};

// 🆕 FAVORITES METHODS

// Method to add workshop to favorites
userSchema.methods.addWorkshopToFavorites = function(workshopId) {
  // Check if already in favorites
  const alreadyInFavorites = this.favorites.workshops.some(
    id => id.toString() === workshopId.toString()
  );
  
  if (alreadyInFavorites) {
    throw new Error('Workshop already in favorites');
  }
  
  this.favorites.workshops.push(workshopId);
  return this.save();
};

// Method to add trip to favorites
userSchema.methods.addTripToFavorites = function(tripId) {
  // Check if already in favorites
  const alreadyInFavorites = this.favorites.trips.some(
    id => id.toString() === tripId.toString()
  );
  
  if (alreadyInFavorites) {
    throw new Error('Trip already in favorites');
  }
  
  this.favorites.trips.push(tripId);
  return this.save();
};

// Method to remove workshop from favorites
userSchema.methods.removeWorkshopFromFavorites = function(workshopId) {
  const initialLength = this.favorites.workshops.length;
  this.favorites.workshops = this.favorites.workshops.filter(
    id => id.toString() !== workshopId.toString()
  );
  
  if (this.favorites.workshops.length === initialLength) {
    throw new Error('Workshop not found in favorites');
  }
  
  return this.save();
};

// Method to remove trip from favorites
userSchema.methods.removeTripFromFavorites = function(tripId) {
  const initialLength = this.favorites.trips.length;
  this.favorites.trips = this.favorites.trips.filter(
    id => id.toString() !== tripId.toString()
  );
  
  if (this.favorites.trips.length === initialLength) {
    throw new Error('Trip not found in favorites');
  }
  
  return this.save();
};

// Method to check if workshop is in favorites
userSchema.methods.isWorkshopInFavorites = function(workshopId) {
  return this.favorites.workshops.some(
    id => id.toString() === workshopId.toString()
  );
};

// Method to check if trip is in favorites
userSchema.methods.isTripInFavorites = function(tripId) {
  return this.favorites.trips.some(
    id => id.toString() === tripId.toString()
  );
};

// Method to toggle workshop favorite status
userSchema.methods.toggleWorkshopFavorite = function(workshopId) {
  const isInFavorites = this.isWorkshopInFavorites(workshopId);
  
  if (isInFavorites) {
    return this.removeWorkshopFromFavorites(workshopId).then(() => ({
      action: 'removed',
      isInFavorites: false
    }));
  } else {
    return this.addWorkshopToFavorites(workshopId).then(() => ({
      action: 'added',
      isInFavorites: true
    }));
  }
};

// Method to toggle trip favorite status
userSchema.methods.toggleTripFavorite = function(tripId) {
  const isInFavorites = this.isTripInFavorites(tripId);
  
  if (isInFavorites) {
    return this.removeTripFromFavorites(tripId).then(() => ({
      action: 'removed',
      isInFavorites: false
    }));
  } else {
    return this.addTripToFavorites(tripId).then(() => ({
      action: 'added',
      isInFavorites: true
    }));
  }
};

// Method to get all favorites with populated data
userSchema.methods.getPopulatedFavorites = function() {
  return this.populate('favorites.workshops')
             .populate('favorites.trips')
             .then(user => ({
               workshops: user.favorites.workshops,
               trips: user.favorites.trips,
               count: user.favoritesCount
             }));
};

// Method to get populated registrations with payment info
userSchema.methods.getPopulatedRegistrations = function() {
  return this.populate('eventRegistrations.workshops.workshopId')
             .populate('eventRegistrations.trips.tripId')
             .populate('eventRegistrations.workshops.paymentId')
             .populate('eventRegistrations.trips.paymentId')
             .then(user => ({
               workshops: user.eventRegistrations.workshops,
               trips: user.eventRegistrations.trips,
               walletBalance: user.walletBalance,
               totalSpent: user.totalSpent,
               totalRefunds: user.totalRefunds,
               availableRefundAmount: user.availableRefundAmount
             }));
};

// Method to clear all favorites
userSchema.methods.clearAllFavorites = function() {
  this.favorites.workshops = [];
  this.favorites.trips = [];
  return this.save();
};

// Method to clear workshop favorites only
userSchema.methods.clearWorkshopFavorites = function() {
  this.favorites.workshops = [];
  return this.save();
};

// Method to clear trip favorites only
userSchema.methods.clearTripFavorites = function() {
  this.favorites.trips = [];
  return this.save();
};

// Static method to find users who favorited a specific workshop
userSchema.statics.findUsersWhoFavoritedWorkshop = function(workshopId) {
  return this.find({
    'favorites.workshops': workshopId
  }).select('-password -verifyToken -resetOtp');
};

// Static method to find users who favorited a specific trip
userSchema.statics.findUsersWhoFavoritedTrip = function(tripId) {
  return this.find({
    'favorites.trips': tripId
  }).select('-password -verifyToken -resetOtp');
};

// Static method to find blocked users
userSchema.statics.findBlockedUsers = function() {
  return this.find({
    $or: [
      { isBlocked: true },
      { blockedUntil: { $gt: new Date() } }
    ]
  });
};

// Static method to find users by payment ID
userSchema.statics.findByPaymentId = function(paymentId) {
  return this.findOne({
    $or: [
      { 'eventRegistrations.workshops.paymentId': paymentId },
      { 'eventRegistrations.trips.paymentId': paymentId }
    ]
  });
};

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ isBlocked: 1, blockedUntil: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'eventRegistrations.workshops.workshopId': 1 });
userSchema.index({ 'eventRegistrations.trips.tripId': 1 });
userSchema.index({ 'eventRegistrations.workshops.paymentId': 1 });
userSchema.index({ 'eventRegistrations.trips.paymentId': 1 });
userSchema.index({ 'favorites.workshops': 1 });
userSchema.index({ 'favorites.trips': 1 });
userSchema.index({ 'transactionHistory.paymentId': 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;