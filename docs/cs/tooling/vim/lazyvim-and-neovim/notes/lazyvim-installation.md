[← Back to Vim Directory](../../index.md){ .md-button }

# Installing LazyVim

## As a supplement to a book

**NOTE**: I followed the book *LazyVim for Ambitious Developers* to install LazyVim. Below are my solutions to some problems I experienced while following the book's sections about installing LazyVim.

The corresponding instruction can be found in **1.8.2 Install Other Recommended Dependencies** in **Chapter 1 Introduction and Installation** in that book.

In this list, `fzf` and `ripgrep` are able to be installed via `apt` directly. Yet, this approach doesn't work for the other two.

## Install `fd`

The package exists in Ubuntu, but it is named fd-find because the name fd was already taken by another linux utility.

```bash
# 1. Install the package
sudo apt install fd-find

# 2. Make it accesible as 'fd' (Required for LazyVim)
mkdir -p ~/.local/bin
ln -s $(which fdfind) ~/.local/bin/fd
```

## Install `lazygit`

Run this command block below to download and install Lazygit manually.

**NOTE**: I have to do it this manual way because I am currently on Ubuntu **24.04 LTS**. For newer versions of Ubuntu, you should check if it can actually be installed via package managers directly.

```bash
LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
curl -Lo lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz"
tar xf lazygit.tar.gz lazygit
sudo install lazygit /usr/local/bin
rm lazygit.tar.gz lazygit
```

## Verify Installation
Once you finish those two steps, check if they work:
```bash
fd --version
lazygit --version
```
