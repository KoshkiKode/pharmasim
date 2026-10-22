import { useState } from 'react';
import { unlockPro } from '@pharmasim/engine';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaywallModal({ isOpen, onClose, onSuccess }: PaywallModalProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const result = unlockPro(licenseKey);
    if (result.success) {
      setLicenseKey('');
      onSuccess();
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-panel p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-accent mb-2">Analysis Limit Reached</h2>
        <p className="text-sm text-ink-muted mb-4">
          You have reached your limit of free analyses on desktop. Upgrade to Pharmasim Pro for unlimited simulations.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-faint mb-1">
              PRO LICENSE KEY
            </label>
            <input
              type="text"
              placeholder="e.g. PHARMASIM-PRO-2026"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-inset px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-sev-contra">{errorMsg}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink-muted hover:bg-bg-inset"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!licenseKey.trim()}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              Unlock Pro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
