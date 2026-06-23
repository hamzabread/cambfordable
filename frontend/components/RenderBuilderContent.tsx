"use client";

import { BuilderComponent } from "@builder.io/react";
import "@/lib/builder-registry"; // Ensure all components are registered in Builder.io
import "@/lib/builder"; // Ensure builder is initialized

interface RenderBuilderContentProps {
  content: any;
  model: string;
}

export function RenderBuilderContent({ content, model }: RenderBuilderContentProps) {
  // If content exists or we are in the Builder editor, render the visual builder canvas.
  // BuilderComponent client-side scripts handle the postMessage iframe communication automatically.
  return <BuilderComponent model={model} content={content} />;
}

