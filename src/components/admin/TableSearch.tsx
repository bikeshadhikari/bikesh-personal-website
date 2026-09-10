'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '../Icon';

/** Search box that navigates once typing stops. */
export default function TableSearch({ resource, initial }: { resource: string; initial: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(initial);

  useEffect(() => {
    if (term === initial) return;
    const timer = setTimeout(() => {
      router.push(term ? `/admin/${resource}?search=${encodeURIComponent(term)}` : `/admin/${resource}`);
    }, 450);
    return () => clearTimeout(timer);
  }, [term, initial, resource, router]);

  return (
    <div className="table-search">
      <Icon name="search" className="icon icon-sm" />
      <label className="visually-hidden" htmlFor="tableSearch">Search</label>
      <input
        type="search" id="tableSearch" value={term}
        onChange={(e) => setTerm(e.target.value)} placeholder="Search…"
      />
    </div>
  );
}
