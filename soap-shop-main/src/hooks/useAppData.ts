import { useState, useEffect, useCallback, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, cloudEnabled } from '../lib/supabase';
import { SalesRep, StateData } from '../types';
import { applyOWDSeed } from '../lib/seedOWDProducts';

// Quick Sale records owner-made sales under a synthetic rep so sales.rep_id's FK to reps(id) is satisfied.
// Hidden from staff login (see RepLoginScreen) and never used for PIN auth.
const OWNER_REP_ID = 'owner';

function ensureOwnerRep(state: StateData): StateData {
  if (state.reps.some(r => r.id === OWNER_REP_ID)) return state;
  const ownerRep: SalesRep = { id: OWNER_REP_ID, name: 'Owner', pin: '', warehouse: 'OWD' };
  return { ...state, reps: [...state.reps, ownerRep] };
}

const STORAGE_KEY = 'soap-shop-local';
const MIGRATED_KEY = 'soap-shop-cloud-migrated';

function loadLocal(): StateData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocal(data: StateData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function hasMigrated(): boolean {
  try { return localStorage.getItem(MIGRATED_KEY) === 'true'; } catch { return false; }
}

function markMigrated() {
  try { localStorage.setItem(MIGRATED_KEY, 'true'); } catch { /* ignore */ }
}

function isEmptyState(s: StateData): boolean {
  return !s.ownerPin && s.reps.length === 0 && s.products.length === 0
    && s.deliveries.length === 0 && s.sales.length === 0 && s.auditLog.length === 0;
}

// First time a device sees a freshly-provisioned (empty) Supabase project while it still
// holds real local-only history, push that history up instead of letting the empty cloud
// state become "truth" and overwrite it. Runs at most once per device (MIGRATED_KEY).
async function pushFullState(sb: SupabaseClient, state: StateData): Promise<boolean> {
  const parents: PromiseLike<any>[] = [
    sb.from('app_config').upsert({ key: 'max_discount_pct', value: String(state.maxDiscountPct) }),
  ];
  if (state.ownerPin) {
    parents.push(sb.from('app_config').upsert({ key: 'owner_pin', value: state.ownerPin }));
  }
  if (state.reps.length) {
    parents.push(sb.from('reps').upsert(state.reps.map(r => ({
      id: r.id, name: r.name, pin_hash: r.pin, warehouse: r.warehouse ?? 'OWD', locked_date: r.lockedDate ?? null,
    }))));
  }
  if (state.products.length) {
    parents.push(sb.from('products').upsert(state.products.map(p => ({
      id: p.id, name: p.name, schedule: p.schedule,
      expected_qty: p.expectedQty, cost_price: p.costPrice,
      sell_price: p.sellPrice, stock: p.stock,
    }))));
  }
  const parentResults = await Promise.allSettled(parents);

  // deliveries/sales FK-reference products & reps, so they must land after parents commit.
  const children: PromiseLike<any>[] = [];
  if (state.deliveries.length) {
    children.push(sb.from('deliveries').upsert(state.deliveries.map(d => ({
      id: d.id, product_id: d.productId, product_name: d.productName ?? '',
      qty: d.qty, cost_per_box: d.costPerBox, date: d.date, supplier: d.supplier,
    }))));
  }
  if (state.sales.length) {
    children.push(sb.from('sales').upsert(state.sales.map(s => ({
      id: s.id, product_id: s.productId, product_name: s.productName,
      rep_id: s.repId, rep_name: s.repName, qty: s.qty,
      price_per_box: s.pricePerBox, standard_price: s.standardPrice,
      expected_cash: s.expectedCash, cash_collected: s.cashCollected,
      discrepancy: s.discrepancy, note: s.note, date: s.date, time: s.time,
      voided: s.voided, voided_by: s.voidedBy ?? null, voided_at: s.voidedAt ?? null,
      edited: s.edited, negotiated: s.negotiated,
      negotiated_price: s.negotiatedPrice ?? null,
      negotiation_reason: s.negotiationReason ?? '',
    }))));
  }
  if (state.auditLog.length) {
    children.push(sb.from('audit_log').insert(state.auditLog.map(a => ({
      id: a.id, ts: a.ts, action: a.action, detail: a.detail, actor: a.actor,
    }))));
  }
  const childResults = await Promise.allSettled(children);

  const allResults = [...parentResults, ...childResults];
  allResults.forEach(r => { if (r.status === 'rejected') console.warn('Supabase migration push failed:', r.reason); });
  return allResults.every(r => r.status === 'fulfilled');
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
          warehouse: (r.warehouse === 'OWD' || r.warehouse === 'JLY') ? r.warehouse : 'OWD' as const,
          lockedDate: r.locked_date ?? null,
        })),
        products: (products.data ?? []).map((p: any) => ({
          id: p.id, name: p.name, schedule: p.schedule,
          expectedQty: p.expected_qty, costPrice: p.cost_price,
          sellPrice: p.sell_price, stock: p.stock,
        })),
        deliveries: (deliveries.data ?? []).map((d: any) => ({
          id: d.id, productId: d.product_id, productName: d.product_name ?? '',
          qty: d.qty, costPerBox: d.cost_per_box, date: d.date, supplier: d.supplier,
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

      const migrating = Boolean(
        supabase && remote && isEmptyState(remote) && local && !isEmptyState(local) && !hasMigrated()
      );

      const base = migrating ? local! : (remote ?? local ?? DEFAULT_STATE);
      const seeded = applyOWDSeed(base);
      const final = ensureOwnerRep(seeded);
      setData(final);
      dataRef.current = final;
      saveLocal(final);
      setLoading(false);

      if (!supabase) return;

      if (migrating) {
        const ok = await pushFullState(supabase, final);
        if (ok) markMigrated();
        return;
      }

      if (final !== base) {
        const ownerRepAdded = !base.reps.some(r => r.id === OWNER_REP_ID);
        await Promise.allSettled([
          supabase.from('products').upsert(
            final.products.map(p => ({
              id: p.id, name: p.name, schedule: p.schedule,
              expected_qty: p.expectedQty, cost_price: p.costPrice,
              sell_price: p.sellPrice, stock: p.stock,
            }))
          ),
          ...(ownerRepAdded ? [
            supabase.from('reps').upsert([{ id: OWNER_REP_ID, name: 'Owner', pin_hash: '', warehouse: 'OWD', locked_date: null }])
          ] : []),
          supabase.from('audit_log').insert(
            final.auditLog
              .filter(a => !base.auditLog.some(x => x.id === a.id))
              .map(a => ({ id: a.id, ts: a.ts, action: a.action, detail: a.detail, actor: a.actor }))
          ),
        ]);
      }
    })();
  }, [loadFromSupabase]);

  const save = useCallback(async (next: StateData) => {
    // 1. Update UI and localStorage immediately — user sees change instantly
    setData(next);
    saveLocal(next);

    const prev = dataRef.current;
    dataRef.current = next;

    if (!supabase) return;

    // 2. Work out what changed
    const nextRepIds = new Set(next.reps.map(r => r.id));
    const deletedRepIds = prev.reps.filter(r => !nextRepIds.has(r.id)).map(r => r.id);

    const nextProductIds = new Set(next.products.map(p => p.id));
    const deletedProductIds = prev.products.filter(p => !nextProductIds.has(p.id)).map(p => p.id);

    const existingDeliveryIds = new Set(prev.deliveries.map(d => d.id));
    const newDeliveries = next.deliveries.filter(d => !existingDeliveryIds.has(d.id));

    const existingSaleMap = new Map(prev.sales.map(s => [s.id, s]));
    const changedSales = next.sales.filter(s => {
      const old = existingSaleMap.get(s.id);
      return !old || old.edited !== s.edited || old.voided !== s.voided || old.cashCollected !== s.cashCollected;
    });

    const existingAuditIds = new Set(prev.auditLog.map(a => a.id));
    const newAudit = next.auditLog.filter(a => !existingAuditIds.has(a.id));

    // 3. Run ALL deletes first and wait for them to fully complete
    const deletes: PromiseLike<any>[] = [];

    if (deletedRepIds.length) {
      deletes.push(supabase.from('reps').delete().in('id', deletedRepIds));
    }
    if (deletedProductIds.length) {
      deletes.push(supabase.from('products').delete().in('id', deletedProductIds));
    }

    if (deletes.length) {
      await Promise.all(deletes);
    }

    // 4. Only after deletes finish, run upserts
    const upserts: PromiseLike<any>[] = [];

    if (next.ownerPin !== prev.ownerPin) {
      upserts.push(supabase.from('app_config').upsert({ key: 'owner_pin', value: next.ownerPin }));
    }
    if (next.maxDiscountPct !== prev.maxDiscountPct) {
      upserts.push(supabase.from('app_config').upsert({ key: 'max_discount_pct', value: String(next.maxDiscountPct) }));
    }
    if (next.reps.length) {
      upserts.push(
        supabase.from('reps').upsert(next.reps.map(r => ({ id: r.id, name: r.name, pin_hash: r.pin, warehouse: r.warehouse ?? 'OWD', locked_date: r.lockedDate ?? null })))
      );
    }
    if (next.products.length) {
      upserts.push(
        supabase.from('products').upsert(next.products.map(p => ({
          id: p.id, name: p.name, schedule: p.schedule,
          expected_qty: p.expectedQty, cost_price: p.costPrice,
          sell_price: p.sellPrice, stock: p.stock,
        })))
      );
    }
    if (newDeliveries.length) {
      upserts.push(
        supabase.from('deliveries').upsert(newDeliveries.map(d => ({
          id: d.id, product_id: d.productId, product_name: d.productName ?? '',
          qty: d.qty, cost_per_box: d.costPerBox, date: d.date, supplier: d.supplier,
        })))
      );
    }
    if (changedSales.length) {
      upserts.push(
        supabase.from('sales').upsert(changedSales.map(s => ({
          id: s.id, product_id: s.productId, product_name: s.productName,
          rep_id: s.repId, rep_name: s.repName, qty: s.qty,
          price_per_box: s.pricePerBox, standard_price: s.standardPrice,
          expected_cash: s.expectedCash, cash_collected: s.cashCollected,
          discrepancy: s.discrepancy, note: s.note, date: s.date, time: s.time,
          voided: s.voided, voided_by: s.voidedBy ?? null, voided_at: s.voidedAt ?? null,
          edited: s.edited, negotiated: s.negotiated,
          negotiated_price: s.negotiatedPrice ?? null,
          negotiation_reason: s.negotiationReason ?? '',
        })))
      );
    }
    if (newAudit.length) {
      upserts.push(
        supabase.from('audit_log').insert(newAudit.map(a => ({
          id: a.id, ts: a.ts, action: a.action, detail: a.detail, actor: a.actor,
        })))
      );
    }

    const results = await Promise.allSettled(upserts);
    results.forEach(r => {
      if (r.status === 'rejected') console.warn('Supabase sync error:', r.reason);
    });
  }, []);

  return { data, save, loading };
}
