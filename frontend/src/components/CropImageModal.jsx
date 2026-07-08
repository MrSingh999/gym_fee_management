import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const maxSize = Math.max(pixelCrop.width, pixelCrop.height);
  canvas.width = maxSize;
  canvas.height = maxSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    maxSize,
    maxSize,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 0.9);
  });
};

export default function CropImageModal({ isOpen, onClose, imageSrc, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((location) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((z) => {
    setZoom(z);
  }, []);

  const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      onCropComplete(file);
      onClose();
    } catch (err) {
      console.error("Crop failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="glass-panel w-full max-w-lg rounded-[16px] overflow-hidden border border-(--border-color-hover) flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex justify-between items-center px-5 py-3 border-b border-(--border-color) shrink-0">
              <h2 className="font-bold text-base text-(--text-primary)">Crop Photo</h2>
              <button
                onClick={onClose}
                className="p-1 text-(--text-secondary) hover:text-(--text-primary) rounded-[6px] hover:bg-(--bg-elevated) transition-all duration-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative w-full h-72 bg-black/40">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={true}
                  onCropChange={onCropChange}
                  onZoomChange={onZoomChange}
                  onCropComplete={onCropAreaComplete}
                />
              )}
            </div>

            <div className="px-5 py-3">
              <label className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider font-mono block mb-1.5">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-gym-orange"
              />
            </div>

            <div className="flex justify-end space-x-3 px-5 py-3 border-t border-(--border-color) shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-[6px] border border-(--border-color) hover:bg-(--bg-elevated) text-sm font-semibold text-(--text-secondary) hover:text-(--text-primary) transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className="flex items-center space-x-1.5 bg-gym-orange hover:bg-gym-orange-hover disabled:opacity-50 text-gym-action-text px-4 py-2 rounded-[6px] text-sm font-semibold transition-all duration-200 shadow-lg shadow-gym-orange/15 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>{processing ? "Processing..." : "Apply"}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
