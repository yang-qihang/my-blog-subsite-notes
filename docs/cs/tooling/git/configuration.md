[← Back to Git Directory](./index.md){ .md-button }

# Configuration

Run the lines below in the command line to add them to the git configuration file.

```bash
# This line makes `git log` print directly in the terminal and stay visible
git config --global core.pager cat 

# print out commit history
git config --global alias.lg "log --oneline --graph --all -decorate"

# switch
git config --global alias.sw "switch"
git config --global alias.sc "switch -c"

# unstage
git config --global alias.unstage "reset HEAD --"
# other possible version:
# git config --global alias.unstage "restore --staged --"
# e.g. git unstage file1.cpp expends to git restore --staged -- file1.cpp
# the -- separator is used to disambiguate between refs and paths

# prune obsolete remote-tracking branches
git config --global alias.prune "fetch --prune"
```