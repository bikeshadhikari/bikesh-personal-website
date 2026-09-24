import Icon from '../Icon';

/**
 * A call button that follows the reader down the page, above the जय नेपाल one.
 *
 * It is an ordinary link rather than a script: `tel:` is what a phone already
 * knows how to do, so a tap dials and a desktop hands it to whatever the
 * machine uses for calls. The number is written out beside the icon on a wide
 * screen, because someone reading on a laptop will want to write it down
 * rather than press it.
 */
export default function PoliticalCall({ phone, label }: { phone: string; label: string }) {
  // tel: takes digits and a leading plus, nothing else.
  const dial = phone.replace(/[^\d+]/g, '');
  if (!dial) return null;

  return (
    <a
      className="pol-call"
      href={`tel:${dial.startsWith('+') ? dial : `+${dial}`}`}
      aria-label={`${label}: ${phone}`}
    >
      <span className="pol-call-icon" aria-hidden="true"><Icon name="phone" /></span>
      <span className="pol-call-text">
        <strong>{label}</strong>
        <small>{phone}</small>
      </span>
    </a>
  );
}
