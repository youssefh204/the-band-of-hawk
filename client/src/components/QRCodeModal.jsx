import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function QRCodeModal({ isOpen, onClose, qrData, title = "Visitor QR Code" }) {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !qrData) return null;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(qrData.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrData.checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    // Create a temporary link element to download the QR code
    const link = document.createElement('a');
    link.href = qrData.qrDataUrl;
    link.download = `${title.replace(/\s+/g, '_')}_QR_${qrData.token.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 text-center">
              {title}
            </h2>

            {/* QR Code Display */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl">
              <img 
                src={qrData.qrDataUrl} 
                alt="QR Code" 
                className="w-full h-auto mx-auto"
                style={{ maxWidth: '300px' }}
              />
            </div>

            {/* Token Display */}
            <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm font-medium">Access Token:</span>
                <button
                  onClick={handleCopyToken}
                  className="text-xs px-3 py-1 bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 rounded-lg transition-all flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <code className="text-white font-mono text-sm break-all block bg-black/30 px-3 py-2 rounded-lg">
                {qrData.token}
              </code>
            </div>

            {/* URL Display */}
            {qrData.checkinUrl && (
              <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Check-in URL:</span>
                  <button
                    onClick={handleCopyUrl}
                    className="text-xs px-3 py-1 bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 rounded-lg transition-all flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <code className="text-white/80 font-mono text-xs break-all block bg-black/30 px-3 py-2 rounded-lg">
                  {qrData.checkinUrl}
                </code>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                {downloadSuccess ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                    Downloaded!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download QR
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all"
              >
                Close
              </button>
            </div>

            {/* Info Text */}
            <p className="text-white/50 text-xs text-center mt-4">
              💡 Share this QR code or token with visitors for easy check-in
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
