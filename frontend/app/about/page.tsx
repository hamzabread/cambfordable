import React from 'react';
import { CheckCircle, Users, Zap, Target, Award, BookOpen } from 'lucide-react';
import Header from '../components/Landing/Header/Header';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Value {
  title: string;
  description: string;
  color: string;
}

export default function AboutPage() {
  const features: Feature[] = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Expert Tutors",
      description: "Learn from qualified, experienced educators who are passionate about your success and dedicated to your growth."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Flexible Learning",
      description: "Study at your own pace with flexible scheduling that adapts to your lifestyle and learning preferences."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Personalized Approach",
      description: "Every student is unique. We create customized learning plans tailored to your specific needs and goals."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Proven Results",
      description: "95% of our students achieve their target grades with our structured methodology and dedicated support."
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Comprehensive Resources",
      description: "Access to extensive study materials, past papers, and practice questions for all subjects."
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Affordable Pricing",
      description: "Quality education shouldn't be expensive. We offer competitive rates with flexible payment options."
    }
  ];

  const values: Value[] = [
    {
      title: "Excellence",
      description: "We strive for excellence in every aspect of our teaching, ensuring the highest quality education for all students.",
      color: "border-emerald-500"
    },
    {
      title: "Accessibility",
      description: "Education should be accessible to everyone. We make quality tutoring affordable and available globally.",
      color: "border-blue-500"
    },
    {
      title: "Innovation",
      description: "We continuously evolve our teaching methods using the latest educational technology and best practices.",
      color: "border-green-500"
    },
    {
      title: "Support",
      description: "Your success is our success. We provide continuous support and guidance throughout your learning journey.",
      color: "border-purple-500"
    }
  ];

  return (
    <>
    <Header />
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                About Cambfordable
              </h1>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Founded with a mission to make quality education accessible to everyone, Cambfordable is an online tutoring platform specializing in O-Levels, A-Levels, and Artificial Intelligence training.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                We believe that personalized, one-on-one instruction combined with cutting-edge learning tools can transform academic outcomes. Our dedicated instructors are committed to helping students not just pass exams, but truly understand and master their subjects.
              </p>
              <div className="flex gap-4">
                <button className="bg-[#1e3557] hover:bg-[#152848] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] shadow-md hover:shadow-lg">
                  Get Started
                </button>
                <button className="border-2 border-[#1e3557] text-[#1e3557] hover:bg-[#1e3557] hover:text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300">
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522202176988-696ce0213ce0?w=600&h=600&fit=crop"
                alt="About"
                className="w-full rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-500 rounded-lg opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Students Taught" },
              { number: "4.9★", label: "Average Rating" },
              { number: "99%", label: "Pass Rate" },
              { number: "24/7", label: "Support Available" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center bg-[#E8EAEE] p-8 rounded-xl border-2 border-[#1e3557] hover:shadow-lg transition-all">
                <p className="text-4xl font-bold text-[#1e3557] mb-2">{stat.number}</p>
                <p className="text-gray-700 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Cambfordable?
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              We combine expert instruction, personalized attention, and cutting-edge technology to help you achieve your academic goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-4px] border-4 border-[#1e3557]"
              >
                <div className="p-3 bg-[#E8EAEE] rounded-lg w-fit mb-4">
                  <div className="text-[#1e3557]">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, idx) => (
              <div
                key={idx}
                className={`bg-[#E8EAEE] p-8 rounded-xl border-2 ${value.color} hover:shadow-lg transition-all duration-300`}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Subjects Section */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              What We Teach
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              We specialize in comprehensive tutoring across multiple subjects and levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { category: "O-Levels", subjects: ["Mathematics", "English Literature", "Physics", "Chemistry"] },
              { category: "A-Levels", subjects: ["Mathematics", "Physics", "Chemistry", "English"] },
              { category: "AI & ML", subjects: ["Machine Learning", "Deep Learning", "Neural Networks", "Data Science"] }
            ].map((level, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl shadow-md border-l-4 border-[#1e3557]">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {level.category}
                </h3>
                <ul className="space-y-3">
                  {level.subjects.map((subject, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      {subject}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#1e3557] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-gray-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of students who have already achieved their academic goals with Cambfordable. Start your journey today!
          </p>
          <button className="bg-white hover:bg-gray-100 text-[#1e3557] font-semibold py-4 px-10 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg hover:shadow-xl text-lg">
            Enroll Now
          </button>
        </div>
      </section>
    </div>
    </>
  );
}