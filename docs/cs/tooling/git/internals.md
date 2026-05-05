[← Back to Git Directory](./index.md){ .md-button }

# Understand the Git File Cycle

## Part 1: tracked/untracked

An intuitive mental model for the core design intent of **Tracked/Untrakced** is that **"Does Git care about this file for the next proposed commit?"**

- If Git is **paying attention to it** for the next version → **Tracked**

- If Git is **ignoring it entirely for the next commimt** → **Untracked**

### 1. The Definition of "Tracked"
A tracked file is in the **Index** (staged or previously commited).

**NOTE**: **Head** and **Working Tree** don't matter here.

### 2. The Definition of "Untracked"

File is in **Working Tree only, not in Index** (HEAD doesn not matter).

### 3. `git status`
When you run `git status`, Git performs a **3-Way Comparison**:

1. **HEAD vs. Index:** Checks for **Staged** changes (New, Modified, Deleted).

2. **Index vs. Worktree:** Checks for **Unstaged** changes.

3. **Worktree vs. Index:** Checks for **Untracked** files.

### 4. `git rm --cached`
The command `git rm --cached` removes files from the staging area (Index) **without deleting them from the working directory**.

### 5. `git rm` commands

1. `git rm file.txt`:

    Deletes file **on disk** + stages the delete in index.

2. `git rm --cached file.txt`:

    Remove from **Index**, but file **stays** in your working directory.

3. `git rm -f folder_name/`:

    `-r` = **recursive**, delete folder + all contents, stage deletion.

4. `git rm -f file.txt` (override modified/unmerged state)

    Use when file has **changed** and Git refuses normal `git rm`.

5. `git rm -r --cached folder_name/`:

    Remove **entire folder** from Index, but keep local files.

6. `git rm a.txt b.txt c.txt`:

    Use when you want to remove **multiple files at once**.

7. `git rm -n file.txt`:

    **Dry run**. Test what will be deleted. (No actual deletion)

### 6. One Nuance: The "Ignored" State
There is a third state called **Ignored**.

- **Ignored** files are technically **Untracked** files that match a pattern in `.gitignore`.

- Git suppresses them from `git status` output so they don't annoy you.

- **Crucial Detail:** If you force-add an ignored file (`git add -f ignored.log`), it becomes **Tracked**. Once it is in the Index, `.gitignore` rules no longer apply to it!


## Part 2: The Nuances of "Staging"
To understand Staging, you must distinguish between the **Action** (what you do) and the **State** (what Git sees).

### 1. As states (staged/unstaged)

In Git, **"Staged"** is not just a bucket you put files into. It is a **relationship** between the Index and HEAD.

* **Staged (Change):** The content in the **Index** is DIFFERENT from the content in **HEAD**.
    **Git's Logic:** "You have prepared a snapshot that looks different from the last commit. This difference is what I will commit."

* **Unstaged (Change):** The content in the **Working Directory** is DIFFERENT from the **Index**.
    **Git's Logic:** "You have done work that you haven't told the Index about yet."

### 2. As an action (`git add`)

When you run `git add`, you are performing a **Synchronization**.
**`git add` = "Make the Index look like the Working Directory."**

**That is also what stage as a verb means.**

It doesn't matter if the file is new, modified, or deleted. The command tells Git: *"Take whatever the reality is on my disk right now, and make the Index match it."*

### 3.  What Happens in the Staging Area?

When a deletion is **staged**, the entry for that file is strictly **removed** from the Index.

- **Before:** The Index has a list: `{"main.cpp": Blob_Hash_1, "logo.png": Blob_Hash_2}`.

- **After:** The Index list is now: `{"main.cpp": Blob_Hash_1}`.

## Part 3: The Two Ways to Delete
Deletion is unique because you can "stage" it in two ways.

| Method     | Action            | State in Index | Official Status                                          |
| :--------- | :---------------- | :------------- | :------------------------------------------------------- |
| **Manual** | `rm file.txt`     | **Exists**     | **Unstaged (Deleted)**<br>(Index has it, Disk doesn't)   |
| **Git**    | `git rm file.txt` | **Removed**    | **Staged (Deleted)**<br>(Index matches Disk: both empty) |

## Part 4: Nuances of `git add`
- **`git add .`**: Stages **New** + **Modified** + **Deleted** files (in current directory).

- **`git add -A`**: Stages **New** + **Modified** + **Deleted** files (in the entire repository)

- **`git add -u`**: Stages **Modified** + **Deleted** files ONLY. **(Ignores New files).**
    **`git add -u` has to be run from root (or `git add -u:/`) to update the WHOLE REPO!**
  `:/` is a **special reference in Git** that means **From the Top-Level of the Repository**.

| **Command**      | **Git 1.x (Legacy)**            | **Git 2.x (Modern)**        |
| ---------------- | ------------------------------- | --------------------------- |
| **`git add .`**  | Updates + New (Ignores Deletes) | **Updates + New + Deletes** |
| **`git add -A`** | Updates + New + Deletes         | **Updates + New + Deletes** |