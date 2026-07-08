import React, { useState, useEffect, useRef } from "react";
import { X, Save, AlertCircle, Camera } from "lucide-react";
import { memberService } from "@/services/memberService";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import CropImageModal from "@/components/CropImageModal";
import ImageViewer from "@/components/ImageViewer";

import { useApp } from "@/context/AppContext";

export default function AddMemberModal() {
  const { isAddModalOpen: isOpen, closeAddModal: onClose, triggerRefresh: onSuccess } = useApp();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    dob: "",
    phone: "",
    email: "",
    membershipType: "strength training",
    startDate: new Date().toISOString().split("T")[0],
    feeAmount: "700",
    password: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [viewImageSrc, setViewImageSrc] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        gender: "Male",
        dob: "",
        phone: "",
        email: "",
        membershipType: "strength training",
        startDate: new Date().toISOString().split("T")[0],
        feeAmount: "700",
        password: "",
      });
      setProfilePicture(null);
      setProfilePreview(null);
      setCropImageSrc(null);
      setError(null);
    }
  }, [isOpen]);

  const handleTypeChange = (type) => {
    let price = "700";
    if (type === "strength and cardio") {
      price = "1000";
    } else if (type === "personal training") {
      price = "2000";
    }

    setFormData({
      ...formData,
      membershipType: type,
      feeAmount: price,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }
    setCropImageSrc(URL.createObjectURL(file));
    setError(null);
  };

  const handleCropComplete = (croppedFile) => {
    setProfilePicture(croppedFile);
    setProfilePreview(URL.createObjectURL(croppedFile));
    setCropImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.phone || !formData.dob || !formData.feeAmount) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData, feeAmount: Number(formData.feeAmount) };
      if (profilePicture) {
        const formDataPayload = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          formDataPayload.append(key, val);
        });
        formDataPayload.append("profilePicture", profilePicture);
        await memberService.createMember(formDataPayload);
      } else {
        await memberService.createMember(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while registering the member.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] px-4 py-2.5 text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-gym-orange transition-all duration-200";
  const labelClass = "text-[11px] font-bold text-(--text-muted) uppercase tracking-wider";
  const selectTriggerClass = "w-full bg-white/[0.03] border border-(--border-color) rounded-[6px] px-4 py-2.5 h-auto text-sm text-(--text-primary) cursor-pointer hover:border-(--border-color-hover) focus:border-gym-orange transition-all duration-200";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto modal-backdrop" 
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="glass-panel w-full max-w-2xl rounded-[16px] shadow-2xl overflow-hidden border border-(--border-color-hover) my-auto max-h-[90vh] md:max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Modal Header */}
        <div className="relative flex justify-between items-center px-6 py-4 border-b border-(--border-color) shrink-0">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gym-orange/30 to-transparent"></div>
          <h2 className="font-bold text-lg text-(--text-primary)">
            Register New Member
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-(--text-secondary) hover:text-(--text-primary) rounded-[6px] hover:bg-(--bg-elevated) transition-all duration-200 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="flex items-start space-x-2.5 p-3 bg-red-500/[0.06] border border-red-500/15 text-red-400 rounded-[6px] text-sm animate-fade-in" role="alert">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="text-[13px]">{error}</span>
              </div>
            )}

            {/* Profile Photo Upload */}
            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-(--border-color) hover:border-gym-orange transition-all duration-200 cursor-pointer"
              >
                {profilePreview ? (
                  <img src={profilePreview} alt="Preview" className="w-full h-full object-cover cursor-pointer" onClick={(e) => { e.stopPropagation(); setViewImageSrc(profilePreview); }} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-(--text-muted) group-hover:text-gym-orange transition-colors duration-200">
                    <Camera className="h-5 w-5" />
                    <span className="text-[8px] font-mono mt-1">Photo</span>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className={inputClass}
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className={labelClass}>Gender *</label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-(--bg-card) backdrop-blur-xl border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <label className={labelClass}>Date of Birth *</label>
                <DatePicker
                  value={formData.dob}
                  onChange={(val) => setFormData({ ...formData, dob: val })}
                  placeholder="Select date of birth"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className={labelClass}>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={inputClass}
                />
              </div>

              {/* Membership Plan */}
              <div className="space-y-1.5">
                <label className={labelClass}>Membership Plan *</label>
                <Select
                  value={formData.membershipType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-(--bg-card) backdrop-blur-xl border border-(--border-color-hover) rounded-[6px] shadow-2xl">
                    <SelectItem value="strength training">Strength Training</SelectItem>
                    <SelectItem value="strength and cardio">Strength & Cardio</SelectItem>
                    <SelectItem value="personal training">Personal Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Membership Price */}
              <div className="space-y-1.5">
                <label className={labelClass}>Fee (₹) *</label>
                <input
                  type="number"
                  name="feeAmount"
                  required
                  min="0"
                  value={formData.feeAmount}
                  onChange={handleChange}
                  placeholder="Amount in Rupees"
                  className={inputClass}
                />
              </div>

              {/* Membership Start Date */}
              <div className="space-y-1.5">
                <label className={labelClass}>Start Date *</label>
                <DatePicker
                  value={formData.startDate}
                  onChange={(val) => setFormData({ ...formData, startDate: val })}
                  placeholder="Select start date"
                  required
                />
              </div>

              {/* Member Password */}
              <div className="space-y-1.5">
                <label className={labelClass}>Login Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Default: member123"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end space-x-3 p-4 sm:p-6 border-t border-(--border-color) shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[6px] border border-(--border-color) hover:bg-(--bg-elevated) text-sm font-semibold text-(--text-secondary) hover:text-(--text-primary) transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-gym-action-text px-5 py-2.5 rounded-[6px] text-sm font-semibold transition-all duration-200 shadow-lg shadow-gym-orange/15 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? "Registering..." : "Register Member"}</span>
            </button>
          </div>
          </form>
        </motion.div>
      </motion.div>
      )}
      {profilePreview && (
        <ImageViewer
          isOpen={!!viewImageSrc}
          onClose={() => setViewImageSrc(null)}
          src={viewImageSrc}
          alt="Profile photo preview"
        />
      )}
      <CropImageModal
        isOpen={!!cropImageSrc}
        onClose={() => { setCropImageSrc(null); fileInputRef.current.value = ""; }}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
      />
    </AnimatePresence>
  );
}
