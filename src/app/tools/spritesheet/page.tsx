import { ensureStorageDirectories } from "@/lib/storage";
import { getImage, listImages } from "@/lib/images";
import { SpritesheetTool } from "@/components/tools/spritesheet-tool";

type PageProps = { searchParams: Promise<{ imageId?: string }> };

export default async function SpritesheetPage({ searchParams }: PageProps) {
  await ensureStorageDirectories();
  const params = await searchParams;
  const images = listImages();
  const preselected = params.imageId ? getImage(params.imageId) : null;
  return <SpritesheetTool initialImages={images} preselectedImage={preselected} />;
}
