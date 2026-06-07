# Troubleshooting WeChat Chinese Input (Fcitx5) on Ubuntu Wayland

## The Problem
Fcitx5 works perfectly in browsers and other native applications, but fails to switch to Chinese or input Chinese characters within the Linux version of WeChat.

## The Cause
WeChat for Linux is built on Electron and, in this environment, runs under **XWayland** (the X11 compatibility layer for Wayland) rather than as a native Wayland window. Because it operates in this legacy X11 pipeline, it completely ignores native Wayland IME launch flags. Instead, XWayland applications rely entirely on global system environment variables to establish communication with Fcitx5.

*(Note: Attempting to inject Wayland flags like `--ozone-platform=wayland` into the `wechat.desktop` file will fail because the app is running through XWayland.)*

## The Solution
Hardcode the necessary GTK/X11 input module environment variables globally. This guarantees that the XWayland layer inherits them on boot and passes them correctly to WeChat.

### Step-by-Step Fix
1. Open your system-wide environment configuration file with root privileges:
```bash
   sudoedit /etc/environment
   ```

**NOTE**: We use `sudoedit` which is a workaround because directly using `sudo nvim` doesn't work. For more information about this, see [another post](./troubleshooting-sudo-nvim.md) 

2. Append the following lines to the bottom of the file:
```bash
   GTK_IM_MODULE=fcitx
   QT_IM_MODULE=fcitx
   XMODIFIERS=@im=fcitx
   ```

3. Save and exit the file.

4. **Reboot your PC** (or completely log out of your Wayland session and log back in) for the new environment variables to take effect globally.