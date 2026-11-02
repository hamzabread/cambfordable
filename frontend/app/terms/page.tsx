import Link from "next/link";
import LegalPage from "../components/Legal/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="2 November 2026">
      <p>These terms apply when you create an account or use the Cambfordable website and student portal.</p>

      <h2>Your account</h2>
      <ul>
        <li>Each account is for one student. Keep your password private and don&apos;t share your login.</li>
        <li>Give accurate details, including a phone number we can reach you on.</li>
        <li>A live class can only be open on one device per account at a time.</li>
      </ul>

      <h2>Enrollment and payment</h2>
      <ul>
        <li>Requesting a course does not give access straight away. Access starts once an administrator verifies your payment proof.</li>
        <li>If a proof can&apos;t be verified, we&apos;ll tell you why and you can upload a new one.</li>
        <li>
          For questions about fees or payments, <Link href="/contact" className="font-semibold text-[#0866ef] underline">contact us</Link>.
        </li>
      </ul>

      <h2>Quizzes and assignments</h2>
      <ul>
        <li>Work you submit must be your own.</li>
        <li>
          Some quizzes are timed and monitored. Leaving the quiz tab or full screen is recorded, and a quiz may submit
          automatically when its time runs out or its rules are broken.
        </li>
        <li>Late work is accepted only where a quiz or assignment allows it, and is marked as late.</li>
      </ul>

      <h2>Classes and course materials</h2>
      <ul>
        <li>Class links, recordings and materials are for your own study. Don&apos;t share or republish them.</li>
        <li>Be respectful in class chat. We may remove access for abuse or disruption.</li>
      </ul>

      <h2>Changes</h2>
      <p>
        We may update these terms as the service changes. The date at the top shows the latest version. Questions?{" "}
        <Link href="/contact" className="font-semibold text-[#0866ef] underline">Get in touch</Link>.
      </p>
    </LegalPage>
  );
}
