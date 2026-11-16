import Icon from '@/components/Icon';

/** The site's icon set, plus a filled YouTube play button for the brand red. */
export default function TechIcon({ name, className = 'st-ico' }: { name: string; className?: string }) {
  if (name === 'youtube-filled') {
    return (
      <svg className={className} viewBox="0 0 28 20" aria-hidden="true">
        <rect width="28" height="20" rx="5" fill="#ff0000" />
        <path d="M11.2 5.8v8.4l7.2-4.2z" fill="#fff" />
      </svg>
    );
  }
  return <Icon name={name} className={className} />;
}
