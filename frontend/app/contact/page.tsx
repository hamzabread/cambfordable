import { builder } from "@/lib/builder";
import ContactForm from "./ContactForm";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ContactPage({ searchParams }: PageProps) {
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
            urlPath: "/contact",
          },
        })
        .toPromise();
    } catch (err) {
      console.error("Error fetching Builder.io content for path '/contact': ", err);
    }
  }

  if (content || isEditing) {
    return <RenderBuilderContent content={content} model="page" />;
  }

  return <ContactForm />;
}