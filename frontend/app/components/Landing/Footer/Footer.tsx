import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

interface SocialLink {
  icon: React.ReactNode;
  url: string;
  label: string;
}

interface FooterLink {
  title: string;
  href: string;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks: FooterLink[] = [
    { title: "Home", href: "#" },
    { title: "Courses", href: "#" },
    { title: "Learning Tools", href: "#" },
    { title: "My Credentials", href: "#" },
  ];

  const courseLinks: FooterLink[] = [
    { title: "O-Levels Math", href: "#" },
    { title: "A-Levels Physics", href: "#" },
    { title: "A-Levels Chemistry", href: "#" },
    { title: "AI & ML", href: "#" },
  ];

  const policyLinks: FooterLink[] = [
    { title: "Privacy Policy", href: "#" },
    { title: "Terms of Service", href: "#" },
    { title: "Refund Policy", href: "#" },
    { title: "Contact Us", href: "#" },
  ];

  const socialLinks: SocialLink[] = [
    { icon: <Facebook className="w-5 h-5" />, url: "#", label: "Facebook" },
    { icon: <Twitter className="w-5 h-5" />, url: "#", label: "Twitter" },
    { icon: <Linkedin className="w-5 h-5" />, url: "#", label: "LinkedIn" },
    { icon: <Instagram className="w-5 h-5" />, url: "#", label: "Instagram" },
  ];

  return (
    <footer className="bg-[#1e3557] text-white">
      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Cambfordable
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Quality online tutoring for O-Levels, A-Levels, and AI specialization. Learn at your own pace with expert guidance.
              </p>
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-emerald-400" />
                  <a href="mailto:hello@cambfordable.com" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">
                    hello@cambfordable.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <a href="tel:+1234567890" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">
                    +1 (234) 567-890
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <p className="text-gray-300 text-sm">
                    Online Learning Platform
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.title}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-emerald-400 transition-colors text-sm font-medium"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Courses */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">
                Popular Courses
              </h3>
              <ul className="space-y-3">
                {courseLinks.map((link) => (
                  <li key={link.title}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-blue-400 transition-colors text-sm font-medium"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">
                Policies
              </h3>
              <ul className="space-y-3">
                {policyLinks.map((link) => (
                  <li key={link.title}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-green-400 transition-colors text-sm font-medium"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-600 my-12"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Copyright */}
            <div className="text-center md:text-left">
              <p className="text-gray-300 text-sm">
                © {currentYear} Cambfordable. All rights reserved.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Designed & Built with ❤️ for online education
              </p>
            </div>

            {/* Center: Quick CTA */}
            <div className="flex gap-4">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] shadow-md hover:shadow-lg text-sm">
                Start Learning
              </button>
              <button className="border-2 border-gray-400 hover:border-white text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 text-sm">
                Schedule Demo
              </button>
            </div>

            {/* Right: Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  aria-label={social.label}
                  className="bg-gray-700 hover:bg-emerald-500 text-white p-3 rounded-full transition-all duration-300 transform hover:translate-y-[-2px]"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Border Accent */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-green-500"></div>
    </footer>
  );
}