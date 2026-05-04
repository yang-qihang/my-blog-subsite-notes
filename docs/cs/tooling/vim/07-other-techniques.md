[← Back to Vim Directory](./index.md){ .md-button }

# Some tricks in Vim

## Using Vim jump markers

1. **Set the markers**: You can set a marker by `m` + a letter, e.g., `mj`)

2. **Clear all marks**:
   
     In normal mode, type:
     ```
     :delmarks a-zA-Z
     ```

3. **Clear just the `j` mark**:

     If you only want to remove the `j` mark, type:
     ```
     :delmarks j
     ```

4. **Jump to a mark you've set**:
   
     You can use either `'j` or `` `j`` to jump to a specified mark.

## Getting a split with copy of the text in a new buffer 

The reason why this is a bit unusual is that:

1. `:vs` does *not* duplicate the current file or the current buffer. It simply creates a **second Window** (a viewport) that looks at the exact same **Buffer** (the text loaded in memory).

2. `:saveas main_copy.cpp`: This does two things. First, it writes the current buffer to disk as `main_copy.cpp`. Second, it **renames** the **buffer itself** to `main_copy.cpp`.

### Method 1: Read Alternate File

1. Type `:vnew` (for horizontal split, use `new`)

     This opens a vertical(horizontal) split with a brand new, empty, unnamed buffer. Because you just left your original file, Neovim quietly stores your original file as the **"alternate file"**.

2. Type `:0r #`

      `:r` means "read". `#` is the shorthand for the **alternate file**. The `0` tells Neovim to paste the text starting at line 0 (the very top).

### Method 2: The "%" Register Trick (If you want to save the cooy immediately)

If you want to immediately create the physical copy on your hard drive (like `main_copy.cpp`) and open it in a split, you can use the `%` shorthand, which represents the current file's name.

1. Type `:w %:r_copy.%:e`

     `:w` writes the text to **a new file**, but unlike `:saveas`, it **keeps** your current buffer attached to the original file.

     `%` is your current file (e.g., `main.cpp`).

     `:r` strips the extension (leaving `main`).

     `_copy` adds your custom text (leaving `main_copy`).

     `.%:e` grabs just the original extension (adding `.cpp`).

2. Type `:vs %:r_copy.%:e`

     This opens a vertical split for that newly created file.