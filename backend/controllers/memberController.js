import mongoose from "mongoose";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";
import Payment from "../models/Payment.js";
import { getDateRange } from "../utils/dateHelpers.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";

// @desc    Get KPI stats
// @route   GET /api/members/dashboard/stats
// @access  Public
const getStats = asyncHandler(async (req, res, next) => {
  const { today, sevenDaysFromNow } = getDateRange();

  // Run queries in parallel for efficiency
  const [
    totalCount,
    activeCount,
    dueCount,
    overdueCount,
    inactiveCount,
    revenueResult,
  ] = await Promise.all([
    Member.countDocuments(),
    Member.countDocuments({
      status: { $nin: ["Inactive", "inactive"] },
      feeEndDate: { $gt: sevenDaysFromNow },
    }),
    Member.countDocuments({
      status: { $nin: ["Inactive", "inactive"] },
      feeEndDate: { $gte: today, $lte: sevenDaysFromNow },
    }),
    Member.countDocuments({
      status: { $nin: ["Inactive", "inactive"] },
      feeEndDate: { $lt: today },
    }),
    Member.countDocuments({ status: { $in: ["Inactive", "inactive"] } }),
    Member.aggregate([
      { $match: { status: { $nin: ["Inactive", "inactive"] } } },
      {
        $lookup: {
          from: "plans",
          localField: "plan",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      { $unwind: "$planDetails" },
      { $group: { _id: null, total: { $sum: "$planDetails.price" } } },
    ]),
  ]);

  const estimatedRevenue =
    revenueResult.length > 0 ? revenueResult[0].total : 0;

  res.json({
    total: totalCount,
    active: activeCount,
    due: dueCount,
    overdue: overdueCount,
    inactive: inactiveCount,
    estimatedRevenue,
  });
});

// @desc    Get members with due or overdue memberships
// @route   GET /api/members/due
// @access  Public
const getDueMembers = asyncHandler(async (req, res, next) => {
  const { today, sevenDaysFromNow } = getDateRange();

  // Query for due (within 7 days) or overdue (end date in the past)
  const members = await Member.find({
    status: { $nin: ["Inactive", "inactive"] },
    feeEndDate: { $lte: sevenDaysFromNow },
  })
    .populate("plan")
    .sort({ feeEndDate: 1 });

  // Sync computedStatus with status field in the output
  const formattedMembers = members.map((member) => {
    const m = member.toObject();
    m.status = member.computedStatus;
    return m;
  });

  res.json(formattedMembers);
});

// @desc    Get all members with filters and search
// @route   GET /api/members
// @access  Public
const getMembers = asyncHandler(async (req, res, next) => {
  const { search, status, membershipType } = req.query;
  const query = {};

  // 1. Text Search (name or phone/mobile)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  // 2. Filter by membershipType via plan name
  if (membershipType) {
    const plan = await Plan.findOne({
      name: { $regex: new RegExp(`^${membershipType}$`, "i") },
    });
    if (plan) {
      query.plan = plan._id;
    } else {
      // Force empty array response if search plan is not registered
      query.plan = new mongoose.Types.ObjectId();
    }
  }

  // 3. Filter by status (we translate status filter to date queries)
  const { today, sevenDaysFromNow } = getDateRange();
  if (status) {
    if (status === "inactive") {
      query.status = "Inactive";
    } else if (status === "overdue") {
      query.status = { $nin: ["Inactive", "inactive"] };
      query.feeEndDate = { $lt: today };
    } else if (status === "due") {
      query.status = { $nin: ["Inactive", "inactive"] };
      query.feeEndDate = { $gte: today, $lte: sevenDaysFromNow };
    } else if (status === "active") {
      query.status = { $nin: ["Inactive", "inactive"] };
      query.feeEndDate = { $gt: sevenDaysFromNow };
    }
  }

  const members = await Member.find(query)
    .populate("plan")
    .sort({ createdAt: -1 });

  // Sync computedStatus with status field in the output
  const formattedMembers = members.map((member) => {
    const m = member.toObject();
    m.status = member.computedStatus;
    return m;
  });

  res.json(formattedMembers);
});

// @desc    Register a new member
// @route   POST /api/members
// @access  Public
const createMember = asyncHandler(async (req, res, next) => {
  const {
    name,
    gender,
    dob,
    phone,
    email,
    membershipType,
    startDate,
    feeAmount,
    password,
  } = req.body;

  // Resolve matching Plan doc
  let planDoc = await Plan.findOne({
    name: { $regex: new RegExp(`^${membershipType}$`, "i") },
  });
  if (!planDoc) {
    // Fallback default
    planDoc = await Plan.findOne();
  }

  if (!planDoc) {
    throw new ErrorResponse(
      "No gym membership plans configured in database.",
      500,
    );
  }

  // Convert inputs
  const start = new Date(startDate || new Date());
  const end = new Date(start);

  // Calculate end date based on durationDays configured in the plan
  end.setDate(end.getDate() + planDoc.durationDays);

  const newMember = new Member({
    name,
    gender,
    dob: new Date(dob),
    mobile: phone, // maps to mobile
    email: email || undefined,
    plan: planDoc._id,
    feeStartDate: start,
    feeEndDate: end,
    status: "Active",
    lastPaymentDate: new Date(),
    password: password || undefined, // falls back to Mongoose default if empty/undefined
  });

  const savedMember = await newMember.save();

  // Log Payment collection entry
  await Payment.create({
    member: savedMember._id,
    plan: planDoc._id,
    amount: Number(feeAmount || planDoc.price),
    startDate: start,
    endDate: end,
    paymentMethod: "Cash",
    remarks: "Initial Gym Registration Payment",
  });

  const populated = await Member.findById(savedMember._id).populate("plan");

  // Sync computedStatus with status field in output
  const output = populated.toObject();
  output.status = populated.computedStatus;

  res.status(201).json(output);
});

// @desc    Renew / extend membership
// @route   PUT /api/members/:id/renew
// @access  Public
const renewMember = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    renewalType,
    customDate,
    feeAmount,
    months,
    membershipType,
    startDate,
  } = req.body;

  const member = await Member.findById(id);
  if (!member) {
    throw new ErrorResponse("Member not found", 404);
  }

  // Resolve target Plan
  let planDoc;
  if (membershipType) {
    planDoc = await Plan.findOne({
      name: { $regex: new RegExp(`^${membershipType}$`, "i") },
    });
  }
  if (!planDoc) {
    planDoc = await Plan.findById(member.plan);
  }
  if (!planDoc) {
    planDoc = await Plan.findOne();
  }

  // Set new start date to today, or if member is active, extend from current feeEndDate
  let newStart;
  if (startDate) {
    newStart = new Date(startDate);
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentEnd = new Date(member.feeEndDate);
    currentEnd.setHours(0, 0, 0, 0);
    newStart = currentEnd > today ? currentEnd : today;
  }
  const newEnd = new Date(newStart);

  if (months) {
    newEnd.setMonth(newEnd.getMonth() + Number(months));
  } else if (renewalType === "custom" && customDate) {
    newEnd.setTime(new Date(customDate).getTime());
  } else if (planDoc) {
    newEnd.setDate(newEnd.getDate() + planDoc.durationDays);
  } else {
    newEnd.setMonth(newEnd.getMonth() + 1);
  }

  if (planDoc) {
    member.plan = planDoc._id;
  }
  member.feeStartDate = newStart;
  member.feeEndDate = newEnd;
  member.status = "Active"; // reset to active
  member.lastPaymentDate = new Date();

  await member.save();

  // Log Payment collection entry for renewal
  await Payment.create({
    member: member._id,
    plan: planDoc ? planDoc._id : undefined,
    amount: Number(feeAmount || (planDoc ? planDoc.price : 0)),
    startDate: newStart,
    endDate: newEnd,
    paymentMethod: "Cash",
    remarks: `Membership Renewal: ${months ? months + " Months" : "Custom Term"}`,
  });

  const populated = await Member.findById(member._id).populate("plan");

  // Sync computedStatus with status field in output
  const output = populated.toObject();
  output.status = populated.computedStatus;

  res.json(output);
});

// @desc    Update member details
// @route   PUT /api/members/:id
// @access  Public
const updateMember = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const member = await Member.findById(id);
  if (!member) {
    throw new ErrorResponse("Member not found", 404);
  }

  // Resolve plan updates
  if (updateData.membershipType) {
    const planDoc = await Plan.findOne({
      name: { $regex: new RegExp(`^${updateData.membershipType}$`, "i") },
    });
    if (planDoc) {
      member.plan = planDoc._id;
    }
  }

  // Update compatibility fields
  if (updateData.phone) {
    member.mobile = updateData.phone;
  }
  if (updateData.startDate) {
    member.feeStartDate = updateData.startDate;
  }
  if (updateData.endDate) {
    member.feeEndDate = updateData.endDate;
  }

  if (updateData.status) {
    const s = updateData.status.toLowerCase();
    if (s === "inactive") {
      member.status = "Inactive";
    } else if (s === "expired" || s === "overdue") {
      member.status = "Expired";
    } else {
      member.status = "Active";
    }
  }

  // Apply general updates
  Object.keys(updateData).forEach((key) => {
    // Skip mapped fields handled separately
    if (
      updateData[key] !== undefined &&
      !["membershipType", "phone", "startDate", "endDate", "status"].includes(
        key,
      )
    ) {
      member[key] = updateData[key];
    }
  });

  await member.save();

  const populated = await Member.findById(member._id).populate("plan");

  // Sync computedStatus with status field in output
  const output = populated.toObject();
  output.status = populated.computedStatus;

  res.json(output);
});

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Public
const deleteMember = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Clean payment history of this member as well
  await Payment.deleteMany({ member: id });

  const deletedMember = await Member.findByIdAndDelete(id);
  if (!deletedMember) {
    throw new ErrorResponse("Member not found", 404);
  }
  res.json({ message: "Member deleted successfully", id });
});

// @desc    Get payments for a specific member
// @route   GET /api/members/:id/payments
// @access  Public
const getMemberPayments = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Restrict payment details to the owner or admins
  if (req.user.role !== "admin" && req.user._id.toString() !== id) {
    throw new ErrorResponse(
      "Not authorized to access these payment records",
      403,
    );
  }

  const member = await Member.findById(id);
  if (!member) {
    throw new ErrorResponse("Member not found", 404);
  }

  const payments = await Payment.find({ member: id })
    .populate("plan")
    .sort({ paymentDate: -1 });

  res.json(payments);
});

// Grouped exports at the bottom
export {
  getStats,
  getDueMembers,
  getMembers,
  createMember,
  renewMember,
  updateMember,
  deleteMember,
  getMemberPayments,
};
