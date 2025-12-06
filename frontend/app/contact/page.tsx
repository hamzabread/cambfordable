'use client';
import React, { useState } from 'react';
import { Phone, MapPin, Mail, Send } from 'lucide-react';
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

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitMessage('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitMessage('Thank you! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
      setIsSubmitting(false);
      
      setTimeout(() => {
        setSubmitMessage('');
      }, 5000);
    }, 1500);
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
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop"
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-emerald-500 bg-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email*
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-emerald-500 bg-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Message*
                  </label>
                  <textarea
                    name="message"
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
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Success Message */}
                {submitMessage && (
                  <div className={`p-4 rounded-lg ${submitMessage.includes('Thank') ? 'bg-emerald-100 border-l-4 border-emerald-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
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