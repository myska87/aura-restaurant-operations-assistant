import React from 'react';

/**
 * Universal Video Embed Component
 * Supports: YouTube, HeyGen, Vimeo, Loom, Wistia, and direct video URLs
 */
export default function VideoEmbed({ url, className = "w-full h-full" }) {
  if (!url) return null;

  // Detect video platform and generate embed URL
  const getEmbedUrl = (videoUrl) => {
    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('youtu.be')
        ? videoUrl.split('youtu.be/')[1]?.split('?')[0]
        : videoUrl.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // HeyGen
    if (videoUrl.includes('heygen.com') || videoUrl.includes('app.heygen.com')) {
      // HeyGen share links format: https://app.heygen.com/share/[id]
      if (videoUrl.includes('/share/')) {
        return videoUrl; // HeyGen share URLs work directly in iframes
      }
      // HeyGen embed format
      if (videoUrl.includes('/embed/')) {
        return videoUrl;
      }
    }

    // Vimeo
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // Loom
    if (videoUrl.includes('loom.com')) {
      const videoId = videoUrl.split('loom.com/share/')[1]?.split('?')[0];
      return `https://www.loom.com/embed/${videoId}`;
    }

    // Wistia
    if (videoUrl.includes('wistia.com')) {
      const videoId = videoUrl.split('wistia.com/medias/')[1]?.split('?')[0];
      return `https://fast.wistia.net/embed/iframe/${videoId}`;
    }

    // Instagram (limited support, may not work in all contexts)
    if (videoUrl.includes('instagram.com')) {
      return `${videoUrl}embed/`;
    }

    // Direct video URL (mp4, webm, etc.)
    if (videoUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
      return null; // Will use <video> tag instead
    }

    // Default: return as-is (might be a direct embed URL)
    return videoUrl;
  };

  const embedUrl = getEmbedUrl(url);

  // If it's a direct video file, use <video> tag
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return (
      <video
        src={url}
        controls
        className={className}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  // Otherwise use iframe
  return (
    <iframe
      src={embedUrl}
      className={className}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      frameBorder="0"
      title="Video Player"
    />
  );
}