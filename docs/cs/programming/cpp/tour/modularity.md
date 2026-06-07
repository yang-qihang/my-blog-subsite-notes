# Modularity

## 3.2.2 Modules

### Understanding the Global Module Fragment (GMF)

When transitioning to C++20/23 modules, handling legacy header files requires a specific architecture to prevent compilation errors and linkage issues. **The Global Module Fragment (GMF)** is the standard mechanism for safely importing traditional `#include` directives.

#### 1. The Core Problem: Macros and Linkage Pollution
Historically, `#include` acts as a literal copy-paste command. When used inside a modern C++ module, this causes two catastrophic issues:
* **Macro Leakage:** Preprocessor macros from the included header leak into your module, breaking the isolated compilation boundary.
* **The "Pollution" Paradox (ODR Violation):** If you `#include <vector>` directly inside a module purview, the compiler attaches the entirety of `std::vector` to your specific module's namespace/linkage (e.g., `MyModule::std::vector`). If another module does the same, the compiler sees two incompatible versions of `std::vector`, fundamentally breaking the **One Definition Rule (ODR)**.

#### 2. The Solution: The GMF Quarantine Zone
The GMF tells the compiler to parse traditional headers but **keep their symbols in the global namespace**, preventing them from attaching to your module or exporting their macros to consumers.

**The Golden Rules:**
1. The `module;` keyword must be the absolute **first non-comment line** in the file.

2. Only preprocessor directives (`#include`, `#define`, etc.) are allowed inside the GMF.
3. Everything in the GMF is completely invisible to anyone who imports your module.

#### 3. Architecture Examples

##### In a Module Interface Unit (`.cppm`)
Use the GMF to include headers, then begin the exported purview.

```cpp
// 1. Open the GMF
module;

// 2. The Quarantine Zone
#include <iostream>
#include <vector>

// 3. Close GMF and begin the actual exported module
export module core_module;

// 4. Module Purview
export void do_something() {
    std::cout << "GMF keeps this safe.\n";
}
```

##### In a Module Implementation Unit (`.cpp`)
If separating interface and implementation, the implementation unit also uses the GMF for its own internal dependencies. Note the absence of the `export` keyword.

```cpp
// 1. Open the GMF
module;

// 2. Implementation-specific headers
#include <sys/socket.h>

// 3. Close GMF and implicitly import the interface
module core_module;

// 4. Implementation logic
void internal_function() {
    // Logic using socket headers
}
```

#### 4. Handling Other Preprocessor Directives
* **Inside the GMF:** Use `#define` or configuration macros here if they are required to modify how a legacy header compiles (e.g., setting a flag before including a C library).
* **Inside the Module Purview:** You can use `#define` after the `export module` declaration. However, C++20 strictly forbids exporting macros. Any macro defined in the purview will exist only for that specific source file and will not be accessible to consumers of the module.