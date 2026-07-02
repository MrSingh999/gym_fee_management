import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true
    },

    price: {
        type: Number,
        required: [true, 'Plan price is required'],
        min: [0, 'Price cannot be negative']
    },

    durationDays: {
        type: Number,
        default: 30
    },

    description: String,

    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
