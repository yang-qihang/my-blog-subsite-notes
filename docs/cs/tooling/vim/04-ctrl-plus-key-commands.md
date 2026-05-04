[← Back to Vim Directory](./index.md){ .md-button }

# `<C-key>` commands in Vim

- `<C-a>` **Increment** the number under cursor

- `<C-x>` **Decrement** the number under cursor

- `<C-r>` **Redo** (undo your undo)


## Vim's built-in completion

- `<C-n>` **Next match**

- `<C-p>` **Previous match**

- `<C-y>` **Yank** the currently selected completion item and insert it into the text.

- `<C-e>` **Exit** the completion menu without inserting anything.

## Vim's page navigation

- `<C-f>` Forward, scroll down **one full screen**

- `<C-b>` Backward, scroll up **one full screen**

- `<C-d>` Down, scroll down **half a screen**

- `<C-u>` Up, scroll up **half a screen**

## Typing Unicode arrows

1. Vim built-in: digraphs (easiest inside Vim)

     In **Insert mode**, type `<C-k>`, then arraw-like symblos.
     Then you will get real Unicode arrow.

     e.g. `<C-k>=>` = ⇒, `<C-k>->` = →

2. System-wide: Linux **compose key** (works everywhere: terminal, browser, etc.)

     1. First enable compose key (in Settings → Keyboard → Compose Key)

     2. Then:
        
          - `Compose` + `-` + `>` → `→`

          - `Compose` + `<` + `-` → `←`