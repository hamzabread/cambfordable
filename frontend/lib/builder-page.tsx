import type { ReactNode } from "react";
import { builder } from "@/lib/builder";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";

export type BuilderSearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Serve the Builder.io page for this path when one is published (or Builder's
 * editor is previewing it); otherwise render the page that lives in the repo. */
export async function builderPageOr(urlPath: string, searchParams: BuilderSearchParams, fallback: ReactNode) {
  const params = await searchParams;
  const isEditing = Boolean(params["builder.preview"] || params["builder.editing"] || params["builder.api_key"]);

  let content = null;
  if (process.env.NEXT_PUBLIC_BUILDER_API_KEY) {
    try {
      content = await builder.get("page", { userAttributes: { urlPath } }).toPromise();
    } catch (err) {
      console.error(`Error fetching Builder.io content for '${urlPath}':`, err);
    }
  }

  if (content || isEditing) {
    return <RenderBuilderContent content={content} model="page" />;
  }
  return fallback;
}
