import { App, TFile } from "obsidian";
import { NextNoteSuggestModal } from "./NextNoteSuggestModal";
import { getActiveFile, getPreviousNote, getNextNotes, detachNote, setPreviousProperty, findLastNote } from "./obsidian";

export async function goToPreviousNoteCommand(app: App) {
    const file = getActiveFile(app);
    if (!file) {
        return;
    }

    const target = getPreviousNote(app, file);
    if (!target) {
        return;
    }

    await app.workspace.getLeaf().openFile(target);
}

export async function goToNextNoteCommand(app: App) {
    const file = getActiveFile(app);
    if (!file) {
        return;
    }

    const nextNotes = getNextNotes(app, file);

    if (nextNotes.length === 0) {
        return;
    }

    if (nextNotes.length === 1) {
        // If only one candidate exists, open it directly.
        await app.workspace.getLeaf().openFile(nextNotes[0]);
    } else {
        // If multiple candidates exist, open a suggestion modal.
        new NextNoteSuggestModal(app, nextNotes, (selectedFile) => {
            void app.workspace.getLeaf().openFile(selectedFile);
        }).open();
    }
}

export async function goToFirstNoteCommand(app: App) {
    const file = getActiveFile(app);
    if (!file) {
        return;
    }

    const startNote = file;
    let firstNote = file;
    while (true) {
        const previousNote = getPreviousNote(app, firstNote);
        if (!previousNote || previousNote === startNote) {
            break;
        }
        firstNote = previousNote;
    }

    if (firstNote !== file) {
        await app.workspace.getLeaf().openFile(firstNote);
    }
}

export async function goToLastNoteCommand(app: App) {
    const file = getActiveFile(app);
    if (!file) {
        return;
    }

    const lastNote = await findLastNote(app, file);
    if (lastNote && lastNote !== file) {
        await app.workspace.getLeaf().openFile(lastNote);
    }
}

export async function detachNoteCommand(app: App) {
    const file = getActiveFile(app);
    if (!file) {
        return;
    }

    // TODO: Add confirm dialog
    await detachNote(app, file);
}

export async function insertNoteToLastCommand(app: App) {
    const file = getActiveFile(app);
    if (!file) {
        return;
    }

    // detach note
    await detachNote(app, file);

    const selectedNote = await new Promise<TFile | null>((resolve) => {
        new NextNoteSuggestModal(app, app.vault.getMarkdownFiles(), resolve).open();
    });

    if (!selectedNote) {
        return;
    }

    const lastNote = await findLastNote(app, selectedNote);
    if (!lastNote) {
        return;
    }

    await setPreviousProperty(app, file, lastNote.basename);
}
