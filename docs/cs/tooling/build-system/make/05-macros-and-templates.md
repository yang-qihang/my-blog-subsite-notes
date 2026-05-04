[← Back to Make Directory](./index.md){ .md-button }

# Macros and Templates

## About `define`

`define` is the only sane way to create a variable that actually contains physical newlines.

If you use backslashes (`\`) to split a variable definition across multiple lines, Make replaces those newlines with spaces.

```make
# This becomes "line1 line2" (One line, space separated)
VAR = line1 \
      line2

# This becomes "line1\nline2" (Two distinct lines)
define VAR
line1
line2
endef
```

However, `define` is rarely used just to store "multi-line text strings." Its primary and most idiomatic purpose is to create Functions (Macros) and Rule Templates.

### Use Case 1: "Canned Recipes" (Custom Functions)

This is the **most common use**. You define a reusable block of shell commands (a "macro") and then execute it inside rules using `$(call)`. This is how you avoid copy-pasting the same complex gcc or objcopy command 50 times.

The Idiom:

```make
# 1. Define the "Function"
# $(1) is the first argument, $(2) is the second...
define COMPILER_MSG
    @echo "--------------------------------"
    @echo "Compiling: $(1)"
    @echo "Output:    $(2)"
    @echo "--------------------------------"
endef

# 2. Use it in a rule
main.o: main.c
    # We "call" the variable like a function
    $(call COMPILER_MSG, $<, $@)
    $(CC) -c main.c
```

Why this is better:
- **It keeps your rules clean** (`$(call COMPILER_MSG...)` vs 4 lines of `echo`).
- If you want to change the message format later, you **change it in one place**.

### Use Case 2: Generating Rules (eval Templates)

This is the superpower of Make. You use `define` to create a blueprint for a rule, and then use a `foreach` loop to stamp out hundreds of actual rules from that blueprint.

This is standard practice in large projects (like standard libraries or kernels) where you have 100+ files that all need similar but slightly different rules.

#### What Make sees after expansion
It effectively **"writes" this code** for you automatically:

```make
app1: app1.o
    @echo "Linking custom binary app1..."
    $(CC) -o $@ $<

app2: app2.o
...
```

### Use Case 3: Writing Files to Disk (The `file` function)

In GNU Make 4.0+, you can write text directly to a file without using `echo` or the shell. This is incredibly fast and avoids quoting hell. `define` is essential here to format the file content.

The Idiom:

```make
# 1. Define the exact content of the file
define CONFIG_CONTENT
version=1.0
debug=true
created_by=$(USER)
endef

# 2. Write it to a file
# Syntax: $(file > filename, content)
generate-config:
    $(file > config.ini,$(CONFIG_CONTENT))
    @echo "Generated config.ini"
```

---

### A hack to iterate through a list and print each item on a separate line

```make
define A_NEWLINE


endef

export A_NEWLINE 

LIST_TO_LOOP_OVER = apple banana watermelon

all:
    @# Put the newline FIRST, followed by your desired spaces (e.g., 2 spaces)
    @echo "Fruits I like include:$(foreach x, $(LIST_TO_LOOP_OVER),$${A_NEWLINE}  $x)"
```

**NOTE**:

1. Without `export`, this wouldn't have worked (Because the expansion of variables **happen in the first part of the run phase** prior to executing those recipes)

2. There are several different stages in the run phase. First will be the **expansion of variables**.
   The distinction between different shell commands (different recipes) are decided by the text after expansion.
   This is because some new **newline characters** might be added to the text in part 1, causing there to be basically more lines.
