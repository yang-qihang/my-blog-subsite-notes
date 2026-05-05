[← Back to Git Directory](./index.md){ .md-button }

# Advanced File-Level Operations

## 1. Granular Staging & Discarding

* **Interactive Patch Mode (`-p`)**

    To interactively stage or discard specific blocks of changes (hunks), you can use the following commands:
    
    - `git add -p <file>`

    - `git restore -p <file>` 

    During this process, several options are provided:

    - `y` (yes, apply)

    - `n` (no, skip)

    - `q` (quit completely)

    - `a` (apply this and all remaining)

    - `d` (skip this and all remaining)

    - `e` (manually edit the hunk).

* **Manually Editing Hunks (`e`)**

    Selecting `e` opens the raw patch in a text editor. Git determines actions based on the first character of each line:

    - `+` (addition)

    - `-` (deletion)

    - a space (unchanged context).

    The way you manually edit is as follows:

    - To prevent staging an addition, **completely delete the `+` line** from the patch.

    - To prevent staging a deletion, replace the `-` with a single space to turn it into a context line.

    - Context lines must remain **intact** for the patch to apply cleanly.

## 2. `git diff`

- `git diff`: Worktree vs. Index 

- `git diff --staged`: Index vs. HEAD 

- `git diff <commit>`: Worktree vs. Specific Commit 

- `git diff --staged <commit>`: Index vs. Specific Commit 

- `git diff <commit_1> <commit_2>`: Commit vs. Commit 

## 3. `git show`

- `git show optional_commit`: Show changes made during the commit specified

- `git show optional_commit:file_name`: peek at an old file in that commit

- `git show optional_commit -- file_name`: see changes to a file during that commit

## 4. Surgical History Inspection

* **File-Level and Line-Level Tracing**

    `git log -p -- <file>` shows the full diff history of a file, while `git blame <file>` shows who last modified each surviving line.

    To trace the complete evolutionary history of a specific line or block of code, use `git log -L <start>,<end>:<file>`. This outputs every commit and patch that ever touched those exact coordinates.

* **Syntax Differences (`log -L` vs. `blame -L`)**

    `git log -L` requires a colon between the line range and the file name (e.g., `-L 10,20:main.c`) because `log` can accept multiple file paths, so the colon binds the range to a specific file.

    `git blame -L` uses a space (e.g., `-L 10,20 main.c`) because `blame` only ever operates on a single file, making the file name a standard positional argument.

## 5. Reading Unified Diff Formats

* **Anatomy of a Patch**

    When viewing raw patches (like from `log -L`), the output is structured into specific metadata blocks.

    It includes the Commit Metadata (Hash, Author, Date, Message), the Diff Header (`a/` for the old file state, `b/` for the new file state), the Hunk Header coordinates (e.g., `@@ -3,1 +3,1 @@` showing the start line and number of lines extracted for both states), and the Payload (the actual `+` and `-` code changes).

## 6. Revision Ranges and History Traversal

* **Navigating Ancestry (`~` and `^`)**

    You can navigate backward through commit history using `HEAD~1` (parent), `HEAD~2` (grandparent), etc.

    Attempting to reference an ancestor that does not exist (such as calling `HEAD~2` when the repository only has two commits) results in a `fatal: bad revision` error because the root commit has no parent.

* **Mathematical Set Difference (`..`)**

    The `A..B` syntax in Git does not represent a simple chronological range. It is a set difference operator meaning: "Commits reachable by B, excluding commits reachable by A."

    For example, `HEAD~1..HEAD` subtracts the entire history of the parent commit from the current commit's history, resulting in exactly one commit: the delta between the two.

* **The Path Separator (`--`)**

    When executing commands where a revision or branch name could be confused with a file name, appending `--` before the file path explicitly forces Git's parser to treat all subsequent arguments as files, preventing ambiguous argument errors.

## 7. Daily Idioms (Quick Reference)

* **Review, stage, and commit a file in one seamless command:**

    `git commit -p <file>`

* **Search the history of a file for exactly when a specific string or function was added or deleted (The Pickaxe):**

    `git log -S "string_to_search" -- <file>`

* **See exactly what changes were introduced by the very last commit for a specific file:**

    `git show HEAD -- <file>`

* **Trace the history of a specific C/C++ function by name (instead of line numbers):**

    `git log -L :function_name:main.c`

    This uses Git's syntax heuristics to automatically locate the start and end boundaries of the function, outputting every patch in history that ever modified its internal logic.

* **Review the precise code changes made to a file in the last 3 commits (you can specify the commit to traverse backward from):**

    `git log commit_name(opt) -3 -p -- <file>`

    The `-3` limits the output length, while the `-p` forces Git to render the actual unified diffs rather than just the commit metadata and messages.

* **Audit all modifications made to a file since branching off from an older commit (exclusive):**

    `git log older_commit..HEAD -p -- <file>`

    This applies the set difference operator to isolate and display every change introduced to the file *after* the `older_commit`, up to your current working state.

* **Investigate how a specific block of code evolved between two precise points in time:**

    `git log older_commit..newer_commit -L 10,20:main.c`

    This combines the mathematical set difference operator with surgical line tracing, rendering the evolution of lines 10 through 20 strictly bounded within that specific era of the repository's history.