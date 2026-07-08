import express from "express";
import { body } from "express-validator";
import {
  getStats,
  getDueMembers,
  getMembers,
  createMember,
  renewMember,
  updateMember,
  deleteMember,
  getMemberPayments,
} from "../controllers/memberController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validator.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Admin-only operations
router.get("/dashboard/stats", admin, getStats);
router.get("/due", admin, getDueMembers);
router.get("/", admin, getMembers);

router.post(
  "/",
  admin,
  upload.single("profilePicture"),
  [
    body("name").notEmpty().withMessage("Name is required").trim(),
    body("gender").isIn(["Male", "Female", "Other"]).withMessage("Gender must be Male, Female, or Other"),
    body("dob").isISO8601().withMessage("Please provide a valid date of birth"),
    body("phone").notEmpty().withMessage("Phone number is required").trim(),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Please provide a valid email address"),
    body("membershipType").notEmpty().withMessage("Membership plan type is required").trim(),
    body("startDate").optional({ checkFalsy: true }).isISO8601().withMessage("Please provide a valid start date"),
    validateRequest,
  ],
  createMember
);

router.put(
  "/:id/renew",
  [
    admin,
    body("renewalType")
      .optional()
      .isIn(["standard", "custom", "months"])
      .withMessage("Renewal type must be standard, custom, or months"),
    body("customDate").optional({ checkFalsy: true }).isISO8601().withMessage("Please provide a valid custom end date"),
    body("months").optional().isNumeric().withMessage("Months must be a number"),
    body("membershipType").optional().trim(),
    body("startDate").optional({ checkFalsy: true }).isISO8601().withMessage("Please provide a valid start date"),
    validateRequest,
  ],
  renewMember
);

router.put(
  "/:id",
  admin,
  upload.single("profilePicture"),
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty").trim(),
    body("gender")
      .optional()
      .isIn(["Male", "Female", "Other"])
      .withMessage("Gender must be Male, Female, or Other"),
    body("dob").optional().isISO8601().withMessage("Please provide a valid date of birth"),
    body("phone").optional().notEmpty().withMessage("Phone number cannot be empty").trim(),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Please provide a valid email address"),
    body("membershipType").optional().notEmpty().withMessage("Membership plan type cannot be empty").trim(),
    body("startDate").optional({ checkFalsy: true }).isISO8601().withMessage("Please provide a valid start date"),
    body("endDate").optional({ checkFalsy: true }).isISO8601().withMessage("Please provide a valid end date"),
    body("status")
      .optional()
      .isIn(["Active", "Expired", "Inactive", "active", "expired", "inactive", "due", "overdue", "Due", "Overdue"])
      .withMessage("Invalid status value"),
    validateRequest,
  ],
  updateMember
);

router.delete("/:id", admin, deleteMember);

// Member or Admin operations
router.get("/:id/payments", getMemberPayments);

export default router;
