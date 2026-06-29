import type { CollectionConfig } from "payload"

export const Horoscopes: CollectionConfig = {
  slug: "horoscopes",
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user || req.headers.get("x-api-key") === process.env.PAYLOAD_SECRET),
    update: ({ req }) => Boolean(req.user || req.headers.get("x-api-key") === process.env.PAYLOAD_SECRET),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "date", type: "text", required: true },
    { name: "publishedDate", type: "date" },
    {
      name: "signs",
      type: "array",
      fields: [
        { name: "sign", type: "text" },
        { name: "reading", type: "textarea" },
        { name: "love", type: "number" },
        { name: "career", type: "number" },
        { name: "luckyColour", type: "text" },
        { name: "luckyNumber", type: "number" },
        { name: "luckyDay", type: "text" },
      ],
    },
  ],
}
