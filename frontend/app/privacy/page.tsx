import Link from "next/link";
import LegalPage from "../components/Legal/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="2 November 2026">
      <p>
        This page explains what Cambfordable collects when you use the website and student portal, why, and who can
        see it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, username, email address, phone number and password (stored only as a secure hash).</li>
        <li>Profile details you choose to add, such as date of birth, gender, nationality and address.</li>
        <li>Payment proofs you upload when you request a course.</li>
        <li>Your coursework: assignment files, quiz answers, grades and teacher feedback.</li>
        <li>Messages you send in live class chats and through the contact form.</li>
        <li>
          Quiz activity needed to keep quizzes fair: how often you leave the quiz tab or exit full screen, and when you
          started.
        </li>
        <li>A device identifier for live classes, so one account can only join from one device at a time.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account, verify your enrollment and give you access to your courses.</li>
        <li>To send class reminders, course announcements and WhatsApp group invitations.</li>
        <li>To grade your work and show you your results.</li>
        <li>To answer messages you send us.</li>
      </ul>

      <h2>Who can see it</h2>
      <ul>
        <li>Cambfordable administrators can see account, enrollment and payment information.</li>
        <li>Teaching assistants can see coursework and quiz activity for the courses they teach.</li>
        <li>Other students cannot see your files, grades or private chat messages.</li>
        <li>
          Live classes run on Zoom, and WhatsApp messages are sent through Twilio; they receive only what is needed to
          deliver those services.
        </li>
      </ul>

      <h2>Keeping it safe</h2>
      <p>
        Uploaded files can only be opened by people signed in with permission to see them. We do not sell your
        information.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update your profile details at any time from your portal profile. To ask for a copy of your data or for
        your account to be deleted, <Link href="/contact" className="font-semibold text-[#0866ef] underline">contact us</Link>.
      </p>
    </LegalPage>
  );
}
