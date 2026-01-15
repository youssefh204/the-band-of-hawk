import mongoose from "mongoose";

const TripSchema = new mongoose.Schema(
{
    tripName: { type: String, required: true, trim: true },
    Destination: { type: String, default: 'GUC Cairo', required: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    price: { type: Number, default: 0, min: 0, required: true },
    capacity: { type: Number, required: true },
    deadlineRegDate: { type: Date, required: true },
    description: { type: String, default: '' },

    Travelers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String },
        email: { type: String },
        registeredAt: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ["registered", "cancelled", "attended", "waitlisted"],
            default: "registered"
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "refunded"],
            default: "pending"
        },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
        amountPaid: { type: Number, default: 0 }
    }],

    allowedRoles: { type: [String], default: [] },
    averageRating: { type: Number, default: 0 },

    currentRegistrations: { type: Number, default: 0 },
    totalRegistrations: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ["active", "cancelled", "completed"],
        default: "active"
    }
},
{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========== Virtuals ========== //
TripSchema.virtual('availableSpots').get(function() {
    return Math.max(0, this.capacity - this.currentRegistrations);
});

TripSchema.virtual('isFull').get(function() {
    return this.currentRegistrations >= this.capacity;
});

TripSchema.virtual('isRegistrationOpen').get(function() {
    return new Date() <= this.deadlineRegDate && this.isActive && this.status === "active";
});

TripSchema.virtual('activeTravelers').get(function() {
    return this.Travelers.filter(t => t.status === "registered");
});

TripSchema.virtual('waitlistedTravelers').get(function() {
    return this.Travelers.filter(t => t.status === "waitlisted");
});

TripSchema.virtual('paidTravelers').get(function() {
    return this.Travelers.filter(t => t.paymentStatus === "paid");
});

TripSchema.virtual('totalRevenue').get(function() {
    return this.Travelers.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
});

// ========== Methods ========== //
TripSchema.methods.registerUser = function(userId, userInfo = {}, paymentId = null, amountPaid = 0) {
    if (!this.isRegistrationOpen) throw new Error('Registration is closed');

    const exists = this.Travelers.find(t =>
        t.userId.toString() === userId.toString() &&
        (t.status === "registered" || t.status === "waitlisted")
    );
    if (exists) throw new Error('User already registered');

    if (this.isFull) {
        this.Travelers.push({
            userId,
            userName: userInfo.userName,
            email: userInfo.email,
            status: "waitlisted",
            paymentId,
            amountPaid,
            paymentStatus: amountPaid > 0 ? "paid" : "pending"
        });

        return this.save().then(trip => ({ status: "waitlisted", trip }));
    }

    this.Travelers.push({
        userId,
        userName: userInfo.userName,
        email: userInfo.email,
        status: "registered",
        paymentId,
        amountPaid,
        paymentStatus: amountPaid > 0 ? "paid" : "pending"
    });

    this.currentRegistrations++;
    this.totalRegistrations++;
    return this.save().then(trip => ({ status: "registered", trip }));
};


TripSchema.methods.cancelUserRegistration = function(userId, refundAmount = 0) {
    const traveler = this.Travelers.find(t =>
        t.userId.toString() === userId.toString() &&
        (t.status === "registered" || t.status === "waitlisted")
    );
    if (!traveler) throw new Error('User not registered');

    const wasRegistered = traveler.status === "registered";
    traveler.status = "cancelled";

    if (refundAmount > 0) traveler.paymentStatus = "refunded";

    if (wasRegistered) {
        this.currentRegistrations = Math.max(0, this.currentRegistrations - 1);

        const waitlisted = this.Travelers.find(t => t.status === "waitlisted");
        if (waitlisted && this.currentRegistrations < this.capacity) {
            waitlisted.status = "registered";
            this.currentRegistrations++;
        }
    }

    return this.save();
};

TripSchema.methods.markAsAttended = function(userId) {
    const t = this.Travelers.find(tr => tr.userId.toString() === userId.toString());
    if (!t) throw new Error('User not found');
    t.status = "attended";
    return this.save();
};

TripSchema.methods.updatePaymentStatus = function(userId, paymentStatus, paymentId = null, amountPaid = 0) {
    const t = this.Travelers.find(tr => tr.userId.toString() === userId.toString());
    if (!t) throw new Error('User not found');

    t.paymentStatus = paymentStatus;
    if (paymentId) t.paymentId = paymentId;
    if (amountPaid > 0) t.amountPaid = amountPaid;

    return this.save();
};

TripSchema.methods.getUserRegistration = function(userId) {
    return this.Travelers.find(t => t.userId.toString() === userId.toString());
};

// ========== Statics ========== //
TripSchema.statics.findActiveTrips = function() {
    return this.find({
        isActive: true,
        status: "active",
        deadlineRegDate: { $gte: new Date() }
    });
};

TripSchema.statics.findWithAvailableSpots = function() {
    return this.find({
        currentRegistrations: { $lt: this.capacity },
        isActive: true,
        status: "active"
    });
};

TripSchema.statics.findByStatus = function(status) {
    return this.find({ status });
};

TripSchema.statics.findTripsRequiringPayment = function() {
    return this.find({
        price: { $gt: 0 },
        isActive: true,
        status: "active"
    });
};

// ========== Indexes ========== //
TripSchema.index({ startDateTime: 1 });
TripSchema.index({ deadlineRegDate: 1 });
TripSchema.index({ isActive: 1 });
TripSchema.index({ status: 1 });
TripSchema.index({ 'Travelers.userId': 1 });
TripSchema.index({ 'Travelers.paymentId': 1 });
TripSchema.index({ currentRegistrations: 1 });
TripSchema.index({ price: 1 });

export default mongoose.model('Trip', TripSchema);
