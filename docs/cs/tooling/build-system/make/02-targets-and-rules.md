[← Back to Make Directory](./index.md){ .md-button }

# Targets and Rules

## `.PHONY` targets ignore pattern rules

Make is designed to assume that `.PHONY` targets are abstract commands (like `clean`, `install`, or `test`), not files derived from other files. When Make sees that `clean_c` needs `bar.o`, and `bar.o` is phony, it skips your `%.o: %.c` pattern rule entirely. It searches exclusively for an explicit rule named exactly `bar.o:`. Because you don't have one, it stops instantly:

```text
make: *** No rule to make target 'bar.o', needed by 'clean_c'. Stop.
```

---

## Explicit/Pattern Targets that are empty have different behaviours!

### 1. Explicit Target `(a.o: a.c)` = "Add a Dependency"

If you write an explicit rule with no recipe:
```make
a.o: a.c
```

This is how people add header file dependencies (e.g., `a.o: a.h`) without having to rewrite the whole gcc compilation commands. Make just merges this extra dependency with its built-in knowledge. And then it will look through its database of implicit rules (like the built-in C compiler rules) to find the recipe.

### 2. Pattern Target `(%.o: %.c)` = "Modify the Database"

If you write a pattern rule with no recipe:

```make
%.o: %.c
```

In GNU Make, defining a **pattern rule with no recipe** is the official syntax for **deleting/canceling a rule**. By writing those lines, you are explicitly telling Make to _forget any built-in knowledge it has about turning .c files into .o files_. Even if you removed the `.PHONY` tag to fix the first problem, Make still wouldn't know how to connect `bar.o` to `bar.c` because you essentially **erased the bridge connecting them**.

---

## Defining the same target multiple times
If you define the same target multiple times with different prerequisites, it accumulates (aggregates) them into a single, master list. *e.g., using multiple `.PHONY`*.

But for **recipes**, Make doesn't merge them. Instead, the last recipe parsed wins.

---

## Implicit Rules

Implicit rule search happens **whenever a target has NO RECIPE (commands)**. (No rules or Rules with no recipes).
