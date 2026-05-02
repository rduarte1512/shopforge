"use client";

import { motion } from "motion/react";
import { Check, ArrowRight } from "lucide-react";
import React from "react";

export const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { 
  icon: any, 
  title: string, 
  description: string,
  delay?: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group`}
  >
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

export const PricingCard = ({ 
  name, 
  price, 
  description, 
  features, 
  highlight = false,
  delay = 0 
}: { 
  name: string, 
  price: string, 
  description: string, 
  features: string[],
  highlight?: boolean,
  delay?: number
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`p-8 rounded-[2rem] border ${
      highlight 
        ? "bg-primary text-white border-primary shadow-2xl relative overflow-hidden" 
        : "bg-white text-slate-900 border-gray-100 shadow-lg"
    }`}
  >
    {highlight && (
      <div className="absolute top-4 right-4 bg-white text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
        Popular
      </div>
    )}
    <h3 className={`text-xl font-bold mb-2 ${highlight ? "text-white" : "text-slate-900"}`}>{name}</h3>
    <p className={`text-sm mb-6 ${highlight ? "text-gray-400" : "text-gray-500"}`}>{description}</p>
    <div className="flex items-baseline gap-1 mb-8">
      <span className="text-4xl font-bold">{price}</span>
      <span className={`text-sm ${highlight ? "text-gray-400" : "text-gray-500"}`}>/mês</span>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((feature, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <div className={`p-1 rounded-full ${highlight ? "bg-white/10" : "bg-primary/10"}`}>
            <Check className={`w-3 h-3 ${highlight ? "text-white" : "text-primary"}`} />
          </div>
          {feature}
        </li>
      ))}
    </ul>
    <button className={`w-full py-4 rounded-2xl font-bold transition-all ${
      highlight 
        ? "bg-white text-primary hover:bg-gray-100" 
        : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
    }`}>
      Escolher Plano
    </button>
  </motion.div>
);

export const HeroMockup = () => (
  <motion.div 
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 1, ease: "easeOut" }}
    className="relative group"
  >
    {/* Background Glow */}
    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-75 transition-opacity" />
    
    <div className="relative border border-gray-200/50 rounded-[2.5rem] bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[4/3] max-w-2xl mx-auto">
      {/* Header bar */}
      <div className="h-12 border-b border-gray-100 flex items-center px-6 justify-between bg-white/50">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="h-2 w-32 bg-gray-100 rounded-full" />
      </div>
      
      {/* Content Mockup */}
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="h-24 rounded-2xl bg-gray-50 border border-gray-100 p-4"
            >
              <div className="h-2 w-12 bg-gray-200 rounded-full mb-2" />
              <div className="h-4 w-20 bg-gray-300 rounded-full" />
            </motion.div>
          ))}
        </div>
        
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="h-40 rounded-3xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col justify-end"
          >
            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <div className="h-2 w-24 bg-gray-100 rounded-full" />
                <div className="h-8 w-40 bg-primary/10 rounded-lg" />
              </div>
              <div className="flex gap-1 items-end">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 1.2 + i * 0.1, duration: 0.8 }}
                    className="w-4 bg-primary/40 rounded-t-sm"
                  />
                ))}
              </div>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="h-20 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
             </div>
             <div className="h-20 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
             </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -right-8 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 z-20"
      >
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
          <Check className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Novo Pedido</p>
          <p className="font-bold text-sm">€ 89.00</p>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 -left-12 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 z-20"
      >
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
          SF
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Visitantes Online</p>
          <p className="font-bold text-sm">1,284</p>
        </div>
      </motion.div>
    </div>
  </motion.div>
);
