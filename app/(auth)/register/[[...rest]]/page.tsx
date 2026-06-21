import { SignUp } from '@clerk/nextjs';
import { AuthShell, clerkAuthAppearance } from '../../AuthShell';

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <SignUp
        appearance={clerkAuthAppearance}
        routing="path"
        path="/register"
        signInUrl="/login"
      />
    </AuthShell>
  );
}
