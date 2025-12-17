import React from 'react'
import Header from './Header/Header'
import Banner from './Banner/Banner'
import Teach from './Teach/Teach'
import CertificatesSection from './Certificates/Certificates'
import StudentsReviews from './Reviews/Reviews'
import CoursesSection from './Subjects/Subjects'
import FAQSection from './FAQs/Faqs'
import Footer from './Footer/Footer'

const Landing = () => {
  return (
    <>
        <Header />
        <Banner />
        <CertificatesSection />
        <Teach />
        
        <CoursesSection />
        <StudentsReviews />
        <FAQSection />
        <Footer />
    </>
  )
}

export default Landing