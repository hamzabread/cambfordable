import { AboutPage } from "./AboutPage";
import { builderPageOr, type BuilderSearchParams } from "@/lib/builder-page";

export default async function Page({ searchParams }: { searchParams: BuilderSearchParams }) {
  return builderPageOr("/about", searchParams, <AboutPage />);
}
