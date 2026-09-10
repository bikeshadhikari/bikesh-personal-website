import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Shell from '@/components/admin/Shell';
import SettingsForm, { type SettingsGroup } from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/settings';
import { blobConfigured } from '@/lib/upload';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Profile & bio' };

const GROUPS: SettingsGroup[] = [
  {
    key: 'profile',
    title: 'Your profile',
    note: 'This is the content of your hero banner and your About page.',
    fields: {
      full_name: { type: 'text', label: 'Full name', required: true },
      name_native: { type: 'text', label: 'Name in Nepali', hint: 'Shown under your name in the hero. Leave empty to hide.' },
      headline: { type: 'text', label: 'Headline', full: true, hint: 'The one-line description of what you are.' },
      rotating_roles: { type: 'textarea', label: 'Rotating roles', rows: 5, full: true, hint: 'One per line. They type themselves out in the hero.' },
      availability: { type: 'text', label: 'Availability note', full: true, hint: 'The small green-dot line above your name. Leave empty to hide it.' },
      hero_intro: { type: 'textarea', label: 'Hero introduction', rows: 4, full: true },
      about_lead: { type: 'textarea', label: 'About: opening line', rows: 2, full: true },
      about_body: { type: 'textarea', label: 'About: full biography', rows: 12, full: true, hint: 'Leave a blank line between paragraphs.' },
      photo: { type: 'image', label: 'Profile photo', folder: 'profile', hint: 'Portrait orientation works best, around 800×1000 pixels.' },
      photo_alt: { type: 'text', label: 'Photo description', hint: 'For screen readers. Defaults to your name.' },
      cv_file: { type: 'file', label: 'CV / résumé', folder: 'documents', hint: 'PDF. A download button appears once this is set.' },
      years_started: { type: 'text', label: 'Working since', hint: 'A year, e.g. 2014.' },
    },
  },
];

export default async function ProfilePage() {
  if ((await currentUser())?.role !== 'admin') redirect('/admin');
  const values = await getSettings();
  return (
    <Shell title="Profile & bio" current="profile">
      <div className="page-head"><div><h2>Profile &amp; bio</h2></div></div>
      <SettingsForm groups={GROUPS} values={values} blobReady={blobConfigured()} />
    </Shell>
  );
}
