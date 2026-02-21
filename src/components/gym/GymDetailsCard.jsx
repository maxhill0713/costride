import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Zap, Target, Award, Flame, Heart, MapPin, Clock, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const amenityIcons = {
  'wifi': '📡',
  'locker': '🔐',
  'shower': '🚿',
  'sauna': '🧖',
  'steam': '💨',
  'pool': '🏊',
  'parking': '🚗',
  'childcare': '👶',
  'cafe': '☕',
  'towel': '🏖️',
  'basketball': '🏀',
  'tennis': '🎾',
  'cardio': '🏃',
  'weights': '🏋️',
  'yoga': '🧘',
  'boxing': '🥊',
  'stretching': '🤸',
  'dance': '💃'
};

const specializationIcons = {
  'weight_loss': '📉',
  'muscle_gain': '💪',
  'strength': '🏋️',
  'endurance': '🏃',
  'flexibility': '🧘',
  'rehabilitation': '⚕️',
  'sports_training': '⚽',
  'general_fitness': '✨',
  'bulking': '🔥',
  'cutting': '✂️',
  'boxing_training': '🥊',
  'crossfit': '⚡'
};

export default function GymDetailsCard({ gym, isOwner, onEditAmenities, onEditSpecializations }) {
  if (!gym) return null;

  const amenitiesArray = gym.amenities || [];
  const specializationsArray = gym.specializes_in || [];

  return (
    <div className="space-y-4">
      {/* Amenities Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/65 via-slate-900/55 to-slate-950/65 backdrop-blur-3xl border border-white/30 p-4 md:p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Amenities</h3>
            </div>
            {isOwner && (
              <button
                onClick={onEditAmenities}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {amenitiesArray.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-600/50 rounded-2xl">
              <Dumbbell className="w-10 h-10 mx-auto mb-2 text-slate-500" />
              <p className="text-slate-400 text-sm">No amenities added yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {amenitiesArray.map((amenity, idx) => (
                <motion.div
                  key={amenity}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 transition-all cursor-default py-1.5 px-3 text-sm flex items-center gap-2">
                    <span className="text-lg">{amenityIcons[amenity.toLowerCase()] || '✨'}</span>
                    {amenity}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Specializations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/65 via-slate-900/55 to-slate-950/65 backdrop-blur-3xl border border-white/30 p-4 md:p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Specializations</h3>
            </div>
            {isOwner && (
              <button
                onClick={onEditSpecializations}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {specializationsArray.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-600/50 rounded-2xl">
              <Zap className="w-10 h-10 mx-auto mb-2 text-slate-500" />
              <p className="text-slate-400 text-sm">No specializations added yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {specializationsArray.map((spec, idx) => (
                <motion.div
                  key={spec}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30 transition-all cursor-default py-1.5 px-3 text-sm flex items-center gap-2">
                    <span className="text-lg">{specializationIcons[spec.toLowerCase()] || '⭐'}</span>
                    {spec.replace(/_/g, ' ')}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Gym Info Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        {gym.rating && (
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-3xl border border-yellow-500/30 p-4 shadow-lg shadow-yellow-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-white">{gym.rating}</span>
            </div>
            <p className="text-xs text-slate-400">Rating</p>
          </Card>
        )}

        {gym.members_count && (
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-3xl border border-blue-500/30 p-4 shadow-lg shadow-blue-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-white">{gym.members_count}</span>
            </div>
            <p className="text-xs text-slate-400">Members</p>
          </Card>
        )}

        {gym.type && (
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-3xl border border-purple-500/30 p-4 shadow-lg shadow-purple-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold text-white capitalize">{gym.type}</span>
            </div>
            <p className="text-xs text-slate-400">Type</p>
          </Card>
        )}

        {gym.city && (
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-3xl border border-green-500/30 p-4 shadow-lg shadow-green-500/10">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold text-white line-clamp-1">{gym.city}</span>
            </div>
            <p className="text-xs text-slate-400">Location</p>
          </Card>
        )}
      </motion.div>

      {/* Price & Rewards */}
      {(gym.price || gym.reward_offer) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          {gym.price && (
            <Card className="bg-gradient-to-br from-green-500/15 to-emerald-500/15 backdrop-blur-3xl border border-green-500/40 p-4 shadow-lg">
              <p className="text-xs text-slate-400 mb-1">Monthly Price</p>
              <p className="text-lg font-bold text-green-300">{gym.price}</p>
            </Card>
          )}

          {gym.reward_offer && (
            <Card className="bg-gradient-to-br from-orange-500/15 to-amber-500/15 backdrop-blur-3xl border border-orange-500/40 p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-orange-400" />
                <p className="text-xs text-slate-400">Special Offer</p>
              </div>
              <p className="text-sm font-bold text-orange-300 line-clamp-2">{gym.reward_offer}</p>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}