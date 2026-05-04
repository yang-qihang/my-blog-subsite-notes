[← Back to Make Directory](./index.md){ .md-button }

# Make Phases and Parsing

## 5 Components of a Makefile

1. **Rules**

      **Special Targets**: Built-in hooks that change Make's behaviour (start with `.`, e.g., `.PHONY`)

2. **Variables**:

     1. **Assignments** (`=`, `:=`, `?=` (Conditional), `+=`)

     2. **Automatic Variables**

     3. **Environment Variables**

3. **Directives**

     - Conditional Directives

     - Include Directives

     - Override Directives

     - Export/Unexport Directives

     - Define Directives

     - Error/Warning Directives

     - VPath Directives

4. **Functions**

     **File Functions**: `$(wildcard ...)`, `$(dir ...)`, `$(notdir ...)`, `$(abspath ...)`

     **String Functions**: `$(subst ...)`, `$(patsubst ...)`, `$(strip ...)`, `$(filter ...)`

     **Control Functions**: `$(foreach ...)`, `$(if ...)`, `$(call ...)`

     **Shell Function**: `$(shell ...)` (Escape hatch to run bash commands in Phase 1).

5. **Comments**

---

## Terminology: Recipe vs Commands

* **The Recipe (The Whole Block)**: The recipe is the entire collection of actions that Make needs to execute to update a target.

* **The Commands (The Individual Lines)**: A command is an individual instruction within that recipe. The recipe executes shell commands.

---

## Two Phases of Make Execution

### 1. The Read Phase (Parse Time)

**Goal:** Read the Makefile top-to-bottom and build the Dependency Graph (DAG). Make figures out which files depend on which, but *does not look at file timestamps or run shell commands yet.*

**Variable Assignment & Expansion during Phase 1:**
Make operates on "Expansion" (macro text replacement). 

* **Simple Assignment (`:=`) -> Immediate Expansion**: The right-hand side is expanded *immediately* during Phase 1. The resulting static string is stored.

* **Recursive Assignment (`=`) -> Deferred Expansion**: The right-hand side is *not* expanded in Phase 1. Make literally stores the raw text/formula (e.g., `$(CC) -c`) to be expanded later whenever it is finally needed.

* **Target & Prerequisite lines**: Expanded immediately in Phase 1 (e.g., expanding raw wildcards like `*.c` to build the DAG).

* **Recipes (Commands)**: **NOT** expanded in Phase 1. Make completely ignores the contents of indented recipe lines during the Read Phase.

#### Example: The Variable & Prerequisite Expansion Gotcha

To truly understand the difference between simple (`:=`) and recursive (`=`) assignment, we also have to understand Make's strictest rule: **Targets and prerequisite lines are ALWAYS expanded immediately during Phase 1.**

This creates a common trap. While recursive variables (`=`) are designed to defer their expansion, *using* them in a prerequisite line forces Make to expand them immediately so it can build the dependency graph. Meanwhile, using them inside an indented recipe strictly defers their expansion to Phase 2.

Observe how the same recursive variable resolves to different values depending entirely on *where* and *when* Make parses it:

```make
# ---------------------------------------------------------
# DEMO: Variable Expansion vs. Prerequisite Expansion Gotcha
# ---------------------------------------------------------

# Set initial state
STATE = initial

# Simple assignment (:=)
# Expands IMMEDIATELY in Phase 1. Locks in the value "initial".
IMMEDIATE_VAR := $(STATE)

# Recursive assignment (=)
# Defers expansion. Stores the literal string "$(STATE)".
RECURSIVE_VAR = $(STATE)

all: first_target second_target test

# --- THE GOTCHA: Prerequisite Expansion in Phase 1 ---
# Rule: Targets and prerequisites are ALWAYS expanded immediately 
# during Phase 1 (Parse time) to build the dependency graph, 
# even if the variable holding them is recursive (=).

# When Make parses this line, STATE is currently "initial". 
# $(RECURSIVE_VAR) is forced to expand NOW.
# The prerequisite is permanently registered as 'initial'.
first_target: $(RECURSIVE_VAR)
    @echo "first_target prerequisites: $^"

# Now we change the state during Phase 1 parsing.
STATE = changed

# When Make parses this line, STATE is now "changed".
# $(RECURSIVE_VAR) is forced to expand NOW.
# The prerequisite is permanently registered as 'changed'.
second_target: $(RECURSIVE_VAR)
    @echo "second_target prerequisites: $^"

# --- Phase 2 Execution (Recipes) ---
# Recipes are completely ignored in Phase 1. Variables inside 
# them are only expanded when the rule runs in Phase 2.
test:
    @echo "Immediate var locked in Phase 1: $(IMMEDIATE_VAR)" # Prints "initial"
    
    # Because this is inside a recipe, $(RECURSIVE_VAR) expands in Phase 2.
    # It uses the FINAL value of STATE at the end of Makefile parsing.
    @echo "Recursive var expanded in Phase 2: $(RECURSIVE_VAR)" # Prints "changed"

# Dummy targets to satisfy the prerequisites constructed above
initial:
    @echo "The target called 'initial' is built."

changed:
    @echo "The target called 'changed' is built."
```

### 2. The Execution Phase

Make checks **file timestamps**. If a target is **out of date**, it prepares to run the recipe. Right before passing the command line to the shell, Make expands any variables or functions inside that recipe.

---

## Cached Snapshot of The Filesystem

Here's a Makefile demonstrating the cache issue:

```make
recursive = $(wildcard *.c)

all: first second

first: $(recursive)
    @echo "int main() { return 0; }" >> main.c

second:
    @echo The value stored inside recursive, when running it in phase 2, is $(recursive)

main.c:
    @echo main.c target is called!

pre.c:
    @echo pre.c target is called! 
```

The file `pre.c` exists before the run, while `main.c` doesn't. And running it, the output is:

```text
> make
pre.c target is called!
The value stored inside recursive, when running it in phase 2, is pre.c
```
You might (which you should) find it weird, since the second line should show `main.c` as well. Because it's a recursive variable, which evaluates on-demand, isn't it.

Here's the reason.

To speed up builds, GNU Make **takes a cached snapshot of your filesystem's directory contents** during **Phase 1**.

When the `$(wildcard)` function executes—even if it correctly waits until Phase 2 to do so—**it does not look at your physical hard drive**. It looks at Make's internal **Phase 1 cache**.

In versions up to **GNU Make 4.3** (which is the default version that ships on Ubuntu 24.04), this cache is never updated after Phase 1.

Here is how your experiment played out:

- **Phase 1 (Parse)**: Make takes a snapshot of the directory. (Assuming no `.c` files exist yet).

- **Phase 1 (Parse)**: `first: $(recursive)` forces immediate expansion. `$(wildcard)` checks the cache, finds nothing. `first` has no prerequisites.

- **Phase 2 (Execute first)**: The recipe runs, creating `main.c` on the physical disk.

- **Phase 2 (Execute second)**: `$(recursive)` expands. `$(wildcard)` executes now, but it asks the stale Phase 1 cache: "Are there any .c files?" The cache says no. It returns an empty string.

Because of the cache, `$(wildcard)` is completely blind to files generated during the same run.

*(Fun fact: This caused so many headaches for C/C++ developers that it was finally patched in GNU Make 4.4, which now forces the cache to invalidate and refresh whenever a recipe runs. But if you are on 4.3 or older, you are stuck with the old behavior!)*
