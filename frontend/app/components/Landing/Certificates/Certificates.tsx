import React from "react";
import { CheckCircle } from "lucide-react";

export default function CertificatesSection() {
  const certificates = [
    {
      id: 1,
      title: "O-Levels Mathematics",
      issuer: "Cambridge International",
      year: "2022",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&h=80&fit=crop",
      color: "from-emerald-50 to-emerald-100 border-l-4 border-emerald-500",
    },
    {
      id: 2,
      title: "A-Levels Physics",
      issuer: "Cambridge International",
      year: "2023",
      image:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=80&h=80&fit=crop",
      color: "from-blue-50 to-blue-100 border-l-4 border-blue-500",
    },
    {
      id: 3,
      title: "AI & Machine Learning Certification",
      issuer: "Stanford Online",
      year: "2023",
      image:
        "https://images.unsplash.com/photo-1555613521-2ef3d707b656?w=80&h=80&fit=crop",
      color: "from-green-50 to-green-100 border-l-4 border-green-500",
    },
    {
      id: 4,
      title: "A-Levels Chemistry",
      issuer: "Cambridge International",
      year: "2023",
      image:
        "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=80&h=80&fit=crop",
      color: "from-purple-50 to-purple-100 border-l-4 border-purple-500",
    },
  ];

  const getColorClasses = (color : string) => {
    const colorMap = {
      "from-emerald-50 to-emerald-100 border-l-4 border-emerald-500": {
        badge: "bg-emerald-100 text-emerald-700",
        icon: "text-emerald-600",
      },
      "from-blue-50 to-blue-100 border-l-4 border-blue-500": {
        badge: "bg-blue-100 text-blue-700",
        icon: "text-blue-600",
      },
      "from-green-50 to-green-100 border-l-4 border-green-500": {
        badge: "bg-green-100 text-green-700",
        icon: "text-green-600",
      },
      "from-purple-50 to-purple-100 border-l-4 border-purple-500": {
        badge: "bg-purple-100 text-purple-700",
        icon: "text-purple-600",
      },
      "from-cyan-50 to-cyan-100 border-l-4 border-cyan-500": {
        badge: "bg-cyan-100 text-cyan-700",
        icon: "text-cyan-600",
      },
      "from-orange-50 to-orange-100 border-l-4 border-orange-500": {
        badge: "bg-orange-100 text-orange-700",
        icon: "text-orange-600",
      },
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            My Credentials & Expertise
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Specialized in O-Levels, A-Levels, and Artificial Intelligence with
            verified certifications
          </p>
        </div>

        {/* Content Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left: Profile Images */}
          <div className="lg:col-span-1 space-y-5">
            <div className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-emerald-500">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=500&fit=crop"
                alt="Profile"
                className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-blue-400">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=200&h=180&fit=crop"
                  alt="Teaching session"
                  className="w-full h-32 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-green-400">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=180&fit=crop"
                  alt="Teaching moment"
                  className="w-full h-32 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
          </div>

          {/* Right: Certificates */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {certificates.map((cert) => {
                const borderColorMap: Record<string, string> = {
                  "from-emerald-50 to-emerald-100 border-l-4 border-emerald-500":
                    "border-emerald-500",
                  "from-blue-50 to-blue-100 border-l-4 border-blue-500":
                    "border-blue-500",
                  "from-green-50 to-green-100 border-l-4 border-green-500":
                    "border-green-500",
                  "from-purple-50 to-purple-100 border-l-4 border-purple-500":
                    "border-purple-500",
                  "from-cyan-50 to-cyan-100 border-l-4 border-cyan-500":
                    "border-cyan-500",
                  "from-orange-50 to-orange-100 border-l-4 border-orange-500":
                    "border-orange-500",
                };
                const borderColor =
                  borderColorMap[cert.color as keyof typeof borderColorMap];
                const colors = getColorClasses(cert.color);
                return (
                  <div
                    key={cert.id}
                    className={`bg-white border-2 ${borderColor} p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-4px] flex gap-4`}
                  >
                    {/* Certificate Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={cert.image}
                        alt={cert.title}
                        className="w-16 h-16 rounded-lg object-cover shadow-md border-2 border-white"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base mb-1">
                            {cert.title}
                          </h3>
                          <p className="text-sm text-gray-700 mb-2">
                            {cert.issuer}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className={`w-4 h-4 ${colors.icon}`} />
                        <span className="text-xs text-gray-700 font-semibold">
                          {cert.year}
                        </span>
                        <span className="text-xs text-gray-600">
                          • Verified
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* More Information Button */}
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-full bg-gray-300 mt-8 h-0.5"></div>
        <div className="mt-8 flex justify-center">
          <button className="bg-[#1e3557] hover:bg-[#152848] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg hover:shadow-xl">
            More Information
          </button>
        </div>
      </div>
    </div>
  );
}
