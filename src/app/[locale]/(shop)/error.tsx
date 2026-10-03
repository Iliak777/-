"use client";

import { useI18n } from "@/components/i18n-provider";
import { Icon } from "@/components/icons";

export default function ShopError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { dict } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <Icon name="alert" className="h-6 w-6" />
      </span>
      <p className="mt-4 font-medium">{dict.common.errorTitle}</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{dict.common.error}</p>
      <button className="btn-primary mt-6" onClick={() => retry()}>
        <Icon name="refresh" className="h-4 w-4" />
        {dict.common.retry}
      </button>
    </div>
  );
}
