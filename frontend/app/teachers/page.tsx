import { OurTeachersPage } from "../our-teachers/OurTeachersPage";
import { builderPageOr, type BuilderSearchParams } from "@/lib/builder-page";

export default async function TeachersAliasPage({ searchParams }: { searchParams: BuilderSearchParams }) {
  return builderPageOr("/teachers", searchParams, <OurTeachersPage />);
}
