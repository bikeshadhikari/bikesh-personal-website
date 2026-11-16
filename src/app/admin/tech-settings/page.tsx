import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Shell from '@/components/admin/Shell';
import SettingsForm, { type SettingsGroup } from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/settings';
import { TECH_DEFAULTS } from '@/lib/tech';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Simplified Tech settings' };

const d = (key: string) => TECH_DEFAULTS[key];

const GROUPS: SettingsGroup[] = [
  {
    key: 'tech',
    title: 'Brand',
    note: 'The name, handle and taglines across the Simplified Tech pages. The wordmark is drawn from the name and “by” line.',
    fields: {
      st_name: { type: 'text', label: 'Name (English)', default: d('st_name') },
      st_by: { type: 'text', label: '“By” line (English)', default: d('st_by') },
      st_name_ne: { type: 'text', label: 'Name (नेपाली)', default: d('st_name_ne') },
      st_by_ne: { type: 'text', label: '“By” line (नेपाली)', default: d('st_by_ne') },
      st_handle: { type: 'text', label: 'Handle', default: d('st_handle'), hint: 'Shown under the wordmark and in the footer.' },
      st_kicker: { type: 'text', label: 'Secondary label (English)', default: d('st_kicker'),
                   hint: 'A quieter label used in the footer and the tab title, e.g. Tech Explainer.' },
      st_kicker_ne: { type: 'text', label: 'Secondary label (नेपाली)', default: d('st_kicker_ne') },
      st_tagline: { type: 'text', label: 'Tagline (English)', full: true, default: d('st_tagline') },
      st_tagline_ne: { type: 'text', label: 'Tagline (नेपाली)', full: true, default: d('st_tagline_ne') },
      st_logo_image: { type: 'image', label: 'Logo image', folder: 'tech',
                       hint: 'Optional. Replaces the drawn wordmark in the header. A wide transparent PNG or SVG.' },
      st_favicon: { type: 'image', label: 'Favicon', folder: 'tech',
                    hint: 'The browser-tab icon for these pages only. Square, 64×64 or larger. Leave empty for the drawn “st/” mark in your accent colour.' },
    },
  },
  {
    key: 'tech',
    title: 'Theme & language',
    fields: {
      st_default_theme: { type: 'select', label: 'Opens in', default: d('st_default_theme'),
                          options: { dark: 'Dark', light: 'Light', auto: "The visitor's device setting" } },
      st_show_theme_toggle: { type: 'checkbox', label: 'Let visitors switch between light and dark', default: true },
      st_default_lang: { type: 'select', label: 'Default language', default: d('st_default_lang'),
                         options: { en: 'English', ne: 'नेपाली (Nepali)' } },
      st_show_lang_toggle: { type: 'checkbox', label: 'Show the English / नेपाली switch', default: true },
      st_use_site_accent: { type: 'checkbox', label: "Use the main website's accent colour", default: true },
      st_accent: { type: 'color', label: 'Own accent colour', default: d('st_accent'),
                   hint: 'Used only when the box above is unticked.' },
    },
  },
  {
    key: 'tech',
    title: 'Home page',
    fields: {
      st_catalogue_title: { type: 'text', label: 'Big heading (English)', default: d('st_catalogue_title') },
      st_catalogue_title_ne: { type: 'text', label: 'Big heading (नेपाली)', default: d('st_catalogue_title_ne') },
      st_catalogue_note: { type: 'text', label: 'Note beside it (English)', default: d('st_catalogue_note') },
      st_catalogue_note_ne: { type: 'text', label: 'Note beside it (नेपाली)', default: d('st_catalogue_note_ne') },
      st_hero_label: { type: 'text', label: 'Label on the big card (English)', default: d('st_hero_label') },
      st_hero_label_ne: { type: 'text', label: 'Label on the big card (नेपाली)', default: d('st_hero_label_ne') },
      st_show_shelves: { type: 'checkbox', label: 'A scrolling row per collection, shop-style', default: true },
      st_show_collections: { type: 'checkbox', label: 'The collections grid', default: true },
      st_show_newsletter: { type: 'checkbox', label: 'The email signup', default: true },
      st_show_big_wordmark: { type: 'checkbox', label: 'The giant wordmark at the bottom', default: true },
      st_per_page: { type: 'number', label: 'Posts per page', default: 24, min: 6, max: 96 },
    },
  },
  {
    key: 'tech',
    title: 'Post pages',
    fields: {
      st_blocks_heading: { type: 'text', label: 'Heading over the copy blocks (English)', default: d('st_blocks_heading') },
      st_blocks_heading_ne: { type: 'text', label: 'Heading over the copy blocks (नेपाली)', default: d('st_blocks_heading_ne') },
    },
  },
  {
    key: 'tech',
    title: 'Menu',
    note: 'Collections ticked “Show in the menu” appear automatically. Add any other links here.',
    fields: {
      st_nav_links: { type: 'textarea', label: 'Extra menu links', rows: 4, full: true,
                      hint: 'One per line as  English | नेपाली | /address  — for example  Tools | टुलहरू | /tech/c/tools. The नेपाली part is optional.' },
      st_show_main_site_link: { type: 'checkbox', label: 'Link back to the main website in the footer', default: true },
    },
  },
  {
    key: 'tech',
    title: 'Social & subscribe',
    note: 'Shown in the header and footer of these pages only. Clear a field to hide that icon.',
    fields: {
      st_youtube: { type: 'url', label: 'YouTube', default: d('st_youtube') },
      st_instagram: { type: 'url', label: 'Instagram', default: d('st_instagram') },
      st_facebook: { type: 'url', label: 'Facebook', default: d('st_facebook') },
      st_tiktok: { type: 'url', label: 'TikTok', default: d('st_tiktok') },
      st_email: { type: 'text', label: 'Email', hint: 'Optional. Shown in the footer.' },
      st_show_subscribe: { type: 'checkbox', label: 'Show the YouTube Subscribe button in the header', default: true },
      st_show_header_socials: { type: 'checkbox', label: 'Show Instagram, Facebook and TikTok in the header too', default: true },
      st_subscribe_label: { type: 'text', label: 'Subscribe button (English)', default: d('st_subscribe_label') },
      st_subscribe_label_ne: { type: 'text', label: 'Subscribe button (नेपाली)', default: d('st_subscribe_label_ne') },
    },
  },
  {
    key: 'tech',
    title: 'Footer & email signup',
    fields: {
      st_newsletter_title: { type: 'text', label: 'Signup heading (English)', full: true, default: d('st_newsletter_title') },
      st_newsletter_title_ne: { type: 'text', label: 'Signup heading (नेपाली)', full: true, default: d('st_newsletter_title_ne') },
      st_newsletter_text: { type: 'textarea', label: 'Signup text (English)', rows: 2, full: true, default: d('st_newsletter_text') },
      st_newsletter_text_ne: { type: 'textarea', label: 'Signup text (नेपाली)', rows: 2, full: true, default: d('st_newsletter_text_ne') },
      st_footer_about: { type: 'textarea', label: 'Footer introduction (English)', rows: 2, full: true, default: d('st_footer_about') },
      st_footer_about_ne: { type: 'textarea', label: 'Footer introduction (नेपाली)', rows: 2, full: true, default: d('st_footer_about_ne') },
      st_footer_copyright: { type: 'text', label: 'Copyright line', full: true, default: d('st_footer_copyright'),
                             hint: '{year} becomes the current year.' },
      st_footer_note: { type: 'text', label: 'Closing line (English)', default: d('st_footer_note') },
      st_footer_note_ne: { type: 'text', label: 'Closing line (नेपाली)', default: d('st_footer_note_ne') },
    },
  },
  {
    key: 'tech',
    title: 'Search engines & sharing',
    fields: {
      st_meta_title: { type: 'text', label: 'Page title', full: true, default: d('st_meta_title') },
      st_meta_description: { type: 'textarea', label: 'Description (English)', rows: 2, full: true, default: d('st_meta_description') },
      st_meta_description_ne: { type: 'textarea', label: 'Description (नेपाली)', rows: 2, full: true, default: d('st_meta_description_ne') },
      st_og_image: { type: 'image', label: 'Share picture', folder: 'tech',
                     hint: 'Shown when the /tech link is shared. 1200×630. Each post uses its own cover.' },
      st_index: { type: 'checkbox', label: 'Allow search engines to index these pages', default: true },
    },
  },
];

export default async function TechSettingsPage() {
  if ((await currentUser())?.role !== 'admin') redirect('/admin');
  const values = await getSettings();
  return (
    <Shell title="Simplified Tech" current="tech-settings">
      <div className="page-head">
        <div>
          <h2>Simplified Tech — site settings</h2>
          <p className="muted">
            Everything here applies to <a href="/tech" target="_blank" rel="noopener noreferrer">/tech</a> only.
            The main website is not affected. Switch the whole section on or off, or rename its menu
            item, under <Link href="/admin/menus">Menus &amp; sections</Link>.
          </p>
        </div>
      </div>
      <SettingsForm groups={GROUPS} values={values} previewHref="/tech" />
    </Shell>
  );
}
