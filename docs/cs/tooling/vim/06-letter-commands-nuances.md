[← Back to Vim Directory](./index.md){ .md-button }

# 1. Uppercase letter = changes the lowercase meaning

## Movement / Insert

- `i` → insert before cursor

    `I` → insert at start of line

- `a` → append after cursor

    `A` → apppend at end of line

- `o` → open line below

    `O` → open line above

## Change / Delete / Yank
- c → change (needs motion)

    C → change **from cursor to end of line**

- d → delete (needs motion)

    D → delete **from cursor to end of line**

- y → yank (needs motion)

    Y → yank **from cursor to end of line**

- s → substitute one character

    S → substitute entire line

# 2. Double lowercase = "do it to the whole line"

Pattern: `xx` = act on **full current line**

- `yy` yank **whole line**

- `dd` delete **whole line**

- `cc` change **whole line**

- `>>` indent line 

- `<<` unindent line 

**NOTE**:

1. About `>` / `<`:

     1. In normal nmode:

          `>` / `<` **always indent the whole line**.
      
     2. In visual block mode (`<C-v>`)

          `>` / `<` shift the text **to the RIGHT of the block**.