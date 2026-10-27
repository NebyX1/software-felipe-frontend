import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiLock, FiUser, FiMail, FiShield } from 'react-icons/fi';
import { changePasswordSchema, type ChangePasswordSchema } from '../schemas';
import { useChangePassword } from '../api/hooks/useAuth';
import useAuth from '../store/useAuth';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--muted-bg)',
  border: '1px solid var(--border-bright)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: '6px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const UserProfile = () => {
  const user = useAuth((s) => s.user);
  const changePassword = useChangePassword();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordSchema) => {
    changePassword.mutate(data, { onSuccess: () => reset() });
  };

  if (!user) return null;

  const roleLabel = user.role === 'super_admin' ? 'Super Administrador' : user.role === 'admin' ? 'Administrador' : 'Usuario';
  const roleColor = user.role === 'super_admin' ? '#f59e0b' : user.role === 'admin' ? '#818cf8' : '#4ade80';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, marginBottom: '32px' }}>Mi perfil</h1>

      {/* User info card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `linear-gradient(135deg, ${roleColor}33, ${roleColor}11)`, border: `2px solid ${roleColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: roleColor }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', background: `${roleColor}18`, color: roleColor, fontSize: '10px', fontWeight: 600, padding: '2px 10px', borderRadius: '99px', border: `1px solid ${roleColor}30` }}>
              <FiShield size={9} /> {roleLabel}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <InfoRow icon={FiMail} label="Email" value={user.email} />
          <InfoRow icon={FiUser} label="Unidad" value={user.unit_name || 'Sin unidad asignada'} />
        </div>
      </div>

      {/* Change password */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <FiLock size={15} color="#818cf8" />
          <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, margin: 0 }}>Cambiar contraseña</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Contraseña actual</label>
            <input type="password" {...register('current_password')} style={inputStyle} />
            {errors.current_password && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{errors.current_password.message}</span>}
          </div>
          <div>
            <label style={labelStyle}>Nueva contraseña</label>
            <input type="password" {...register('new_password')} style={inputStyle} />
            {errors.new_password && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{errors.new_password.message}</span>}
          </div>
          <div>
            <label style={labelStyle}>Confirmar nueva contraseña</label>
            <input type="password" {...register('confirm_password')} style={inputStyle} />
            {errors.confirm_password && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{errors.confirm_password.message}</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={changePassword.isPending}
              style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: changePassword.isPending ? 'not-allowed' : 'pointer', opacity: changePassword.isPending ? 0.7 : 1 }}
            >
              {changePassword.isPending ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--muted-bg)', borderRadius: '8px' }}>
    <Icon size={14} color="var(--text-muted)" />
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '2px' }}>{value}</div>
    </div>
  </div>
);

export default UserProfile;

