import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 text-2xl font-bold text-text-primary">
           <ShoppingBag className="w-8 h-8 text-primary" />
           <span>ShopForge</span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card-bg py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          {children}
        </div>
      </div>
    </div>
  );
}
