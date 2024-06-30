export function combineDocuments(docs: { pageContent: string }[]): string {
  return docs.map((doc) => doc.pageContent).join("\n\n");
}
