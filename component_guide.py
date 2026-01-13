#!/usr/bin/env python3
"""
Script to generate a PDF guide of Cambfordable frontend components
"""

import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib import colors
from datetime import datetime

# Create PDF
pdf_filename = "/Users/hamzaelahi/Desktop/Hamza/Projects/Personal/cambfordable/cambfordable/Cambfordable_Component_Guide.pdf"
doc = SimpleDocTemplate(pdf_filename, pagesize=letter,
                        rightMargin=0.75*inch, leftMargin=0.75*inch,
                        topMargin=0.75*inch, bottomMargin=0.75*inch)

# Container for PDF elements
elements = []

# Custom Styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#1E3557'),
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=colors.HexColor('#1E3557'),
    spaceAfter=10,
    spaceBefore=10,
    fontName='Helvetica-Bold'
)

subheading_style = ParagraphStyle(
    'CustomSubHeading',
    parent=styles['Heading3'],
    fontSize=11,
    textColor=colors.HexColor('#275EB1'),
    spaceAfter=6,
    spaceBefore=6,
    fontName='Helvetica-Bold'
)

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=9,
    textColor=colors.HexColor('#333333'),
    spaceAfter=6,
    alignment=TA_JUSTIFY
)

code_style = ParagraphStyle(
    'CodeStyle',
    parent=styles['BodyText'],
    fontSize=8,
    textColor=colors.HexColor('#FFFFFF'),
    backColor=colors.HexColor('#1E3557'),
    spaceAfter=6,
    leftIndent=12,
    rightIndent=12,
    fontName='Courier'
)

# Title Page
elements.append(Spacer(1, 1.5*inch))
elements.append(Paragraph("CAMBFORDABLE", title_style))
elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph("Frontend Components Guide", ParagraphStyle(
    'SubTitle',
    parent=styles['Heading2'],
    fontSize=16,
    textColor=colors.HexColor('#275EB1'),
    alignment=TA_CENTER
)))
elements.append(Spacer(1, 0.5*inch))
elements.append(Paragraph(f"<b>Document Version:</b> 1.0<br/><b>Generated:</b> {datetime.now().strftime('%B %d, %Y')}<br/><b>Purpose:</b> Guide for frontend developers making text changes to the main pages", body_style))
elements.append(Spacer(1, 1*inch))
elements.append(Paragraph("<b>This guide provides a comprehensive breakdown of:</b><br/>• Landing Page Components<br/>• Contact Page Components<br/>• About Page Components<br/>• Text locations and file paths for easy modifications", body_style))

elements.append(PageBreak())

# Table of Contents
elements.append(Paragraph("Table of Contents", heading_style))
elements.append(Spacer(1, 0.2*inch))
toc_data = [
    ["1.", "Landing Page Overview", "3"],
    ["2.", "Landing Page Components", "4-8"],
    ["3.", "Contact Page Overview", "9"],
    ["4.", "Contact Page Components", "10"],
    ["5.", "About Page Overview", "11"],
    ["6.", "About Page Components", "12-13"],
    ["7.", "File Structure Reference", "14"],
]
toc_table = Table(toc_data, colWidths=[0.5*inch, 4*inch, 1*inch])
toc_table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
elements.append(toc_table)

elements.append(PageBreak())

# SECTION 1: LANDING PAGE
elements.append(Paragraph("Landing Page Overview", heading_style))
elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph("<b>File Location:</b> <font color='#275EB1'>/frontend/app/page.tsx</font>", body_style))
elements.append(Paragraph("<b>Purpose:</b> Main homepage displaying the Cambfordable landing page experience", body_style))
elements.append(Spacer(1, 0.2*inch))

elements.append(Paragraph("The landing page is composed of the following sections:", body_style))
elements.append(Spacer(1, 0.1*inch))

landing_components = [
    ["Component", "Location", "Primary Content"],
    ["Header", "Header/Header.tsx", "Navigation menu, branding, login/join buttons"],
    ["Banner", "Banner/Banner.tsx", "Hero section with main heading & CTA buttons"],
    ["Certificates Section", "Certificates/Certificates.tsx", "Educational background & credentials"],
    ["Teach Section", "Teach/Teach.tsx", "Teaching methodology overview"],
    ["Courses/Subjects", "Subjects/Subjects.tsx", "Available courses and subjects offered"],
    ["Reviews", "Reviews/Reviews.tsx", "Student testimonials carousel"],
    ["FAQ", "FAQs/Faqs.tsx", "Frequently asked questions"],
    ["Footer", "Footer/Footer.tsx", "Footer information and links"],
]

landing_table = Table(landing_components, colWidths=[1.5*inch, 2.2*inch, 2.3*inch])
landing_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3557')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F3F3')]),
]))
elements.append(landing_table)

elements.append(PageBreak())

# DETAILED LANDING COMPONENTS
elements.append(Paragraph("Landing Page - Detailed Component Guide", heading_style))
elements.append(Spacer(1, 0.2*inch))

# Header Component
elements.append(Paragraph("1. Header Component", subheading_style))
elements.append(Paragraph("<b>File:</b> /frontend/app/components/Landing/Header/Header.tsx", body_style))
elements.append(Spacer(1, 0.1*inch))

header_info = [
    ["Element", "Text/Content", "Notes"],
    ["Logo Text", "Cambfordable", "Line 18: text-white font-bold text-2xl"],
    ["Navigation Links", "Home, Our Teachers, Contact, More", "Lines 19-42: Navigation menu items"],
    ["Button 1", "Login", "Line 44-46: Login button"],
    ["Button 2", "Join", "Line 48-50: Join button"],
]
header_table = Table(header_info, colWidths=[1.2*inch, 2*inch, 2.8*inch])
header_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#275EB1')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
]))
elements.append(header_table)
elements.append(Spacer(1, 0.2*inch))

# Banner Component
elements.append(Paragraph("2. Banner Component (Hero Section)", subheading_style))
elements.append(Paragraph("<b>File:</b> /frontend/app/components/Landing/Banner/Banner.tsx", body_style))
elements.append(Spacer(1, 0.1*inch))

banner_info = [
    ["Element", "Text/Content", "Line Number"],
    ["Main Heading", "Learn O and A-Levels live online", "18"],
    ["Subheading", "Join structured classes with qualified tutors. Real-time instruction, small groups, and the space to grow at your own pace.", "23"],
    ["Button 1", "Enroll Now", "28"],
    ["Button 2", "Learn More", "32"],
]
banner_table = Table(banner_info, colWidths=[1.2*inch, 2.5*inch, 1.3*inch])
banner_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#275EB1')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
]))
elements.append(banner_table)
elements.append(Spacer(1, 0.2*inch))

# Teach Component
elements.append(Paragraph("3. Teach Component (Teaching Methodology)", subheading_style))
elements.append(Paragraph("<b>File:</b> /frontend/app/components/Landing/Teach/Teach.tsx", body_style))
elements.append(Spacer(1, 0.1*inch))

teach_info = [
    ["Element", "Text/Content", "Notes"],
    ["Subtitle", "How we teach", "Line 8: Small bold text"],
    ["Main Heading", "One on one sessions to learn online", "Line 9-11: Large heading"],
    ["Body Text", "We built Cambfordable to cut through the noise...", "Line 12-15: Description paragraph"],
    ["Button", "Learn more", "Line 16: CTA button"],
]
teach_table = Table(teach_info, colWidths=[1.2*inch, 2*inch, 2.8*inch])
teach_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#275EB1')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
]))
elements.append(teach_table)
elements.append(Spacer(1, 0.2*inch))

# Subjects Component
elements.append(Paragraph("4. Subjects/Courses Component", subheading_style))
elements.append(Paragraph("<b>File:</b> /frontend/app/components/Landing/Subjects/Subjects.tsx", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Section Heading:</b> 'Subjects I Teach' (Line 85)", body_style))
elements.append(Paragraph("<b>Section Subheading:</b> 'Comprehensive courses covering O-Levels, A-Levels, and specialized AI training' (Line 88)", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Available Courses (See lines 12-75 for course data):</b>", body_style))

courses_list = [
    "1. Mathematics - 'Master algebra, calculus, statistics...' (Line 18)",
    "2. Physics - 'Understand mechanics, thermodynamics...' (Line 27)",
    "3. Chemistry - 'Explore organic, inorganic, and physical chemistry...' (Line 36)",
    "4. English Literature - 'Analyze texts, improve writing skills...' (Line 45)",
    "5. Artificial Intelligence - 'Learn machine learning, deep learning...' (Line 54)",
    "6. Global Perspectives - 'Understand international issues...' (Line 63)",
]

for course in courses_list:
    elements.append(Paragraph("• " + course, body_style))

elements.append(Spacer(1, 0.2*inch))

# Reviews Component
elements.append(Paragraph("5. Reviews Component (Student Testimonials)", subheading_style))
elements.append(Paragraph("<b>File:</b> /frontend/app/components/Landing/Reviews/Reviews.tsx", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Section Heading:</b> 'What My Students Say' (Line 75)", body_style))
elements.append(Paragraph("<b>Section Subheading:</b> 'Join hundreds of satisfied students who have achieved their academic goals' (Line 78)", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Review Data Location:</b> Lines 10-68 contain 6 student reviews with structure:<br/>- Student name<br/>- Subject taken<br/>- Star rating (all 5 stars)<br/>- Review text", body_style))

elements.append(PageBreak())

# FAQ Component
elements.append(Paragraph("6. FAQ Component", subheading_style))
elements.append(Paragraph("<b>File:</b> /frontend/app/components/Landing/FAQs/Faqs.tsx", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Section Heading:</b> 'Frequently Asked Questions' (Line 91)", body_style))
elements.append(Paragraph("<b>Section Subheading:</b> 'Find answers to common questions about my tutoring services, qualifications, and policies' (Line 94)", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>FAQ Items (Lines 16-84):</b><br/>1. What qualifications do you have?<br/>2. How do one-on-one sessions work?<br/>3. What subjects do you teach?<br/>4. How much does tutoring cost?<br/>5. Can you help with exam preparation?<br/>6. What if I need to cancel or reschedule?<br/>7. Do you provide study materials?<br/>8. How do I get started?", body_style))

elements.append(Spacer(1, 0.3*inch))

elements.append(PageBreak())

# SECTION 2: CONTACT PAGE
elements.append(Paragraph("Contact Page Overview", heading_style))
elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph("<b>File Location:</b> <font color='#275EB1'>/frontend/app/contact/page.tsx</font>", body_style))
elements.append(Paragraph("<b>Purpose:</b> Contact form and information page for visitors to reach out", body_style))
elements.append(Spacer(1, 0.2*inch))

elements.append(Paragraph("Contact Page - Detailed Component Guide", subheading_style))
elements.append(Spacer(1, 0.1*inch))

contact_elements = [
    ["Section", "Text/Content", "Line Number"],
    ["Badge", "Get In Touch", "Line 80"],
    ["Main Heading", "Feel Free To Contact", "Line 83"],
    ["Contact Card 1 - Phone", "+92 345 9202628, +92 345 9225425, 051-7066015", "Lines 28-30"],
    ["Contact Card 2 - Location", "Online Learning Platform, Global Accessibility, 24/7 Available", "Lines 31-35"],
    ["Contact Card 3 - Email", "hello@cambfordable.com, support@cambfordable.com", "Lines 36-39"],
    ["Form Badge", "Contact", "Line 130"],
    ["Form Heading", "Need Help Or Have A Question?", "Line 133"],
]

contact_table = Table(contact_elements, colWidths=[1.3*inch, 2.3*inch, 1.4*inch])
contact_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#275EB1')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
]))
elements.append(contact_table)

elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph("<b>Form Fields:</b><br/>• Name input field (Line 143)<br/>• Email input field (Line 152)<br/>• Message textarea (Line 161)<br/>• Submit button 'SEND NOW' (Line 171)", body_style))

elements.append(PageBreak())

# SECTION 3: ABOUT PAGE
elements.append(Paragraph("About Page Overview", heading_style))
elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph("<b>File Location:</b> <font color='#275EB1'>/frontend/app/about/page.tsx</font>", body_style))
elements.append(Paragraph("<b>Purpose:</b> Company information, values, features, and educational offerings", body_style))
elements.append(Spacer(1, 0.2*inch))

elements.append(Paragraph("About Page - Detailed Component Guide", subheading_style))
elements.append(Spacer(1, 0.1*inch))

about_sections = [
    ["Section", "Heading", "Location"],
    ["Hero/Intro", "About Cambfordable", "Lines 89-103"],
    ["Stats Section", "500+ Students, 4.9★ Rating, 99% Pass Rate, 24/7 Support", "Lines 108-124"],
    ["Why Choose Us", "Why Choose Cambfordable?", "Lines 130-147"],
    ["Core Values", "Our Core Values", "Lines 153-176"],
    ["Subjects", "What We Teach", "Lines 182-207"],
    ["CTA Section", "Ready to Transform Your Learning?", "Lines 213-224"],
]

about_table = Table(about_sections, colWidths=[1.3*inch, 2.3*inch, 1.4*inch])
about_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#275EB1')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
]))
elements.append(about_table)

elements.append(Spacer(1, 0.2*inch))

elements.append(Paragraph("<b>Core Values (Lines 56-75):</b>", body_style))
values_text = [
    "1. Excellence - 'We strive for excellence in every aspect...'",
    "2. Accessibility - 'Education should be accessible to everyone...'",
    "3. Innovation - 'We continuously evolve our teaching methods...'",
    "4. Support - 'Your success is our success...'",
]
for val in values_text:
    elements.append(Paragraph("• " + val, body_style))

elements.append(Spacer(1, 0.15*inch))

elements.append(Paragraph("<b>Features/Why Choose Us (Lines 10-39):</b>", body_style))
features_text = [
    "1. Expert Tutors - 'Learn from qualified, experienced educators...'",
    "2. Flexible Learning - 'Study at your own pace...'",
    "3. Personalized Approach - 'Every student is unique...'",
    "4. Proven Results - '95% of our students achieve their target grades...'",
    "5. Comprehensive Resources - 'Access to extensive study materials...'",
    "6. Affordable Pricing - 'Quality education shouldn't be expensive...'",
]
for feat in features_text:
    elements.append(Paragraph("• " + feat, body_style))

elements.append(PageBreak())

# FILE STRUCTURE REFERENCE
elements.append(Paragraph("File Structure Reference", heading_style))
elements.append(Spacer(1, 0.2*inch))

elements.append(Paragraph("Complete Component File Paths:", subheading_style))
elements.append(Spacer(1, 0.1*inch))

file_structure = """
<b>Landing Page Components:</b>
/frontend/app/components/Landing/Landing.tsx (Main container)
├── Header/Header.tsx
├── Banner/Banner.tsx
├── Certificates/Certificates.tsx
├── Teach/Teach.tsx
├── Subjects/Subjects.tsx
├── Reviews/Reviews.tsx
├── FAQs/Faqs.tsx
└── Footer/Footer.tsx

<b>Main Page Files:</b>
/frontend/app/page.tsx (Home page - imports Landing)
/frontend/app/contact/page.tsx (Contact page)
/frontend/app/about/page.tsx (About page)

<b>Shared Components:</b>
/frontend/app/components/Landing/Header/Header.tsx (Used in all pages)
/frontend/app/components/Landing/Footer/Footer.tsx (Used in all pages)
"""

elements.append(Paragraph(file_structure, body_style))

elements.append(Spacer(1, 0.3*inch))

elements.append(Paragraph("Quick Edit Checklist", heading_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("""
When making text changes, follow these steps:

1. <b>Identify the text location</b> - Use this guide to find which component contains the text
2. <b>Open the correct file</b> - Navigate to the file path listed
3. <b>Find the specific line</b> - Reference the line numbers provided in the tables
4. <b>Make your changes</b> - Edit the text in the JSX/TSX code
5. <b>Test locally</b> - Run the development server to verify changes
6. <b>Commit and push</b> - Push your changes to the repository

<b>Important Notes:</b>
• All text is embedded in JSX/TSX code, not in external text files
• Some components use data arrays (like courses, reviews, FAQs) defined within the component
• Remember to preserve quotes, braces, and JSX syntax when editing
• Keep responsive design in mind - test on multiple screen sizes
""", body_style))

elements.append(Spacer(1, 0.3*inch))

elements.append(Paragraph("Contact & Support", heading_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("""
For questions about the codebase structure or component locations, refer to this guide.

<b>Document Information:</b>
• Generated: """ + datetime.now().strftime('%B %d, %Y at %H:%M') + """
• Version: 1.0
• Component Coverage: Landing Page, Contact Page, About Page
• Scope: Frontend text elements only
""", body_style))

# Build PDF
doc.build(elements)
print(f"✅ PDF generated successfully: {pdf_filename}")
print(f"📄 File size: {os.path.getsize(pdf_filename) / 1024:.2f} KB")
