import { useState } from 'react';
import { RepAppProps } from '../types';
import QuickSale from './QuickSale';
import DetailedSale from './DetailedSale';

export default function RepApp({ data, save, rep, onLogout, addAudit }: RepAppProps) {
  // Quick Sale is the default — the detailed flow (cart, negotiation, part-payments) is unchanged and reachable via the toggle.
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');

  if (mode === 'quick') {
    return (
      <QuickSale
        data={data}
        save={save}
        rep={rep}
        onLogout={onLogout}
        onSwitchToDetailed={() => setMode('detailed')}
        addAudit={addAudit}
      />
    );
  }

  return (
    <DetailedSale
      data={data}
      save={save}
      rep={rep}
      onLogout={onLogout}
      onSwitchToQuick={() => setMode('quick')}
      addAudit={addAudit}
    />
  );
}
