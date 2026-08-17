import { config, collection, singleton, fields } from "@keystatic/core";

// The repo owner/name are public, so they must be hardcoded here (not read from
// a server-only env var) — this config is evaluated in the browser bundle too,
// and Next only exposes NEXT_PUBLIC_* vars there. Reading KEYSTATIC_REPO here
// made the client fall back to "local" while the server used "github", breaking
// the GitHub login gate and all collection reads.
const storage =
  process.env.NODE_ENV === "production"
    ? ({
        kind: "github",
        repo: { owner: "wyatt-woodby", name: "wyatt-woodby" },
      } as const)
    : ({ kind: "local" } as const);

export default config({
  storage,
  collections: {
    media: collection({
      label: "Media",
      slugField: "title",
      path: "content/media/*",
      format: { data: "json" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        media: fields.conditional(
          fields.select({
            label: "Type",
            options: [
              { label: "Vimeo video", value: "vimeo" },
              { label: "Image", value: "image" },
            ],
            defaultValue: "vimeo",
          }),
          {
            vimeo: fields.object({
              vimeoUrl: fields.text({
                label: "Vimeo link",
                description: "Paste the Vimeo share link or embed code.",
                multiline: true,
              }),
            }),
            image: fields.object({
              file: fields.image({
                label: "Image",
                directory: "public/media",
                publicPath: "/media/",
              }),
            }),
          },
        ),
      },
    }),
  },
  singletons: {
    feed: singleton({
      label: "Feed order",
      path: "content/feed",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.relationship({ label: "Item", collection: "media" }),
          { label: "Items", itemLabel: (p) => p.value ?? "Select item" },
        ),
      },
    }),
  },
});
