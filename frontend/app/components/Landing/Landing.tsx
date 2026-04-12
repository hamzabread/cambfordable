import React from 'react'
import Header from './Header/Header'
import Banner from './Banner/Banner'
import Teach from './Teach/Teach'
import Teacher from '@/app/components/Landing/Teacher/teacher'
import Impact from './Impact/Impact'
import StudentsReviews from './Reviews/Reviews'
import CoursesSection from './Subjects/Subjects'
import FAQSection from './FAQs/Faqs'
import Footer from './Footer/Footer'

const Landing = () => {
  return (
    <main className="bg-[#FBF9F6] text-slate-900">
        <Header />
        <Banner />
      
        <Teach />
        <Teacher />
        {/* <Impact /> */}
        <CoursesSection />
        <StudentsReviews />
        <FAQSection />
        <Footer />
    </main>
  )
}

export default Landing