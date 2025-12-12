const Footer = () => {
  return (
    <footer className="footer">
      <p>
        &copy; {new Date().getFullYear()} <span>Matajar Group</span>. All Rights Reserved.
      </p>
      <p style={{ marginTop: '5px', fontSize: '0.75rem' }}>
        Powered by <span>Mirage by MAG Investment LLC</span>
      </p>
    </footer>
  );
};

export default Footer;
