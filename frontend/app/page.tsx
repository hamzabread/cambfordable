import Landing from "./components/Landing/Landing";
import { builderPageOr, type BuilderSearchParams } from "@/lib/builder-page";

export default async function Home({ searchParams }: { searchParams: BuilderSearchParams }) {
  return builderPageOr("/", searchParams, <Landing />);
}
