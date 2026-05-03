[← Back to Git Directory](./index.md){ .md-button }

# Commands related to reversing changes

## 1. `git revert`

1. `git revert a1b2c3d`: The editor will open for you to write revert commit message → save done.

2. `git revert --no-edit a1b2c3d`: Revert without editing message.

3. `git revert OLD_COMMIT..NEW_COMMIT`: Reverts everything in that range, one by one.

4. `git revert --abort`: Abort revert (conflict happens).

5. `git revert --continue`: Continue after resolving conflicts.

## 2. `git reset`

### A. `git reset <commit> -- <path>`

- You *cannot* use **`--soft` or `--hard`** when specifying a file path.

### B. `git reset <commit> --soft/mixed(default)/hard(opt)`

- `--soft` affects only **HEAD**.

- `--mixed` affects **HEAD** and **Index**.

- `--hard` affects **HEAD**, **Index**, and **Working Directory**.

### C. Nuanced differences

- **`git reset --mixed HEAD`(Repository Level)**: This moves the **HEAD pointer** (even if it's moving it to where it already is) and resets the index. It is a "Repository-level" operation.

	- It's a **"Ref Operation"**, so it can interact with the **`reflog`** (the history of where your **HEAD** has been)

	- But `git reset HEAD .` is a path operation, so Git records **nothing** in the **`reflog`**.

- **`git reset HEAD .`(Path Level)**: This **does not touch the HEAD pointer**. It strictly performs a "copy" operation from the HEAD tree into the Index for the paths specified (in this case, all of them).

- The terminology here is a bit confusing. If `--mixed` normally means `HEAD` + `Index` both change, **why do we still call file-level reset implicit `--mixed`**, when **only `Index` changes** and `HEAD` stays fixed?

    The answer is that, to be more precise than what I said above, `--soft` / `--mixed` / `--hard` are not defined by "does HEAD move". They are defined by **what happens to the INDEX and WORKING TREE**, regardless of whether HEAD moves.

## 3. `git restore`

### A. Interactive Mode (The "Pro" Move)

Just like `git add -p`, you can restore parts of a file!

- **Command:** `git restore -p <file>`

- **Action:** Git will ask you chunk-by-chunk: "Do you want to discard this specific change?"

### B. Possible flags

1. `--source=HEAD`

2. `--source=<hash/branch>`

3. `--worktree`, `--staged` or (`-S`, `-W`)

### C. Some idioms

1. `git restore --source=HEAD --staged --worktree <file or .>` 

     Here the specification `<file or .>` applies to **both the working tree and the staging area**.

2. `git restore .`
 
     The source here by default is **the Index**.

3. `git restore --staged .`

     The source is **HEAD** by default.

## 4. The Root Commit Edge Case

The "Root Commit" (the very first commit in a repo) is tricky because it has no parent. Standard commands like `git reset HEAD~1` fail because "`HEAD~1`" doesn't exist.

### The equivalent of `reset` or `restore`

If you want to "undo" the root commit or clear the staging area completely at the very beginning, you use:

- **`git update-ref -d HEAD`**: This is the "nuclear" option you likely saw online. It deletes the reference to the HEAD branch entirely. This effectively puts the repo back into the state it was in right after `git init`, allowing you to start over.

- **`git rm -rf .`**: If you just want to clear the files from the index/working tree but keep the history, you'd use this.

## 5. `git commit --amend --no-edit` / `git commit --amend -m <new-commit-msg>`

This command is used to modify the most recent commit. Instead of creating a new commit, it "wraps" your staged changes into the previous one.

- **`-m` (message):** Allows you to provide a new commit message. If you don't use this, Git will open your editor with the previous message.

- **How it works:** It creates a brand new commit object with a different hash and replaces the old one.

- **Warning:** Never amend a commit that has already been pushed to a shared repository, as it rewrites history.

- **`--no-edit`**: keep the old commit message, don't open the editor

## 6. `git branch -f`

This is the "force" version of branch creation/movement.

- **`-f` (force):** Normally, Git won't let you create a branch name that already exists. The `-f` flag tells Git to **forcibly move** an existing branch pointer to a specific revision (a hash, another branch, or a tag).
- **Typical Use:** `git branch -f main HEAD~3` moves the `main` branch pointer back three commits.


### Why `git branch -f` can not be replaced by `git restore` / `git reset`?

1. **No checkout required**: You can modify any branch pointer while staying on a different branch. **But `git reset` requires you to first check it out since it move the tip of the current branch**.

2. **Direct pointer manipuation**: It only changes where the branch lable points, without touching your working directory or index.

## 7. git force push

### A. Normal force push

```bash
git push --force
# or
git push -f
```

### B. Safe force push (Recommended)

```bash
git push --force-with-lease
```
It compares the **remote-tracking branch** with the **actual current state of the remote branch**. If they match → force push is allowed. If they **don't match** → push **aborts immediately**. 

### C. A few of the common use cases of force pushing:

1. Updating the remote after local history rewriting.

2. Overwriting a shared feature branch you own.

3. Recovering from accidental commits to the wrong branch.

### D. When it shouldn't be used:

1. On shared, long-lived branches like `main`, `develop` where multiple collaborators work.

2. If you're unsure whether others have pulled the branch you're pushing to.

3. If you haven't backed up the remote branch's history (e.g. by creating a backup branch).