import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function QRScanner({ open, onClose }) {
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(
        (decodedText) => {
          // Extract code from URL or use directly
          let code = decodedText;
          if (decodedText.includes('code=')) {
            const urlParams = new URLSearchParams(decodedText.split('?')[1]);
            code = urlParams.get('code');
          }
          
          scanner.clear();
          scannerRef.current = null;
          onClose();
          navigate(createPageUrl('RedeemReward') + '?code=' + code);
        },
        (error) => {
          // Ignore errors - they happen continuously while scanning
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onClose, navigate]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Scan QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div id="qr-reader" className="w-full"></div>
          <p className="text-center text-sm text-gray-600 mt-4">
            Position the QR code within the frame to scan
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}