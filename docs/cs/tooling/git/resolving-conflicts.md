[← Back to Git Directory](./index.md){ .md-button }

# Resolving Conflict

Git's conflict resolution commands can definitely feel inconsistent. This is because Git wasn't designed as a single monolithic program, but rather as a toolkit that grew organically. Some commands process a single action, while others run a "sequencer" that processes a list of commits. 

Understanding the underlying architecture of these commands clarifies why their flags differ.

## 1. Conflict Resolution Flags: The Breakdown

The availability of `--continue`, `--skip`, and `--abort` depends entirely on whether Git is executing a **Single-State Operation** or a **Sequential Operation** (looping through multiple commits).

| Git Command | `--continue` | `--skip` | `--abort` | Under the Hood / Why? |
| :--- | :---: | :---: | :---: | :--- |
| `git merge` | ✅ | ❌ | ✅ | **Single-State:** Merges two trees into one commit. You cannot "skip" a merge; you must complete it or `--abort`. *(**Note:** `--continue` was only added in Git 2.12 for consistency. Historically, because a merge is just combining trees, you simply run standard `git commit` to finalize it).* |
| `git rebase` | ✅ | ✅ | ✅ | **Sequential:** Reapplies a list of commits one by one. If a specific commit conflicts and you realize you don't need it, you can `--skip` that specific commit and move to the next. |
| `git cherry-pick` | ✅ | ✅ | ✅ | **Sequential:** Exactly like rebase, it applies commits iteratively. You can `--skip` a problematic or redundant pick. |
| `git revert` | ✅ | ✅ | ✅ | **Sequential:** Generates new commits that undo past commits. If undoing a specific commit causes a mess you don't care about, you can `--skip` it. |
| `git stash pop/apply`| ❌ | ❌ | ❌ | **Working Directory Hack:** `stash` does not use the sequencer. If it conflicts, it dumps the conflict into your working tree and stops. There is no `--continue` or `--abort`. |
| `git pull` | *Varies* | *Varies* | *Varies* | **Wrapper:** `pull` is just `git fetch` followed by either `git merge` or `git rebase`. The flags available depend entirely on which of those two it delegates to. | 

!!! Note
    Most sequencer commands also have a `--quit` flag, which stops the operation exactly where it is, leaving your working directory in the conflicted state without reverting back to the beginning like `--abort` does).

---

## 2. The Full Resolution Idioms (Workflows)

When a conflict pauses Git, you don't just immediately run `--continue`. You must resolve the text and explicitly stage the files to tell Git the conflict is handled. The standard idioms look like this:

**The Merge Idiom**

1. Resolve conflicts in your editor.

2. `git add <resolved-files>`

3. `git commit` *(The historical and actual way; Git will automatically populate the merge commit message)* **OR** `git merge --continue` *(A modern alias that just runs `git commit` under the hood).*

**The Sequencer Idiom (`rebase`, `cherry-pick`, `revert`)**

1. Resolve conflicts in your editor.

2. `git add <resolved-files>`

3. `git rebase --continue` *(or `cherry-pick --continue` / `revert --continue`)*

!!! warning
    Do NOT run `git commit` here! If you do, you will manually create a commit, disrupting the sequencer, and you will still have to run `--continue` afterward to restart the loop.

**The Stash Idiom**

1. Resolve conflicts in your editor.

2. `git add <resolved-files>` *(or `git reset` if you just want the resolved files sitting unstaged in your working directory).*

3. `git stash drop` *(Because `git stash pop` refuses to drop the stash if a conflict occurs, you must manually delete the stash entry once you are done).*

---

## 3. The Anatomy of Conflict Marks (Terminology)

When Git halts to let you resolve a conflict, it alters the files to include standard markers. The standard configuration uses a **two-way merge** style, which utilizes three exclusive terms:

```text
<<<<<<< HEAD
    printf("Initializing subsystem...\n");
    init_graphics_engine();
=======
    printf("Starting subsystem...\n");
    init_audio_engine();
>>>>>>> feature-audio
```

* **Ours (Local / Current):** The top section, bracketed by `<<<<<<< HEAD`. This represents the state of the code in the branch you are currently checked out on. 

* **Theirs (Remote / Incoming):** The bottom section, bounded by `>>>>>>> [branch-name]`. This represents the changes coming from the branch you are trying to pull in.

* **The Separator:** The `=======` line divides the two competing changes.

### The `diff3` Style (Adding the "Base")
For more systematic conflict resolution, many developers enable `diff3` (`git config --global merge.conflictStyle diff3`). This injects a crucial third term into the conflict markers:

```text
<<<<<<< HEAD
    init_graphics_engine();
||||||| merged common ancestors
    init_engine();
=======
    init_audio_engine();
>>>>>>> feature-audio
```

* **Base (Common Ancestor):** Bracketed by `|||||||`. This shows you what the original code looked like *before* both branches diverged. Seeing the original state makes it significantly easier to understand what each branch was attempting to achieve.

!!! warning "The Rebase Inversion Trap"
    There is a massive terminology trap here depending on the command you are running:

    * **During a Merge:** "Ours" is your active feature branch. "Theirs" is the branch you are pulling in (e.g., `main`).

    * **During a Rebase:** This is **flipped**. When you run `git rebase main` from your feature branch, Git temporarily checks out `main`. It then replays your feature branch's commits on top of it. Therefore, during a rebase conflict, **"Ours" is `main`**, and **"Theirs" is your feature branch commit**.
