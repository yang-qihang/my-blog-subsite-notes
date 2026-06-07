# Error Handling

## C++ Exception Handling and RAII

### 1. The Core Purpose of Exceptions
* **The Problem:** Library creators (like the author of `Vector`) can detect errors (e.g., out-of-bounds access) but don't know how the application should handle them. Library users know how to handle errors but shouldn't have to manually check every operation.
* **The Solution:** The library detects the error and "throws" an exception, pausing execution and handing the decision-making power to the user's `try-catch` block.
* **Invariants:** Exceptions are used to enforce a class's invariant (its guaranteed valid internal state) or preconditions by refusing to act if rules are broken.

### 2. Stack Unwinding
* **Definition:** When an exception is thrown, the C++ runtime travels backward through the call stack to find a matching `catch` handler.
* **Destruction:** As it tears down each stack frame ("plate"), it systematically calls the destructors for all local objects.
* **The Danger of Raw Pointers:** If you allocate memory with `new` and an exception occurs before `delete` is called, the raw pointer is destroyed during unwinding, but the heap memory is not. This causes a memory leak.

### 3. The RAII Solution (Smart Pointers)
* **Resource Acquisition Is Initialization (RAII):** The principle of wrapping raw resources (memory, file handles, sockets) inside a class. 
* **How it Works:** The constructor acquires the resource, and the destructor releases it. 
* **Smart Pointers:** Classes like `std::unique_ptr` act exactly like pointers but automatically call `delete` in their destructor. Because they are local stack objects, stack unwinding guarantees their destructors fire, making memory leaks during exceptions impossible.

### 4. Exception Memory Mechanics: Throwing vs. Catching
* **The Throw Site (Copy Elision):** Exceptions do not live on the standard call stack (since it gets destroyed). They are constructed in a safe, opaque area managed by the runtime called the **Exception Buffer**. Modern C++ mandates copy elision here: `throw std::out_of_range("...")` constructs the object directly in the buffer with zero copies.
* **The Catch Site (Always Catch by Reference):** You should catch exceptions by reference (e.g., `catch (const std::exception& e)`) for two critical reasons:
    1.  **Avoid Object Slicing:** Catching by value slices off derived-class data, breaking polymorphism (e.g., `e.what()` might print the wrong message).
    2.  **Prevent Fatal Double-Faults:** Catching by value requires copying the exception. If that copy fails (e.g., an out-of-memory `std::bad_alloc`), C++ instantly calls `std::terminate()` and aborts the program.

### 5. Why Exception Materialization Can't Be Deferred
The compiler cannot wait to build the exception directly in the `catch` block's local variables because:
* **Compile-Time vs. Run-Time:** The compiler doesn't statically know where the `catch` block is (it might be in a different dynamic library).
* **The Unwinder Needs It:** The system unwinder needs the physical object in the buffer to check its Run-Time Type Information (RTTI) as it searches up the stack for a matching handler.
* **Rethrowing (`throw;`):** An exception must live independently of any specific `catch` block's scope so it can be rethrown without being destroyed.

### 6. Translating "Standard-Speak"
* **"The Implementation":** Refers to the physical software stack that makes the C++ Standard a reality—your specific compiler (GCC, Clang), runtime library (`libstdc++`), and Operating System.
* **"Context of the Caller":** Refers to Execution Context. The runtime must manually overwrite the CPU's hardware registers (Instruction Pointer, Stack Pointer) to time-travel the hardware state back to the exact environment of the calling function.

### 7. RAII's Impact on Code Structure
* **Reducing Try-Blocks:** Without RAII, you must write `try-catch` blocks everywhere just to manually clean up resources before rethrowing the error. 
* **Clean Propagation:** By relying on RAII's implicit cleanup during stack unwinding, you can eliminate intermediate try-blocks. Exceptions can cleanly propagate up through dozens of functions, leaving your code simple, systematic, and readable.

### 8. The `noexcept` Paradox and Move Constructors
* **The Rule:** A general-purpose library shouldn't use `noexcept` just to force a termination on standard errors.
* **The Exception (Move Semantics):** `std::vector` provides the **Strong Exception Guarantee** (if reallocation fails, the vector remains untouched). If it uses a custom move constructor to transfer elements, and that move fails halfway through, the original vector is permanently corrupted.
* **The Contract:** To protect against this, `std::vector` will only use your move constructor if you mark it `noexcept`. You aren't asking the program to terminate; you are providing a mathematical guarantee to the compiler that your move logic (which should just be swapping pointers) physically cannot fail.

## On Section `4.5`

### Template Argument Deduction

Here in the code the author doesn't pass the `Error_action` type variable to the function `expect` because it has a default value which the compiler falls back to if you don't specify it manually.

You can pass the argument inside angle brackets, after the function name and right before the standard parentheses.

```C++
// Explicitly overriding the default to force termination for this specific check
expect<Error_action::terminating>([i,this] { return 0<=i && i<size(); }, Error_code::range_error);
```

### About the word `class`

The `class C` part is called a **template type parameter**.

The word `class` simply means **"any data type."** In fact, C++ has another keyword, `typename` which has the same semantics. It's actually preferred by many developers now because `class` is misleading as it suggests "object-oriented".

### About the merit of lambda function here

If Stroustrup passed a simple boolean to the function like this:
```C++
expect( 0 <= i && i < size(), Error_code::range_error );
```
The program would be forced to calculate the math (0 <= i && i < size()) before passing the true/false result into expect. You would pay a performance cost!

By wrapping the math inside a lambda `[i,this] { return 0<=i && i<size(); }`, he is **passing instructions on how to do the math**, rather than **the result of the math**. If the action is ignore, the compiler simply throws the instructions away, and the math is never calculated at all.

This concept of passing a function so it can be evaluated later (or not at all) is called **"lazy evaluation."**