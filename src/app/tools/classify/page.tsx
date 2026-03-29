import { ensureStorageDirectories } from "@/lib/storage";
import { getImage, listImages } from "@/lib/images";
import { ClassifyTool } from "@/components/tools/classify-tool";

type PageProps = { searchParams: Promise<{ imageId?: string }> };

export default async function ClassifyPage({ searchParams }: PageProps) {
  await ensureStorageDirectories();
  const params = await searchParams;
  const images = listImages();
  const preselected = params.imageId ? getImage(params.imageId) : null;
  return <ClassifyTool initialImages={images} preselectedImage={preselected} />;
}
