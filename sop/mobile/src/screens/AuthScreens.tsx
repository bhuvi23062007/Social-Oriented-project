import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { Button, C, Card, ErrorText, Field } from '../components/ui';

export function WelcomeScreen({ navigation }: any) {
  return (
    <View style={s.welcomeRoot}>
      <View style={s.brandMark}><Text style={s.brandMarkText}>CC</Text></View>
      <Text style={[s.brand, { color: C.white }]}>CleanCity</Text>
      <Text style={s.hero}>Sorted streets start with one report.</Text>
      <Text style={s.welcomeCopy}>Report waste in your area, support a cleaner community, and earn rewards for your contribution.</Text>
      <View style={{ gap: 10, marginTop: 28 }}>
        <Button title="Log in" onPress={() => navigation.navigate('Login')} />
        <Button title="Create an account" kind="secondary" onPress={() => navigation.navigate('Register')} />
      </View>
      <View style={s.benefits}>
        <Text style={s.benefit}>📸  Report waste in your area</Text>
        <Text style={s.benefit}>🌱  Support a cleaner community</Text>
        <Text style={s.benefit}>🏆  Earn points for valid reports</Text>
      </View>
    </View>
  );
}

export function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(''); setBusy(true);
    try { await login(email.trim(), password); }
    catch (e: any) { setError(e?.message || 'Login failed'); }
    finally { setBusy(false); }
  };
  return (
    <View style={s.authRoot}>
      <Text style={s.brand}>CleanCity</Text>
      <Text style={s.authTitle}>Welcome back.</Text>
      <Text style={s.authSubtitle}>Log in and we'll take you straight to your dashboard.</Text>
      <Card style={s.authCard}>
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry />
        <ErrorText>{error}</ErrorText>
        <Button title="Log in" onPress={submit} loading={busy} disabled={!email.trim() || !password} />
      </Card>
      <Text style={s.switchCopy}>New to CleanCity?</Text>
      <Button title="Create an account" kind="secondary" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}

export function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must contain at least 6 characters'); return; }
    setBusy(true);
    try { await register(`${firstName.trim()} ${lastName.trim()}`.trim(), email.trim(), password); }
    catch (e: any) { setError(e?.message || 'Registration failed'); }
    finally { setBusy(false); }
  };
  return (
    <View style={s.authRoot}>
      <Text style={s.brand}>CleanCity</Text>
      <Text style={s.authTitle}>Join CleanCity.</Text>
      <Text style={s.authSubtitle}>Become part of the community and help create a cleaner, greener environment.</Text>
      <Card style={s.authCard}>
        <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
        <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
        <Field label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Enter password again" secureTextEntry />
        <ErrorText>{error}</ErrorText>
        <Button title="Create account" onPress={submit} loading={busy} disabled={!firstName.trim() || !email.trim() || !password || !confirm} />
      </Card>
      <Text style={s.switchCopy}>Already have an account?</Text>
      <Button title="Log in" kind="secondary" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const s = StyleSheet.create({
  welcomeRoot: { flex: 1, backgroundColor: C.accent, paddingHorizontal: 26, paddingTop: 82, paddingBottom: 36, justifyContent: 'center' },
  brandMark: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brandMarkText: { color: C.white, fontSize: 17, fontWeight: '900' },
  brand: { color: C.accent, fontSize: 15, fontWeight: '900', letterSpacing: -0.3, marginBottom: 24 },
  hero: { color: C.white, fontWeight: '900', fontSize: 38, lineHeight: 42, letterSpacing: -1.1 },
  welcomeCopy: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 23, marginTop: 18 },
  benefits: { marginTop: 38, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', gap: 12 },
  benefit: { color: C.white, fontSize: 13, fontWeight: '600' },
  authRoot: { flex: 1, backgroundColor: C.paper, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 28 },
  authTitle: { color: C.ink, fontSize: 31, fontWeight: '900', marginTop: 8, letterSpacing: -0.5 },
  authSubtitle: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 22 },
  authCard: { padding: 16 },
  switchCopy: { marginTop: 20, textAlign: 'center', color: C.muted, fontSize: 12 },
});
