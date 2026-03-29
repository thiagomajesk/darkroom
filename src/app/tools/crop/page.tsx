import { ensureStorageDirectories } from "@/lib/storage";
import { getImage, listImages } from "@/lib/images";
import { CropTool } from "@/components/tools/crop-tool";

type PageProps = { searchParams: Promise<{ imageId?: string }> };

export default async function CropPage({ searchParams }: PageProps) {
  await ensureStorageDirectories();
  const params = await searchParams;
  const images = listImages();
  const preselected = params.imageId ? getImage(params.imageId) : null;
  return <CropTool initialImages={images} preselectedImage={preselected} />;
}
