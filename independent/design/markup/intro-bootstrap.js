(() => {
            try {
              const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
              const navigationType = performance.getEntriesByType('navigation')[0]?.type || 'navigate';
              let marker = null;
              try {
                marker = JSON.parse(sessionStorage.getItem('stryde:intro-internal-return:v1') || 'null');
                sessionStorage.removeItem('stryde:intro-internal-return:v1');
                sessionStorage.removeItem('stryde:intro-seen:v1');
              } catch { /* Navigation still works when session storage is blocked. */ }
              const internalReferrer = document.referrer && new URL(document.referrer).origin === location.origin;
              const recentReturn = marker && marker.path === location.pathname && Number.isFinite(marker.time) && Date.now() >= marker.time && Date.now() - marker.time < 15000;
              const internalReturn = navigationType === 'navigate' && (internalReferrer || recentReturn);
              if (internalReturn || reduced || navigationType === 'back_forward' || location.hash) return;
              const html = document.documentElement;
              html.classList.add('site-intro-pending');
              const cancelPending = () => {
                html.classList.remove('site-intro-pending');
                controls.abort();
              };
              const controls = new AbortController();
              const options = { signal: controls.signal };
              document.addEventListener('click', event => {
                if (event.target.closest?.('[data-intro-skip]') && html.classList.contains('site-intro-pending'))
                  cancelPending();
              }, options);
              document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && html.classList.contains('site-intro-pending'))
                  cancelPending();
              }, options);
              setTimeout(cancelPending, 2500);
            } catch { /* The homepage remains available if the introduction cannot start. */ }
          })();
