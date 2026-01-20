import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, CheckCircle, Calendar } from 'lucide-react';

export default function ClaimedRewardCard({ claimedBonus, reward, gym }) {
  const [showQR, setShowQR] = useState(false);

  const redemptionCode = claimedBonus.redemption_code || claimedBonus.id.slice(0, 8).toUpperCase();
  const redemptionUrl = `${window.location.origin}${window.location.pathname}#/RedeemReward?code=${redemptionCode}`;
  const qrData = redemptionUrl;

  return (
    <>
      <Card className={`p-5 border-2 ${claimedBonus.redeemed ? 'border-gray-300 bg-gray-100 opacity-75' : 'border-green-200 bg-green-50/50'}`}>
        <div className="flex items-start gap-4">
          <div className="text-4xl">{reward?.icon || '🎁'}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  {reward?.title || claimedBonus.offer_details}
                  {claimedBonus.redeemed ? (
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full font-bold">
                      Redeemed
                    </span>
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">{gym?.name || 'Gym'}</p>
              </div>
              {reward?.value && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {reward.value}
                </span>
              )}
            </div>
            
            {reward?.description && (
              <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>Claimed {new Date(claimedBonus.created_date).toLocaleDateString()}</span>
                </div>
                {claimedBonus.redeemed && claimedBonus.redeemed_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Redeemed {new Date(claimedBonus.redeemed_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {!claimedBonus.redeemed && (
                <Button
                  size="sm"
                  onClick={() => setShowQR(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  Show QR
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Reward Verification</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-2xl shadow-lg border-4 border-green-500">
              <QRCode
                value={qrData}
                size={200}
                level="H"
              />
            </div>
            
            <div className="text-center">
              <p className="font-bold text-gray-900 mb-1">{reward?.title || claimedBonus.offer_details}</p>
              <p className="text-sm text-gray-600">{gym?.name}</p>
            </div>
            
            <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-600 font-medium mb-2">Show this code to gym staff</p>
              <p className="text-lg font-black text-gray-900 tracking-wider mb-1">{redemptionCode}</p>
              <p className="text-xs text-gray-500">Valid until redeemed</p>
            </div>
            
            <Button
              onClick={() => setShowQR(false)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}