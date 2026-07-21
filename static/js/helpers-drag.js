// helpers-drag.js - helper pieces drag/drop and restore logic
const originalHelperPanelHTML = new WeakMap();
const originalHelperPositions = new WeakMap();
window.originalHelperPanelHTML = originalHelperPanelHTML;

function resetHelpers() {
  const helperPanels = Array.from(document.querySelectorAll('.helper-panel'));
  helperPanels.forEach((panel) => {
    const originalHTML = originalHelperPanelHTML.get(panel);
    if (originalHTML) {
      panel.innerHTML = originalHTML;
    }
  });
  if (typeof initDragHelpers === 'function') {
    initDragHelpers();
  }
}

function initDragHelpers() {
  const helperPanels = Array.from(document.querySelectorAll('.helper-panel'));
  helperPanels.forEach((panel) => {
    if (!originalHelperPanelHTML.has(panel)) {
      originalHelperPanelHTML.set(panel, panel.innerHTML);
    }
    panel.style.position = 'relative';

    const actionBins = Array.from(panel.querySelectorAll('.action-bin'));
    const helperPieces = Array.from(panel.querySelectorAll('.helper-piece:not(.helper-piece--empty)'));
    const binStorages = {
      '+': panel.querySelector('.action-bin--plus .bin-storage'),
      '-': panel.querySelector('.action-bin--minus .bin-storage'),
    };
    const binCountValues = {
      '+': panel.querySelector('.action-bin--plus .bin-count-value'),
      '-': panel.querySelector('.action-bin--minus .bin-count-value'),
    };
    const restoreHandles = Array.from(panel.querySelectorAll('.action-bin .bin-count'));
    const getRestoreSlots = () => Array.from(panel.querySelectorAll('.helper-piece--empty'));

    if (!helperPieces.length || !actionBins.length || !getRestoreSlots().length || !binStorages['+'] || !binStorages['-'] || !binCountValues['+'] || !binCountValues['-'] || !restoreHandles.length) return;

    const createEmptySlot = () => {
      const slot = document.createElement('div');
      slot.className = 'helper-piece helper-piece--empty';
      slot.setAttribute('aria-hidden', 'true');
      return slot;
    };

    const findMatchingBin = (piece, bins) => {
      return bins.find((actionBin) => actionBin.dataset.accept === piece.dataset.sign);
    };

    const recordOriginalPosition = (piece) => {
      if (originalHelperPositions.has(piece)) return;
      originalHelperPositions.set(piece, {
        parent: piece.parentNode,
        index: Array.from(piece.parentNode.children).indexOf(piece),
      });
    };

    const restorePieceToSlot = (pieceToRestore, slot) => {
      if (!pieceToRestore || !slot) return;
      try {
        const slotParent = slot.parentNode;
        const sign = pieceToRestore.dataset && pieceToRestore.dataset.sign;
        const binStorage = binStorages[sign];
        const countValue = binCountValues[sign];

        if (slotParent) {
          try {
            slotParent.replaceChild(pieceToRestore, slot);
          } catch (e) {
            // fallback if replaceChild fails
            try { slotParent.appendChild(pieceToRestore); } catch (e2) { /* ignore */ }
          }
        } else if (pieceToRestore._originalParent && pieceToRestore._originalParent.nodeType === 1) {
          // try to restore to original parent position
          try {
            const orig = pieceToRestore._originalParent;
            const idx = typeof pieceToRestore._originalIndex === 'number' ? pieceToRestore._originalIndex : -1;
            if (idx >= 0 && idx <= orig.children.length) {
              orig.insertBefore(pieceToRestore, orig.children[idx] || null);
            } else {
              orig.appendChild(pieceToRestore);
            }
          } catch (e) { /* ignore */ }
        } else {
          // last-resort append into panel
          try { panel.appendChild(pieceToRestore); } catch (e) { /* ignore */ }
        }

        pieceToRestore.classList.remove('helper-piece--removed');
        pieceToRestore.removeAttribute('aria-hidden');
        pieceToRestore.draggable = true;
        pieceToRestore.style.opacity = '';
        pieceToRestore.style.pointerEvents = '';

        // update bin count safely
        if (countValue && binStorage) {
          try {
            countValue.textContent = binStorage.querySelectorAll('.helper-piece--removed').length.toString();
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.warn('restorePieceToSlot failed', err, pieceToRestore, slot);
      }
    };

    const setupHelperPiece = (piece) => {
      if (!piece || piece.__helperDragInitialized) return;
      recordOriginalPosition(piece);
      piece.__helperDragInitialized = true;
      piece.style.touchAction = 'none';

      let dragClone = null;
      let pointerId = null;
      let offsetX = 0;
      let offsetY = 0;
      let activeActionBin = null;
      let activeRestoreSlot = null;

      const resetClone = () => {
        if (dragClone && dragClone.parentElement) {
          dragClone.parentElement.removeChild(dragClone);
        }
        dragClone = null;
        if (activeActionBin) {
          activeActionBin.classList.remove('drag-over');
          activeActionBin = null;
        }
        if (activeRestoreSlot) {
          activeRestoreSlot.classList.remove('drag-over');
          activeRestoreSlot = null;
        }
      };

      const removePiece = (statusText) => {
        try {
          const placeholder = createEmptySlot();
          const originalParent = piece.parentNode;
          const originalIndex = originalParent ? Array.from(originalParent.children).indexOf(piece) : -1;
          if (originalParent && originalParent.nodeType === 1) {
            try { originalParent.replaceChild(placeholder, piece); } catch (e) { /* ignore */ }
          }

          piece._originalParent = originalParent;
          piece._originalIndex = originalIndex;

          const storage = binStorages[piece.dataset.sign];
          const countValue = binCountValues[piece.dataset.sign];

          if (storage && storage.appendChild) {
            try { storage.appendChild(piece); } catch (e) { panel.appendChild(piece); }
          } else {
            try { panel.appendChild(piece); } catch (e) { /* ignore */ }
          }

          piece.classList.add('helper-piece--removed');
          piece.setAttribute('aria-hidden', 'true');
          piece.draggable = true;
          piece.style.opacity = '0.4';
          piece.style.pointerEvents = 'auto';
          setupHelperPiece(piece);

          if (countValue && storage) {
            try {
              countValue.textContent = storage.querySelectorAll('.helper-piece--removed').length.toString();
            } catch (e) { /* ignore */ }
          }
        } catch (err) {
          console.warn('removePiece failed', err, piece);
        }
      };

      const onPointerMove = (event) => {
        if (!dragClone || event.pointerId !== pointerId) return;
        event.preventDefault();
        const panelRect = panel.getBoundingClientRect();
        const x = Math.min(
          Math.max(0, event.clientX - panelRect.left - offsetX),
          panelRect.width - dragClone.offsetWidth
        );
        const y = Math.min(
          Math.max(0, event.clientY - panelRect.top - offsetY),
          panelRect.height - dragClone.offsetHeight
        );
        dragClone.style.left = `${x}px`;
        dragClone.style.top = `${y}px`;

        const centerX = event.clientX;
        const centerY = event.clientY;
        let foundBin = null;
        let foundSlot = null;

        if (!piece.classList.contains('helper-piece--removed')) {
          const matchingBin = findMatchingBin(piece, actionBins);
          if (matchingBin) {
            const binRect = matchingBin.getBoundingClientRect();
            if (
              centerX >= binRect.left &&
              centerX <= binRect.right &&
              centerY >= binRect.top &&
              centerY <= binRect.bottom
            ) {
              foundBin = matchingBin;
            }
          }
        } else {
          getRestoreSlots().forEach((slot) => {
            const slotRect = slot.getBoundingClientRect();
            if (
              centerX >= slotRect.left &&
              centerX <= slotRect.right &&
              centerY >= slotRect.top &&
              centerY <= slotRect.bottom
            ) {
              foundSlot = slot;
            }
          });
        }

        if (activeActionBin && activeActionBin !== foundBin) {
          activeActionBin.classList.remove('drag-over');
          activeActionBin = null;
        }
        if (foundBin && activeActionBin !== foundBin) {
          foundBin.classList.add('drag-over');
          activeActionBin = foundBin;
        }

        if (activeRestoreSlot && activeRestoreSlot !== foundSlot) {
          activeRestoreSlot.classList.remove('drag-over');
          activeRestoreSlot = null;
        }
        if (foundSlot && activeRestoreSlot !== foundSlot) {
          foundSlot.classList.add('drag-over');
          activeRestoreSlot = foundSlot;
        }
      };

      const endDrag = (event) => {
        if (!dragClone || event.pointerId !== pointerId) return;
        event.preventDefault();
        const centerX = event.clientX;
        const centerY = event.clientY;
        let droppedBin = null;
        let droppedSlot = null;

        if (!piece.classList.contains('helper-piece--removed')) {
          const matchingBin = findMatchingBin(piece, actionBins);
          if (matchingBin) {
            const binRect = matchingBin.getBoundingClientRect();
            if (
              centerX >= binRect.left &&
              centerX <= binRect.right &&
              centerY >= binRect.top &&
              centerY <= binRect.bottom
            ) {
              droppedBin = matchingBin;
            }
          }

          if (droppedBin) {
            const statusText = piece.dataset.sign === '+' ? 'Disimpan Positif' : 'Disimpan Negatif';
            removePiece(statusText);
            console.debug('[drag] dropped on bin', { piece: piece.id, bin: droppedBin.className, statusText });
          }
        } else {
          getRestoreSlots().forEach((slot) => {
            const slotRect = slot.getBoundingClientRect();
            if (
              centerX >= slotRect.left &&
              centerX <= slotRect.right &&
              centerY >= slotRect.top &&
              centerY <= slotRect.bottom
            ) {
              droppedSlot = slot;
            }
          });

          if (droppedSlot) {
            restorePieceToSlot(piece, droppedSlot);
            console.debug('[drag] restored piece to slot', { piece: piece.id });
          }
        }

        resetClone();
        try { piece.releasePointerCapture(pointerId); } catch (e) { /* ignore */ }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
        pointerId = null;
      };

      piece.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        pointerId = event.pointerId;
        try { piece.setPointerCapture(pointerId); } catch (e) { /* ignore */ }

        const pieceRect = piece.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        offsetX = event.clientX - pieceRect.left;
        offsetY = event.clientY - pieceRect.top;

        dragClone = piece.cloneNode(true);
        dragClone.classList.add('dragging');
        dragClone.style.position = 'absolute';
        dragClone.style.left = `${pieceRect.left - panelRect.left}px`;
        dragClone.style.top = `${pieceRect.top - panelRect.top}px`;
        dragClone.style.width = `${pieceRect.width}px`;
        dragClone.style.opacity = '0.9';
        dragClone.style.pointerEvents = 'none';
        dragClone.style.zIndex = '1000';
        panel.appendChild(dragClone);

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
      });
    };

    helperPieces.forEach((piece) => {
      setupHelperPiece(piece);
    });

    restoreHandles.forEach((handle) => {
      let dragClone = null;
      let pointerId = null;
      let offsetX = 0;
      let offsetY = 0;
      let activeRestoreSlot = null;
      const sign = handle.closest('.action-bin')?.dataset.accept;

      handle.style.touchAction = 'none';
      handle.setAttribute('data-restore-handle', 'true');

      const resetHandleClone = () => {
        if (dragClone && dragClone.parentElement) {
          dragClone.parentElement.removeChild(dragClone);
        }
        dragClone = null;
        if (activeRestoreSlot) {
          activeRestoreSlot.classList.remove('drag-over');
          activeRestoreSlot = null;
        }
      };

      const getHiddenPiece = () => {
        const storage = binStorages[sign];
        return storage ? storage.querySelector('.helper-piece--removed') : null;
      };

      const handlePointerMove = (event) => {
        if (!dragClone || event.pointerId !== pointerId) return;
        event.preventDefault();
        const panelRect = panel.getBoundingClientRect();
        const x = Math.min(
          Math.max(0, event.clientX - panelRect.left - offsetX),
          panelRect.width - dragClone.offsetWidth
        );
        const y = Math.min(
          Math.max(0, event.clientY - panelRect.top - offsetY),
          panelRect.height - dragClone.offsetHeight
        );
        dragClone.style.left = `${x}px`;
        dragClone.style.top = `${y}px`;

        const centerX = event.clientX;
        const centerY = event.clientY;
        let foundSlot = null;

        getRestoreSlots().forEach((slot) => {
          const slotRect = slot.getBoundingClientRect();
          if (
            centerX >= slotRect.left &&
            centerX <= slotRect.right &&
            centerY >= slotRect.top &&
            centerY <= slotRect.bottom
          ) {
            foundSlot = slot;
          }
        });

        if (activeRestoreSlot && activeRestoreSlot !== foundSlot) {
          activeRestoreSlot.classList.remove('drag-over');
          activeRestoreSlot = null;
        }
        if (foundSlot && activeRestoreSlot !== foundSlot) {
          foundSlot.classList.add('drag-over');
          activeRestoreSlot = foundSlot;
        }
      };

      const handlePointerUp = (event) => {
        if (!dragClone || event.pointerId !== pointerId) return;
        event.preventDefault();
        const centerX = event.clientX;
        const centerY = event.clientY;
        let droppedSlot = null;

        getRestoreSlots().forEach((slot) => {
          const slotRect = slot.getBoundingClientRect();
          if (
            centerX >= slotRect.left &&
            centerX <= slotRect.right &&
            centerY >= slotRect.top &&
            centerY <= slotRect.bottom
          ) {
            droppedSlot = slot;
          }
        });

        if (droppedSlot) {
          const pieceToRestore = getHiddenPiece();
          if (pieceToRestore) {
            restorePieceToSlot(pieceToRestore, droppedSlot);
          }
        }

        resetHandleClone();
        try { handle.releasePointerCapture(pointerId); } catch (e) { /* ignore */ }
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        pointerId = null;
      };

      handle.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        pointerId = event.pointerId;
        try { handle.setPointerCapture(pointerId); } catch (e) { /* ignore */ }

        const handleRect = handle.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        offsetX = event.clientX - handleRect.left;
        offsetY = event.clientY - handleRect.top;

        dragClone = handle.cloneNode(true);
        dragClone.classList.add('dragging');
        dragClone.style.position = 'absolute';
        dragClone.style.left = `${handleRect.left - panelRect.left}px`;
        dragClone.style.top = `${handleRect.top - panelRect.top}px`;
        dragClone.style.width = `${handleRect.width}px`;
        dragClone.style.opacity = '0.9';
        dragClone.style.pointerEvents = 'none';
        dragClone.style.zIndex = '1000';
        panel.appendChild(dragClone);

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
      });
    });
  });
}

// expose functions globally
window.resetHelpers = resetHelpers;
window.initDragHelpers = initDragHelpers;
