import { Builder } from "@builder.io/react";

// Import landing page sections to register as Builder components
import Header from "@/app/components/Landing/Header/Header";
import Banner from "@/app/components/Landing/Banner/Banner";
import HowItWorks from "@/app/components/Landing/HowItWorks/HowItWorks";
import Teach from "@/app/components/Landing/Teach/Teach";
import Teacher from "@/app/components/Landing/Teacher/teacher";
import CoursesSection from "@/app/components/Landing/Subjects/Subjects";
import StudentsReviews from "@/app/components/Landing/Reviews/Reviews";
import FAQSection from "@/app/components/Landing/FAQs/Faqs";
import Footer from "@/app/components/Landing/Footer/Footer";

// Register Header
Builder.registerComponent(Header, {
  name: "Header",
  description: "Main navigation header with logo and links",
});

// Register Banner
Builder.registerComponent(Banner, {
  name: "Banner",
  description: "Hero banner section with heading and call-to-action button",
});

// Register How It Works
Builder.registerComponent(HowItWorks, {
  name: "HowItWorks",
  description: "Process flow showing how the learning process works step by step",
});

// Register Teach
Builder.registerComponent(Teach, {
  name: "Teach",
  description: "Section promoting teachers or how to become a teacher",
});

// Register Teacher (Dr. Ali Imran featured profile summary)
Builder.registerComponent(Teacher, {
  name: "Teacher",
  description: "Featured teacher highlight card / section",
});

// Register Courses Section
Builder.registerComponent(CoursesSection, {
  name: "CoursesSection",
  description: "Section listing courses/subjects available",
});

// Register Reviews
Builder.registerComponent(StudentsReviews, {
  name: "StudentsReviews",
  description: "Testimonial and review carousel from students",
});

// Register FAQ Section
Builder.registerComponent(FAQSection, {
  name: "FAQSection",
  description: "Frequently Asked Questions accordion section",
});

// Register Footer
Builder.registerComponent(Footer, {
  name: "Footer",
  description: "Main site footer with links and social icons",
});
