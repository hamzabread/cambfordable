import { builder } from "@/lib/builder";
import { OurTeachersPage } from "./OurTeachersPage";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function OurTeachersPageWrapper({ searchParams }: PageProps) {
  const resolvedParams = searchParams instanceof Promise ? await searchParams : (searchParams || {});
  
  const isEditing = !!(
    resolvedParams["builder.preview"] ||
    resolvedParams["builder.editing"] ||
    resolvedParams["builder.api_key"]
  );

  let content = null;
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY;

  if (apiKey) {
    try {
      content = await builder
        .get("page", {
          userAttributes: {
            urlPath: "/our-teachers",
          },
        })
        .toPromise();
    } catch (err) {
      console.error("Error fetching Builder.io content for path '/our-teachers': ", err);
    }
  }

  if (content || isEditing) {
    return <RenderBuilderContent content={content} model="page" />;
  }

  return <OurTeachersPage />;
}
