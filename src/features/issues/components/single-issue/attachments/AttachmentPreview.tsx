import { PhotoSlider } from "react-photo-view";

type AttachmentPreviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  imageUrl: string | null;
};

export function AttachmentPreview({ open, onOpenChange, fileName, imageUrl }: AttachmentPreviewProps) {
  if (!imageUrl) return null;

  return (
    <PhotoSlider
      speed={() => 300}
      images={[{ src: imageUrl, key: imageUrl }]}
      visible={open}
      onClose={() => onOpenChange(false)}
      index={0}
      photoClosable={false}
      maskClosable
      maskOpacity={0.8}
      pullClosable
      bannerVisible
      overlayRender={() => <div className="pointer-events-none absolute inset-x-0 top-0 z-10 truncate bg-black/50 px-4 py-3 text-center text-sm text-white">{fileName}</div>}
    />
  );
}
