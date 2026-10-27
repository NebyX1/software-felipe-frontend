import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiShield, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import { z } from 'zod';
import { useLoginStep1, useLoginStep2 } from '../api/hooks/useAuth';
import { loginSchema, twoFASchema, type LoginSchema, type TwoFASchema } from '../schemas';

type Step = 'credentials' | '2fa';
type CaptchaChallenge = {
  left: number;
  right: number;
  answer: string;
};

const credentialsFormSchema = loginSchema.extend({
  captcha: z
    .string()
    .trim()
    .min(1, 'Resuelve el captcha numérico')
    .regex(/^\d+$/, 'Solo se permiten números'),
});

type CredentialsFormValues = z.infer<typeof credentialsFormSchema>;

const createCaptchaChallenge = (): CaptchaChallenge => {
  const left = Math.floor(Math.random() * 8) + 1;
  const right = Math.floor(Math.random() * 8) + 1;

  return {
    left,
    right,
    answer: String(left + right),
  };
};

// Step 1: email + password
const CredentialsForm = ({
  onSuccess,
}: {
  onSuccess: (pending_token: string) => void;
}) => {
  const [showPw, setShowPw] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaChallenge>(() => createCaptchaChallenge());
  const loginStep1 = useLoginStep1();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    formState: { errors },
  } = useForm<CredentialsFormValues>({ resolver: zodResolver(credentialsFormSchema) });

  const regenerateCaptcha = () => {
    setCaptcha(createCaptchaChallenge());
    resetField('captcha');
    clearErrors('captcha');
  };

  const onSubmit = ({ captcha: captchaValue, ...credentials }: CredentialsFormValues) => {
    if (captchaValue.trim() !== captcha.answer) {
      setError('captcha', { message: 'Captcha numérico incorrecto' });
      regenerateCaptcha();
      return;
    }

    clearErrors('captcha');
    loginStep1.mutate(credentials, {
      onSuccess: ({ pending_token }) => onSuccess(pending_token),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Email</label>
        <div style={inputWrap}>
          <FiMail style={iconStyle} />
          <input
            {...register('email')}
            type="email"
            placeholder="usuario@ejemplo.com"
            style={inputStyle}
            autoComplete="email"
          />
        </div>
        {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Contraseña</label>
        <div style={inputWrap}>
          <FiLock style={iconStyle} />
          <input
            {...register('password')}
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            style={{ ...inputStyle, paddingRight: '44px' }}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={showPwBtn}
            tabIndex={-1}
          >
            {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
        {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Captcha numérico</label>
        <div style={captchaChallengeStyle}>
          <div style={captchaPromptStyle}>
            Resuelve {captcha.left} + {captcha.right}
          </div>
          <button type="button" onClick={regenerateCaptcha} style={captchaRefreshBtn} aria-label="Generar nuevo captcha">
            <FiRefreshCw size={16} />
          </button>
        </div>
        <div style={inputWrap}>
          <FiShield style={iconStyle} />
          <input
            {...register('captcha')}
            type="text"
            inputMode="numeric"
            maxLength={2}
            placeholder="Resultado"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
        {errors.captcha && <p style={errorStyle}>{errors.captcha.message}</p>}
      </div>

      <button type="submit" style={submitBtn} disabled={loginStep1.isPending}>
        {loginStep1.isPending ? 'Verificando...' : 'Iniciar sesión'}
      </button>
    </form>
  );
};

// Step 2: 2FA code
const TwoFAForm = ({
  pendingToken,
  onBack,
}: {
  pendingToken: string;
  onBack: () => void;
}) => {
  const loginStep2 = useLoginStep2();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFASchema>({ resolver: zodResolver(twoFASchema) });

  const onSubmit = (data: TwoFASchema) => {
    loginStep2.mutate({ pending_token: pendingToken, code: data.code });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
        Te enviamos un código de 6 dígitos a tu correo. Ingrésalo a continuación.
      </p>
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Código de verificación</label>
        <div style={inputWrap}>
          <FiShield style={iconStyle} />
          <input
            {...register('code')}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            style={{
              ...inputStyle,
              fontSize: '24px',
              letterSpacing: '12px',
              textAlign: 'center',
            }}
            autoComplete="one-time-code"
            autoFocus
          />
        </div>
        {errors.code && <p style={errorStyle}>{errors.code.message}</p>}
      </div>

      <button type="submit" style={submitBtn} disabled={loginStep2.isPending}>
        {loginStep2.isPending ? 'Verificando...' : 'Verificar código'}
      </button>

      <button type="button" onClick={onBack} style={backBtn}>
        Volver
      </button>
    </form>
  );
};

// Main Login page
const Login = () => {
  const [step, setStep] = useState<Step>('credentials');
  const [pendingToken, setPendingToken] = useState('');

  const handleStep1Success = (token: string) => {
    setPendingToken(token);
    setStep('2fa');
  };

  return (
    <div style={pageStyle}>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        style={cardStyle}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={logoStyle}>🏛️</div>
          <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, margin: '12px 0 4px' }}>
            Daniel Quiere Saber
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            {step === 'credentials' ? 'Ingresa tus credenciales para continuar' : 'Verificación en dos pasos'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={stepBarStyle}>
          {(['credentials', '2fa'] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                ...stepDotStyle,
                background: step === s ? '#6366f1' : i < ['credentials', '2fa'].indexOf(step) ? '#22c55e' : '#334155',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.div key="creds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CredentialsForm onSuccess={handleStep1Success} />
            </motion.div>
          ) : (
            <motion.div key="twofa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TwoFAForm pendingToken={pendingToken} onBack={() => setStep('credentials')} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>


    </div>
  );
};

export default Login;

// Styles

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg)',
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '40px',
  width: '100%',
  maxWidth: '420px',
  boxShadow: 'var(--dropdown-shadow)',
};

const logoStyle: React.CSSProperties = {
  fontSize: '40px',
  display: 'flex',
  justifyContent: 'center',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-mid)',
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: '8px',
};

const inputWrap: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const iconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '14px',
  color: 'var(--text-muted)',
  pointerEvents: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '12px 14px 12px 40px',
  color: 'var(--input-text)',
  fontSize: '14px',
  fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box',
};

const showPwBtn: React.CSSProperties = {
  position: 'absolute',
  right: '12px',
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
};

const submitBtn: React.CSSProperties = {
  width: '100%',
  padding: '13px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: '12px',
};

const backBtn: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '13px',
  cursor: 'pointer',
};

const captchaChallengeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '10px',
};

const captchaPromptStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(99, 102, 241, 0.08)',
  border: '1px solid rgba(99, 102, 241, 0.14)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '13px',
  fontWeight: 600,
  padding: '12px 14px',
};

const captchaRefreshBtn: React.CSSProperties = {
  width: '40px',
  height: '40px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  flexShrink: 0,
};

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '12px',
  marginTop: '6px',
};

const stepBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '28px',
};

const stepDotStyle: React.CSSProperties = {
  width: '32px',
  height: '4px',
  borderRadius: '2px',
  transition: 'background 0.3s ease',
};
