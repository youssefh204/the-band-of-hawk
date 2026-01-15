import mongoose from "mongoose";

const bazaarSchema = new mongoose.Schema({
    bazaarName: {type: String, required: true, trim: true},
    location: {
        type: String,
        enum: ['GUC Cairo', 'GUC Berlin'],
        default: 'GUC Cairo',
        required: true
    },
     startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    Description: { type: String, default: '' },
    RegDeadline: {type: Date, required: true}
        ,
        // tokens generated for external visitors (QR tokens)
        externalTokens: [
            {
                token: { type: String },
                createdAt: { type: Date, default: Date.now },
                used: { type: Boolean, default: false },
                visitorName: { type: String, default: '' }
            }
        ],
        tickets: [{
  ticketId: String,
  scanned: { type: Boolean, default: false },
  scannedAt: Date
}]

},
{timestamps: true}
);
export default mongoose.model('Bazaar', bazaarSchema);
