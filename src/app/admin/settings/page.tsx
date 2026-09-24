import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Shell from '@/components/admin/Shell';
import SettingsForm, { type SettingsGroup } from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings' };

const GROUPS: SettingsGroup[] = [
  {
    key: 'site',
    title: 'Site identity',
    fields: {
      site_name: { type: 'text', label: 'Site name', required: true },
      site_short_name: { type: 'text', label: 'Short name', hint: 'Used in the dashboard and on phone home screens.' },
      site_tagline: { type: 'text', label: 'Tagline', full: true },
      logo_text: { type: 'text', label: 'Logo text', hint: 'Shown when no logo image is set.' },
      logo_image: { type: 'image', label: 'Logo image', folder: 'site', hint: 'Replaces the text logo. Around 200×60 pixels.' },
      favicon: { type: 'image', label: 'Favicon', folder: 'site', hint: 'The small browser-tab icon. A square PNG, SVG or .ico, 64×64 or larger. Leave empty for one drawn in your accent colour.' },
    },
  },
  {
    key: 'footer',
    title: 'Footer',
    note: 'Everything along the bottom of every page.',
    fields: {
      footer_about: {
        type: 'textarea', label: 'Footer introduction', rows: 2, full: true,
        hint: 'The short paragraph under your name. Leave empty to use the site tagline.',
      },
      footer_links_title: { type: 'text', label: 'Heading over the page links', default: 'Explore' },
      footer_topics_title: { type: 'text', label: 'Heading over the blog topics', default: 'Topics' },
      footer_contact_title: { type: 'text', label: 'Heading over your contact details', default: 'Reach me' },
      footer_show_links: { type: 'checkbox', label: 'Column: page links', default: true },
      footer_show_topics: { type: 'checkbox', label: 'Column: blog topics', default: true },
      footer_show_contact: { type: 'checkbox', label: 'Column: contact details', default: true },
      footer_show_social: { type: 'checkbox', label: 'Social icons', default: true },
      footer_show_rss: { type: 'checkbox', label: 'RSS feed icon', default: false },
      footer_show_email: { type: 'checkbox', label: 'Contact column: email', default: true },
      footer_show_phone: { type: 'checkbox', label: 'Contact column: phone', default: true },
      footer_show_location: { type: 'checkbox', label: 'Contact column: location', default: true },
      footer_show_hours: { type: 'checkbox', label: 'Contact column: usual hours', default: false },
      footer_copyright: {
        type: 'text', label: 'Copyright line', full: true,
        hint: 'Write {year} where the current year should go, and {name} for your name. Leave empty for the standard line.',
      },
      footer_note: { type: 'text', label: 'Footer note', full: true, hint: 'A last line under the copyright.' },
    },
  },
  {
    key: 'contact',
    title: 'Contact details',
    fields: {
      contact_email: { type: 'text', label: 'Public email' },
      contact_phone: { type: 'text', label: 'Phone', hint: 'Shown wherever it is switched on below. Leave empty to hide it everywhere.' },
      contact_location: { type: 'text', label: 'Location' },
      contact_hours: { type: 'text', label: 'Usual hours' },
      contact_intro: { type: 'textarea', label: 'Contact page introduction', rows: 3, full: true },
      notify_email: { type: 'text', label: 'Forward enquiries to', hint: 'Optional. Messages always stay in the dashboard inbox.' },
      map_embed: { type: 'textarea', label: 'Map embed code', rows: 3, full: true, hint: 'Paste the iframe from Google Maps. Leave empty to hide the map.' },
    },
  },
  {
    key: 'political',
    title: 'Political page',
    note: 'The standalone page at /political. Switch the page itself on or off under Menus & sections.',
    fields: {
      pol_name: { type: 'text', label: 'Name', default: 'विकेश अधिकारी', full: true },
      pol_eyebrow: { type: 'text', label: 'Line above the name', default: 'सार्वजनिक परिचय' },
      pol_phone: { type: 'text', label: 'Phone number',
                   hint: 'Shown as a call button that follows the reader down the political page. Clear the field to remove the button.' },
      pol_call_label: { type: 'text', label: 'Call button wording', default: 'फोन गर्नुहोस्' },
      pol_emblem: { type: 'image', label: 'Election symbol', folder: 'political',
                    hint: 'The symbol beside the name in the hero. Pressing it gives the जय नेपाल greeting. Leave empty for the tree.' },
      pol_emblem_label: { type: 'text', label: 'Symbol caption', default: 'रूख' },
      pol_roles: { type: 'text', label: 'Roles line', full: true,
                   default: 'IT • शिक्षाकर्मी • प्राविधिक • वक्ता • योजनाकार' },
      pol_candidacy: { type: 'text', label: 'Candidacy', full: true,
                       default: 'संघीय महाधिवेशन प्रतिनिधि उम्मेदवार',
                       hint: 'The post being contested. Shown as a band under the name.' },
      pol_candidacy_sub: { type: 'text', label: 'Candidacy detail', full: true,
                           default: 'युवा तर्फ — ३५ वर्षमुनि' },
      pol_candidacy_note: { type: 'textarea', label: 'Candidacy paragraph', rows: 3, full: true },
      pol_pillars: {
        type: 'textarea', label: 'Pledges', rows: 5, full: true,
        hint: 'One per line as first line | second line, for example  शिक्षित युवा | सबल संगठन.',
      },
      pol_quote: { type: 'textarea', label: 'Quotation', rows: 2, full: true,
                   default: 'सिक्नेहरूलाई कर्मशील बनाउने र कर्मशीलहरूलाई नेतृत्वतर्फ अघि बढाउने ।',
                   hint: 'No longer shown in the hero; kept for the share description.' },
      pol_intro: { type: 'textarea', label: 'Opening paragraph', rows: 3, full: true,
                   hint: 'No longer shown in the hero; kept for the share description.' },
      pol_portrait: { type: 'image', label: 'Portrait', folder: 'political',
                      hint: 'The photograph at the top of the page.' },
      pol_cover: { type: 'image', label: 'Share picture', folder: 'political',
                   hint: 'THIS is the picture Facebook, LinkedIn and WhatsApp show when the link is pasted. Around 1200×630. Leave empty and a card with your name and candidacy is drawn instead.' },
      pol_meta_description: { type: 'textarea', label: 'Share description', rows: 2, full: true,
                              hint: 'The line under the title when the link is shared.' },
      pol_listen_label: { type: 'text', label: 'Listen button text', full: true,
                          default: 'नपढी सुन्नका लागि यहाँ क्लिक गर्नुहोस्' },
      pol_footer_note: { type: 'text', label: 'Closing line', full: true,
                         default: 'समुन्नत नेपाल, सम्मानित नेपाली' },
      pol_jaya_label: { type: 'text', label: 'Greeting button text', full: true,
                        default: 'जय नेपाल भन्नुहोस्' },
      pol_jaya_audio: { type: 'file', label: 'Greeting recording', folder: 'political',
                        hint: 'MP3 of “जय नेपाल”. Strongly recommended: without one the browser has to speak the words itself, and a link opened inside Messenger or Facebook lands in a browser that often cannot. A recording plays everywhere.' },
    },
  },
  {
    key: 'contact_page',
    title: 'Contact page',
    note: 'Which of the details above appear beside the contact form, on the contact page and in the contact block on the home page.',
    fields: {
      contact_show_email: { type: 'checkbox', label: 'Email', default: true },
      contact_show_phone: { type: 'checkbox', label: 'Phone', default: true },
      contact_show_location: { type: 'checkbox', label: 'Location', default: true },
      contact_show_hours: { type: 'checkbox', label: 'Usual hours', default: true },
      contact_show_social: { type: 'checkbox', label: 'Social icons', default: true },
      contact_show_form: { type: 'checkbox', label: 'The message form', default: true },
      contact_show_map: { type: 'checkbox', label: 'The map', default: true },
    },
  },
  {
    key: 'social',
    title: 'Social links',
    note: 'Only the ones you fill in are shown.',
    fields: {
      social_linkedin: { type: 'url', label: 'LinkedIn' },
      social_facebook: { type: 'url', label: 'Facebook' },
      social_instagram: { type: 'url', label: 'Instagram' },
      social_youtube: { type: 'url', label: 'YouTube' },
      social_github: { type: 'url', label: 'GitHub' },
      social_twitter: { type: 'url', label: 'X / Twitter' },
      social_tiktok: { type: 'url', label: 'TikTok' },
    },
  },
  {
    key: 'seo',
    title: 'Search engines & sharing',
    fields: {
      meta_title: { type: 'text', label: 'Default page title', full: true },
      meta_description: { type: 'textarea', label: 'Default description', rows: 2, full: true, hint: 'Around 155 characters.' },
      meta_keywords: { type: 'text', label: 'Keywords', full: true },
      og_image: { type: 'image', label: 'Share image', folder: 'site', hint: 'Shown when a link is shared. 1200×630 pixels.' },
      search_indexing: { type: 'checkbox', label: 'Allow search engines to index this site', default: true },
    },
  },
  {
    key: 'appearance',
    title: 'Appearance',
    fields: {
      theme_accent: { type: 'color', label: 'Accent colour', default: '#2563eb' },
      theme_accent_alt: { type: 'color', label: 'Secondary colour', default: '#0ea5e9' },
      default_mode: { type: 'select', label: 'Default theme', options: { light: 'Light', dark: 'Dark', auto: "Follow the visitor's device" } },
      show_mode_toggle: { type: 'checkbox', label: 'Let visitors switch between light and dark', default: true },
    },
  },
  {
    key: 'blog',
    title: 'Blog',
    fields: {
      blog_title: { type: 'text', label: 'Blog heading' },
      posts_per_page: { type: 'number', label: 'Posts per page', default: 6, min: 1, max: 50 },
      blog_intro: { type: 'textarea', label: 'Blog introduction', rows: 2, full: true },
      comments_enabled: { type: 'checkbox', label: 'Allow comments on posts', default: true },
      comments_moderated: { type: 'checkbox', label: 'Hold new comments for my approval', default: true },
      newsletter_enabled: { type: 'checkbox', label: 'Show the newsletter signup', default: true },
    },
  },
  {
    key: 'site',
    title: 'Maintenance mode',
    note: 'While this is on, visitors see a holding page. You stay able to browse the site while signed in.',
    fields: {
      maintenance_mode: { type: 'checkbox', label: 'Take the site offline' },
      maintenance_text: { type: 'textarea', label: 'Message for visitors', rows: 2, full: true },
    },
  },
];

export default async function SettingsPage() {
  if ((await currentUser())?.role !== 'admin') redirect('/admin');
  const values = await getSettings();
  return (
    <Shell title="Settings" current="settings">
      <div className="page-head"><div><h2>Settings</h2></div></div>
      <SettingsForm
        groups={GROUPS}
        values={values}
        intro="Site-wide options. Every change takes effect on the public site as soon as you save."
      />
    </Shell>
  );
}
