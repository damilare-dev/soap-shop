import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, cloudEnabled } from '../lib/supabase';
import { StateData } from '../types';

const STORAGE_KEY = 'soap-shop-local';

function loadLocal(): StateData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocal(data: StateData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const DEFAULT_STATE: StateData = {
  ownerPin: null,
  maxDiscountPct: 15,
  reps: [],
  products: [],
  deliveries: [],
  sales: [],
  auditLog: [],
};

export function useAppData() {
  const [data, setData] = useState<StateData>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  // Ref tracks the current data so save() always diffs against latest — fixes stale closure bug
  const dataRef = useRef<StateData>(DEFAULT_STATE);

  const loadFromSupabase = useCallback(async (): Promise<StateData | null> => {
    if (!supabase) return null;
    try {
      const [config, reps, products, deliveries, sales, auditLog] = await Promise.all([
        supabase.from('app_config').select('*'),
        supabase.from('reps').select('*'),
        supabase.from('products').select('*'),
        supabase.from('deliveries').select('*').order('created_at', { ascending: false }),
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_log').select('*').order('ts', { ascending: false }),
      ]);

      const ownerPinRow = config.data?.find((r: any) => r.key === 'owner_pin');
      const maxDiscRow = config.data?.find((r: any) => r.key === 'max_discount_pct');

      return {
        ownerPin: ownerPinRow?.value ?? null,
        maxDiscountPct: maxDiscRow ? Number(maxDiscRow.value) : 15,
        reps: (reps.data ?? []).map((r: any) => ({
          id: r.id, name: r.name, pin: r.pin_hash,
        })),
        products: (products.data ?? []).map((p: any) => ({
          id: p.id, name: p.name, schedule: p.schedule,
          expectedQty: p.expected_qty, costPrice: p.cost_price,
          sellPrice: p.sell_price, stock: p.stock,
        })),
        deliveries: (deliveries.data ?? []).map((d: any) => ({
          id: d.id, productId: d.product_id, qty: d.qty,
          costPerBox: d.cost_per_box, date: d.date, supplier: d.supplier,
        })),
        sales: (sales.data ?? []).map((s: any) => ({
          id: s.id, productId: s.product_id, productName: s.product_name,
          repId: s.rep_id, repName: s.rep_name, qty: s.qty,
          pricePerBox: s.price_per_box, standardPrice: s.standard_price,
          expectedCash: s.expected_cash, cashCollected: s.cash_collected,
          discrepancy: s.discrepancy, note: s.note, date: s.date, time: s.time,
          voided: s.voided, voidedBy: s.voided_by, voidedAt: s.voided_at,
          edited: s.edited, negotiated: s.negotiated,
          negotiatedPrice: s.negotiated_price, negotiationReason: s.negotiation_reason,
        })),
        auditLog: (auditLog.data ?? []).map((a: any) => ({
          id: a.id, ts: a.ts, action: a.action, detail: a.detail, actor: a.actor,
        })),
      };
    } catch (e) {
      console.warn('Supabase load failed', e);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const remote = cloudEnabled ? await loadFromSupabase() : null;
      const local = loadLocal();
      const resolved = remote ?? local ?? DEFAULT_STATE;
      setData(resolved);
      dataRef.current = resolved;
      setLoading(false);
    })();
  }, [loadFromSupabase]);

  // save uses dataRef.current for diffing — never stale regardless of when it's called
  const save = useCallback(async (next: StateData) => {
    setData(next);
    saveLocal(next);

    const prev = dataRef.current;
    dataRef.current = next;

    if (!supabase) return;

    const promises: any[] = [];

    if (next.ownerPin !== prev.ownerPin) {
      promises.push(
        supabase.from('app_config').upsert({ key: 'owner_pin', value: next.ownerPin })
      );
    }

    if (next.maxDiscountPct !== prev.maxDiscountPct) {
      promises.push(
        supabase.from('app_config').upsert({ key: 'max_discount_pct', value: String(next.maxDiscountPct) })
      );
    }

    if (next.reps.length) {
      promises.push(
        supabase.from('reps').upsert(
          next.reps.map(r => ({ id: r.id, name: r.name, pin_hash: r.pin }))
        )
      );
    }

    if (next.products.length) {
      promises.push(
        supabase.from('products').upsert(
          next.products.map(p => ({
            id: p.id, name: p.name, schedule: p.schedule,
            expected_qty: p.expectedQty, cost_price: p.costPrice,
            sell_price: p.sellPrice, stock: p.stock,
          }))
        )
      );
    }

    const existingDeliveryIds = new Set(prev.deliveries.map(d => d.id));
    const newDeliveries = next.deliveries.filter(d => !existingDeliveryIds.has(d.id));
    if (newDeliveries.length) {
      promises.push(
        supabase.from('deliveries').upsert(
          newDeliveries.map(d => ({
            id: d.id, product_id: d.productId, qty: d.qty,
            cost_per_box: d.costPerBox, date: d.date, supplier: d.supplier,
          }))
        )
      );
    }

    const existingSaleMap = new Map(prev.sales.map(s => [s.id, s]));
    const changedSales = next.sales.filter(s => {
      const old = existingSaleMap.get(s.id);
      return !old || old.edited !== s.edited || old.voided !== s.voided || old.cashCollected !== s.cashCollected;
    });
    if (changedSales.length) {
      promises.push(
        supabase.from('sales').upsert(
          changedSales.map(s => ({
            id: s.id, product_id: s.productId, product_name: s.productName,
            rep_id: s.repId, rep_name: s.repName, qty: s.qty,
            price_per_box: s.pricePerBox, standard_price: s.standardPrice,
            expected_cash: s.expectedCash, cash_collected: s.cashCollected,
            discrepancy: s.discrepancy, note: s.note, date: s.date, time: s.time,
            voided: s.voided, voided_by: s.voidedBy ?? null, voided_at: s.voidedAt ?? null,
            edited: s.edited, negotiated: s.negotiated,
            negotiated_price: s.negotiatedPrice ?? null,
            negotiation_reason: s.negotiationReason ?? '',
          }))
        )
      );
    }

    const existingAuditIds = new Set(prev.auditLog.map(a => a.id));
    const newAudit = next.auditLog.filter(a => !existingAuditIds.has(a.id));
    if (newAudit.length) {
      promises.push(
        supabase.from('audit_log').insert(
          newAudit.map(a => ({ id: a.id, ts: a.ts, action: a.action, detail: a.detail, actor: a.actor }))
        )
      );
    }

    const results = await Promise.allSettled(promises);
    results.forEach(r => {
      if (r.status === 'rejected') console.warn('Supabase sync partial failure:', r.reason);
    });
  }, []); // Empty deps — dataRef.current always has latest data, no stale closure

  return { data, save, loading };
}
