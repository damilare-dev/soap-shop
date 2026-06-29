import { RepAppProps } from '../types';
import DetailedSale from './DetailedSale';

export default function RepApp({ data, save, rep, onLogout, addAudit }: RepAppProps) {
  return (
    <DetailedSale
      data={data}
      save={save}
      rep={rep}
      onLogout={onLogout}
      addAudit={addAudit}
    />
  );
}
