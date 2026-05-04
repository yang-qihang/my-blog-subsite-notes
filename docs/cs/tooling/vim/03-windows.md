[← Back to Vim Directory](./index.md){ .md-button }

# Windows, Tabs, Buffers, etc.

## Some Notions

- A **buffer** is the in-memory text of a file.
  
    A buffer can be in **one of three states**:

    1. **active**: The buffer is displayed in a window.

    2. **hidden**: The buffer is not displayed.

    3. **inactive:** The buffer is not displayed and does not contain anything.

- A window is a viewport on a buffer.

- A tab page is a collection of windows.

## Commands and notes about buffers
- `:buffers` (or `:ls`) lists all the buffers

    If you want to see the **hidden ones**, you can use **`:ls!`** instead.

- Some navigation commands:

    ```bash
    :bnext  (or :bn)
    :bprev  (or :bp)
    :bfirst (or :bf)
    :blast  (or :bl)
    ```

- `:bufdo`: run an operation across all buffers

- `:bd! or :bd! N`: to **force-delete** a buffer

- choosing a buffer (the following are all legal)

    ```bash
    # N denotes the buffer name or buffer number
    bN
    Nb
    b N
    Nb
    buffer N
    ...
    ```

- You can use `|` to execute multiple commands at one go.
  
    - `:w | bd`: save and close the current buffer
    - `:wa | bd`: save changes to **all buffers** and close **only** the current buffer.
    - `:3b | w | bd`: Save a specifc buffer, then delete it (the window will also automatically close)

    **NOTE**: there is no such commands to "save changes to a buffer without jumping to it". You might think of `:w <buffer-name/number>`, but that actually means **something very different** and is in fact **rarely used**.

### Switch to a buffer in a new window:

```bash
:sbuffer <buffer-number/name> # Split the window and open the buffer
:sb <buffer-number/name>
:vertical sbuffer <buffer-number/name> # Split the window and open the buffer in vertical split
:vert sb <buffer-number/name>
```

## Distinction between commands for buffers and windows

### 1. Only Close the Window

```bash
<C-w>c
:close
```

### 2. Other cases

```bash
:bd # You can specify the buffer, but it's optional.
```
It will delete the buffer, and the window **(or multiple windows)** showing that buffer **will automatically close!**

```bash
:q
```
If this is the **last window**, it closes the window and deletes the buffer. Otherwise, it **only closes the window**.

## Vim split window keyboard shortcuts
For more information on Using Split Windows With Vim, please consult this page from Linux Handbook. [blog link](https://linuxhandbook.com/vim-split-windows/)

| Action | Keyboard Shortcut | Description |
| :--- | :--- | :--- |
| Horizontal split | :split or :sp | Splits window horizontally |
| Vertical split | :vsplit or :vs | Splits window vertically |
| Close current window | :q or :close | Closes the active window |
| Close all except current | :only or :on | Closes all windows except active one |
| Navigate between windows | Ctrl-w + h/j/k/l | Move to left/down/up/right window |
| Navigate between windows | Ctrl-w + Ctrl-w | Cycle through all windows |
| Resize horizontally | Ctrl-w + < or > | Decrease/increase width |
| Resize vertically | Ctrl-w + - or + | Decrease/increase height |
| Equal size windows | Ctrl-w + = | Make all windows equal size |
| Maximize height | Ctrl-w + _ | Maximize current window height |
| Maximize width | Ctrl-w + \| | Maximize current window width |
| Move window | Ctrl-w + r | Rotate windows |
| Swap with next window | Ctrl-w + x | Exchange with next window |

## Creating Split Windows
You can specify the filename, or Vim will show the current file in both windows.
```bash
:split filename (or :sp filename)
:vsplit filename (or :vs filename)
```

- Use `:set splitbelow` to open the new windows below the current one. 
(By default, the windows are opened above the current **window**.)

- Use `:set splitright` to open the new windows on the right. 
(By default, the windows are opened on the left of the current **window**.)

## Resizing split windows
For faster resizing, prefix commands with a number:

```bash
10 <C-w> + # Increase height by 10 lines
```
We can also create splits with specific dimensions by **adding a number before the command**.
```bash
:10split # create a horizontal split with 10 lines of height
:30vsplit # create a vertical split that's 30 characters wide
```

## Navigating Between Windows
- `<C-w>w`: Cycle forward through all windows
- `<C-w>W`: Cycle backword through all windows

## Moving and rearraging Windows

```bash
<C-w>r # Rotate windows downward/rightward
<C-w>R # Rotate windows upward/leftward
<C-w>x # Exchange current window with the next one
```

```bash
<C-w>H # Move current window to far left
<C-w>J # Move current window to very bottom
<C-w>K # Move current window to very top
<C-w>L # Move current window to far right
```

```bash
<C-w>c # Close the current window (safe alternative to :q)
```

## Few random but useful tips

### Add terminal in the mix

- `:sp | terminal` opens a horizontal split with a terminal
- `:vs | terminal` opens a vertical split with a terminal

### Start split with Vim
```bash
# Open two files in horizontal splits
vim -o file1 file2

# Open two files in vertical splits
vim -O file1 file2

# Open three files in horizontal splits
vim -o3 file1 file2 file3
# the number after O/o specifies the number of windows that Vim will open, 
# and it doesn't have to be the same as the number of files!
```

### File explorer in split windows

You can open Vim's built-in file explorer (**netrw**) in a split.

```bash
:Sexplorer # Open file explorer in horizontal split
:Vexplorer # Open file explorer in vertical split
```

### Close all the split windows and exit Vim
```bash
:qa
```


### Terminal Mode Basics
- When you open a terminal in Vim, you enter **Terminal-Job mode**. Then you press **`i`, `a`, etc.** to enter **Terminal-Insert mode** to type into the terminal. 

- To leave Terminal-Insert mode, press `<C-\><C-n>`
