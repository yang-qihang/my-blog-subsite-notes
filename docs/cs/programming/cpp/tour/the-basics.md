## 1.6 Constants

### About `constexpr`

The standards require that a `constexpr` function must have at least one set of arguments for which it yields a constant expression.

`std::cout` operations are not `constexpr` and never will be (they require runtime hardware interaction). **I/O operations** are inherently runtime side effects - they interact with the console, which doesn't exist during compilation.

There, a `constexpr` function that **always** performs I/O cannot exist (Unconditional I/O). If the I/O is conditional, then the function can be used for constant expressions as long as the constant-evaluated path avoids the I/O.

