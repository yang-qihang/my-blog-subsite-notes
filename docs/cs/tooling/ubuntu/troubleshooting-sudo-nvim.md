# Troubleshooting `sudo nvim` Workflow

## Issue 1: "Command not found"
**The Cause:**
When invoking `sudo`, Linux replaces your user's custom environment variables (including `$PATH`) with a restricted `secure_path` from `/etc/sudoers`. If Neovim is installed locally (e.g., `~/.local/bin`), `sudo` is blind to it.

**The Solution:**
Create a system-wide symlink connecting your local installation to a path `sudo` trusts.
```bash
sudo ln -s $(which nvim) /usr/local/bin/nvim
```

---

## Issue 2: LazyVim Plugins and System Clipboard Fails to Load
**The Cause:**
Running `sudo nvim` changes the execution context entirely to the `root` user. 
1. Neovim looks for configurations in `/root/.config/nvim` (which is empty) instead of your user's `~/.config/nvim`.
2. The `root` user is isolated from your active desktop session, severing access to the Wayland/X11 environment variables required for system clipboard interactions.

### Solution A: Preserve Environment Variables (`-E`)
The `-E` flag forces `sudo` to inherit your normal user's environment (retaining your `$HOME` path for configs and display variables for the clipboard) while maintaining root privileges.

```bash
sudo -E nvim /etc/environment
```
*Persistent Setup:* Add an alias to your `~/.zshrc`:
```bash
alias snvim="sudo -E nvim"
```

### Solution B: The Proper Unix Way (`sudoedit`)
`sudoedit` bypasses the issue entirely by never running the editor as root. Instead, it copies the target file to a secure temporary location, opens it under your standard user account (loading LazyVim and the clipboard natively), and quietly writes the changes back as root upon saving.

*Persistent Setup:* Add the following to your `~/.zshrc`:
```bash
export SUDO_EDITOR=$(which nvim)
```
Reload your shell configuration (`source ~/.zshrc`), and edit protected files using:
```bash
sudoedit /etc/environment
```