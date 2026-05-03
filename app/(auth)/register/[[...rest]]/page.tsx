import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ShopForge</h1>
          <p className="text-slate-500 mt-2 font-medium">Cria a tua conta e começa a vender em minutos com IA.</p>
        </div>

        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm font-bold py-3 rounded-xl shadow-lg shadow-primary/20",
              card: "shadow-premium rounded-[32px] border-border overflow-hidden",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "rounded-xl border-border hover:bg-slate-50 font-bold",
              formFieldInput: "rounded-xl border-border bg-slate-50 focus:bg-white focus:border-primary/30 transition-all",
              footerActionLink: "text-primary font-bold hover:text-primary/80"
            }
          }}
          routing="path"
          path="/register"
          signInUrl="/login"
        />
      </div>
    </div>
  );
}
