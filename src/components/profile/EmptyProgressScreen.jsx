import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function EmptyProgressScreen({ isOpen, onContinue }) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-500/30 max-w-md shadow-2xl shadow-black/40 [&>button]:hidden min-h-96 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center justify-center gap-4"
        >
          <Button
            onClick={onContinue}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30"
          >
            Continue
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}