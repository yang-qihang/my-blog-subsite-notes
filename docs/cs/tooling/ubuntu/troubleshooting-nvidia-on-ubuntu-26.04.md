---
render_macros: false
---

# Troubleshooting NVIDIA on Ubuntu 26.04: `nvidia-smi` Reports “No Devices Were Found”

## Hardware and software involved

This problem occurred on the following system:

- Laptop: ASUS TUF Gaming FA608PM
- GPU: NVIDIA GeForce RTX 5060 Laptop GPU
- GPU architecture: Blackwell
- Ubuntu: Ubuntu 26.04 LTS
- Kernel during diagnosis: `7.0.0-28-generic`
- NVIDIA driver branch: `595`
- Recommended package: `nvidia-driver-595-open`

**Warning**: The package and kernel version numbers in this section describe one
particular incident. Future Ubuntu installations may use a different
kernel and a newer NVIDIA driver branch.

---

## Initial installation

Ubuntu recommended the open NVIDIA driver:

```bash
ubuntu-drivers devices
```

The relevant output was:

```text
driver : nvidia-driver-595-open - distro non-free recommended
```

I installed the automatically recommended driver:

```bash
sudo ubuntu-drivers install
sudo reboot
```

However, after rebooting, the GPU was still unusable:

```bash
nvidia-smi
```

Output:

```text
No devices were found
```

Running `ubuntu-drivers install` again did not help:

```text
All the available drivers are already installed.
```

This meant that the recommended driver package was registered as
installed, but the NVIDIA GPU had not initialized successfully.

---

## Diagnostic commands

I used the following commands to inspect the running kernel, graphics
devices, loaded modules, Secure Boot state, installed NVIDIA packages,
and relevant kernel messages:

```bash
echo "===== Running kernel ====="
uname -r

echo "===== Graphics devices and bound drivers ====="
lspci -nnk | grep -A4 -E 'VGA|3D|Display'

echo "===== Loaded graphics modules ====="
lsmod | grep -E '^(nvidia|nouveau|amdgpu)'

echo "===== Installed NVIDIA module version ====="
modinfo -F version nvidia 2>&1

echo "===== Secure Boot ====="
mokutil --sb-state

echo "===== Installed NVIDIA packages ====="
apt list --installed 2>/dev/null \
  | grep -E 'nvidia-driver-595|linux-modules-nvidia-595|nvidia-dkms-595'

echo "===== Relevant kernel messages ====="
sudo journalctl -k -b --no-pager \
  | grep -Ei 'nvidia|NVRM|nouveau|verification|secure|RmInit|GSP|firmware|BAR|Xid' \
  | tail -n 150
```

The results initially looked contradictory.

The PCI device was detected correctly:

```text
01:00.0 VGA compatible controller:
NVIDIA Corporation GB206M [GeForce RTX 5060 Max-Q / Mobile]
```

The kernel also appeared to have attached an NVIDIA driver:

```text
Kernel driver in use: nvidia
```

The NVIDIA modules were loaded:

```text
nvidia_uvm
nvidia_drm
nvidia_modeset
nvidia
```

Secure Boot was not blocking the driver:

```text
SecureBoot disabled
```

Nevertheless, `nvidia-smi` still reported no device.

---

## The decisive kernel error

The important error was found in the kernel log:

```text
NVRM: The NVIDIA GPU 0000:01:00.0
NVRM: installed in this system requires use of the NVIDIA open kernel modules.

NVRM: GPU 0000:01:00.0:
RmInitAdapter failed! (0x22:0x56:1017)

NVRM: GPU 0000:01:00.0:
rm_init_adapter failed, device minor number 0
```

This showed that an NVIDIA kernel module had loaded, but it was the wrong
flavour for this GPU.

The RTX 5060 is a Blackwell-generation GPU. It requires NVIDIA's official
open kernel modules. The historical proprietary kernel-module flavour
cannot initialize this GPU.

---

## Confirming which kernel module was selected

I checked the licence and path of the `nvidia` module:

```bash
modinfo -F license nvidia
modinfo -n nvidia
```

The output was:

```text
NVIDIA
/lib/modules/7.0.0-28-generic/kernel/nvidia-595/nvidia.ko
```

The licence value:

```text
NVIDIA
```

identified the loaded module as the proprietary kernel-module flavour.

For the open NVIDIA kernel module, the expected licence is:

```text
Dual MIT/GPL
```

The module path should also correspond to an `nvidia-595-open` directory.

---

## Root cause

Both NVIDIA kernel-module flavours had been installed simultaneously.

The correct packages included:

```text
nvidia-driver-595-open
linux-modules-nvidia-595-open-7.0.0-28-generic
linux-modules-nvidia-595-open-generic-hwe-26.04
```

However, the following non-open packages were also present:

```text
linux-modules-nvidia-595-7.0.0-14-generic
linux-modules-nvidia-595-7.0.0-28-generic
linux-modules-nvidia-595-generic-hwe-26.04
linux-objects-nvidia-595-7.0.0-14-generic
linux-objects-nvidia-595-7.0.0-28-generic
```

Both flavours provided kernel modules with the same basic names:

```text
nvidia.ko
nvidia-drm.ko
nvidia-modeset.ko
nvidia-uvm.ko
```

The kernel module index selected the proprietary copy:

```text
/lib/modules/7.0.0-28-generic/kernel/nvidia-595/nvidia.ko
```

The result was:

```text
GPU detected over PCI
        ↓
nvidia kernel module loaded
        ↓
module attached to the PCI device
        ↓
GPU initialization rejected
        ↓
nvidia-smi: No devices were found
```

This also explains why `ubuntu-drivers install` said that everything was
already installed. The recommended `nvidia-driver-595-open` package was
indeed installed, so `ubuntu-drivers` did not detect that another copy of
`nvidia.ko` was being selected at runtime.

---

## Removing the conflicting proprietary packages

**Warning**:

Do not run this cleanup merely because `nvidia-smi` fails.

First confirm that:

1. the GPU requires the open NVIDIA kernel modules;

2. both open and non-open packages are installed; and

3. `modinfo -F license nvidia` reports `NVIDIA` rather than
   `Dual MIT/GPL`.

The following script located installed NVIDIA 595 kernel packages whose
names did not contain `open`:

```bash
mapfile -t badpkgs < <(
    dpkg-query -W \
      -f='${db:Status-Abbrev} ${binary:Package}\n' 2>/dev/null |
    awk '
        $1 == "ii" &&
        $2 !~ /open/ &&
        (
            $2 ~ /^linux-(modules|objects)-nvidia-595/ ||
            $2 ~ /^nvidia-(dkms|kernel-source)-595/
        ) {
            print $2
        }
    '
)

echo "Proprietary packages that will be removed:"
printf '  %s\n' "${badpkgs[@]}"
```

On this machine it printed:

```text
Proprietary packages that will be removed:
  linux-modules-nvidia-595-7.0.0-14-generic
  linux-modules-nvidia-595-7.0.0-28-generic
  linux-modules-nvidia-595-generic-hwe-26.04
  linux-objects-nvidia-595-7.0.0-14-generic
  linux-objects-nvidia-595-7.0.0-28-generic
```

Before removing them, I checked the list carefully.

The command should not remove packages such as:

```text
nvidia-driver-595-open
linux-modules-nvidia-595-open-...
linux-image-...
ubuntu-desktop
```

After confirming the package list, I removed the conflicting packages:

```bash
if ((${#badpkgs[@]})); then
    sudo apt purge "${badpkgs[@]}"
else
    echo "No installed proprietary NVIDIA 595 packages were found."
fi
```

---

## Removing the stale proprietary module directory

A previous partial package removal had been insufficient because the
proprietary module files were still available under the running kernel's
module directory.

I stored the current kernel version:

```bash
kver=$(uname -r)
```

Then removed only the stale proprietary NVIDIA 595 directory:

```bash
sudo rm -rf "/lib/modules/$kver/kernel/nvidia-595"
```

**Caution**:

This path is specific to this diagnosed conflict.

Do not delete arbitrary files from `/lib/modules`. Confirm the selected module path with `modinfo -n nvidia` before removing anything.

---

### Reinstalling only the open NVIDIA module

I then reinstalled the correct open driver packages:

```bash
sudo apt update

sudo apt install --reinstall \
    "linux-modules-nvidia-595-open-$kver" \
    linux-modules-nvidia-595-open-generic-hwe-26.04 \
    nvidia-driver-595-open
```

Next, I rebuilt the kernel module dependency index and the initramfs:

```bash
sudo depmod -a "$kver"
sudo update-initramfs -u -k "$kver"
```

---

### Verifying the selected module before rebooting

Before restarting, I checked the module again:

```bash
modinfo -k "$kver" -F license nvidia
modinfo -k "$kver" -n nvidia
```

The expected result was now:

```text
Dual MIT/GPL
```

and a path belonging to the open module flavour, similar to:

```text
/lib/modules/7.0.0-28-generic/kernel/nvidia-595-open/nvidia.ko
```

If the result had still been:

```text
NVIDIA
```

I would have searched for every remaining copy of `nvidia.ko`:

```bash
find "/lib/modules/$kver" -type f -name 'nvidia.ko*' \
    -print -exec dpkg -S {} \; 2>&1
```

This identifies both the location of each module and the package that
owns it.

---

## Rebooting and final verification

After the open module had been selected correctly:

```bash
sudo reboot
```

After logging in again:

```bash
nvidia-smi
```

The RTX 5060 was finally detected normally.

I also verified the selected module:

```bash
modinfo -F license nvidia
modinfo -n nvidia
```

Expected result:

```text
Dual MIT/GPL
/lib/modules/<current-kernel>/.../nvidia-595-open/.../nvidia.ko
```

The external display also became usable after the NVIDIA GPU initialized
correctly.

---

## Why the `-open` driver is correct

The following three drivers should not be confused:

| Driver | Description |
|---|---|
| Nouveau | Community-developed open-source Linux driver |
| NVIDIA proprietary kernel modules | NVIDIA's historical closed kernel-module flavour |
| NVIDIA open kernel modules | NVIDIA's official modern kernel-module flavour |

The package used here:

```text
nvidia-driver-595-open
```

is still part of NVIDIA's official driver stack. It is not Nouveau.

The word `open` refers mainly to the NVIDIA kernel modules. The normal
NVIDIA user-space components for OpenGL, Vulkan, CUDA and device
management are still used.

For this RTX 5060, the choice was not between a faster proprietary driver
and a slower open driver:

```text
Proprietary NVIDIA kernel module:
    GPU initialization fails

Open NVIDIA kernel module:
    officially supported and functional
```

---

## Normal installation procedure for future systems

This conflict is not expected during every Ubuntu installation.

The normal process should remain:

```bash
sudo apt update
sudo apt full-upgrade

ubuntu-drivers devices
sudo ubuntu-drivers install

sudo reboot
nvidia-smi
```

For an RTX 50-series GPU, I would additionally verify:

```bash
modinfo -F license nvidia
modinfo -n nvidia
```

The expected licence is:

```text
Dual MIT/GPL
```

The detailed purge procedure above should be treated as troubleshooting
for a confirmed package conflict, not as part of every routine Ubuntu
installation.

---

## Main lesson

The presence of `nvidia` in `lsmod` or the line:

```text
Kernel driver in use: nvidia
```

does not prove that the GPU initialized successfully.

A more complete verification sequence is:

```bash
nvidia-smi
modinfo -F license nvidia
modinfo -n nvidia

sudo journalctl -k -b --no-pager |
grep -Ei 'nvidia|NVRM|RmInit|GSP|firmware'
```

In this incident, the package manager believed that the recommended
driver was installed, while the kernel was actually selecting a
conflicting and unsupported copy of `nvidia.ko`.
