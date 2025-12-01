# Previous River

An Obsidian plugin that enables navigation between notes using the `previous` property in frontmatter or backlinks.

<img width="640" src="https://github.com/user-attachments/assets/db3d5466-affd-43de-aebe-b5d4757e08ac" />

## Features

### Go to previous Note
Jump to the note specified in the `previous` property of the current note's frontmatter.

### Go to next Note
Move to notes that backlink to the current note and have their `previous` property pointing to it.  
If multiple candidates exist, a suggestion modal will allow you to choose.

### Go to first Note
Follow the `previous` property chain to reach the first note in the sequence.

### Go to last Note
Use backlinks to find the last note in the sequence.  
If there are multiple candidates, a suggestion modal will appear for selection.

## Recommended Hotkeys

- **Go to previous Note**: `Alt+,`
- **Go to next Note**: `Alt+.`
- **Go to first Note**: `Alt+Shift+,`
- **Go to last Note**: `Alt+Shift+.`

## Contributing

Feel free to submit bug reports and feature requests via Issues. Contributions through pull requests are also highly appreciated!