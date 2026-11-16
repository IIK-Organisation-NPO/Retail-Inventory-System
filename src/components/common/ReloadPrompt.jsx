import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxWidth: '320px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ marginBottom: '10px', fontSize: '0.9rem' }}>
        {offlineReady ? (
          <span>✅ App ready to work offline</span>
        ) : (
          <span>🔄 A new version is ready. Reload to update.</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reload
          </button>
        )}
        <button
          onClick={close}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default ReloadPrompt;