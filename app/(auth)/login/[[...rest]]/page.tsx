import { SignIn } from '@clerk/nextjs';
import { AuthShell, clerkAuthAppearance } from '../../AuthShell';

export default function LoginPage() {
  return (
    <AuthShell mode="login">
      <SignIn
        appearance={clerkAuthAppearance}
        routing="path"
        path="/login"
        signUpUrl="/register"
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
