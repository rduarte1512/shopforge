"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { motion } from "motion/react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-main relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Link href="/" className="flex justify-center items-center gap-2 text-3xl font-black tracking-tighter text-text-primary group">
           <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-7 h-7 text-white" />
           </div>
           <span>ShopForge</span>
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0"
      >
        <div className="bg-card-bg py-10 px-6 shadow-2xl shadow-primary/5 sm:rounded-[2rem] sm:px-12 border border-border backdrop-blur-xl relative z-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
