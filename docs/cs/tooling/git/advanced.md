[← Back to Git Directory](./index.md){ .md-button }

# Advanced

## Identifying points

### 1. `git tag`
Think of tags as "bookmarks" or "snapshots." While branches move as you add commits, a tag stays pinned to a specific commit hash forever.

#### Types of Tags
- **Lightweight Tags:** Just a name pointing to a commit.
    - _Usage:_ `git tag v1.0`

- **Annotated Tags:** Stored as full objects in the Git database. they include the tagger name, email, date, and a message. **This is the recommended way for releases.**
    - _Usage:_ `git tag -a v1.0 -m "Release version 1.0"`

#### Key Arguments
- **`-l` (list):** Lists existing tags (e.g., `git tag -l "v1.*"`).
- **`-d` (delete):** Removes a tag locally (e.g., `git tag -d v1.0`).
- **Pushing tags:** Tags are not pushed by default. You must use `git push origin v1.0` or `git push origin --tags`.

### 2. `git describe`
This command is used to find the most recent "reachable" tag from a commit and describe its relation to that tag. It’s incredibly useful for creating human-readable version strings for builds.

#### How the Output is Constructed
If you run `git describe`, it returns a string in this format:

> **`v1.0-4-g1234abc`**

- **`v1.0`**: The name of the most recent tag.

- **`4`**: The number of commits made _since_ that tag.

- **`g1234abc`**: The "g" (for git) plus the abbreviated hash of the current commit.

#### Useful Flags

- **`--tags`**: By default, `describe` only looks for annotated tags. This flag tells it to look for lightweight tags too.

- **`--abbrev=<n>`**: Changes the number of characters in the hash suffix (default is 7).

- **`--always`**: If no tags are found, it will just show the commit hash instead of throwing an error.

## Some commands related to file operations

### `git clean -fd` and `git clean -fdx`

- `-n`: **dry run**: shows what would be deleted. **Always do this first!**

- `-f`: **force**: By default, `git clean` will refuse to run because deleting untracked files is **permanent**.

- `-i`: **interactive**: this opens a menu where you can **filter, select, or confirm files one by one.**

---

- `-d`: **directories**: Without this flag, `git clean` will only delete untracked _files_. If you have a build folder (e.g., `build/` or `dist/`) that isn't tracked, `git clean -f` will leave it alone. `git clean -fd` will delete it.
- `-x`: **ignored files**: This tells Git to delete **everything** that isn't tracked, including files you explicitly told Git to ignore (like `.o`, `.exe`, `node_modules/`, `.env`).

### `git gc --prune=now --aggressive`

### `git reflog expire --all --expire=now`

#### 1. What is it? 

The `reflog` is a strictly **local** chronological log of where `HEAD` and branch references have been. Unlike `git log`, which shows the project's ancestry, `git reflog` shows your **actions**.

#### 2. The "Undo" Button

Because the `Reflog` tracks every movement, you can "undo" almost anything, even destructive commands like `git reset --hard` or `git commit --amend`.
- Run `git reflog`. You will see some entries.
- Recover it: `git reset --hard HEAD@{1}` (or `git reset --hard 4a1b2c3`).

#### 3. Forcing Cleanup

To permanently delete data (e.g., to shrink repo size), you must clear the `reflog` first.

```
# 1. Expire all reflog entries immediately (Cut the safety net)
git reflog expire --expire=now --all

# 2. Run Garbage Collection (Delete unreferenced objects)
git gc --prune=now
```

### `git stash`

`git stash` is used when you have messy changes in your working directory that you aren't ready to commit yet, but you need to switch branches or pull new updates. It takes your uncommitted changes and "stashes" them away in a temporary storage area, giving you a clean working directory.
- **`git stash`**: Save your current changes and reverts the directory to the last commit.

- **`git stash list`**:Shows all your saved stashes.

- **`git stash pop`**: Removes the most recent stash and applies those changes back to your current branch.

- **`git stash apply`**: Similar to `pop`, but it keeps the stash in the storage list instead of deleting it.

	- No specification: The very last one. It automatically defaults to `stash@{0}`.

	- Specifying an ID: `git stash apply stash@{2}`

- **`git stash drop`**: Deletes a specific stash from your list. **(Optional specifier!)**

- **`git stash clear`**: Delete all entries in the stash list.

#### Conflict

1. Run `git status` to see the conflict.

2. Edit the file to remove `<<<<` `====` `>>>>` markers.

3. Run `git add <file>` to resolve it.

4. **Do not** run "continue." Just commit your changes normally (`git commit`).

5. Run `git stash drop` to remove the backup if you are sure you're done with it.

#### The Mapping between `git stash` and `git clean`

- **`git stash` (default)** = Stashes **tracked** files only.

- **`git stash -u` (`--include-untracked`)** = Stashes **tracked** files + **untracked** files + **untracked directories**. (Equivalent to `git clean -fd`).

- **`git stash -a` (`--all`)** = Stashes **everything**, including ignored files. (Equivalent to `git clean -fdx`).

| **If you want to "remove"...** | **Destructive (Delete)**            | **Safe (Move to Stash)** |
| ------------------------------ | ----------------------------------- | ------------------------ |
| **Tracked changes only**       | `git checkout .`<br>`git restore .` | `git stash`              |
| **Untracked files & dirs**     | `git clean -fd`                     | `git stash -u`           |
| **Everything (Inc. Ignored)**  | `git clean -fdx`                    | `git stash -a`           |