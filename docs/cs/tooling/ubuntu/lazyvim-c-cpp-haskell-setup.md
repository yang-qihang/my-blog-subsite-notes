## LazyVim setup for C, C++, and Haskell

This setup keeps each tool under one clear owner:

```text
APT      -> compilers, build tools, native libraries, Python support
GHCup    -> GHC, Cabal, optional Stack
Mason    -> language servers and editor-oriented tools
LazyVim  -> Neovim plugins and integration
Cabal    -> Haskell projects and optionally command-line Haskell tools
```

### 1. Install all Ubuntu packages

```bash
sudo apt update
sudo apt install \
  build-essential \
  clang \
  clang-format \
  cmake \
  ninja-build \
  gdb \
  curl \
  git \
  unzip \
  libffi-dev \
  libgmp-dev \
  libncurses-dev \
  libicu-dev \
  zlib1g-dev \
  pkg-config \
  python3-venv \
  python3-pip
```

Primary packages:

- `build-essential`: GCC, G++, Make, and basic C/C++ development files.
- `clang`: an alternative C/C++ compiler toolchain.
- `clang-format`: C/C++ source formatter used by LazyVim/Conform.
- `cmake`: project configuration and build-file generator.
- `ninja-build`: fast build backend commonly used with CMake.
- `gdb`: C/C++ debugger.
- `curl`, `git`, `unzip`: installers, source repositories, and downloaded archives.
- `libffi-dev`, `libgmp-dev`, `libncurses-dev`, `libicu-dev`, `zlib1g-dev`: native libraries required by GHC and many Haskell packages.
- `pkg-config`: helps build systems locate installed native libraries.
- `python3-venv`, `python3-pip`: required by Python-based Mason packages such as `cmakelang` and `cmakelint`.

### 2. Verify Neovim

Current `haskell-tools.nvim` requires Neovim 0.12 or newer:

```bash
nvim --version
```

### 3. Configure C and C++ in LazyVim

Open:

```vim
:LazyExtras
```

Enable:

```text
lang.clangd
lang.cmake
```

Keep the existing completion extra:

```text
coding.blink
```

Do not also enable `coding.nvim-cmp` unless deliberately replacing Blink.

Open Mason:

```vim
:Mason
```

Confirm or install:

```text
clangd
neocmakelsp
```

`lang.clangd` provides C/C++ LSP integration. `lang.cmake` provides CMake syntax, LSP, and CMake tooling. The actual compiler and CMake executable still come from APT.

Verify:

```bash
gcc --version
g++ --version
cmake --version
clang-format --version
```

With a `.c` or `.cpp` file open:

```vim
:LspInfo
:ConformInfo
```

### 4. Install the Haskell toolchain with GHCup

Run as the normal user, not with `sudo`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | sh
```

Recommended installer choices:

```text
Base channel:          GHCup maintained
Prereleases:           No
Cross channel:         No
Third-party channel:   No initially
Add GHCup to .zshrc:   Yes, prepend
Install HLS:           No, because Mason will provide it
Stack integration:     Optional
```

Reload the shell environment:

```bash
source ~/.ghcup/env
```

Verify:

```bash
ghcup --version
ghc --version
cabal --version
```

If needed:

```bash
ghcup install ghc recommended
ghcup set ghc recommended
ghcup install cabal recommended
```

Do not also install Ubuntu's `ghc` or `cabal-install` packages when GHCup is managing them.

### 5. Configure Haskell in LazyVim

Open:

```vim
:LazyExtras
```

Enable:

```text
lang.haskell
```

Restart Neovim, then install HLS through Mason:

```vim
:MasonInstall haskell-language-server
```

In this setup:

```text
Mason                -> installs the HLS executable
haskell-tools.nvim   -> starts and manages the HLS client
```

### 6. Install Fourmolu: choose one owner

The Haskell extra configures Conform to run `fourmolu`, but the executable must be installed separately. Both methods below work; choose only one.

#### Option A — Mason (recommended for a new LazyVim-focused setup)

```vim
:MasonInstall fourmolu
```

Advantages:

- quickest installation because Mason downloads a prepared release;
- automatically available inside Neovim;
- no `~/.cabal/bin` shell configuration;
- formatter updates stay with other editor tools in Mason.

Use this when Fourmolu is mainly needed by LazyVim.

Verify inside Neovim:

```vim
:ConformInfo
:lua print(vim.fn.exepath("fourmolu"))
```

#### Option B — Cabal (good when also using Fourmolu from the terminal)

```bash
cabal install fourmolu
```

Ensure Cabal executables are in `PATH`:

```bash
echo 'export PATH="$HOME/.cabal/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Advantages:

- available to Neovim, terminal commands, scripts, and CI through normal `PATH`;
- managed with the rest of the Haskell toolchain;
- convenient for running `fourmolu` independently of Neovim.

Disadvantages:

- Cabal may compile Fourmolu and many dependencies locally;
- `~/.cabal/bin` must be present in the environment inherited by Neovim.

Verify:

```bash
command -v fourmolu
fourmolu --version
```

For this existing machine, the Cabal-installed copy already works, so keep it; no purge or Mason reinstall is necessary. Avoid keeping both copies unless deliberately testing versions. Mason's `bin` directory normally has priority inside Neovim, so two installations can make Neovim and the shell use different Fourmolu versions.

HLint is optional. Install it through Mason when wanted:

```vim
:MasonInstall hlint
```

### 7. Fix the duplicate HLS client

The Mason-installed HLS was being started twice:

```text
haskell-tools.nvim -> correct client
hls                -> unwanted generic client
```

Keep HLS installed in Mason, but prevent LazyVim's generic LSP path from starting it.

Create:

```text
~/.config/nvim/lua/plugins/haskell.lua
```

Contents:

```lua
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        -- HLS remains installed through Mason.
        -- haskell-tools.nvim is the only component that should start it.
        hls = {
          enabled = false,
        },
      },
    },
  },
}
```

Completely restart Neovim:

```vim
:qa!
```

Verify that only one Haskell client is attached:

```vim
:lua for _,c in ipairs(vim.lsp.get_clients({bufnr=0})) do print(c.id,c.name) end
```

Expected:

```text
1 haskell-tools.nvim
```

The numeric ID may differ. There must be no separate client named `hls`.

### 8. Brief HLS startup race

When opening a brand-new `.hs` file and typing immediately, HLS may briefly emit:

```text
importLens: Rule Failed: ImportActions
```

This is separate from the duplicate-client problem. The duplicate fix should remain in place.

Because the remaining error occurs only during the first moment of HLS initialization, the practical workaround is to wait briefly before typing. Keep `importLens` enabled unless the error also occurs after HLS has fully initialized.

The gray `module Main where` line is virtual text/code-lens output from HLS; it is not inserted into the file.

### 9. Test Haskell

Create `Main.hs`:

```haskell
double :: Integer -> Integer
double x = x * 2

factorial :: Integer -> Integer
factorial 0 = 1
factorial n = n * factorial (n - 1)

main :: IO ()
main = do
  let number = 5 :: Integer
  putStrLn ("Double: " ++ show (double number))
  putStrLn ("Factorial: " ++ show (factorial number))
```

Run:

```bash
runghc Main.hs
```

With the file open in LazyVim:

```vim
:LspInfo
:ConformInfo
```

Format with:

```text
<leader>cf
```

Fourmolu only formats syntactically valid Haskell. If it reports a parser error, fix the syntax or indentation first.

### 10. Recommended final ownership

```text
APT
├── GCC/G++, Clang, CMake, Ninja, GDB
├── clang-format
├── native Haskell build libraries
└── Python venv/Pip support for Mason packages

GHCup
├── GHC
├── Cabal
└── optional Stack

Cabal
├── Haskell project dependencies
└── Fourmolu only when choosing the command-line installation route

Mason
├── clangd
├── neocmakelsp
├── haskell-language-server
├── Fourmolu when choosing the LazyVim-focused installation route
└── optional HLint

LazyVim
├── lang.clangd
├── lang.cmake
├── lang.haskell
└── coding.blink
```
