import { getMedia } from "../lib/media-data";
import { Feed } from "./Feed";

export default async function Home() {
  const items = await getMedia();
  return <Feed items={items} />;
}
