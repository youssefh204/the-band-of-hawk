import mongoose from "mongoose";

const clubSchema = new mongoose.Schema({
    clubName: { type: String, required: true, trim: true },

    Genre: {
        type: String,
        enum: ['Art', 'Tech', 'Development', 'Other'],
        default: 'Tech',
        required: true
    },

    creationDate: { type: Date },

    Description: { type: String, default: '' },

    maxMemberNumbers: { type: Number, required: true },

    // ⭐ MEMBERS LIST
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],

    heads: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
},
{ timestamps: true });

export default mongoose.model("Club", clubSchema);
