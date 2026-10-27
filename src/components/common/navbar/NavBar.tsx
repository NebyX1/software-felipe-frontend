import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiArchive, FiMenu, FiX, FiSettings, FiUser, FiLogOut, FiChevronDown, FiSun, FiMoon } from 'react-icons/fi';
import useAuth from '../../../store/useAuth';

// ─── NavLink ─────────────────────────────────────────────────────────────────

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink = ({ to, icon: Icon, children, onClick }: NavLinkProps) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        color: active ? 'var(--text)' : 'var(--text-muted)',
        backgroundColor: active ? 'rgba(99,102,241,0.15)' : 'transparent',
        transition: 'all 0.18s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--muted-bg)';
          e.currentTarget.style.color = 'var(--text-mid)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      <Icon size={14} />
      {children}
      {active && (
        <motion.span
          layoutId="nav-pill"
          style={{ position: 'absolute', inset: 0, borderRadius: '6px', border: '1px solid rgba(99,102,241,0.35)', pointerEvents: 'none' }}
        />
      )}
    </Link>
  );
};

// ─── UserMenu ─────────────────────────────────────────────────────────────────

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const roleLabel = user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Usuario';
  const roleColor = user.role === 'super_admin' ? '#f59e0b' : user.role === 'admin' ? '#818cf8' : '#4ade80';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--muted-bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '6px 12px',
          cursor: 'pointer',
          color: 'var(--text-mid)',
          fontSize: '13px',
        }}
      >
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `linear-gradient(135deg, ${roleColor}55, ${roleColor}22)`, border: `1px solid ${roleColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: roleColor }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span style={{ color: 'var(--text)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
        <FiChevronDown size={12} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                minWidth: '200px',
                background: 'var(--dropdown-bg)',
                border: '1px solid var(--border-bright)',
                borderRadius: '10px',
                overflow: 'hidden',
                zIndex: 100,
                boxShadow: 'var(--dropdown-shadow)',
              }}
            >
              {/* User info header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{user.email}</div>
                <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${roleColor}15`, color: roleColor, fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', border: `1px solid ${roleColor}30` }}>
                  {roleLabel}
                  {user.unit_name && <span style={{ color: 'var(--text-muted)' }}> · {user.unit_name}</span>}
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px' }}>
                <MenuItem icon={FiUser} label="Mi perfil" onClick={() => { navigate('/profile'); setOpen(false); }} />
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <MenuItem icon={FiSettings} label="Panel de administración" onClick={() => { navigate('/admin'); setOpen(false); }} />
                )}
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                <MenuItem icon={FiLogOut} label="Cerrar sesión" onClick={handleLogout} danger />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, danger = false }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', color: danger ? '#ef4444' : 'var(--text-mid)', fontSize: '13px', transition: 'background 0.15s, color 0.15s' }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'var(--muted-bg)'; e.currentTarget.style.color = danger ? '#ef4444' : 'var(--text)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = danger ? '#ef4444' : 'var(--text-mid)'; }}
  >
    <Icon size={14} />
    {label}
  </button>
);

// ─── NavBar ───────────────────────────────────────────────────────────────────

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const homeRoute = user?.role === 'user' ? '/area' : '/admin/areas';

  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        backgroundColor: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--nav-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <motion.img
            src="/Logo-IDL.png"
            alt="IDL"
            whileHover={{ scale: 1.05 }}
            style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.04em' }}>Daniel Quiere Saber</div>
            <div style={{ fontSize: '9px', fontWeight: 400, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Gestión Pública</div>
          </div>
        </Link>

        {/* Desktop nav */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NavLink to={homeRoute} icon={FiGrid}>{user.role === 'user' ? 'Mi área' : 'Áreas'}</NavLink>
            <NavLink to="/archived" icon={FiArchive}>Archivados</NavLink>
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme toggle */}
          <button
            onClick={() => setDark((v) => !v)}
            title={dark ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px',
              background: 'var(--muted-bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-mid)',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted-bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--muted-bg)'; e.currentTarget.style.color = 'var(--text-mid)'; }}
          >
            {dark ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

          {user ? (
            <UserMenu />
          ) : null}
          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', display: 'none' }}
            className="md-hidden"
          >
            {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderTop: '1px solid var(--nav-border)', overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink to={homeRoute} icon={FiGrid} onClick={() => setIsOpen(false)}>
                {user?.role === 'user' ? 'Mi área' : 'Áreas'}
              </NavLink>
              <NavLink to="/archived" icon={FiArchive} onClick={() => setIsOpen(false)}>Archivados</NavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default NavBar;
