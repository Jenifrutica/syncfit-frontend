"use client";

/**
 * Decoupled exercise media renderer.
 *
 * Priority: animation/video (media_url) > image (image_url).
 * To add animations later, populate `media_url` in the contract catalog
 * (GIF/Lottie/mp4). No other code change is needed here.
 */
export function ExerciseMedia({
  mediaUrl,
  imageUrl,
  alt,
  className = "h-36 w-full object-cover",
}: {
  mediaUrl?: string | null;
  imageUrl?: string | null;
  alt: string;
  className?: string;
}) {
  if (mediaUrl) {
    const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);
    if (isVideo) {
      return <video src={mediaUrl} autoPlay loop muted playsInline className={className} />;
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaUrl} alt={alt} className={className} />;
  }
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={alt} className={className} />;
  }
  return null;
}

export default ExerciseMedia;
