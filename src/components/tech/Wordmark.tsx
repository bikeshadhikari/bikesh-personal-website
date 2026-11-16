/**
 * The Simplified Tech wordmark: the name set tight and lower-case, a slanted
 * stroke in the accent colour, and the "by" line in mono beneath. Drawn in
 * type rather than an image so it is sharp at every size and follows the theme.
 */
export default function Wordmark({
  name, by, size = 'md', image,
}: { name: string; by?: string; size?: 'sm' | 'md' | 'xl'; image?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`st-logo-img st-logo-${size}`} src={image} alt={by ? `${name} ${by}` : name} />;
  }
  return (
    <span className={`st-wordmark st-wordmark-${size}`}>
      <span className="st-wordmark-row">
        <span className="st-wordmark-name">{name.toLowerCase()}</span>
        <span className="st-wordmark-slash" aria-hidden="true" />
      </span>
      {by && size !== 'xl' && <span className="st-wordmark-by">{by}</span>}
    </span>
  );
}
