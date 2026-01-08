import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center shadow-lg mb-4"
      >
        <Leaf className="w-8 h-8 text-white" />
      </motion.div>
      <p className="text-slate-500 font-medium">{message}</p>
    </div>
  );
}