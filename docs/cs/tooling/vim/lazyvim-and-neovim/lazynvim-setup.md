[← Back to Vim Directory](../index.md){ .md-button }

## Basic Configuration for writing Haskell code with LazyVim 

1. Setup the haskell platform following instruction on the Official website.

2. Install the language plugin for Haskell in lazyExtra.

3. Resolve the conflict of two linting tools.
   
     1. You might try to install `hlint` in Mason, because of the error `ENOENT` (which comes from the `nvim-lint` panic, and means "Error NO ENTry").
      
        **However, you shouldn't do that!**

        Because the standalone `hlint` is not designed to read half-finished code. It crashes, giving you that annoying exit code error.
    
      2. Instead, add the following configuration file to tell LazyVim stop looking for `hlint`.

        (This file should be placed in this path: `~/.config/nvim/lua/plugins/init.lua`)

        ```lua
        return {
          {
            "mfussenegger/nvim-lint",
            opts = {
              linters_by_ft = {
                haskell = {}, -- This empty bracket tells it to stop looking for hlint!
              },
            },
          },
        }
        ```

# Gio Trash Permission Errors When Deleting Files on an NTFS-formatted Drive

To resolve the gio trash permission errors when deleting files on an NTFS-formatted drive (common with shared Windows partitions), follow these steps:

  1. Create a plugin override file:

    ```bash
    nvim ~/.config/nvim/lua/plugins/snacks.lua
    ```

   3. Disable the trash feature in Snacks:

    Add the following configuration to force permanent deletion instead of using the system trash:

    ```lua
    return {
      "folke/snacks.nvim",
      opts = {
        explorer = {
          -- Disabling trash bypasses the 'gio' error on NTFS mounts 
          -- where the .Trash-1000 directory cannot be created or accessed.
          trash = false,
        },
      },
    }
    ```