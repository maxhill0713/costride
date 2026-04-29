import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EditBasicInfoModal({ open, onClose, gym, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: gym?.name || '',
    type: gym?.type || '',
    address: gym?.address || '',
    city: gym?.city || '',
    postcode: gym?.postcode || '',
    price: gym?.price || ''
  });
  const [geoStatus, setGeoStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [resolvedCoords, setResolvedCoords] = useState(null);
  const geocodeTimer = useRef(null);

  useEffect(() => {
    if (open && gym) {
      setFormData({
        name: gym.name || '',
        type: gym.type || '',
        address: gym.address || '',
        city: gym.city || '',
        postcode: gym.postcode || '',
        price: gym.price || ''
      });
      setGeoStatus(null);
      setResolvedCoords(null);
    }
  }, [open, gym?.id]);

  // Auto-geocode whenever address fields change (debounced 900ms)
  useEffect(() => {
    const { address, city, postcode } = formData;
    const hasAddress = address || city || postcode;

    // Don't re-geocode if nothing changed from original
    const sameAsOriginal =
      address === (gym?.address || '') &&
      city    === (gym?.city    || '') &&
      postcode === (gym?.postcode || '');

    if (!hasAddress || sameAsOriginal) {
      setGeoStatus(null);
      setResolvedCoords(null);
      clearTimeout(geocodeTimer.current);
      return;
    }

    clearTimeout(geocodeTimer.current);
    setGeoStatus('loading');
    geocodeTimer.current = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke('geocodeAddress', { address, city, postcode });
        const { latitude, longitude } = res.data;
        setResolvedCoords({ latitude, longitude });
        setGeoStatus('success');
      } catch {
        setResolvedCoords(null);
        setGeoStatus('error');
      }
    }, 900);

    return () => clearTimeout(geocodeTimer.current);
  }, [formData.address, formData.city, formData.postcode]);

  const gymTypes = ['powerlifting', 'bodybuilding', 'crossfit', 'boxing', 'mma', 'general'];

  const handleSubmit = () => {
    const saveData = { ...formData };
    if (resolvedCoords) {
      saveData.latitude = resolvedCoords.latitude;
      saveData.longitude = resolvedCoords.longitude;
    }
    onSave(saveData);
  };

  const locationChanged =
    formData.address  !== (gym?.address  || '') ||
    formData.city     !== (gym?.city     || '') ||
    formData.postcode !== (gym?.postcode || '');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Gym Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Gym Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter gym name"
            />
          </div>

          <div>
            <Label htmlFor="type">Gym Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select gym type" />
              </SelectTrigger>
              <SelectContent>
                {gymTypes.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                placeholder="Postcode"
              />
            </div>
          </div>

          {/* Location geocoding status — only shown when address changed */}
          {locationChanged && (
            <div
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
              style={{
                background:
                  geoStatus === 'success' ? 'rgba(34,197,94,0.08)'  :
                  geoStatus === 'error'   ? 'rgba(255,77,109,0.08)' :
                  'rgba(77,127,255,0.08)',
                border: `1px solid ${
                  geoStatus === 'success' ? 'rgba(34,197,94,0.25)'  :
                  geoStatus === 'error'   ? 'rgba(255,77,109,0.25)' :
                  'rgba(77,127,255,0.25)'
                }`,
              }}
            >
              {geoStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#4d7fff', flexShrink: 0 }} />}
              {geoStatus === 'success' && <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e', flexShrink: 0 }} />}
              {geoStatus === 'error'   && <AlertCircle  className="w-4 h-4" style={{ color: '#ff4d6d', flexShrink: 0 }} />}
              {!geoStatus && <MapPin className="w-4 h-4" style={{ color: '#4d7fff', flexShrink: 0 }} />}
              <span style={{
                color:
                  geoStatus === 'success' ? '#22c55e' :
                  geoStatus === 'error'   ? '#ff4d6d' :
                  '#4d7fff',
                fontWeight: 500,
              }}>
                {geoStatus === 'loading' && 'Updating check-in location coordinates…'}
                {geoStatus === 'success' && `Check-in pin updated (${resolvedCoords?.latitude?.toFixed(4)}, ${resolvedCoords?.longitude?.toFixed(4)})`}
                {geoStatus === 'error'   && 'Could not resolve coordinates — member check-in may not work at new address'}
                {!geoStatus              && 'Detecting new check-in coordinates…'}
              </span>
            </div>
          )}

          <div>
            <Label htmlFor="price">Monthly Price (£)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="Monthly membership price"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || geoStatus === 'loading'}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold h-12 rounded-2xl"
          >
            {isLoading ? 'Saving...' : geoStatus === 'loading' ? 'Resolving location…' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}