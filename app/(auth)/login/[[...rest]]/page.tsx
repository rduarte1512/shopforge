import { AuthShell } from '../../AuthShell';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <AuthShell mode="login">
      <LoginForm />
    </AuthShell>
  );
}
