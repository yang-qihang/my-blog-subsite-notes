[← Back to Make Directory](./index.md){ .md-button }

# Functions and Control Flow

## About Functions in Make

**Comma Parsing**: Make parses function arguments strictly using **commas**. If you want to pass a **literal comma** into a Make function, you need to _define a variable that holds nothing but a comma, and then reference the variable_.

**Function Expansion Timing**: Functions like `$(wildcard)` or `$(subst)` do NOT inherently execute immediately. They execute based entirely on their context:

- If `$(wildcard *.c)` is on the right-hand side of a `:=`, it expands immediately in **Phase 1**.

- If `$(wildcard *.c)` is inside a recipe block, it expands in **Phase 2**.

- If `$(wildcard *.c)` is on the right-hand side of a `=`, it expands whenever **that variable is eventually used**.

---

## Make Wildcards vs Shell Wildcards

There is a classic Catch-22 in Makefiles when dealing with files generated during the build process:

1. **Make's `$(wildcard)` is safe, but often evaluates too early.** Make's wildcard returns an empty string if nothing is found (safe). However, if you use it in a Phase 1 **simply expanded variable** assignment (e.g., `SRC := $(wildcard *.c)`), it evaluates *before* any recipes run. 
   
     If your Makefile generates `.c` files later in Phase 2, `$(wildcard)` will completely miss them.
   *(See the cached filesystem gotcha in Phase 1 notes regarding recursive wildcard usage).*
   
2. **Shell wildcards (`*.c`) evaluate at runtime, but are dangerous.**

     If you use a raw `*.c` inside a recipe, it evaluates during Phase 2 exactly when the command runs. However, standard `/bin/sh` does not handle empty matches gracefully. 
   
     If no `.c` files exist, the shell returns the literal string `*.c`, causing commands like `ls` or `rm` to throw an error and halt the build.

### How to handle Shell Wildcard errors

#### Solution 1: The "Ignore Error" Flag (The Quick Fix)

If `ls *.c` finds no files, it returns an exit code of 2 (error), which stops Make. You can tell Make to ignore the shell error by prefixing the recipe line with a minus sign `-`.

```make
print:
    # If *.c matches nothing, ls complains, but Make ignores it and keeps going
    -ls -la *.c
```

#### Solution 2: The Shell For-Loop (The Robust POSIX Fix)
This is the professional, universally compatible way to handle shell wildcards safely inside a Makefile recipe. You write an inline shell script that verifies the file actually exists before acting on it.

```make
print:
    # 1. Loop through files
    # 2. [ -e "$$f" ] checks if the file actually exists (prevents literal '*.c' execution)
    # 3. If yes, execute the command.
    for f in *.c; do \
        [ -e "$$f" ] && ls -la "$$f"; \
    done
```

---

## The behavior of handling `%` in Make

In Regex, `*` or `.` usually means "match anything here, and here, and here."

In Make, `%` is a single variable (called the "stem").

Because there is only one stem variable in Make's logic, Make essentially ignores any `%` after the first one to avoid ambiguity. This logic is **universal** across all of Make's pattern features.

---

## The `ifdef` Rule Trap

`ifdef` checks the raw stored value. It does not expand the variable to see what's inside. Because `ifdef` is so easily fooled by whitespace and recursive variables, experienced Make users **almost never use it**.

Instead, use this robust pattern which expands the variable and strips whitespace before checking:

```make
# Checks if the EXPANDED value is empty
ifneq ($(strip $(foo)),)
    echo "foo actually has content!"
endif
```

---

## Implementing Loops in Make

The standard way to iterate through a list in Make depends on **when** you want to do it: during the **shell execution** (in a recipe) or during **Make's parsing** (to generate code).

### Method 1: The Shell Loops

```make
LIST = one two three four

all:
    @# Note the $$i (Double Dollar) to escape the variable for the shell
    @for i in $(LIST); do \
        echo "Item: $$i"; \
    done
```

### Method 2: The `foreach` Function

**Cons**: It expands into one giant single line. If your list has 10,000 items, you might hit the "Argument list too long" error.

```make
LIST = apple banana cherry

# This expands to: echo "I like apple"; echo "I like banana"; ...
all:
    @$(foreach fruit,$(LIST),echo "I like $(fruit)";)
```

### Method 3: The `$(info)` function

```make
LIST = alpha beta gamma

# This prints to the console instantly, before any targets are built!
$(foreach item,$(LIST),$(info found item: $(item)))

all:
    @echo "Done"
```

### Extra: using `$(eval)` together with `foreach`

```make
PROGRAMS = prog1 prog2 prog3

# 1. Add a default target BEFORE the rules are generated.
# Because this is the first target, running 'make' will trigger it.
all: $(PROGRAMS)

# 2. Define a template (using 'define' block)
define PROGRAM_TEMPLATE
$(1):
    @echo "This is the rule for $(1)"
endef

# 3. Use foreach to iterate the list
# 4. Use $(call) to fill the template
# 5. Use $(eval) to force Make to read the result as actual Makefile code
$(foreach prog,$(PROGRAMS),$(eval $(call PROGRAM_TEMPLATE,$(prog))))
```

- `foreach` put things on **one line**.

- `eval` is special because it ignores the `foreach` string concatenation logic.

- The `foreach` function always generate the string (it works like a `map` function in functional programming).

If you don't assign it to a variable, Make will simply **paste the result right there in the file**!!

### Why `$(foreach)` when combined with `$(eval)` can generate multiple lines of code?

For **each iteration of the loop** (e.g. for `prog1`):

1. `$(call)` generates the multiline text.

2. `$(eval)` does two distinct things:

     1. It registers the new rule in Make's internal database as if it had been typed directly into the Makefile. 

     2. After registering the rule, `$(eval)` evaluates to an **empty string**.

3. `$(foreach)` collects **empty strings** (which is the key reason why it works).

---

## Handling `$(foreach)` Output in Makefiles: When to Capture vs. Discard Results

### Scenario A: The Result is Text (Dangerous if ignored)
If your `foreach` generates text, you cannot just leave it floating in the file, or Make will try to **read it as syntax**.

```make
LIST = one two
# BAD: This expands to the text "one two" sitting alone on a line.
$(foreach i,$(LIST),$i)

# Make reads the file and sees:
# one two
# Error: *** missing separator. Stop.
```

### Scenario B: The Result is Empty/Side-Effects (Safe to ignore)
If you are using `foreach` to call functions that have side effects (like `$(info)` to print, or `$(eval)` to create rules), the function returns an **empty string**.

In this case, **foreach** returns a string of spaces. Make ignores lines that contain only whitespace, so you can safely "drop" the result.

```make
LIST = prog1 prog2

# GOOD: $(info) prints to the console but returns NOTHING.
# foreach concatenates "nothing" + "nothing".
# Result: A line of spaces. Make ignores it.
$(foreach i,$(LIST),$(info Found program: $i))

all:
    @echo done
```
