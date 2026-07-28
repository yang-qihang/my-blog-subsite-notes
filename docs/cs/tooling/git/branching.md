[← Back to Git Directory](./index.md){ .md-button }

# Branching

## Rename an Existing Git Branch

### A. Rename the Local Branch
```shell
# Option 1: rename the current branch
git branch -m new-branch-name
# Option 2: rename another branch
git branch -m old-branch-name new-branch-name
```

### B. Update the Remote Repository

**NOTE**:

If the remote branch you want to delete is **current checked out** in the remote repository as its **default branch**, Git servers **by default deny deleting the currently checkout-out/default branch** to prevent confusion and broken clone, and an error message will be reported.

To address this error, you can either **switch the remote default branch first** or **configure the remote to allow deletion**.

```shell
# Step 1:
# delete the old remote branch
# option 1: the full version
git push origin --delete old-branch-name
# option 2: the short version
git push origin -d old-branch-name
# option 3: another syntax
# an empty left side means "delete the remote branch on the right"
git push origin :old-branch-name

# Step 2:
# push the renamed branch to remote && set the upstream tracking
git push -u origin new-branch-name
```

## `git cherry-pick` commands

Take **one or a few specific commits** from any branch, copy them, and replay them **on top of your current branch**.

There will be **no merge, no full rebase**.

**A. Pick a single commit:**

```
git cherry-pick a1b2c3d
```

**B. Pick multiple individual commits**

```
git cherry-pick commit1 commit2 commit3
```

**C. Pick a range of commits(inclusive)**`

From start (excl) to end (incl):
```
git cherry-pick startCommit..endCommit
```

**D. Abort cherry-pick (conflict/regret)**

```
git cherry-pick --abort
```

**E. Continue after resolving conflicts**

```
git cherry-pick --continue
```

## Creating an Orphan Commit

An "orphan" branch is a branch that starts with a completely clean slate—no history, no parents, and usually no files.

- **Command:** `git checkout --orphan <new-branch-name>`

- **What happens:** The next commit you make will be a new **root commit**. It will have no connection to the previous history of the project.

- **Cleanup:** After running the command, your index is still full of files from the previous branch. You usually follow this with `git rm -rf .` to start totally empty.

## Merging Unrelated Histories
By default, Git refuses to merge two branches that do not share a common ancestor. This often happens when you try to merge two projects that were started independently.

- **The Argument:** `--allow-unrelated-histories`

- **The Command:** `git merge <other-branch> --allow-unrelated-histories`

- **The Result:** Git will attempt to combine the file trees. You will likely have to resolve a large number of conflicts, as Git has no "base" version to compare the two branches against.


## Deleting branches

### 1. The mechanism of `git branch -d`

**Explanation**:

- When you run `git branch -d <target>`, Git performs a "merged status" check.

- It only allows the deletion if the `<target>` branch's history is already fully contained within the history of your **current branch** (`HEAD`).

- If the target branch has commits that don't exist in **your current branch**, deleting the target branch would mean those commits become "orphaned" (unreachable). Git throws an error to warn you that you might be losing work.

**Important Detail**:

* `git branch -d` checks the "merged status" against `HEAD` **(your current branch)**.

* To **force delete a local branch that has unmerged commits** (commits not in your current HEAD branch), use the **uppercase `-D` flag** instead of lowercase `-d`.

**An Example:**

- If you want to delete `feature` because it was merged into `develop`, but you are currently sitting on `main`, the command **might still fail** if `main` hasn't pulled those changes from `develop` yet.

### 2. To check if a branch is merged into a specific branch
If you want to check if a branch is merged into a **specific** branch (not just your current one) without switching, you can use:
```shell
git branch --merged main
```
This lists all branches that are safe to delete because they are fully contained within `main`.

## After Pull Requests: Deleting Local and Remote-Tracking Branches
After pull requests, you may need to delete a local branch and its corresponding remote-tracking branch.
### 1. Switch to a Different Branch
You cannot delete the branch you are currently on. Switch to `main`, `develop`, or any other branch first.
```shell
git checkout main
```
### 2. Identify the Target Branches
List all branches to confirm the exact names of your local and remote-tracking branches.
```shell
git branch -a # Lists both local and remote-tracking branches
```

- **Local**: `feature/vision`

- **Remote-tracking**: `origin/feature/vision`

### 3. Delete the Local Branch
#### Option A: Safe Delete (Recommended)
Git will check if the branch has been fully merged into your current branch. If not, it will throw an error to prevent data loss.
```shell
git branch -d feature/vision
```
#### Option B: Force Delete (Use with Caution!)
This deletes the branch regardless of its merge status.
```shell
git branch -D feature/vision
```
### 4. Delete the Remote-Tracking Branch
The "remote-tracking branch" is your local copy of what exists on the server (the pointer prefixed with `origin/`).
#### Option A: Prune All Expired References (Recommended)
This is the cleanest way. It scans the remote and removes any local tracking pointers for branches that have already been deleted on the server.
```shell
git fetch --prune # Shorthand: git fetch -p
```
#### Option B: Prune a Specific Remote
If you only want to clean up reference for a specific remote (like `oribin`):
```shell
git remote prune origin
```
