'use client';

import { useState } from 'react';

interface ExternalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  businessName: string;
  destination: string;
}

export default function ExternalLinkModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  businessName,
  destination 
}: ExternalLinkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-deep-earth-brown/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F5F1E8] rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border-2 border-soft-gray-green/20">
        <div className="p-6">
          <h3 className="text-xl font-heading font-bold text-deep-earth-brown mb-2">Leaving Lokal</h3>
          <p className="text-deep-earth-brown/80 font-body mb-6">
            You're leaving Lokal to visit <span className="font-semibold text-forest-green">{businessName}</span>'s {destination}. While we vet all businesses, please exercise standard online caution.
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border-2 border-forest-green text-forest-green font-body font-medium hover:bg-forest-green/10 transition-colors"
            >
              Stay on Lokal
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-forest-green text-cream font-body font-medium hover:bg-forest-green/90 transition-colors shadow-md"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

