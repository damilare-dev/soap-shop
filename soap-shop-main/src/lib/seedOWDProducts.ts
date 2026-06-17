import { Product, AuditEntry, StateData } from '../types';

const OWD_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: "Viva 1.7G (OWD)",            schedule: "monthly", expectedQty: 13,  costPrice: 14700, sellPrice: 16500, stock: 13  },
  { name: "Viva 800G (OWD)",            schedule: "monthly", expectedQty: 53,  costPrice: 12200, sellPrice: 14500, stock: 53  },
  { name: "Viva 170G (OWD)",            schedule: "monthly", expectedQty: 765, costPrice: 9900,  sellPrice: 11200, stock: 765 },
  { name: "Viva 80G (OWD)",             schedule: "monthly", expectedQty: 163, costPrice: 9300,  sellPrice: 10600, stock: 163 },
  { name: "Viva Matic 900G (OWD)",      schedule: "monthly", expectedQty: 5,   costPrice: 13500, sellPrice: 15500, stock: 5   },
  { name: "Viva Ankara Bar (OWD)",      schedule: "monthly", expectedQty: 2,   costPrice: 12200, sellPrice: 16000, stock: 2   },
  { name: "Viva Bar Gold 130G (OWD)",   schedule: "monthly", expectedQty: 18,  costPrice: 17200, sellPrice: 18000, stock: 18  },
  { name: "Magik 170G (OWD)",           schedule: "monthly", expectedQty: 50,  costPrice: 8700,  sellPrice: 8800,  stock: 50  },
  { name: "Magik 80G (OWD)",            schedule: "monthly", expectedQty: 58,  costPrice: 8600,  sellPrice: 8700,  stock: 58  },
  { name: "Supa Fresh 140G (OWD)",      schedule: "monthly", expectedQty: 96,  costPrice: 8200,  sellPrice: 8500,  stock: 96  },
  { name: "Goodmama 170G (OWD)",        schedule: "monthly", expectedQty: 23,  costPrice: 8500,  sellPrice: 9100,  stock: 23  },
  { name: "Goodmama 85G (OWD)",         schedule: "monthly", expectedQty: 15,  costPrice: 8900,  sellPrice: 9400,  stock: 15  },
  { name: "Goodmama 45G (OWD)",         schedule: "monthly", expectedQty: 5,   costPrice: 7000,  sellPrice: 7600,  stock: 5   },
  { name: "Klin Protect 170G (OWD)",    schedule: "monthly", expectedQty: 31,  costPrice: 9900,  sellPrice: 10200, stock: 31  },
  { name: "So-Klin Smart 350ml (OWD)",  schedule: "monthly", expectedQty: 10,  costPrice: 6600,  sellPrice: 7600,  stock: 10  },
  { name: "Niptol 170G (OWD)",          schedule: "monthly", expectedQty: 47,  costPrice: 7350,  sellPrice: 7600,  stock: 47  },
  { name: "Rafa 800G (OWD)",            schedule: "monthly", expectedQty: 11,  costPrice: 11700, sellPrice: 12500, stock: 11  },
  { name: "Rafa 125G (OWD)",            schedule: "monthly", expectedQty: 19,  costPrice: 7750,  sellPrice: 8200,  stock: 19  },
  { name: "Rafa 85G (OWD)",             schedule: "monthly", expectedQty: 39,  costPrice: 8700,  sellPrice: 9300,  stock: 39  },
  { name: "Rafa 45G (OWD)",             schedule: "monthly", expectedQty: 63,  costPrice: 7900,  sellPrice: 8300,  stock: 63  },
  { name: "Mama Joy 140G (OWD)",        schedule: "monthly", expectedQty: 50,  costPrice: 8100,  sellPrice: 8200,  stock: 50  },
  { name: "Mama Joy 850G (OWD)",        schedule: "monthly", expectedQty: 2,   costPrice: 10500, sellPrice: 11000, stock: 2   },
  { name: "Wakanda 170G (OWD)",         schedule: "monthly", expectedQty: 14,  costPrice: 9900,  sellPrice: 10300, stock: 14  },
  { name: "Wakanda 85G (OWD)",          schedule: "monthly", expectedQty: 14,  costPrice: 9500,  sellPrice: 9700,  stock: 14  },
  { name: "Hypo Sachet (OWD)",          schedule: "monthly", expectedQty: 28,  costPrice: 7650,  sellPrice: 8200,  stock: 28  },
  { name: "Softcare Pad Roll (OWD)",    schedule: "monthly", expectedQty: 153, costPrice: 1200,  sellPrice: 1600,  stock: 153 },
  { name: "Softcare Pad Box (OWD)",     schedule: "monthly", expectedQty: 82,  costPrice: 3000,  sellPrice: 3300,  stock: 82  },
  { name: "Softcare Pad Zip (OWD)",     schedule: "monthly", expectedQty: 52,  costPrice: 1600,  sellPrice: 1700,  stock: 52  },
  { name: "Diva Pad (OWD)",             schedule: "monthly", expectedQty: 8,   costPrice: 700,   sellPrice: 750,   stock: 8   },
  { name: "Oral Care Paste 130G (OWD)", schedule: "monthly", expectedQty: 79,  costPrice: 6300,  sellPrice: 7200,  stock: 79  },
  { name: "Xtreme Paste (OWD)",         schedule: "monthly", expectedQty: 374, costPrice: 3840,  sellPrice: 4000,  stock: 374 },
  { name: "My My Blue Gel Paste (OWD)", schedule: "monthly", expectedQty: 157, costPrice: 3110,  sellPrice: 3250,  stock: 157 },
  { name: "My My Herbal Paste (OWD)",   schedule: "monthly", expectedQty: 158, costPrice: 2410,  sellPrice: 2500,  stock: 158 },
  { name: "Pro Green 75G (OWD)",        schedule: "monthly", expectedQty: 33,  costPrice: 7920,  sellPrice: 8500,  stock: 33  },
  { name: "Pro Green 800G (OWD)",       schedule: "monthly", expectedQty: 9,   costPrice: 10560, sellPrice: 11500, stock: 9   },
  { name: "Chaze Mathstick (OWD)",      schedule: "monthly", expectedQty: 29,  costPrice: 1600,  sellPrice: 1800,  stock: 29  },
  { name: "Picasso Mathstick (OWD)",    schedule: "monthly", expectedQty: 29,  costPrice: 1600,  sellPrice: 1800,  stock: 29  },
  { name: "B&B Mathstick (OWD)",        schedule: "monthly", expectedQty: 24,  costPrice: 1750,  sellPrice: 1900,  stock: 24  },
];

// Jaleyemi — exact stock counts confirmed June 2026
// Products marked with costPrice: 0 are JLY-only — set sell price in Owner → Settings → Manage Products
const JLY_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: "Viva 1.7G (JLY)",            schedule: "monthly", expectedQty: 62,  costPrice: 14700, sellPrice: 16500, stock: 62    },
  { name: "Viva 800G (JLY)",            schedule: "monthly", expectedQty: 578, costPrice: 12200, sellPrice: 14500, stock: 578   },
  { name: "Viva 170G (JLY)",            schedule: "monthly", expectedQty: 13,  costPrice: 9900,  sellPrice: 11200, stock: 12.5  },
  { name: "Viva 80G (JLY)",             schedule: "monthly", expectedQty: 163, costPrice: 9300,  sellPrice: 10600, stock: 0     },
  { name: "Viva Matic 900G (JLY)",      schedule: "monthly", expectedQty: 5,   costPrice: 13500, sellPrice: 15500, stock: 2     },
  { name: "Viva Bar Gold 130G (JLY)",   schedule: "monthly", expectedQty: 18,  costPrice: 17200, sellPrice: 18000, stock: 8     },
  { name: "Magik 170G (JLY)",           schedule: "monthly", expectedQty: 50,  costPrice: 8700,  sellPrice: 8800,  stock: 18    },
  { name: "Magik 80G (JLY)",            schedule: "monthly", expectedQty: 58,  costPrice: 8600,  sellPrice: 8700,  stock: 40.5  },
  { name: "Magik 800G (JLY)",           schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 0     },
  { name: "Goodmama 800G (JLY)",        schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 0     },
  { name: "Goodmama 170G (JLY)",        schedule: "monthly", expectedQty: 23,  costPrice: 8500,  sellPrice: 9100,  stock: 0     },
  { name: "Goodmama 90G (JLY)",         schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 1     },
  { name: "Goodmama 45G (JLY)",         schedule: "monthly", expectedQty: 5,   costPrice: 7000,  sellPrice: 7600,  stock: 0     },
  { name: "Mama Joy 850G (JLY)",        schedule: "monthly", expectedQty: 2,   costPrice: 10500, sellPrice: 11000, stock: 2     },
  { name: "Mama Joy 140G (JLY)",        schedule: "monthly", expectedQty: 50,  costPrice: 8100,  sellPrice: 8200,  stock: 5     },
  { name: "Mama Joy 85G (JLY)",         schedule: "monthly", expectedQty: 20,  costPrice: 0,     sellPrice: 0,     stock: 2     },
  { name: "Klin Protect 1.6G (JLY)",    schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 5     },
  { name: "Klin Protect 800G (JLY)",    schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 2     },
  { name: "Klin Protect 170G (JLY)",    schedule: "monthly", expectedQty: 31,  costPrice: 9900,  sellPrice: 10200, stock: 7     },
  { name: "So-Klin 800G (JLY)",         schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 0     },
  { name: "So-Klin 1.7G (JLY)",         schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 2     },
  { name: "Supa Fresh (JLY)",           schedule: "monthly", expectedQty: 96,  costPrice: 8200,  sellPrice: 8500,  stock: 9     },
  { name: "Rafa 800G (JLY)",            schedule: "monthly", expectedQty: 11,  costPrice: 11700, sellPrice: 12500, stock: 31    },
  { name: "Rafa 125G (JLY)",            schedule: "monthly", expectedQty: 19,  costPrice: 7750,  sellPrice: 8200,  stock: 121   },
  { name: "Rafa 85G (JLY)",             schedule: "monthly", expectedQty: 39,  costPrice: 8700,  sellPrice: 9300,  stock: 296   },
  { name: "Rafa 45G (JLY)",             schedule: "monthly", expectedQty: 63,  costPrice: 7900,  sellPrice: 8300,  stock: 126   },
  { name: "Wakanda 170G (JLY)",         schedule: "monthly", expectedQty: 14,  costPrice: 9900,  sellPrice: 10300, stock: 69    },
  { name: "Wakanda 85G (JLY)",          schedule: "monthly", expectedQty: 14,  costPrice: 9500,  sellPrice: 9700,  stock: 110   },
  { name: "Smart Klin (JLY)",           schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 7     },
  { name: "Niptol 170G (JLY)",          schedule: "monthly", expectedQty: 47,  costPrice: 7350,  sellPrice: 7600,  stock: 4     },
  { name: "Pro Green 800G (JLY)",       schedule: "monthly", expectedQty: 9,   costPrice: 10560, sellPrice: 11500, stock: 10    },
  { name: "Pro Green 170G (JLY)",       schedule: "monthly", expectedQty: 33,  costPrice: 0,     sellPrice: 0,     stock: 0     },
  { name: "Pro Green 85G (JLY)",        schedule: "monthly", expectedQty: 20,  costPrice: 0,     sellPrice: 0,     stock: 14    },
  { name: "Excel 800G (JLY)",           schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 3     },
  { name: "Hypo Sachet (JLY)",          schedule: "monthly", expectedQty: 28,  costPrice: 7650,  sellPrice: 8200,  stock: 100.5 },
  { name: "Hype 500ml (JLY)",           schedule: "monthly", expectedQty: 12,  costPrice: 0,     sellPrice: 0,     stock: 12    },
  { name: "Chaze Matchstick (JLY)",     schedule: "monthly", expectedQty: 29,  costPrice: 1600,  sellPrice: 1800,  stock: 20    },
  { name: "B&B Matchstick (JLY)",       schedule: "monthly", expectedQty: 24,  costPrice: 1750,  sellPrice: 1900,  stock: 20    },
  { name: "Egret Matchstick (JLY)",     schedule: "monthly", expectedQty: 40,  costPrice: 0,     sellPrice: 0,     stock: 40    },
  { name: "My My Herbal Paste (JLY)",   schedule: "monthly", expectedQty: 158, costPrice: 2410,  sellPrice: 2500,  stock: 56    },
  { name: "My My Blue Gel Paste (JLY)", schedule: "monthly", expectedQty: 157, costPrice: 3110,  sellPrice: 3250,  stock: 59    },
  { name: "Xtreme Paste (JLY)",         schedule: "monthly", expectedQty: 374, costPrice: 3840,  sellPrice: 4000,  stock: 1073  },
  { name: "Oral Care Paste (JLY)",      schedule: "monthly", expectedQty: 79,  costPrice: 6300,  sellPrice: 7200,  stock: 183   },
  { name: "Softcare Pad Box (JLY)",     schedule: "monthly", expectedQty: 82,  costPrice: 3000,  sellPrice: 3300,  stock: 47    },
  { name: "Softcare Pad Roll (JLY)",    schedule: "monthly", expectedQty: 153, costPrice: 1200,  sellPrice: 1600,  stock: 66    },
  { name: "Softcare Pad Zip (JLY)",     schedule: "monthly", expectedQty: 52,  costPrice: 1600,  sellPrice: 1700,  stock: 159   },
  { name: "Ladycare Pad (JLY)",         schedule: "monthly", expectedQty: 20,  costPrice: 0,     sellPrice: 0,     stock: 18    },
  { name: "Kiss Kids Jumbo (JLY)",      schedule: "monthly", expectedQty: 24,  costPrice: 0,     sellPrice: 0,     stock: 24    },
  { name: "Kiss Kids Eco (JLY)",        schedule: "monthly", expectedQty: 32,  costPrice: 0,     sellPrice: 0,     stock: 32    },
  { name: "Kiss Kids Small (JLY)",      schedule: "monthly", expectedQty: 143, costPrice: 0,     sellPrice: 0,     stock: 143   },
  { name: "Softcare Jumbo (JLY)",       schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 4     },
  { name: "Softcare Eco (JLY)",         schedule: "monthly", expectedQty: 10,  costPrice: 0,     sellPrice: 0,     stock: 4     },
  { name: "Softcare Small (JLY)",       schedule: "monthly", expectedQty: 26,  costPrice: 0,     sellPrice: 0,     stock: 26    },
];

const ALL_PRODUCTS = [...OWD_PRODUCTS, ...JLY_PRODUCTS];

// v3 — bumped to force re-seed with corrected JLY stock numbers
const SEED_FLAG = 'owd-jly-seed-v3';

export function applyOWDSeed(state: StateData): StateData {
  const alreadySeeded = state.auditLog.some(a => a.action === SEED_FLAG);
  if (alreadySeeded) return state;

  const anyPreviousSeed =
    state.auditLog.some(a => a.action === 'owd-seed-v1') ||
    state.auditLog.some(a => a.action === 'owd-jly-seed-v2');

  const now = new Date().toISOString();

  if (anyPreviousSeed) {
    // Existing install — strip all old JLY products and replace with corrected ones.
    // OWD products stay untouched.
    const existingOWD = state.products.filter(p => !p.name.includes('(JLY)'));
    const newJLY: Product[] = JLY_PRODUCTS.map(p => ({ ...p, id: crypto.randomUUID() }));
    const seedMarker: AuditEntry = {
      id: crypto.randomUUID(), ts: now, action: SEED_FLAG,
      detail: `JLY stock corrected: ${newJLY.length} products replaced`, actor: 'OWNER',
    };
    return { ...state, products: [...existingOWD, ...newJLY], auditLog: [...state.auditLog, seedMarker] };
  }

  // Fresh install — add everything from scratch
  const newProducts: Product[] = ALL_PRODUCTS.map(p => ({ ...p, id: crypto.randomUUID() }));
  const seedMarker: AuditEntry = {
    id: crypto.randomUUID(), ts: now, action: SEED_FLAG,
    detail: `Full inventory seeded: ${newProducts.length} products (OWD + JLY)`, actor: 'OWNER',
  };
  return { ...state, products: newProducts, auditLog: [...state.auditLog, seedMarker] };
}
