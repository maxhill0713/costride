import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ScanBarcode, Loader2, ChevronRight, Camera, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const OVERLAY_BG = 'rgba(0,0,0,0.85)';
const CARD_BG = 'linear-gradient(135deg, rgba(20,25,50,0.99) 0%, rgba(6,8,18,1) 100%)';

// ─── LLM food lookup by barcode ───────────────────────────────────────────────
async function lookupBarcode(barcode) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Look up this food product barcode: ${barcode}. Return the nutritional information per serving. If you cannot find it, return null for all fields.`,
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BarcodeScannerModal({ onAdd, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);

  const [phase, setPhase] = useState('scanning'); // scanning | found | manual | loading | result | error
  const [manualCode, setManualCode] = useState('');
  const [detectedCode, setDetectedCode] = useState('');
  const [foodResult, setFoodResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [cameraErr, setCameraErr] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');

  const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    scanningRef.current = false;
  }, []);

  // Detect barcodes from video
  const startDetectionLoop = useCallback(() => {
    if (!detectorRef.current || !videoRef.current) return;
    const detect = async () => {
      if (!scanningRef.current) return;
      try {
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length > 0) {
            const code = codes[0].rawValue;
            scanningRef.current = false;
            setDetectedCode(code);
            handleBarcodeFound(code);
            return;
          }
        }
      } catch (_) { /* keep trying */ }
      animFrameRef.current = requestAnimationFrame(detect);
    };
    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  // Start camera
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Check BarcodeDetector support
      if (!('BarcodeDetector' in window)) {
        setCameraErr('Barcode scanner not supported in this browser. Please enter the barcode manually.');
        setPhase('manual');
        return;
      }

      try {
        const formats = await BarcodeDetector.getSupportedFormats();
        detectorRef.current = new BarcodeDetector({ formats });
      } catch (_) {
        detectorRef.current = new BarcodeDetector();
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scanningRef.current = true;
          startDetectionLoop();
        }
      } catch (err) {
        if (!cancelled) {
          setCameraErr('Camera access denied. Please enter the barcode manually.');
          setPhase('manual');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [startDetectionLoop, stopCamera]);

  const handleBarcodeFound = async (code) => {
    stopCamera();
    setPhase('loading');
    try {
      const data = await lookupBarcode(code);
      if (data?.found && data?.name) {
        setFoodResult(data);
        setPhase('result');
      } else {
        setErrMsg(`No product found for barcode ${code}. Try entering manually.`);
        setPhase('error');
      }
    } catch (_) {
      setErrMsg('Failed to look up product. Please try again.');
      setPhase('error');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    stopCamera();
    setDetectedCode(manualCode.trim());
    await handleBarcodeFound(manualCode.trim());
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
    stopCamera();
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

      {/* Camera view */}
      {(phase === 'scanning') && (
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

          {/* Scan overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 260, height: 160, borderRadius: 16, border: '2px solid #38bdf8', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', position: 'relative' }}>
              {/* Corner accents */}
              {[
                { top: -2, left: -2, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '16px 0 0 0' },
                { top: -2, right: -2, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 16px 0 0' },
                { bottom: -2, left: -2, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '0 0 0 16px' },
                { bottom: -2, right: -2, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 0 16px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />
              ))}
              {/* Scan line animation */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)', animation: 'scanLine 1.5s ease-in-out infinite', top: '50%' }} />
            </div>
          </div>

          {/* Instruction */}
          <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Point camera at barcode</p>
          </div>

          {/* Manual entry button */}
          <button
            onClick={() => { stopCamera(); setPhase('manual'); }}
            style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 18px', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Enter manually instead
          </button>
        </div>
      )}

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
            style={{ padding: '14px', borderRadius: 12, background: manualCode.length >= 8 ? '#38bdf8' : 'rgba(255,255,255,0.06)', border: 'none', color: manualCode.length >= 8 ? '#061820' : '#475569', fontSize: 14, fontWeight: 700, cursor: manualCode.length >= 8 ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            Look Up Product
          </button>
          {!cameraErr && (
            <button
              onClick={() => { setManualCode(''); setPhase('scanning'); }}
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

            {/* Macros */}
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
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  style={{
                    padding: '8px 4px', borderRadius: 10, border: '1px solid',
                    borderColor: selectedMeal === meal ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)',
                    background: selectedMeal === meal ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)',
                    color: selectedMeal === meal ? '#38bdf8' : '#64748b',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {meal}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            style={{ padding: '14px', borderRadius: 12, background: '#38bdf8', border: 'none', color: '#061820', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Add to {selectedMeal}
          </button>

          <button
            onClick={() => { setPhase('manual'); setManualCode(''); }}
            style={{ padding: '10px', borderRadius: 10, background: 'transparent', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
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
          <button
            onClick={() => { setPhase('manual'); setManualCode(detectedCode); }}
            style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Enter manually
          </button>
          <button
            onClick={() => { setDetectedCode(''); setPhase('scanning'); scanningRef.current = true; startDetectionLoop(); }}
            style={{ padding: '12px 20px', borderRadius: 12, background: '#38bdf8', border: 'none', color: '#061820', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={14} /> Try scanning again
          </button>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}