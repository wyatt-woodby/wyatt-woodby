import { config, collection, singleton, fields } from "@keystatic/core";

const storage =
  process.env.NODE_ENV === "production" && process.env.KEYSTATIC_REPO
    ? ({ kind: "github", repo: process.env.KEYSTATIC_REPO } as const)
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
              { label: "Legacy MP4", value: "video" },
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
            video: fields.object({
              videoSrc: fields.text({ label: "MP4 path (legacy)" }),
              poster: fields.text({ label: "Poster path (legacy)" }),
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
