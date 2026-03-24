import React from 'react'
import Header from './Header/Header'
import Banner from './Banner/Banner'
import Teach from './Teach/Teach'
import Teacher from '@/app/components/Landing/Teacher/teacher'
import StudentsReviews from './Reviews/Reviews'
import CoursesSection from './Subjects/Subjects'
import FAQSection from './FAQs/Faqs'
import Footer from './Footer/Footer'

const Landing = () => {
  return (
    <>
        <Header />
        <Banner />
      
        <Teach />
        <Teacher />
        <CoursesSection />
        <StudentsReviews />
        <FAQSection />
        <Footer />
    </>
  )
}

export default Landing