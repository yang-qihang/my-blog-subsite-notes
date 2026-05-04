[← Back to Make Directory](./index.md){ .md-button }

# C/C++ Compilation Flags

## Common flags used in C/C++ Projects

### 1. `CPPFLAGS` (C PreProcessor Flags)

These flags apply to **both C and C++**.

1. **`-I<dir>` (Include Directory)**

     **Example**: `-I./include` or `-I/usr/local/include/mylib`

     **Meaning:** "Look in this folder for .h header files." This lets you write `#include "myheader.h"` instead of `#include "./include/myheader.h"`.

     `CPP` stands for **C Pre-Processor**, not C Plus Plus. Since both C and C++ use the same preprocessor, they both read these flags.

2. **`-D<macro>` (Define Macro)**

     **Example**: `-DDEBUG` or `-DVERSION="1.0"`

     **Meaning**: Defines a macro as if you wrote `#define DEBUG` at the top of every file. Often used to enable debug logging or set version numbers.

3. **`-MMD` / `-MP` (Dependency Generation)**

     **Meaning**: These are advanced but very common magic flags. They tell the preprocessor to figure out which header files your code depends on, so Make knows to rebuild your code if a header file changes.

     - **`-MMD`**: Generate Dependency `.d` Files

         The `.d` file lists:

         - The **object files** (`.o`)

         - All **local headers** (`.h`) it `#include`s

         - Ignores system headers (e.g. `<stdio.h>`) - that's the extra **M** in `-MMD`

         e.g. 

         ```make
         main.o: main.c utils.h config.h
         ```
   
     - **`-MP`: Add Empty Phony Rules (Safety Net)**

         What it does:

         - **Adds an empty rule for every header** in the `.d` file

         - Prevents `make` errors if a header is **deleted or renamed**

         e.g.

         ```make
         main.o: main.c utils.h config.h
         utils.h:
         config.h:
         ```

### 2. `CFLAGS` (C Compiler Flags)

These flags apply **only to C** files (`.c`).

1. **`-g` (Debug Information)**

     **Example**: `-g`

     **Meaning**: Adds debugging symbols to your binary. This is what allows tools like GDB or LLDB to show you variable names and line numbers when your program crashes.

2. **`-O<level>` (Optimization Level)**

     **Example**: `-O0` (None), `-O2` (Standard), `-O3` (Aggressive), `-Os` (Size)

     **Meaning**: Tells the compiler how hard to try to make your code fast. `-O0` is best for debugging (compiles fast, code runs exactly as written). `-O2` is the standard for release builds.

3. **`-Wall` / `-Wextra` (Warnings)**

     **Example**: `-Wall -Wextra -Werror`

     **Meaning**: "Enable All Warnings." This asks the compiler to complain about anything suspicious (like unused variables or bad format strings). It is highly recommended to always use at least `-Wall`.

4. **`-std=<standard>` (Language Standard)**

     **Example**: `-std=c99` or `-std=c11`

     **Meaning**: Specifies which version of the C language standard to use.

### 3. `CXXFLAGS` (C++ Compiler Flags)

These flags apply **only to C++** files (`.cpp`, `.cc`).

1. **`-std=<standard>` (C++ Standard)**

     **Example**: `-std=c++11`, `-std=c++14`, `-std=c++17`, `-std=c++20`

     **Meaning**: Essential for modern C++. If you use features like smart pointers or lambdas, you must tell the compiler which standard you are targeting.

2. **`-stdlib=<library>` (Standard Library Implementation)**

     **Example**: `-stdlib=libc++` (LLVM/Clang) or `-stdlib=libstdc++` (GNU)

     **Meaning**: Occasionally needed on systems (like macOS vs Linux) to switch between the LLVM standard library and the GNU standard library.

3. **(Inherited Flags)**

     **Note**: Most flags from `CFLAGS` (like `-g`, `-O2`, `-Wall`) also work perfectly in `CXXFLAGS`.

### 4. `LDFLAGS` (Linker Flags)

**NOTE**: 
LD = Link Editor, the official traditional name of the Unix/Linux linker program: `ld`.
The linker `ld`'s job: combine compiled object files + libraries into one executable.

These flags are used by the linker (usually invoked via the compiler, e.g., `gcc`) to set up **library paths** and linker options.

GCC does **not** perform linking internally. Instead:
It parses the flags, arguments, paths, and prepares all the options. Finally, it **spawns and invokes the real system linker** automatically for you.

And it's only when on Linux or on Windows (specifically using `MinGW`), `ld` is the name for the linker.

1. **`-L<dir>` (Library Directory)**

     **Example**: `-L./lib` or `-L/usr/local/lib`

     **Meaning**: "Look in this folder for binary library files (`.a` or `.so`)." This is the partner to `-I`. While `-I` finds the header text, `-L` finds the compiled binary code.

2. **`-pthread` (Threading Support)**

     **Meaning**: Tells the linker to link against the system threading library (POSIX threads) and sets the correct macros. Required if you use `std::thread` or `pthread`.

### 5. `LDLIBS` (Linker Libraries)

These are the **specific libraries** you want to link into your program.

**Critical Rule**: In explicit Make rules, `LDLIBS` must go **last** (after your object files), or the linker might fail to find symbols.

1. **`-l<name>` (Link Library)**

     **Example**: `-lm` (Math), `-lcurl` (Curl), `-lmyutils`

     **Meaning**: "Link against `lib<name>.a` or `lib<name>.so`."

     Note the naming convention: To link a file named `libmath.a`, you strip the `lib` prefix and the `.a` extension, leaving just `-lm`.

### Relationship between `LDFLAGS` AND `LDLIBS`:

- **`LDFLAGS`** provides linker paths + linker settings + flags

- **`LDLIBS`**: the actual libraries to link (system **or** external/custom)
