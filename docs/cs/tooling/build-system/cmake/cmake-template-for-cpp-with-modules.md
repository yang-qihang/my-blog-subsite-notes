# Modern C++23 Modules with CMake and Neovim (Clangd)

This document outlines the complete, working architecture for developing with C++23 modules using CMake and a Neovim (LazyVim) LSP environment. 

Because the binary formats for C++ modules (`.pcm` / `.gcm`) are not yet standardized across compilers, **the compiler generating the modules and the language server parsing them must be the exact same major version.** Mixing GCC for compilation and Clang for tooling will result in broken LSP diagnostics.

## 1. Prerequisites (Ubuntu/Debian)

You must use CMake 3.28+ (for native module support) and ensure both the Clang compiler and the auxiliary Clang tools (which include `clang-scan-deps` and `clangd`) are installed and matching.

```bash
# Install the complete Clang 18 toolchain
sudo apt update
sudo apt install clang-18 clang-tools-18 ninja-build
```

## 2. Neovim (LazyVim) LSP Configuration

Your LSP must be pinned to the exact version of the compiler you are using. Furthermore, modern versions of `clangd` no longer require (and will actively crash if provided) the `--experimental-modules-support` flag.

Update your LazyVim LSP config (e.g., `lua/plugins/lsp.lua`):

```lua
return {
  "neovim/nvim-lspconfig",
  opts = {
    servers = {
      clangd = {
        cmd = {
          "clangd-18", -- Must match the compiler version exactly
          "--background-index",
          "--clang-tidy",
          -- DO NOT include --experimental-modules-support in Clang 18+
        },
      },
    },
  },
}
```

## 3. Project Structure & Boilerplate

Do not use `file(GLOB ...)` to dynamically find source files. Explicitly declaring your files ensures CMake properly regenerates the dependency graph when files are added or modified.

### `CMakeLists.txt`
```cmake
cmake_minimum_required(VERSION 3.28)

project(ModernCppProject LANGUAGES CXX)

# Enforce strict C++23 compliance
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Generate compile_commands.json for clangd
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Define the primary executable and standard source files
add_executable(app main.cpp)

# Declare module interface files explicitly for dynamic dependency scanning
target_sources(app
    PUBLIC
    FILE_SET CXX_MODULES FILES
        core_module.cppm
)
```

### `core_module.cppm` (The Module Interface)
```cpp
export module core_module;

export int calculate_sum(int a, int b) {
    return a + b;
}
```

### `main.cpp` (The Consumer)
```cpp
#include <iostream>
import core_module;

int main() {
    int result = calculate_sum(5, 7);
    std::cout << "C++23 Module Linkage Successful: 5 + 7 = " << result << '\n';
    return 0;
}
```

## 4. Build Instructions

Always use the **Ninja** generator, as traditional Makefiles struggle with module dependency scanning. You must explicitly override the default system compiler (usually GCC) by passing `CXX=clang++-18`.

```bash
# 1. Clear any old build caches or incorrect LSP data
rm -rf build .cache/clangd

# 2. Configure the out-of-source build using Clang 18
CXX=clang++-18 cmake -B build -G Ninja

# 3. Compile the project
cmake --build build
```

Once the build is configured and `compile_commands.json` is generated inside the `build/` directory, open `main.cpp` in Neovim. `clangd-18` will start, read the JSON file, natively parse the generated `.pcm` module files, and provide full autocompletion and diagnostics.