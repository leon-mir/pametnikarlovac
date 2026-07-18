import { useApp } from '@/state/AppState';
import { Back } from '@/lib/icons';

export function BackButton() {
  const { goBack } = useApp();
  return (
    <button className="back-btn" onClick={goBack}>
      <Back /> Natrag
    </button>
  );
}
