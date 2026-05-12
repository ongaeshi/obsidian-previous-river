import { Plugin } from "obsidian";
import {
  goToPreviousNoteCommand,
  goToNextNoteCommand,
  goToFirstNoteCommand,
  goToLastNoteCommand,
  detachNoteCommand,
  insertNoteToLastCommand,
  insertNoteCommand,
  insertNoteToFirstCommand,
  copyNextNotesListCommand,
  exportNextNotesToCanvasCommand,
  exportAllRiversToCanvasCommand,
  exportFilteredRiversToCanvasCommand,
  setRootCommand,
  duplicateNextNoteCommand
} from "./lib/commands";

export default class PreviousRiverPlugin extends Plugin {
  onload() {
    this.addCommand({
      id: "go-to-previous-note",
      name: "Go to previous note",
      callback: () => goToPreviousNoteCommand(this.app),
    });

    this.addCommand({
      id: "go-to-next-note",
      name: "Go to next note",
      callback: () => goToNextNoteCommand(this.app),
    });

    this.addCommand({
      id: "go-to-first-note",
      name: "Go to first note",
      callback: () => goToFirstNoteCommand(this.app),
    });

    this.addCommand({
      id: "go-to-last-note",
      name: "Go to last note",
      callback: () => goToLastNoteCommand(this.app),
    });

    this.addCommand({
      id: "detach-note",
      name: "Detach note",
      callback: () => detachNoteCommand(this.app),
    });

    this.addCommand({
      id: "insert-note-to-last",
      name: "Insert note to last",
      callback: () => insertNoteToLastCommand(this.app),
    });

    this.addCommand({
      id: "insert-note",
      name: "Insert note",
      callback: () => insertNoteCommand(this.app),
    });

    this.addCommand({
      id: "insert-note-to-first",
      name: "Insert note to first",
      callback: () => insertNoteToFirstCommand(this.app),
    });

    this.addCommand({
      id: "copy-next-notes-list",
      name: "Copy next notes list",
      callback: () => copyNextNotesListCommand(this.app),
    });

    this.addCommand({
      id: "export-next-notes-to-canvas",
      name: "Export next notes to canvas",
      callback: () => exportNextNotesToCanvasCommand(this.app),
    });

    this.addCommand({
      id: "export-all-rivers-to-canvas",
      name: "Export all rivers to canvas",
      callback: () => exportAllRiversToCanvasCommand(this.app),
    });

    this.addCommand({
      id: "export-filtered-rivers-to-canvas",
      name: "Export filtered rivers to canvas",
      callback: () => exportFilteredRiversToCanvasCommand(this.app),
    });

    this.addCommand({
      id: "set-root",
      name: "Set ROOT to previous property",
      callback: () => setRootCommand(this.app),
    });

    this.addCommand({
      id: "duplicate-next-note",
      name: "Duplicate next note",
      callback: () => duplicateNextNoteCommand(this.app),
    });

    this.app.workspace.onLayoutReady(() => {
      let timeoutId: number | null = null;
      
      const observer = new MutationObserver(() => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
        
        timeoutId = window.setTimeout(() => {
          const propertiesContainers = document.querySelectorAll('.metadata-properties');
          propertiesContainers.forEach((container) => {
            const properties = container.querySelectorAll('.metadata-property');
            properties.forEach((property) => {
              const keyInput = property.querySelector('.metadata-property-key-input') as HTMLInputElement | null;
              const keyTextEl = property.querySelector('.metadata-property-key');
              
              let keyText = "";
              if (keyInput && keyInput.value) {
                keyText = keyInput.value;
              } else if (keyTextEl && keyTextEl.textContent) {
                keyText = keyTextEl.textContent;
              }

              if (keyText.toLowerCase() === 'previous') {
                if (property.querySelector('.previous-river-go-next-button')) return;

                const button = property.createEl('button', {
                  text: 'Go next notes',
                  cls: 'previous-river-go-next-button',
                });

                // Set absolute positioning to place it on the right side without affecting height
                (property as HTMLElement).style.position = 'relative';
                
                button.style.position = 'absolute';
                button.style.right = '4px';
                button.style.top = '50%';
                button.style.transform = 'translateY(-50%)';
                button.style.height = '24px';
                button.style.padding = '0 12px';
                button.style.zIndex = '10';

                button.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToNextNoteCommand(this.app);
                });

                // Simply append to the property container
                property.appendChild(button);
              }
            });
          });
        }, 100); // debounce slightly to avoid performance hit
      });

      observer.observe(document.body, { childList: true, subtree: true });
      this.register(() => observer.disconnect());
    });
  }
}
