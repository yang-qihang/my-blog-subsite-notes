# Details During A Rebase

When you want to perform a `rebase`, there are many specific details to pay attention to.

## 0. Edge case about root commits:

1. Use `git rebase -i --root` if you want to re-edit the first commit.

2. You can't mark the first-commit as to be squashed because it doesn't have its parent commit to merge into.

## 1. Untracked File Collision vs Submodule State Mismatch

1. If your working directory has an **untracked file**, while the rebase starting commit already tracks a file with the identical path, Git will trigger a **fatal path collision** and block the rebase process to prevent data loss. 

     You need to do either of the following and then resume the rebase.

     1. Manually delete the conflicting local file

     2. Stash untracked files with `git stash -u`

2. When the submodule commit recorded in the rebase vase version does not match the local submodule state, Git only outputs a **rountine warning**. Git regards a submodule folder as a **whole tracked entry** rather than ordinary files, and will **not automatically modify or overwrite local submodule content**.

     No forced manual deletetion is required.

3. If there's a submodule in the current commit that doesn't exist in the rebase starting commit. Git only tries to run `rmdir`(which refuses to delete non-empty folder). If it's refused, only a warning is issued. This is because Git is designed to separate the submodule from the main repo. Yet if it's an ordinary tracked file/directory that doesn't exist in the older commit, it gets deleted immediately.

## 2. Correcly choose between different `git rm` commands 

I want to start this part with an example. The scenario is that you try to remove a tracked `build` folder (e.g., `public/`) across all historical commits. You use `git rebase -i --root` and edit every commit to do this. What's the command you should use for removing the file from every commit? `git rm -rf` or `git rm -r` or `git rm --cached` (for `--cached` command no `-f` needed)? The answer is `git rm -r` or `git rm -rf`, depending on the case, not `git rm --cached`. Why?

If you use `git rm -r --cached public/` for `Commit 1`, it untracks the folder in Git but leaves the physical files on the hard drive. When Git attempts to step forward to Commit 2 (which expects to track `public/`), it detects the leftover physical files, panics (`untracked working tree files would be overwritten`), and crashes the rebase. (This point has been illustrated in section 1 above).

## 3. The Dual Nature of Rebase Pauses

During an **interactive rebase** *(Normal rebase can only be paused because of conflicts!)*, Git halts the timeline for two fundamentally different reasons. Confusing them causes accidental commit squashing.

* **Case A: The `edit` Pause**

    For this case, git has constructed the commit and paused because of the Todo list(you told git ealier you want to **edit** this commmit).
  
    1. Make changes

    2. `git commit --amend --no-edit`

    3. `git rebase --continue`.

* **Case B: The `CONFLICT` Pause**

    Git hit a wall trying to construct the next commit (e.g., `modify/delete` conflict).
  
     1. Resolve the conflict (e.g., in this case it's `git rm -r public/`)

     2. Make changes here (Resolving the conflicts and making the desired changes are combined together!)

     3. `git rebase --continue`  

    !!!note "Two Vert Common Traps"

        1. The state of `HEAD` is very **special here**, it's not fully in the current commit as in **Case A**. If you run `git commit --amend` during a Conflict Pause, you force the hovering Index changes into the *previous* commit (where `HEAD` is currently resting), gluing them together.

        2. You might incorrectly think the editing is after you resolve the conflict and run `git rebase --continue`. But the fact is that **you have to do it together here!**

            If you resolve the conflict and run `git rebase --continue`, Git assumes your manual intervention included your intended edits. It will **skip** the scheduled `edit` pause and immediately process the next commit.

## 4. `git rm -rf` or `git rm -r`? 

Let's review the rules regarding `git rm` in normal cases first:

1. `git rm <file>` on a file with **unstaged OR staged changes** throws an error.

2. `git rm <file> -f` force the action, **ignoring unstaged or staged changes**. 

3. `git rm --cached <file>` doesn't perform the check.

Does the difference between `rm -f` and `rm` still exist for the case of resolving rebase conflict?

e.g. We are in the middle of an interactive rebase which involves `main.c`. We rebase C1 through C2. When working on C1, we made a few changes which conflict with the change from C1 to C2. Thus, we pause on C2, with the conflict marks inserted into C2's original version of `main.c`. You decide that you don't even want `main.c` for revised C2 since dealing with the conflicts is too tedious. But you may wonder can you directly `git rm main.c` here without `-f`? Do the inserted special conflict marks account for "unstaged changes" as well?

In fact, it's an **expection**. During a merge conflict, Git clears the file from **Stage 0 of the Index** and splits it into **an "Unmerged" state** containing Stage 1 (Base), Stage 2 (Ours), and Stage 3 (Theirs). (They all live in the Index)
  
When `git rm` detects a file in Stages 1/2/3, **it skips the standard modification check**. It interprets the command not as a deletion, but as an explicit conflict resolution strategy ("Resolve by Deletion"). It wipes the unmerged stages and clears the physical file without requiring `-f`.

Below is some extra info about the underlying mechanism of this process.

### Under the Hood: What happens respectively when Resolving Conflicts In 2 ways(`git add` vs `git rm`)

When a conflict occurs, Git vacates **Stage 0** (Normal) and splits the file into **three "Unmerged" Index slots**: Stage 1 (Base), Stage 2 (Ours), and Stage 3 (Theirs). 

* **Path 1: Manual Edit + `git add` (The Standard Fix)**

    **Action:** You manually fix the code markers in your text editor, then run `git add <file>`.

    **Mechanism:** Manually editing the file alters your hard drive, but Git's Index remains strictly Unmerged (Stages 1, 2, and 3 are intact). Running `git add` acts as the trigger: Git hashes your new, clean file into **Stage 0**, and permanently wipes Stages 1, 2, and 3. The conflict is cleared.

* **Path 2: `git rm <file>` (Resolution by Deletion)**

     **Action:** You run `git rm <file>` directly in the terminal, bypassing the text editor.

     **Mechanism:** Git checks the Index, sees the file is Unmerged (occupying Stages 1/2/3), and skips the `-f` safety check. It deletes the physical file from your hard drive, wipes Stages 1, 2, and 3, and deliberately leaves **Stage 0 empty**. The conflict is cleared, and the next commit will build without the file.

## 5. Disaster Recovery

* **In-Progress Rescue:** If you realize you have squashed or messed up the timeline while the terminal still reads `(REBASING X/Y)`.

    **Action:** `git rebase --abort` to cancel the operation and return to the pre-rebase state.

* **Post-Completion Rescue:** If the rebase finishes (`Successfully rebased...`) but the history is botched. Git does not delete the old commits; it only moves the branch pointer.

    **Action:** Run `git reflog` to locate the hash of your original timeline's tip, then run `git reset --hard <old-hash>` to detach from the bad history and reattach to the intact, orphaned commits.
