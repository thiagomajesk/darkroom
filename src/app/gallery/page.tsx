import { ensureStorageDirectories } from "@/lib/storage";
import { listImages } from "@/lib/images";
import { listCollections } from "@/lib/collections";
import { GalleryPage } from "@/components/gallery/gallery-page";

export default async function Gallery() {
  await ensureStorageDirectories();
  const images = listImages();
  const collections = listCollections();
  return <GalleryPage initialImages={images} initialCollections={collections} />;
}
