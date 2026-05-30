import { useState, useEffect, useCallback } from 'react';
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
  reps: [],
  products: [],
  deliveries: [],
  sales: [],
  auditLog: [],
};

export function useAppData() {
  const [data, setData] = useState<StateData>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

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

      return {
        ownerPin: ownerPinRow?.value ?? null,
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
      setLoading(false);
    })();
  }, [loadFromSupabase]);

  const save = useCallback(async (next: StateData) => {
    setData(next);
    saveLocal(next);
    if (!supabase) return;

    // Persist each entity type to its own table
    const promises: any[] = [];

    if (next.ownerPin !== data.ownerPin) {
      promises.push(
        supabase.from('app_config').upsert({ key: 'owner_pin', value: next.ownerPin })
      );
    }

    // Upsert reps
    if (next.reps.length) {
      promises.push(
        supabase.from('reps').upsert(
          next.reps.map(r => ({ id: r.id, name: r.name, pin_hash: r.pin }))
        )
      );
    }

    // Upsert products
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

    // Upsert new deliveries
    const existingDeliveryIds = new Set(data.deliveries.map(d => d.id));
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

    // Upsert new or changed sales
    const existingSaleMap = new Map(data.sales.map(s => [s.id, s]));
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

    // Upsert new audit entries
    const existingAuditIds = new Set(data.auditLog.map(a => a.id));
    const newAudit = next.auditLog.filter(a => !existingAuditIds.has(a.id));
    if (newAudit.length) {
      promises.push(
        supabase.from('audit_log').insert(
          newAudit.map(a => ({ id: a.id, ts: a.ts, action: a.action, detail: a.detail, actor: a.actor }))
        )
      );
    }

    await Promise.allSettled(promises);
  }, [data]);

  return { data, save, loading };
}
