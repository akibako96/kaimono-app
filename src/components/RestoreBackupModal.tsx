import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { buildBackupFileName, createBackupPayload, triggerJsonDownload } from '../services/backup';
import { MAX_BACKUP_BYTES, prepareRestore, restoreBackup, type RestorePlan } from '../services/restore';

interface Props {
  onClose: () => void;
  onRestored: (plan: RestorePlan) => void;
}

export function RestoreBackupModal({ onClose, onRestored }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [plan, setPlan] = useState<RestorePlan | null>(null);
  const [recoveryJson, setRecoveryJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setPlan(null);
    setError('');
    setLoading(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('ファイルが32 MiBを超えています。');
      setPlan(prepareRestore(await file.text(), window.localStorage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルを読み取れませんでした。');
    } finally {
      setLoading(false);
    }
  }

  function downloadRecovery() {
    try {
      const json = recoveryJson ?? JSON.stringify(createBackupPayload(), null, 2);
      triggerJsonDownload(json, buildBackupFileName().replace('backup-', 'before-restore-'));
    } catch {
      setError('復元前のバックアップを書き出せませんでした。');
    }
  }

  function confirmRestore() {
    if (!plan || recoveryJson !== null) return;
    try {
      // Keep a copy available for download even if the browser rejects a rollback.
      const before = JSON.stringify(createBackupPayload(), null, 2);
      setRecoveryJson(before);
      restoreBackup(plan, window.localStorage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データを復元できませんでした。');
      return;
    }
    onRestored(plan);
  }

  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="restore-title" className="restore-dialog">
      <section className="space-y-4 p-5 text-sm">
        <h2 id="restore-title" className="text-lg font-extrabold">バックアップから復元</h2>
        <label className="block space-y-1 font-bold">
          <span>バックアップJSON</span>
          <input
            type="file"
            accept=".json,application/json"
            onChange={readFile}
            disabled={loading || recoveryJson !== null}
            className="block w-full min-w-0 rounded-lg border border-stone-300 p-2 font-normal"
          />
        </label>
        {loading && <p role="status">ファイルを確認しています。</p>}
        {plan && (
          <div className="space-y-2 rounded-xl bg-stone-100 p-3">
            <p>作成日時 {plan.createdAt}</p>
            <p>
              大カテゴリ {plan.summary.largeCategoriesCount}件 · 中カテゴリ {plan.summary.mediumCategoriesCount}件 · 商品マスター {plan.summary.masterItemsCount}件
            </p>
            <p>
              日別リスト {plan.summary.dailyListsCount}日分 · 買い物商品 {plan.summary.totalShoppingItemsCount}件（購入済み {plan.checkedItems}件）
            </p>
            <ul className="space-y-1 break-all text-xs">
              {[...plan.entries].map(([key, value]) => {
                const before = plan.previous.get(key);
                return <li key={key}>{before === value ? '同じ内容' : before === null ? '追加' : '上書き'} · {key}</li>;
              })}
            </ul>
          </div>
        )}
        {error && <p role="alert" className="font-bold text-red-800">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-300 px-3 py-2 font-bold">
            {recoveryJson === null ? 'キャンセル' : '閉じる'}
          </button>
          {plan && (
            <>
              <button type="button" onClick={downloadRecovery} className="rounded-lg border border-emerald-700 px-3 py-2 font-bold text-emerald-800">
                復元前のデータを保存
              </button>
              <button type="button" onClick={confirmRestore} disabled={recoveryJson !== null} className="rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white disabled:opacity-50">
                確認した内容で復元する
              </button>
            </>
          )}
        </div>
      </section>
    </dialog>
  );
}
