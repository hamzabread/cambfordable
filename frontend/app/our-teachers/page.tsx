import { OurTeachersPage } from "./OurTeachersPage";
import { builderPageOr, type BuilderSearchParams } from "@/lib/builder-page";

export default async function OurTeachersPageWrapper({ searchParams }: { searchParams: BuilderSearchParams }) {
  return builderPageOr("/our-teachers", searchParams, <OurTeachersPage />);
}
