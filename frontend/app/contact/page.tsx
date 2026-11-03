import ContactForm from "./ContactForm";
import { builderPageOr, type BuilderSearchParams } from "@/lib/builder-page";

export default async function ContactPage({ searchParams }: { searchParams: BuilderSearchParams }) {
  return builderPageOr("/contact", searchParams, <ContactForm />);
}
