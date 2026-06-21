import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import GlobalAssistant from '@/components/GlobalAssistant';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/auth-context';
import { RememberClerkAccount } from '@/components/auth/RememberClerkAccount';
import { ptPT } from "@clerk/localizations";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ShopForge - Crie a sua loja online',
  description: 'Plataforma completa de e-commerce para criar e gerir a sua loja online facilmente.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={ptPT}>
      <html lang="pt-PT" className={inter.variable} suppressHydrationWarning>
        <body className="font-sans antialiased" suppressHydrationWarning>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <RememberClerkAccount />
              {children}
              <GlobalAssistant />
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
