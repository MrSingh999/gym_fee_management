import Member from "../models/Member.js";
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
      status: { $ne: "inactive" },
      endDate: { $gt: sevenDaysFromNow },
    }),
    Member.countDocuments({
      status: { $ne: "inactive" },
      endDate: { $gte: today, $lte: sevenDaysFromNow },
    }),
    Member.countDocuments({
      status: { $ne: "inactive" },
      endDate: { $lt: today },
    }),
    Member.countDocuments({ status: "inactive" }),
    Member.aggregate([
      { $match: { status: { $ne: "inactive" } } },
      { $group: { _id: null, total: { $sum: "$feeAmount" } } },
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
    status: { $ne: "inactive" },
    endDate: { $lte: sevenDaysFromNow },
  }).sort({ endDate: 1 });

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

  // 1. Text Search (name or phone)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  // 2. Filter by membershipType
  if (membershipType) {
    query.membershipType = membershipType;
  }

  // 3. Filter by status (we translate status filter to date queries)
  const { today, sevenDaysFromNow } = getDateRange();
  if (status) {
    if (status === "inactive") {
      query.status = "inactive";
    } else if (status === "overdue") {
      query.status = { $ne: "inactive" };
      query.endDate = { $lt: today };
    } else if (status === "due") {
      query.status = { $ne: "inactive" };
      query.endDate = { $gte: today, $lte: sevenDaysFromNow };
    } else if (status === "active") {
      query.status = { $ne: "inactive" };
      query.endDate = { $gt: sevenDaysFromNow };
    }
  }

  const members = await Member.find(query).sort({ createdAt: -1 });

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
  } = req.body;

  // Convert inputs
  const start = new Date(startDate || new Date());
  const end = new Date(start);

  // Calculate end date based on membership type (both Workout and Workout + Cardio are 1 month duration)
  if (membershipType === "workout" || membershipType === "workout + cardio") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  const newMember = new Member({
    name,
    gender,
    dob: new Date(dob),
    phone,
    email,
    membershipType,
    startDate: start,
    endDate: end,
    feeAmount: Number(feeAmount),
    status: "active",
    lastPaymentDate: new Date(),
  });

  const savedMember = await newMember.save();
  res.status(201).json(savedMember);
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

  // Set new start date to today, or if member is active, extend from current endDate, OR use custom startDate if provided
  let newStart;
  if (startDate) {
    newStart = new Date(startDate);
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentEnd = new Date(member.endDate);
    currentEnd.setHours(0, 0, 0, 0);
    newStart = currentEnd > today ? currentEnd : today;
  }
  const newEnd = new Date(newStart);

  if (months) {
    newEnd.setMonth(newEnd.getMonth() + Number(months));
  } else if (renewalType === "custom" && customDate) {
    newEnd.setTime(new Date(customDate).getTime());
  } else if (renewalType === "workout" || renewalType === "workout + cardio") {
    newEnd.setMonth(newEnd.getMonth() + 1);
  } else {
    throw new ErrorResponse("Invalid renewal type", 400);
  }

  if (membershipType) {
    member.membershipType = membershipType;
  }

  member.startDate = newStart;
  member.endDate = newEnd;
  member.status = "active"; // Mark active again
  member.lastPaymentDate = new Date();
  if (feeAmount) {
    member.feeAmount = Number(feeAmount);
  }

  const updatedMember = await member.save();
  res.json(updatedMember);
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

  // Apply updates
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      member[key] = updateData[key];
    }
  });

  const updatedMember = await member.save();
  res.json(updatedMember);
});

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Public
const deleteMember = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const deletedMember = await Member.findByIdAndDelete(id);
  if (!deletedMember) {
    throw new ErrorResponse("Member not found", 404);
  }
  res.json({ message: "Member deleted successfully", id });
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
};
