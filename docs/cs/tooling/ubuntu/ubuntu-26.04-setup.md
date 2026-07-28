# Ubuntu 26.04 Setup

## Install Vim and Configure Package Mirrors

```bash
sudo apt update && sudo apt install vim -y # Install Vim
```

Change the `apt` mirror to the [Tsinghua University Mirror](https://mirrors.tuna.tsinghua.edu.cn/) for faster downloads.

## Update the system

```bash
sudo apt update
sudo apt full-upgrade
```

## Chinese Input Method

```bash
sudo apt update
sudo apt install im-config fcitx5 fcitx5-chinese-addons fcitx5-config-qt fcitx5-frontend-all
im-config -n fcitx5
```

Logout/login.

Then:

```bash
fcitx5-configtool
```

Add:
```bash
Pinyin
```

Go to **Settings → Apps**, and select **fcitx5** and you should see an **autostart** toggle. Enable it.

Or you can try to add the entry into `~/.config/autostart` manually as well.

## NVIDIA Driver

If you encounter any issues during Ubuntu setup or configuration, please refer to the related articles in the Ubuntu category for detailed solutions and troubleshooting notes. 

[Troubleshooting NVIDIA Driver on Ubuntu 26.04](./troubleshooting-nvidia-on-ubuntu-26.04.md)

##  Install the clipboard utilities needed for nvim

Neovim actually doesn't have its own built-in mechanism for talking to the system clipboard. Instead, it acts like a manager and outsources the job to **external clipboard utilities installed on your OS**.

You just need to install the dedicated clipboard utility for Wayland. It bridges the gap between terminal applications and the Wayland compositor.

```bash
sudo apt install wl-clipboard
```

## VPN Software

The best VPN/proxy client for Ubuntu in 2026 is **Clash Verge Rev**, which provides an Ubuntu/Debian `.deb` package.

[Clash Verge Rev's Github Page](https://github.com/clash-verge-rev/clash-verge-rev)
## Install Nerd Fonts

Download fonts from the [Nerd Fonts Official Website](https://www.nerdfonts.com/font-downloads).
*(Recommendation: `JetBrains Mono NF`)*

**Method 1: Install fonts for the current user only**

1. Create the user font directory (if it doesn't exist):
   ```bash
   mkdir -p ~/.local/share/fonts
   ```
2. Move all font files (e.g., `.ttf`, `.otf`) into this folder:
   ```bash
   mv *.ttf *.otf ~/.local/share/fonts
   ```
3. Update the font cache:
   ```bash
   fc-cache -fv
   ```

**Method 2: Install fonts system-wide (for all users)**

4. Create a system font directory:
   ```bash
   sudo mkdir -p /usr/share/fonts/custom
   ```
5. Copy font files into the directory:
   ```bash
   sudo cp *.ttf *.otf /usr/share/fonts/custom/
   ```
6. Update the system font cache:
   ```bash
   sudo fc-cache -fv

## Install Zsh & Oh My Zsh

Follow [this guide](https://www.haoyep.com/posts/zsh-config-oh-my-zsh/) to install zsh and Oh My Zsh.

## Install Starship Prompt **(Optional!!)**

Install the `starship` prompt by downloading the script and modifying your shell's configuration file (e.g., `~/.zshrc`). Please refer to the [Starship Official Guide](https://starship.rs/guide/) for detailed instructions.

## Install Neovim

Download the latest pre-built release of `neovim` and follow the steps on the [official website](https://neovim.io/doc/install/).
    
**NOTE:** We download the pre-built release from the official website instead of installing via `apt`. The version available in Ubuntu's default repository is often outdated and lacks newer features or fixes.

## Setting up C/C++/Haskell Development Toolchain

Because the process of setting up the environment warrants another standalone blog. Please click this link to see another note dedicated to [LazyVim setup for C, C++, and Haskell](./lazyvim-c-cpp-haskell-setup.md).

## Setting Up a Shared NTFS Partition Between Ubuntu 26.04 and Windows 11

The recommended approach is to mount the NTFS partition automatically in Ubuntu using `/etc/fstab`, instead of manually mounting it with `sudo mount` every time.

### 1. Disable Windows Fast Startup

Before accessing an NTFS partition from Linux, **disable Windows Fast Startup**.

Fast Startup uses a partial hibernation mechanism. If Windows is not completely shut down, Linux may detect the NTFS partition as "unclean" and mount it read-only or refuse to mount it.

#### Option 1: Disable hibernation completely

Open **Windows Terminal / Command Prompt as Administrator**:

```powershell
powercfg /hibernate off
```

This disables **Windows hibernation** and **Fast Startup**. Then perform one normal Windows shutdown afterward.

#### Option 2: Disable only Fast Startup

Go to:

```text
Control Panel
→ Hardware and Sound
→ Power Options
→ Choose what the power buttons do
→ Change settings that are currently unavailable
→ Disable "Turn on fast startup"
```

---

### 2. Identify the NTFS Partition

Boot into Ubuntu and list storage devices:
```bash
lsblk -f
```
Example:

```text
NAME        FSTYPE LABEL   UUID
nvme0n1p4   ntfs   Shared  1234ABCD5678EFGH
```

Record:

- UUID

- Partition label (optional)

Use the UUID rather than `/dev/nvme0n1p4`, because **device names may change**.

---

### 3. Find Your Ubuntu User and Group IDs

NTFS does not store Linux ownership information.

Find your user and group IDs:

```bash
id -u
id -g
```

Typical output:

```text
1000
1000
```

These values will be used later.

### 4. Create the Mount Point

Create a permanent mount directory:

```bash
sudo mkdir -p /mnt/windowsshared
```

This directory is only the mount point. The actual files will appear here after mounting.

---

### 5. Configure Automatic Mounting with `/etc/fstab`

Backup the current configuration:

```bash
sudo cp /etc/fstab /etc/fstab.backup
```

Edit:

```bash
sudoedit /etc/fstab
```

Add:

```fstab
UUID=YOUR_UUID /mnt/windowsshared ntfs3 uid=1000,gid=1000,fmask=0133,dmask=0022,windows_names,nofail,x-systemd.automount 0 0
```

Replace `YOUR_UUID` with the UUID obtained from `lsblk -f`.

**Explanation of Mount Options**

- **`ntfs3`**: Uses the modern Linux kernel NTFS driver.

- **`uid` and `gid`**: 

    e.g. `uid=1000,gid=1000` Makes files appear owned by your Ubuntu user.

- **`fmask`**: Controls permissions of files.

    e.g. `fmask=0133` results in `-rw-r--r--` for normal files. This prevents all NTFS files from appearing executable.

- **`dmask`**: Controls permissions of directories.

    e.g. `dmask=0022` results in `drwxr-xr-x` for directories.

- **`windows_names`**:

    Prevents Linux from creating filenames that Windows cannot handle.
    
    e.g. 
    ```text
    CON
    AUX
    file:name
    ```

- **`nofail`**

    Allows Ubuntu to boot even if the partition is unavailable.

- **`x-systemd.automount`**

    Mounts the partition automatically when it is accessed instead of blocking boot.

---

### 6. Test the Configuration

Reload systemd:

```bash
sudo systemctl daemon-reload
```

Mount everything from `/etc/fstab`:

```bash
sudo mount -a
```

Check the contents:

```bash
ls /mnt/windowsshared
```

Verify:

```bash
findmnt -T /mnt/windowsshared
```

---

### 7. Test Read and Write Access

Create a temporary file:

```bash
touch /mnt/windowsshared/.ubuntu-test
```

Remove it:

```bash
rm /mnt/windowsshared/.ubuntu-test
```

If both work, Ubuntu has read/write access.

---

### 8. Optional: Create a Shortcut

You may create a symbolic link in your home directory:

```bash
ln -s /mnt/windowsshared ~/Shared
```

Then:

```bash
cd ~/Shared
```

will access the shared partition.

To remove the symbolic link:

```bash
rm ~/Shared
```

This removes only the shortcut, not the data.

Check before deleting:

```bash
ls -l ~/Shared
```

Example:

```text
Shared -> /mnt/windowsshared
```

---

### 9. Why Files Previously Appeared Green in `ls`

When the partition was mounted manually:

```bash
sudo mount /dev/nvme0n1p4 /mnt/windowsshared
```

files may have appeared green.

This was **not** because Linux could not understand the file type.

The reason was usually that NTFS files were presented with Linux executable permissions:

```text
-rwxrwxrwx
```

Ubuntu's `ls --color` displays executable files in green.

The file contents did not change.

The mount options:

```text
fmask=0133,dmask=0022
```

fix this by presenting:

```text
-rw-r--r--
```

for ordinary files.

---

### 10. Troubleshooting

#### Partition mounts as read-only

The usual cause is that Windows was not fully shut down.

Boot Windows and run:

```powershell
chkdsk D: /f
```

Replace `D:` with the actual Windows drive letter.

Then shut Windows down completely.

#### Do not force-mount damaged NTFS partitions

Avoid:

```bash
mount -o force
```

If NTFS is dirty, repair it from Windows instead.

---

### Final Recommended Configuration

For a normal Ubuntu 26.04 + Windows 11 dual-boot system:

Windows:

```text
Fast Startup: disabled
```

Ubuntu `/etc/fstab`:

```fstab
UUID=<partition UUID> /mnt/windowsshared ntfs3 uid=1000,gid=1000,fmask=0133,dmask=0022,windows_names,nofail,x-systemd.automount 0 0
```

This provides:

- Automatic mounting
- Read/write access
- Correct Linux permissions
- Windows-compatible filenames
- Safe dual-boot behavior
