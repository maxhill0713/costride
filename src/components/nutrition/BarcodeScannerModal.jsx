import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ScanBarcode, Loader2, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { base44 } from '@/api/base44Client';

const OVERLAY_BG = 'rgba(0,0,0,0.85)';
const CARD_BG = 'linear-gradient(135deg, rgba(20,25,50,0.99) 0%, rgba(6,8,18,1) 100%)';

async function lookupBarcode(barcode) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Look up this food product barcode: ${barcode}. Return the nutritional information per serving. If you cannot find it, set found to false.`,
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

const FOOD_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
];

const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 150 },
  disableFlip: false,
};

// Throttled debug logger — logs at most once per second
let lastWarnTime = 0;
function throttledWarn(msg) {
  const now = Date.now();
  if (now - lastWarnTime > 1000) {
    lastWarnTime = now;
    console.warn('[BarcodeScanner] frame error:', msg);
  }
}

export default function BarcodeScannerModal({ onAdd, onClose }) {
  const scannerRef = useRef(null);
  const scannerStartedRef = useRef(false);
  const fallbackTimerRef = useRef(null);
  const [phase, setPhase] = useState('scanning'); // scanning | loading | result | manual | error
  const [manualCode, setManualCode] = useState('');
  const [detectedCode, setDetectedCode] = useState('');
  const [foodResult, setFoodResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [cameraErr, setCameraErr] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [showFallback, setShowFallback] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerStartedRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {}
      scannerStartedRef.current = false;
    }
  }, []);

  const fetchFood = useCallback(async (code) => {
    setDetectedCode(code);
    setPhase('loading');
    try {
      // First try Open Food Facts (free, no API key needed)
      const offResp = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
        { headers: { 'User-Agent': 'CoStrideApp - Web - 1.0' } }
      );
      const offData = await offResp.json();

      if (offData.status === 1 && offData.product?.product_name) {
        const n = offData.product.nutriments || {};
        setFoodResult({
          found: true,
          name: offData.product.product_name,
          cal: n['energy-kcal_100g'] || n['energy-kcal'] || 0,
          protein: n.proteins_100g || n.proteins || 0,
          carbs: n.carbohydrates_100g || n.carbohydrates || 0,
          fat: n.fat_100g || n.fat || 0,
          serving_size: offData.product.serving_size || '100g',
        });
        setPhase('result');
        return;
      }

      // Fallback to LLM lookup
      const llmData = await lookupBarcode(code);
      if (llmData?.found && llmData?.name) {
        setFoodResult(llmData);
        setPhase('result');
      } else {
        setErrMsg(`No product found for barcode ${code}.`);
        setPhase('error');
      }
    } catch (_) {
      setErrMsg('Failed to look up product. Please try again or enter manually.');
      setPhase('error');
    }
  }, []);

  const startScanner = useCallback(async (cancelled) => {
    await new Promise(r => setTimeout(r, 100));
    if (cancelled?.value) return;

    try {
      const scanner = new Html5Qrcode('barcode-scanner-view', {
        formatsToSupport: FOOD_BARCODE_FORMATS,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        SCANNER_CONFIG,
        (decodedText) => {
          if (!cancelled?.value && scannerStartedRef.current) {
            clearTimeout(fallbackTimerRef.current);
            scannerStartedRef.current = false;
            scanner.stop().catch(() => {});
            fetchFood(decodedText);
          }
        },
        (errorMsg) => {
          throttledWarn(errorMsg);
        }
      );

      if (!cancelled?.value) {
        scannerStartedRef.current = true;
        // 10-second fallback: show manual entry button hint
        fallbackTimerRef.current = setTimeout(() => {
          if (scannerStartedRef.current) {
            setShowFallback(true);
          }
        }, 10000);
      }
    } catch (err) {
      if (!cancelled?.value) {
        console.warn('[BarcodeScanner] init error:', err);
        setCameraErr('Camera access denied or unavailable. Please enable camera permissions.');
        setPhase('manual');
      }
    }
  }, [fetchFood]);

  // Start scanner on mount
  useEffect(() => {
    const cancelled = { value: false };
    startScanner(cancelled);
    return () => {
      cancelled.value = true;
      clearTimeout(fallbackTimerRef.current);
      stopScanner();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    await stopScanner();
    fetchFood(manualCode.trim());
  };

  const handleScanAgain = async () => {
    setErrMsg('');
    setFoodResult(null);
    setManualCode('');
    setDetectedCode('');
    setShowFallback(false);
    clearTimeout(fallbackTimerRef.current);
    setPhase('scanning');
    const cancelled = { value: false };
    startScanner(cancelled);
  };

  const handleAdd = () => {
    if (!foodResult) return;
    onAdd(selectedMeal, {
      name: foodResult.name,
      cal: Math.round(foodResult.cal || 0),
      protein: Math.round(foodResult.protein || 0),
      carbs: Math.round(foodResult.carbs || 0),
      fat: Math.round(foodResult.fat || 0),
    });
    onClose();
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', background: OVERLAY_BG }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', background: 'rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScanBarcode size={18} color="#38bdf8" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Scan Barcode</span>
        </div>
        <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} color="#94a3b8" />
        </button>
      </div>

      {/* Scanner view — always in DOM so Html5Qrcode can attach, hidden via visibility when not scanning */}
      <div style={{ display: 'flex', flex: phase === 'scanning' ? 1 : 0, height: phase === 'scanning' ? undefined : 0, overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <div id="barcode-scanner-view" style={{ width: '100%', height: '100%' }} />

        {/* Scan frame overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 290, height: 150, borderRadius: 12, border: '2px solid #38bdf8', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', position: 'relative' }}>
            {[
              { top: -2, left: -2, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '12px 0 0 0' },
              { top: -2, right: -2, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 12px 0 0' },
              { bottom: -2, left: -2, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '0 0 0 12px' },
              { bottom: -2, right: -2, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 0 12px 0' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />
            ))}
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)', animation: 'scanLine 1.5s ease-in-out infinite', top: '50%' }} />
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Point camera at barcode</p>
        </div>

        <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {showFallback && (
            <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, margin: 0 }}>
              Having trouble? Make sure barcode is well-lit and centred.
            </p>
          )}
          <button
            onClick={() => { clearTimeout(fallbackTimerRef.current); stopScanner(); setPhase('manual'); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 18px', color: showFallback ? '#e2e8f0' : '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: showFallback ? 700 : 400 }}>
            Enter manually instead
          </button>
        </div>
      </div>

      {/* Loading */}
      {phase === 'loading' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Loader2 size={36} color="#38bdf8" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Looking up barcode {detectedCode}…</p>
        </div>
      )}

      {/* Manual entry */}
      {phase === 'manual' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 16 }}>
          {cameraErr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} color="#f87171" />
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
                { label: 'Calories', value: `${Math.round(foodResult.cal || 0)}`, unit: 'kcal', color: '#38bdf8' },
                { label: 'Protein', value: `${Math.round(foodResult.protein || 0)}`, unit: 'g', color: '#60a5fa' },
                { label: 'Carbs', value: `${Math.round(foodResult.carbs || 0)}`, unit: 'g', color: '#22c55e' },
                { label: 'Fat', value: `${Math.round(foodResult.fat || 0)}`, unit: 'g', color: '#f59e0b' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color, margin: '0 0 2px' }}>{value}<span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>{unit}</span></p>
                  <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meal picker */}
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
        @keyframes scanLine { 0% { top: 10%; } 50% { top: 85%; } 100% { top: 10%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        #barcode-scanner-view video { object-fit: cover; }
      `}</style>
    </div>
  );
}