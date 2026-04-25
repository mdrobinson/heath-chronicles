import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dtium3yae',
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function generateOptimizedUrl(publicId: string, type: string, cloudName: string) {
  if (type === 'video') {
    return `https://res.cloudinary.com/${cloudName}/video/upload/w_300,q_auto/${publicId}`;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/w_300,q_auto,f_auto,c_fill,g_auto/${publicId}`;
}

/**
 * Format resource object consistently
 */
function formatResource(resource: any) {
  const cloudName = 'dtium3yae';
  const isVideo = resource.resource_type === 'video';

  return {
    publicId: resource.public_id,
    assetId: resource.asset_id,
    format: resource.format,
    resourceType: resource.resource_type,
    width: resource.width,
    height: resource.height,
    url: resource.secure_url,
    createdAt: resource.created_at,
    tags: resource.tags || [],
    folder: resource.folder,
    metadata: resource.metadata || {},
    context: resource.context || {},

    // Generate optimized URLs
    optimizedUrl: generateOptimizedUrl(resource.public_id, isVideo ? 'video' : 'image', cloudName),
    thumbnailUrl: isVideo
      ? `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_150,h_150,c_fill/${resource.public_id}.jpg`
      : `https://res.cloudinary.com/${cloudName}/image/upload/w_150,h_150,c_fill/${resource.public_id}`,
  };
}

export async function listFolders() {
  const result = await cloudinary.api.root_folders();
  console.log(result.folders); // logs [{ name, path, external_id }, ...]
}

export async function fetchAllMediaFromFolder(folderPath: string) {
  try {
    // Fetch images
    const imageResults = await cloudinary.api.resources_by_asset_folder(folderPath, {
      resource_type: 'image',
      max_results: 500,
      metadata: true,
      context: true,
    });

    // Fetch videos
    const videoResults = await cloudinary.api.resources_by_asset_folder(folderPath, {
      resource_type: 'video',
      max_results: 500,
      metadata: true,
      context: true,
    });

    const images = imageResults.resources.map(formatResource);
    const videos = videoResults.resources.map(formatResource);

    return {
      images,
      videos,
      all: [...images, ...videos],
      total: images.length + videos.length,
    };
  } catch (error) {
    console.error(`Error fetching media from folder "${folderPath}":`, error);
    return { images: [], videos: [], all: [], total: 0 };
  }
}
