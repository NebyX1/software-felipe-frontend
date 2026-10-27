const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="/Logo-IDL.png"
          alt="IDL"
          style={{ height: '24px', width: 'auto', objectFit: 'contain', opacity: 0.85 }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-mid)', letterSpacing: '0.06em' }}>
          © {year} <strong style={{ fontWeight: 600 }}>Daniel Quiere Saber</strong> · Intendencia Departamental de Lavalleja
        </span>
      </div>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
        PLATAFORMA DE GESTIÓN PÚBLICA · v2.0
      </span>
    </footer>
  );
};

export default Footer;
