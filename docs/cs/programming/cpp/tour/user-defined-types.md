# User-Defined Types

This note corresponds to the **second** chapter of *A Tour of C++(The 3rd Edition)*. It includes some supplementary notes to some content in the book.

## Related to access of functions

### Per Class rather than Per Object

In C++, **access control is per class, not per object**. That means a member function of a class can access the private members of any object of that same class, not just the implicit `this` object.

In other words, the member functions grant full access to both operands' private data.

```C++
class Vector2D {
private:
    double x, y;
public:
    Vector2D(double x, double y) : x(x), y(y) {}

    // Overload + as a member function
    Vector2D operator+(const Vector2D& other) const {
        // Can directly access other.x and other.y
        return Vector2D(x + other.x, y + other.y);
    }
};
```

### Overloading the two operators `<<` and `>>` for a custom class

To overload the `<<` / `>>` operator for a custom class, you cannot make it a member function of your class because the left operand is an `std::ostream&`/`std::istream` (or a similar stream type), not an object of your class. Instead, you overload it as **a standalone (non‑member) function**, typically declared as a `friend` inside your class so it can access private data members.

```C++
#include <iostream>

class Point {
private:
    int x, y;
public:
    Point(int x, int y) : x(x), y(y) {}

    // Declare the friend function inside the class
    friend std::ostream& operator<<(std::ostream& os, const Point& p);
};

// Define the standalone function
std::ostream& operator<<(std::ostream& os, const Point& p) {
    os << "Point(" << p.x << ", " << p.y << ")";
    return os; // return the stream to enable chaining
}

int main() {
    Point p(3, 4);
    std::cout << p << std::endl; // prints: Point(3, 4)
    return 0;
}
```

Key points:

- Left operand: `std::ostream&` (e.g., `std::cout`).

- Right operand: `const YourClass&`.

- Return type: `std::ostream&` to allow **chaining** (e.g., `cout << a << b`).

- `friend` is used so the function can access private members; without it, you would need **public getters**.

- The function is not a member of your class, so it’s defined outside the class body.

- If your class already provides **public getters** (e.g., `getX()`, `getY()`), you could **avoid friend**, but direct access via friend is cleaner for overloading `<<`.

    ```C++
    class Point {
    private:
        int x, y;
    public:
        Point(int x, int y) : x(x), y(y) {}
        int getX() const { return x; }
        int getY() const { return y; }
    };

    std::ostream& operator<<(std::ostream& os, const Point& p) {
        os << "Point(" << p.getX() << ", " << p.getY() << ")";
        return os;
    }
    ```

## Prefix vs Postfix Increment (Decrement) Operators

You typically need to implement the prefix and postfix increment operators separately in C++. **They are distinct operators with different signatures and intended semantics**.

### Prefix increment (`++obj`) – overloaded as `T& operator++()`

Increments the object and **returns a reference to itself** (the incremented object).
It usually modifies the current object and returns it by reference for efficiency.

### Postfix increment (`obj++`) – overloaded as `T operator++(int)`

**Takes a dummy int parameter to distinguish it from the prefix version.**

It should save a copy of the original state, increment the current object, then **return the copy (by value)**.

The dummy int is never used; it's only a **syntactic marker**.

Because their behavior and return types differ, you must provide separate implementations if you want both to work naturally. You can omit one if you only need the other, but most classes that support increment provide both.

Example
```cpp

class Counter {
public:
    int value = 0;

    // Prefix ++counter
    Counter& operator++() {
        ++value;
        return *this;
    }

    // Postfix counter++
    Counter operator++(int) {
        Counter old = *this;   // save original
        ++(*this);             // reuse prefix
        return old;            // return unmodified copy
    }
};
```

Key points

- The postfix version returns **a copy (value)**, not a reference, because the returned object represents the state before increment.

- The prefix version returns a reference to the incremented object.

- The dummy int parameter for postfix is never used – it’s just a convention to resolve the overload.

- To avoid code duplication, the postfix often calls the prefix version (as shown above).