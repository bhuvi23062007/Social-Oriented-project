import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { Button, C, Card, Enter, ErrorText, Field, PulseDot } from '../components/ui';

export function WelcomeScreen({ navigation }: any) {
  return (
    <View style={s.welcomeRoot}>
      <Enter>
        <View style={s.topPill}>
          <PulseDot color="#34D399" />
          <Text style={s.topPillText}>LIVE CIVIC TELEMETRY · 4 STREAMS</Text>
        </View>

        <View style={s.brandRow}>
          <View style={s.brandMark}>
            <Text style={s.brandMarkText}>CMX</Text>
          </View>
          <Text style={s.brandLight}>CleanMaxx</Text>
        </View>

        <Text style={s.hero}>
          Cleaner streets,{'\n'}
          <Text style={{ color: '#60A5FA' }}>engineered</Text> in real time.
        </Text>

        <Text style={s.welcomeCopy}>
          Snap a photo, lock the GPS pin on OpenStreetMap, and dispatch nearby cleaners in under 20 seconds.
        </Text>
      </Enter>

      <Enter delay={90}>
        <View style={s.metricsGrid}>
          <View style={s.metricBox}>
            <Text style={s.metricVal}>&lt;20s</Text>
            <Text style={s.metricLbl}>REPORT TIME</Text>
          </View>

          <View style={s.metricBox}>
            <Text style={[s.metricVal, { color: '#34D399' }]}>AI</Text>
            <Text style={s.metricLbl}>AUTO-VERIFIED</Text>
          </View>

          <View style={s.metricBox}>
            <Text style={[s.metricVal, { color: '#60A5FA' }]}>5 km</Text>
            <Text style={s.metricLbl}>LIVE RADAR</Text>
          </View>
        </View>

        <View style={{ gap: 10, marginTop: 24 }}>
          <Button
            title="Sign in to Console"
            kind="accent"
            onPress={() => navigation.navigate('Login')}
          />

          <Button
            title="Create Citizen Account"
            kind="secondary"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </Enter>
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
    setError('');
    setBusy(true);

    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.authRoot}
        keyboardShouldPersistTaps="handled"
      >
        <Enter>
          <View style={s.authBadge}>
            <Text style={s.authBadgeText}>CMX</Text>
          </View>

          <Text style={s.authTitle}>Welcome back.</Text>

          <Text style={s.authSubtitle}>
            Sign in to access your real-time CleanMaxx dashboard.
          </Text>

          <Card style={s.authCard}>
            <Field
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <ErrorText>{error}</ErrorText>

            <View style={{ marginTop: 6 }}>
              <Button
                title="Sign in →"
                onPress={() => void submit()}
                loading={busy}
                disabled={!email.trim() || !password}
              />
            </View>
          </Card>

          <Text style={s.switchCopy}>New to CleanMaxx?</Text>

          <Button
            title="Create an account"
            kind="secondary"
            onPress={() => navigation.navigate('Register')}
          />
        </Enter>
      </ScrollView>
    </KeyboardAvoidingView>
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

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    setBusy(true);

    try {
      await register(
        `${firstName.trim()} ${lastName.trim()}`.trim(),
        email.trim(),
        password,
      );
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.authRoot}
        keyboardShouldPersistTaps="handled"
      >
        <Enter>
          <View style={s.authBadge}>
            <Text style={s.authBadgeText}>CMX</Text>
          </View>

          <Text style={s.authTitle}>Join CleanMaxx.</Text>

          <Text style={s.authSubtitle}>
            Report waste, track live pickups, and earn redeemable eco-credits.
          </Text>

          <Card style={s.authCard}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Field
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last"
                />
              </View>
            </View>

            <Field
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
            />

            <Field
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              secureTextEntry
            />

            <ErrorText>{error}</ErrorText>

            <View style={{ marginTop: 6 }}>
              <Button
                title="Create account →"
                onPress={() => void submit()}
                loading={busy}
                disabled={
                  !firstName.trim() ||
                  !email.trim() ||
                  !password ||
                  !confirm
                }
              />
            </View>
          </Card>

          <Text style={s.switchCopy}>Already have an account?</Text>

          <Button
            title="Sign in"
            kind="secondary"
            onPress={() => navigation.navigate('Login')}
          />
        </Enter>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  welcomeRoot: {
    flex: 1,
    backgroundColor: C.ink,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 38,
    justifyContent: 'space-between',
  },

  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 24,
  },

  topPillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandMarkText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '900',
  },

  brandLight: {
    color: C.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  hero: {
    color: C.white,
    fontWeight: '900',
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.2,
  },

  welcomeCopy: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
  },

  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },

  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 14,
  },

  metricVal: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
  },

  metricLbl: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },

  authRoot: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  authBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  authBadgeText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '900',
  },

  authTitle: {
    color: C.ink,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  authSubtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 20,
  },

  authCard: {
    padding: 18,
  },

  switchCopy: {
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'center',
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});