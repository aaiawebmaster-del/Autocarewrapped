type CommunityLogoImageMarkProps = {
  src: string;
  className?: string;
};

/** Community wordmark — fills the glossy button face edge-to-edge. */
export function CommunityLogoImageMark({ src, className }: CommunityLogoImageMarkProps) {
  return (
    <img
      src={src}
      alt=""
      className={['community-logo-gauge__logo-image', className].filter(Boolean).join(' ')}
      draggable={false}
    />
  );
}
