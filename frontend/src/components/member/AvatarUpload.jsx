import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { motion, AnimatePresence } from "framer-motion";

export default function AvatarUpload() {
  const { user, updateProfilePicture } = useAuth();
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      setUploadSuccess(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size cannot exceed 5MB.");
      setUploadSuccess(null);
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const response = await authService.uploadProfilePicture(formData);
      if (response.success) {
        updateProfilePicture(response.profilePicture);
        setUploadSuccess("Profile picture updated!");
      }
    } catch (err) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4 bg-gym-dark/20 border border-(--border-color)/30 p-3 sm:p-4 rounded-[12px] animate-fade-in">
      <div
        onClick={() => ref.current?.click()}
        className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gym-orange/30 shadow-md cursor-pointer shrink-0 transition-all duration-300 hover:border-gym-orange/70"
      >
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gym-orange/10 to-orange-500/20 text-gym-orange flex items-center justify-center text-lg sm:text-xl font-black uppercase">
            {user.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span className="text-[9px] text-white font-bold uppercase mt-0.5">Change</span>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-gym-orange animate-spin" />
          </div>
        )}
      </div>
      <div className="flex-1 text-left space-y-0.5">
        <h4 className="font-bold text-sm sm:text-base text-(--text-primary)">Profile Picture</h4>
        <p className="text-[11px] text-(--text-muted)">Click to upload. JPG, PNG, WEBP. Max 5MB.</p>
        <input type="file" ref={ref} onChange={handleFileChange} accept="image/*" className="hidden" disabled={uploading} />
        <AnimatePresence mode="wait">
          {uploadError && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400 font-semibold">{uploadError}</motion.p>}
          {uploadSuccess && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-emerald-400 font-semibold">{uploadSuccess}</motion.p>}
        </AnimatePresence>
      </div>
    </div>
  );
}
