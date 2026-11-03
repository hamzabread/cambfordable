'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { Phone, MapPin, Mail, Send } from 'lucide-react';
import { API_URL, getApiError } from '@/lib/portal';
import Footer from '../components/Landing/Footer/Footer';
import Header from '../components/Landing/Header/Header';

interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  details: string[];
  color: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const contactInfo: ContactInfo[] = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone",
      details: ["+92 345 9202628", "+92 345 9225425", "051-7066015"],
      color: "bg-[#E8EAEE]"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Location",
      details: ["Online Learning Platform", "Global Accessibility", "24/7 Available"],
      color: "bg-[#E8EAEE] "
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      details: ["hello@cambfordable.com", "support@cambfordable.com"],
      color: "bg-[#E8EAEE] "
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();

    if (!name || !email || !message) {
      setSubmitMessage('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubmitMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      await axios.post(`${API_URL}/contact`, { name, email, message });
      setSubmitMessage('Thank you! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });

      setTimeout(() => {
        setSubmitMessage('');
      }, 5000);
    } catch (error) {
      setSubmitMessage(getApiError(error, 'Your message could not be sent. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Header />
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-emerald-500 font-semibold text-sm uppercase tracking-wider mb-2">
            Get In Touch
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Feel Free To Contact
          </h1>
          <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((info, idx) => (
            <div
              key={idx}
              className={`${info.color} border-2 border-[#275eb1] p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-4px]`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white rounded-lg">
                  <div className="text-gray-900">
                    {info.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {info.title}
                </h3>
              </div>
              <div className="space-y-2">
                {info.details.map((detail, i) => (
                  <p key={i} className="text-gray-700 text-sm">
                    {detail}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form Section */}
        <div className="bg-gray-50 rounded-xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <img
                  src="/assets/certificate/ali-imran.jpg"
                  alt="Contact Person"
                  className="w-full h-auto rounded-lg shadow-lg object-cover"
                />
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500 rounded-lg opacity-20"></div>
              </div>
            </div>

            {/* Right: Form */}
            <div>
              <p className="text-emerald-500 font-semibold text-sm uppercase tracking-wider mb-2">
                Contact
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Need Help Or Have A Question?
              </h2>
              <div className="w-16 h-1 bg-emerald-500 rounded-full mb-8"></div>

              <div className="space-y-6">
                {/* Name and Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-900 mb-2">
                      Name*
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      maxLength={120}
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-emerald-500 bg-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-900 mb-2">
                      Email*
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-emerald-500 bg-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-900 mb-2">
                    Message*
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    maxLength={5000}
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-emerald-500 bg-transparent outline-none transition-colors text-gray-900 resize-none placeholder-gray-500"
                    placeholder="Your message here..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-[#1e3557] hover:bg-[#152848] disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg hover:shadow-xl flex items-center gap-2 group"
                  >
                    {isSubmitting ? 'SENDING...' : 'SEND NOW'}
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </button>
                </div>

                {/* Success Message */}
                {submitMessage && (
                  <div className={`p-4 rounded-lg ${submitMessage.includes('Thank') ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={submitMessage.includes('Thank') ? 'text-emerald-800' : 'text-red-800'}>
                      {submitMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}