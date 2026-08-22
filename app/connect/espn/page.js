'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import {
  pageStyle,
  cardStyle,
  inputStyle,
  buttonPrimaryStyle,
} from '../../../lib/theme';
import { supabase } from '../../../lib/supabase';

export default function ConnectEspnPage() {
  const router = useRouter();
  const [swid, setSwid] = useState('');
  const [espnS2, setEspnS2] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in.');
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase
      .from('espn_connections')
      .upsert(
        {
          user_id: user.id,
          swid,
          espn_s2: espnS2,
        },
        { onConflict: 'user_id' }
      );

    setSaving(false);

    if (upsertError) {
      setError('Something went wrong saving your connection.');
      return;
    }

    router.push('/');
  };

   return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Header user={user} />

        <div style={{ ...cardStyle, width: '100%' }}>
          <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <h2 style={{ margin: 0 }}>Connect ESPN</h2>
        </div>

        <p style={{ color: '#9ca3af', lineHeight: 1.5, marginBottom: 20 }}>
          ESPN does not support a login button here. Instead, you will copy
          two values from your own browser after logging into ESPN normally.
          These values stay private to your account and are only used to
          read your leagues.
        </p>

        <ol
          style={{
            color: '#9ca3af',
            lineHeight: 1.8,
            marginBottom: 24,
            paddingLeft: 20,
          }}
        >
          <li>Log into fantasy.espn.com in this same browser</li>
          <li>Open your browser's developer tools and go to the Cookies section</li>
          <li>Find the cookie named <code>SWID</code> and copy its value</li>
          <li>Find the cookie named <code>espn_s2</code> and copy its value</li>
        </ol>

        <form onSubmit={handleSave}>
          <label style={{ display: 'block', marginBottom: 6, color: '#e5e7eb' }}>
            SWID
          </label>
          <input
            type="text"
            value={swid}
            onChange={(e) => setSwid(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
            required
          />

          <label style={{ display: 'block', marginBottom: 6, color: '#e5e7eb' }}>
            espn_s2
          </label>
          <input
            type="text"
            value={espnS2}
            onChange={(e) => setEspnS2(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
            required
          />

          {error && (
            <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{ ...buttonPrimaryStyle, width: '100%' }}
          >
            {saving ? 'Saving...' : 'Save Connection'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
