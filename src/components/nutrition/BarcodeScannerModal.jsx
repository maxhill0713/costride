import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ScanBarcode, Loader2, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { base44 } from '@/api/base44Client';

const OVERLAY_BG = 'rgba(0,0,0,0.92)';
const CARD_BG = 'linear-gradient(135deg, rgba(20,25,50,0.99) 0%, rgba(6,8,18,1) 100%)';

const FOOD_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
];

async function lookupOpenFoodFacts(barcode) {
  try {
    const resp = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'CoStrideApp/1.0' } }
    );
    const data = await resp.json();
    if (data.status === 1 && data.product?.product_name) {
      const n = data.product.nutriments || {};
      const p = data.product;

      // Debug: log all relevant fields
      console.log('[OFFApi] product_quantity:', p.product_quantity, '| quantity:', p.quantity, '| serving_size:', p.serving_size, '| serving_quantity:', p.serving_quantity, '| nutriments keys:', Object.keys(n).filter(k => k.includes('energy') || k.includes('kcal')));

      // Try multiple fields to get total product size
      const totalSize = parseFloat(p.product_quantity) || parseFloat(p.quantity) || null;

      // Per 100g/ml values
      let calPer100 = n['energy-kcal_100g'] ?? null;
      if (calPer100 === null) {
        const kj = n['energy_100g'] ?? n['energy-kj_100g'] ?? null;
        calPer100 = kj !== null ? kj / 4.184 : 0;
      }
      const proteinPer100 = n['proteins_100g'] ?? 0;
      const carbsPer100 = n['carbohydrates_100g'] ?? 0;
      const fatPer100 = n['fat_100g'] ?? 0;

      // If we have the total size, scale up to full product
      const multiplier = totalSize ? totalSize / 100 : 1;
      const servingLabel = totalSize ? `${totalSize}${p.quantity?.includes('ml') || p.product_quantity_unit === 'ml' ? 'ml' : 'g'} (full product)` : (p.serving_size || 'per 100g');

      return {
        found: true,
        name: p.product_name,
        cal: calPer100 * multiplier,
        protein: proteinPer100 * multiplier,
        carbs: carbsPer100 * multiplier,
        fat: fatPer100 * multiplier,
        serving_size: servingLabel,
      };
    }
  } catch (_) {}
  return null;
}

async function lookupLLM(barcode) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Look up food product with barcode: ${barcode}. Return nutritional info per 100g serving. If not found, set found to false.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        found: { type: 'boolean' },
        name: { type: 'string' },
        cal: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fat: { type: 'number' },
        serving_size: { type: 'string' },
      },
    },
  });
  return result;
}

// Each mount gets a unique ID to avoid conflicts if component remounts
let instanceCount = 0;

export default function BarcodeScannerModal({ onAdd, onClose }) {
  const idRef = useRef(`bcsv-${++instanceCount}`);
  const scannerRef = useRef(null);
  const activeRef = useRef(false); // true while camera is running

  const [phase, setPhase] = useState('init'); // init | scanning | loading | result | manual | error
  const [manualCode, setManualCode] = useState('');
  const [detectedCode, setDetectedCode] = useState('');
  const [foodResult, setFoodResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [cameraErr, setCameraErr] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [showFallback, setShowFallback] = useState(false);
  const fallbackTimer = useRef(null);

  const stopCamera = useCallback(async () => {
    clearTimeout(fallbackTimer.current);
    if (scannerRef.current && activeRef.current) {
      activeRef.current = false;
      try { await scannerRef.current.stop(); } catch (_) {}
      try { scannerRef.current.clear(); } catch (_) {}
      scannerRef.current = null;
    }
  }, []);

  const fetchFood = useCallback(async (code) => {
    setDetectedCode(code);
    setPhase('loading');
    try {
      const off = await lookupOpenFoodFacts(code);
      if (off) { setFoodResult(off); setPhase('result'); return; }
      const llm = await lookupLLM(code);
      if (llm?.found && llm?.name) { setFoodResult(llm); setPhase('result'); }
      else { setErrMsg(`No product found for barcode ${code}.`); setPhase('error'); }
    } catch (_) {
      setErrMsg('Failed to look up product. Try manual entry.');
      setPhase('error');
    }
  }, []);

  const startCamera = useCallback(async () => {
    const divId = idRef.current;
    setPhase('scanning');
    setShowFallback(false);

    // Wait up to 2s for the div to appear and have a size
    let el = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 100));
      el = document.getElementById(divId);
      console.log(`[BarcodeScanner] poll ${i}: el=${!!el} w=${el?.offsetWidth} h=${el?.offsetHeight}`);
      if (el && el.offsetWidth > 10 && el.offsetHeight > 10) break;
    }

    if (!el || el.offsetWidth <= 10) {
      console.error('[BarcodeScanner] div never got size', el?.offsetWidth, el?.offsetHeight);
      setCameraErr('Scanner view not ready. Please try again.');
      setPhase('manual');
      return;
    }

    // Clean up any previous instance
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (_) {}
      try { scannerRef.current.clear(); } catch (_) {}
      scannerRef.current = null;
    }

    try {
      console.log('[BarcodeScanner] creating Html5Qrcode on div:', divId, 'size:', el.offsetWidth, 'x', el.offsetHeight);
      const scanner = new Html5Qrcode(divId, {
        formatsToSupport: FOOD_FORMATS,
        verbose: true,
      });
      scannerRef.current = scanner;

      console.log('[BarcodeScanner] calling scanner.start...');
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: Math.min(el.offsetWidth - 40, 260), height: 140 } },
        (decoded) => {
          console.log('[BarcodeScanner] decoded:', decoded);
          if (!activeRef.current) return;
          stopCamera();
          fetchFood(decoded);
        },
        (err) => {
          // per-frame errors are normal — only log distinct ones
          if (err && !String(err).includes('No MultiFormat')) {
            console.log('[BarcodeScanner] frame:', err);
          }
        }
      );

      console.log('[BarcodeScanner] scanner started successfully');
      activeRef.current = true;

      fallbackTimer.current = setTimeout(() => {
        if (activeRef.current) setShowFallback(true);
      }, 10000);

    } catch (err) {
      console.error('[BarcodeScanner] START ERROR:', err, JSON.stringify(err));
      const msg = String(err?.message || err).toLowerCase();
      if (msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied')) {
        setCameraErr('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (msg.includes('notfound') || msg.includes('no camera') || msg.includes('devices')) {
        setCameraErr('No camera found on this device.');
      } else {
        setCameraErr(`Camera error: ${err?.message || String(err)}`);
      }
      setPhase('manual');
    }
  }, [fetchFood, stopCamera]);

  // Start on mount
  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, []); // eslint-disable-line

  const handleScanAgain = () => {
    setErrMsg(''); setFoodResult(null); setManualCode(''); setDetectedCode('');
    startCamera();
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    await stopCamera();
    fetchFood(manualCode.trim());
  };

  const handleAdd = () => {
    if (!foodResult) return;
    onAdd(selectedMeal, {
      name: foodResult.name,
      cal: parseFloat((foodResult.cal || 0).toFixed(1)),
      protein: parseFloat((foodResult.protein || 0).toFixed(1)),
      carbs: parseFloat((foodResult.carbs || 0).toFixed(1)),
      fat: parseFloat((foodResult.fat || 0).toFixed(1)),
    });
    onClose();
  };

  const handleClose = () => { stopCamera(); onClose(); };

  const showScanner = phase === 'scanning' || phase === 'init';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', background: OVERLAY_BG }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScanBarcode size={18} color="#38bdf8" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Scan Barcode</span>
        </div>
        <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} color="#94a3b8" />
        </button>
      </div>

      {/* Camera view — always rendered so the div exists in DOM */}
      <div style={{
        flex: showScanner ? 1 : 0,
        minHeight: showScanner ? 200 : 0,
        overflow: 'hidden',
        position: 'relative',
        background: '#000',
        display: showScanner ? 'block' : 'none',
      }}>
        {/* The div Html5Qrcode attaches to */}
        <div id={idRef.current} style={{ width: '100%', height: '100%', minHeight: 280 }} />

        {/* Scan frame overlay */}
        {phase === 'scanning' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 270, height: 140, borderRadius: 10, border: '2px solid rgba(56,189,248,0.6)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', position: 'relative', marginBottom: 60 }}>
              {/* Corner accents */}
              {[
                { top: -2, left: -2, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '10px 0 0 0' },
                { top: -2, right: -2, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 10px 0 0' },
                { bottom: -2, left: -2, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '0 0 0 10px' },
                { bottom: -2, right: -2, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 0 10px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...s }} />
              ))}
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)', animation: 'scanLine 1.6s ease-in-out infinite', top: '50%' }} />
            </div>
          </div>
        )}

        {/* Hint + manual button */}
        {phase === 'scanning' && (
          <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'all' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>Point at a barcode on food packaging</p>
            {showFallback && (
              <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, margin: 0 }}>
                Tip: ensure good lighting and hold steady
              </p>
            )}
            <button
              onClick={() => { stopCamera(); setPhase('manual'); }}
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 20px', color: showFallback ? '#e2e8f0' : '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: showFallback ? 700 : 400 }}>
              Enter manually instead
            </button>
          </div>
        )}

        {/* Init spinner */}
        {phase === 'init' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={32} color="#38bdf8" style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Loading */}
      {phase === 'loading' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Loader2 size={36} color="#38bdf8" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Looking up {detectedCode}…</p>
        </div>
      )}

      {/* Manual entry */}
      {phase === 'manual' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 16 }}>
          {cameraErr && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{cameraErr}</p>
            </div>
          )}
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Enter the barcode number from the product:</p>
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={e => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 14))}
            placeholder="e.g. 5000112637922"
            autoFocus
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 14px', color: '#e2e8f0', fontSize: 18, fontFamily: 'monospace', outline: 'none', letterSpacing: '0.08em' }}
          />
          <button
            onClick={handleManualSubmit}
            disabled={manualCode.length < 8}
            style={{ padding: '14px', borderRadius: 12, background: manualCode.length >= 8 ? '#38bdf8' : 'rgba(255,255,255,0.06)', border: 'none', color: manualCode.length >= 8 ? '#061820' : '#475569', fontSize: 14, fontWeight: 700, cursor: manualCode.length >= 8 ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            Look Up Product
          </button>
          {!cameraErr && (
            <button
              onClick={handleScanAgain}
              style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Camera size={14} /> Use Camera Instead
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {phase === 'result' && foodResult && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 14, overflowY: 'auto' }}>
          <div style={{ background: CARD_BG, borderRadius: 16, padding: 16, border: '1px solid rgba(56,189,248,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ScanBarcode size={18} color="#38bdf8" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 3px' }}>{foodResult.name}</p>
                {foodResult.serving_size && <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Per {foodResult.serving_size}</p>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Calories', value: parseFloat((foodResult.cal || 0).toFixed(1)), unit: 'kcal', color: '#38bdf8' },
                { label: 'Protein', value: parseFloat((foodResult.protein || 0).toFixed(1)), unit: 'g', color: '#60a5fa' },
                { label: 'Carbs', value: parseFloat((foodResult.carbs || 0).toFixed(1)), unit: 'g', color: '#22c55e' },
                { label: 'Fat', value: parseFloat((foodResult.fat || 0).toFixed(1)), unit: 'g', color: '#f59e0b' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color, margin: '0 0 2px' }}>{value}<span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>{unit}</span></p>
                  <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add to meal</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => (
                <button key={meal} onClick={() => setSelectedMeal(meal)} style={{ padding: '8px 4px', borderRadius: 10, border: '1px solid', borderColor: selectedMeal === meal ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)', background: selectedMeal === meal ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)', color: selectedMeal === meal ? '#38bdf8' : '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {meal}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleAdd} style={{ padding: '14px', borderRadius: 12, background: '#38bdf8', border: 'none', color: '#061820', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Add to {selectedMeal}
          </button>
          <button onClick={() => { setPhase('manual'); setManualCode(''); }} style={{ padding: '10px', borderRadius: 10, background: 'transparent', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Try a different barcode
          </button>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} color="#f87171" />
          </div>
          <p style={{ fontSize: 14, color: '#f87171', margin: 0 }}>{errMsg}</p>
          <button onClick={() => { setPhase('manual'); setManualCode(detectedCode); }} style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Enter manually
          </button>
          <button onClick={handleScanAgain} style={{ padding: '12px 20px', borderRadius: 12, background: '#38bdf8', border: 'none', color: '#061820', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={14} /> Try scanning again
          </button>
        </div>
      )}

      <style>{`
        @keyframes scanLine { 0% { top: 5%; } 50% { top: 88%; } 100% { top: 5%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        #${idRef.current} video { width: 100% !important; height: 100% !important; object-fit: cover; }
      `}</style>
    </div>
  );
}