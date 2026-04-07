import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, Camera, AlertCircle, Plus } from 'lucide-react';

const OVERLAY_BG = 'rgba(0,0,0,0.85)';
const CARD_BG = 'linear-gradient(135deg, rgba(20,25,50,0.99) 0%, rgba(6,8,18,1) 100%)';

export default function FoodBarcodeScanner({ onFoodAdded, onClose }) {
  const [phase, setPhase] = useState('scanner'); // scanner | loading | result | error
  const [foodData, setFoodData] = useState(null);
  const [servingSize, setServingSize] = useState(100);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');

  const htmlScannerRef = useRef(null);
  const scannerActiveRef = useRef(false);

  // Start scanner
  useEffect(() => {
    let cancelled = false;

    const initScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-scanner');
        htmlScannerRef.current = scanner;
        scannerActiveRef.current = true;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannerActiveRef.current && !cancelled) {
              scannerActiveRef.current = false;
              scanner.stop();
              setScannedBarcode(decodedText);
              fetchFoodData(decodedText);
            }
          },
          () => {
            // Suppress barcode parsing errors
          }
        );
      } catch (err) {
        if (!cancelled) {
          setPhase('error');
          setErrorMsg('Camera not available. Please check permissions.');
        }
      }
    };

    initScanner();

    return () => {
      cancelled = true;
      if (htmlScannerRef.current && scannerActiveRef.current) {
        htmlScannerRef.current.stop();
        scannerActiveRef.current = false;
      }
    };
  }, []);

  // Fetch from Open Food Facts API
  const fetchFoodData = async (barcode) => {
    setPhase('loading');
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'NutritionTrackerApp - Web - Version 1.0',
          },
        }
      );

      const data = await response.json();

      if (data.status === 1 && data.product) {
        const macros = data.product.nutriments || {};
        setFoodData({
          name: data.product.product_name || 'Unknown Product',
          calories: macros['energy-kcal_100g'] || 0,
          protein: macros.proteins_100g || 0,
          carbs: macros.carbohydrates_100g || 0,
          fat: macros.fat_100g || 0,
        });
        setPhase('result');
      } else {
        setPhase('error');
        setErrorMsg('Food not found in database. Try another item.');
      }
    } catch (err) {
      setPhase('error');
      setErrorMsg('Failed to fetch food data. Please try again.');
    }
  };

  // Calculate macros for serving size
  const calculateMacros = () => {
    if (!foodData) return {};
    const factor = servingSize / 100;
    return {
      calories: Math.round(foodData.calories * factor),
      protein: (foodData.protein * factor).toFixed(1),
      carbs: (foodData.carbs * factor).toFixed(1),
      fat: (foodData.fat * factor).toFixed(1),
    };
  };

  const macros = calculateMacros();

  const handleAddFood = () => {
    if (onFoodAdded && foodData) {
      onFoodAdded({
        name: foodData.name,
        servingSize,
        ...macros,
      });
    }
    onClose();
  };

  const handleRetry = async () => {
    setPhase('scanner');
    setFoodData(null);
    setErrorMsg('');
    setServingSize(100);

    // Restart scanner
    try {
      const scanner = new Html5Qrcode('qr-scanner');
      htmlScannerRef.current = scanner;
      scannerActiveRef.current = true;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (scannerActiveRef.current) {
            scannerActiveRef.current = false;
            scanner.stop();
            setScannedBarcode(decodedText);
            fetchFoodData(decodedText);
          }
        },
        () => {}
      );
    } catch (err) {
      setPhase('error');
      setErrorMsg('Camera not available.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        background: OVERLAY_BG,
      }}
      onClick={onClose}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          background: 'rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Camera size={18} color="#38bdf8" />
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#e2e8f0',
            }}
          >
            Scan Food
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} color="#94a3b8" />
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          padding: phase === 'scanner' ? 0 : '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scanner Phase */}
        {phase === 'scanner' && (
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div id="qr-scanner" style={{ width: '100%', height: '100%' }} />

            {/* Scan Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: 260,
                  height: 160,
                  borderRadius: 16,
                  border: '2px solid #38bdf8',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  position: 'relative',
                }}
              >
                {/* Corner accents */}
                {[
                  { top: -2, left: -2, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' },
                  { top: -2, right: -2, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' },
                  { bottom: -2, left: -2, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' },
                  { bottom: -2, right: -2, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 24,
                      height: 24,
                      borderRadius: i === 0 ? '16px 0 0 0' : i === 1 ? '0 16px 0 0' : i === 2 ? '0 0 0 16px' : '0 0 16px 0',
                      ...s,
                    }}
                  />
                ))}

                {/* Scan line animation */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
                    top: '50%',
                    animation: 'scanLine 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            </div>

            {/* Instruction */}
            <div
              style={{
                position: 'absolute',
                bottom: 32,
                left: 0,
                right: 0,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                Point camera at barcode
              </p>
            </div>
          </div>
        )}

        {/* Loading Phase */}
        {phase === 'loading' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <Loader2 size={36} color="#38bdf8" style={{ animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 14, color: '#94a3b8' }}>Searching for food data...</p>
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && foodData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: CARD_BG,
                borderRadius: 16,
                padding: 16,
                border: '1px solid rgba(56,189,248,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(56,189,248,0.12)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Camera size={18} color="#38bdf8" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#e2e8f0',
                      margin: '0 0 3px',
                    }}
                  >
                    {foodData.name}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Per 100g</p>
                </div>
              </div>

              {/* Macros */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                }}
              >
                {[
                  { label: 'Calories', value: `${Math.round(foodData.calories)}`, unit: 'kcal', color: '#38bdf8' },
                  { label: 'Protein', value: `${foodData.protein.toFixed(1)}`, unit: 'g', color: '#60a5fa' },
                  { label: 'Carbs', value: `${foodData.carbs.toFixed(1)}`, unit: 'g', color: '#22c55e' },
                  { label: 'Fat', value: `${foodData.fat.toFixed(1)}`, unit: 'g', color: '#f59e0b' },
                ].map(({ label, value, unit, color }) => (
                  <div
                    key={label}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10,
                      padding: '10px 8px',
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color,
                        margin: '0 0 2px',
                      }}
                    >
                      {value}
                      <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                        {unit}
                      </span>
                    </p>
                    <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Serving Size */}
            <div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', fontWeight: 600 }}>
                Serving Size: {servingSize}g
              </p>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={servingSize}
                onChange={(e) => setServingSize(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.1)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 6,
                  marginTop: 12,
                }}
              >
                {[
                  { label: 'Calories', value: macros.calories },
                  { label: 'Protein', value: `${macros.protein}g` },
                  { label: 'Carbs', value: `${macros.carbs}g` },
                  { label: 'Fat', value: `${macros.fat}g` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: 'rgba(56,189,248,0.08)',
                      border: '1px solid rgba(56,189,248,0.2)',
                      borderRadius: 10,
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddFood}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                background: '#38bdf8',
                border: 'none',
                color: '#061820',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
            >
              <Plus size={16} />
              Add to Diary
            </button>
          </div>
        )}

        {/* Error Phase */}
        {phase === 'error' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={24} color="#f87171" />
            </div>
            <p style={{ fontSize: 14, color: '#f87171', margin: 0 }}>{errorMsg}</p>
            <button
              onClick={handleRetry}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: '#38bdf8',
                border: 'none',
                color: '#061820',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}