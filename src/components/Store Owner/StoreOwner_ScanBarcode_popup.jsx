// src/components/Store Owner/StoreOwner_ScanBarcode_popup.jsx
// "Scan barcode" popup opened from the Record sale popup.
// Step 1: start the camera or type a code. Step 2: list of items scanned so far.
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { PopupShell } from "./StoreOwner_StockIn_popup";
import "../../Style/Store Owner/StoreOwner_StockIn_popup.css";
import "../../Style/Store Owner/StoreOwner_ScanBarcode_popup.css";

// Ignore the same code for this long, so holding an item in front of the
// camera doesn't add it over and over
const RESCAN_DELAY_MS = 2000;

const cameraErrorMessage = (err) => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return "The camera isn't available here (it needs a secure https connection). Type the code below instead.";
  }
  if (err?.name === "NotAllowedError") {
    return "Camera access was blocked. Allow the camera in your browser settings, or type the code below.";
  }
  if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
    return "No camera was found on this device. Type the code below instead.";
  }
  return "The camera couldn't start. Type the code below instead.";
};

/**
 * products:  [{ id, product, onHand, barcode }]
 * initialScanned: optional items to review before scanning more
 * qtyInSale: (productId) => quantity already in the Record sale popup
 * onDone:    called with [{ productId, qty }]
 * onCancel:  go back to the Record sale popup without adding anything
 */
const StoreOwner_ScanBarcode_popup = ({
  products,
  initialScanned = [],
  qtyInSale,
  onDone,
  onCancel,
}) => {
  const [scanned, setScanned] = useState(() =>
    initialScanned.flatMap(({ productId, qty }) => {
      const product = products.find((entry) => entry.id === productId);
      return product ? [{ productId, name: product.product, qty }] : [];
    })
  );
  const [lastAdded, setLastAdded] = useState(() => {
    const firstItem = initialScanned[0];
    return products.find((product) => product.id === firstItem?.productId)?.product ?? "";
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const codeInputRef = useRef(null);
  const lastScanRef = useRef({ code: "", at: 0 });

  const totalScanned = scanned.reduce((sum, s) => sum + s.qty, 0);
  const step = scanned.length > 0 ? "list" : "start";

  // Add one of the product with this barcode
  const addByBarcode = (rawCode) => {
    const barcode = rawCode.trim();
    if (!barcode) return;

    const product = products.find((p) => p.barcode === barcode);
    if (!product) {
      setError(`No product has the barcode ${barcode}.`);
      return;
    }

    const alreadyScanned = scanned.find((s) => s.productId === product.id)?.qty ?? 0;
    if (qtyInSale(product.id) + alreadyScanned >= product.onHand) {
      setError(`No more ${product.product} in stock.`);
      return;
    }

    setScanned((current) =>
      alreadyScanned
        ? current.map((s) => (s.productId === product.id ? { ...s, qty: s.qty + 1 } : s))
        : [...current, { productId: product.id, name: product.product, qty: 1 }]
    );
    setLastAdded(product.product);
    setError("");
    setCode("");
    navigator.vibrate?.(60);
  };

  // Called by the camera for every code it reads
  const onCameraDetected = useEffectEvent((barcode) => {
    const now = Date.now();
    const last = lastScanRef.current;
    if (barcode === last.code && now - last.at < RESCAN_DELAY_MS) return;
    lastScanRef.current = { code: barcode, at: now };
    addByBarcode(barcode);
  });

  const onCameraFailed = useEffectEvent((err) => {
    setCameraOn(false);
    setCameraReady(false);
    setError(cameraErrorMessage(err));
  });

  // Start the camera when turned on; stop it when turned off or the popup closes
  useEffect(() => {
    if (!cameraOn) return undefined;

    let cancelled = false;
    let controls = null;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("No camera API");
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;

        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } }, // back camera on phones
          videoRef.current,
          (result) => {
            if (result) onCameraDetected(result.getText());
          }
        );

        if (cancelled) controls.stop();
        else setCameraReady(true);
      } catch (err) {
        if (!cancelled) onCameraFailed(err);
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [cameraOn]);

  const toggleCamera = () => {
    setError("");
    setCameraReady(false);
    setCameraOn((on) => !on);
  };

  const handleTypedCode = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter a barcode number.");
      return;
    }
    addByBarcode(code);
    codeInputRef.current?.focus();
  };

  const removeScanned = (productId) => {
    setScanned((current) => current.filter((s) => s.productId !== productId));
  };

  const itemsLabel = (n) => `${n} item${n === 1 ? "" : "s"}`;

  return (
    <PopupShell title="Scan barcode" onClose={onCancel}>
      {/* =========================================
          CAMERA AREA (kept in place for both steps
          so the camera keeps running)
          ========================================= */}
      <div className={`sb-camera sb-camera-${step}${cameraOn ? " sb-camera-on" : ""}`}>
        {cameraOn && <video ref={videoRef} className="sb-video" muted playsInline />}

        <div className="sb-camera-text">
          {cameraOn && !cameraReady && <p className="sb-camera-title">Starting camera…</p>}

          {step === "start" && !cameraOn && (
            <>
              <p className="sb-camera-title">Point the camera at the barcode</p>
              <p className="sb-camera-sub">It reads the code by itself</p>
            </>
          )}

          {step === "list" && (!cameraOn || cameraReady) && (
            <p className="sb-camera-sub sb-next">Scan the next item.</p>
          )}
        </div>

        {/* Turn the camera on from step 2 if it isn't running */}
        {step === "list" && !cameraOn && (
          <button type="button" className="sb-camera-toggle" onClick={toggleCamera}>
            Use camera
          </button>
        )}

        {step === "list" && lastAdded && (
          <div className="sb-added" role="status" aria-live="polite">
            Added: {lastAdded}
          </div>
        )}
      </div>

      {/* =========================================
          STEP 1: START (camera or typed code)
          ========================================= */}
      {step === "start" && (
        <>
          <button type="button" className="sp-btn sp-btn-primary sb-full" onClick={toggleCamera}>
            {cameraOn ? "Stop camera" : "Scan"}
          </button>

          <div className="sb-divider"><span>or type it</span></div>

          <form onSubmit={handleTypedCode} noValidate>
            <div className="sp-field">
              <label htmlFor="sb-code">Barcode number</label>
              <div className="sb-code-row">
                <input
                  id="sb-code"
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="sp-input"
                  placeholder="e.g. 5449000000996"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError("");
                  }}
                  autoFocus
                />
                <button type="submit" className="sp-btn sp-btn-outline sb-find-btn">Find product</button>
              </div>
            </div>
          </form>

          <p className="sb-hint">
            No barcode scanner? A keyboard also works. The code is entered for you.
          </p>

          {error && <p className="sp-error">{error}</p>}

          <button type="button" className="sp-btn sp-btn-outline sb-full" onClick={onCancel}>
            Cancel
          </button>
        </>
      )}

      {/* =========================================
          STEP 2: SCANNED SO FAR
          ========================================= */}
      {step === "list" && (
        <>
          {/* Typing / USB scanner still works here */}
          <form onSubmit={handleTypedCode} noValidate className="sb-code-row sb-code-row-compact">
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="sp-input"
              placeholder="Or type a barcode"
              aria-label="Barcode number"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              autoFocus
            />
            <button type="submit" className="sp-btn sp-btn-outline sb-find-btn">Add</button>
          </form>

          {error && <p className="sp-error">{error}</p>}

          <p className="sb-list-label">Scanned so far ({itemsLabel(totalScanned)})</p>
          <ul className="sb-list">
            {scanned.map((s) => (
              <li key={s.productId} className="sb-list-item">
                <span className="sb-list-name">{s.name}</span>
                <span className="sb-list-qty">×{s.qty}</span>
                <button type="button" className="sb-remove" onClick={() => removeScanned(s.productId)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="sp-btn sp-btn-primary sb-full"
            onClick={() => onDone(scanned.map(({ productId, qty }) => ({ productId, qty })))}
          >
            Done, add {itemsLabel(totalScanned)} to the sale
          </button>
          <button type="button" className="sp-btn sp-btn-outline sb-full" onClick={onCancel}>
            Cancel
          </button>
        </>
      )}
    </PopupShell>
  );
};

export default StoreOwner_ScanBarcode_popup;