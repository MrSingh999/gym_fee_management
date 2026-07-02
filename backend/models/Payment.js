import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
{
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: [true, 'Member reference is required']
    },

    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan"
    },

    amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: [0, 'Amount cannot be negative']
    },

    paymentDate: {
        type: Date,
        default: Date.now
    },

    startDate: Date,

    endDate: Date,

    paymentMethod: {
        type: String,
        enum: ["Cash", "UPI", "Card", "Bank"],
        default: "Cash"
    },

    remarks: String
},
{
    timestamps: true
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
