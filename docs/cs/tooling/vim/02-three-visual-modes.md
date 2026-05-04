[← Back to Vim Directory](./index.md){ .md-button }

# Vim's Three Visual Modes

## Three Modes

- **Visual mode (`v`)**: Selects text chracter by character (line-wise).

    **Characterwise**: Paste goes **into the current line**, like inserting words.

- **Visual Line mode (`V`)**: Selects entire lines.

    **Linewise**: Paste goes **as full new lines**, between existing lines.

- **Visual Block mode (`<C-v>`)**: Selects text in a **rectangular block**, regardless of line breaks.

    **Blockwise**: Paste goes into a **rectangle column**.

!!! note
    Linewise / characterwise / blockwise only changes how the text behaves when you **PASTE**.

## Two Commands in Visual Block Mode

- **`I`(Uppercase i)**: Insets text at the beginning of the block (the left edge) on every selected line.

- **`A`(Uppercase a)**: Insets text at the end of the block (the right edge) on every selected line.

## When to Use Visual Line Mode

Line mode exists to **guarantee safe line-based operations**:

- indenting

- moving code blocks

- yanking whole functions

- pasting without breaking lines
