export const headerData = {
  links: [
    { text: 'Membership', href: '/membership' },
    {
      text: 'Our Cities',
      links: [
        { text: 'Auckland', href: '/cities/auckland' },
        { text: 'Wellington', href: '/cities/wellington' },
        { text: 'Christchurch', href: '/cities/christchurch' },
        { text: 'Queenstown', href: '/cities/queenstown' },
      ],
    },
    { text: 'The Process', href: '/process' },
  ],
  actions: [{ text: 'Apply Now', href: '/contact' }],
};

export const footerData = {
  links: [],
  secondaryLinks: [
    { text: 'Privacy', href: '/privacy' },
    { text: 'Terms', href: '/terms' },
  ],
  socialLinks: [],
  footNote: '© 2025 The Match Bureau. All rights reserved.',
};
