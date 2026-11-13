// src/components/common/Footer.jsx
// TODO: replace with the official IIK social media page URLs
const socialLinks = [
  { label: 'Facebook', href: 'https://web.facebook.com/profile.php?id=61580379807189', icon: 'facebook' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/iik-organisation-npo', icon: 'linkedin' },
  { label: 'Instagram', href: 'https://www.instagram.com/iik_organisation/', icon: 'instagram' },
  { label: 'YouTube', href: 'http://www.youtube.com/@IIKOrganisation', icon: 'youtube' },
];

const SocialIcon = ({ name }) => {
  const paths = {
    facebook: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.43H7.08v-3.5h3.05V9.4c0-3.03 1.79-4.72 4.54-4.72 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.34l-.53 3.5h-2.81V24C19.61 23.09 24 18.09 24 12.07Z',
    linkedin: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V8.99h3.56v11.46ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.23 0Z',
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm5.2-3.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z',
    youtube: 'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
};

const Footer = () => {
  return (
    <footer className="learner-footer">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} IIK Organisation NPO (318-977) | PBO Number : 930086625 | All Rights Reserved.</span>
          <div className="footer-social">
            {socialLinks.map(({ label, href, icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <SocialIcon name={icon} />
              </a>
            ))}
          </div>
          <div className="footer-links">
              <a href="https://www.iik.co.za/contact-us">Get In Touch</a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;  // <--- THIS LINE IS CRITICAL!