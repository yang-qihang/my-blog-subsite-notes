# Yosys & Netlistsvg Quick Reference

*For turning Verilog/SystemVerilog code into logic schematics.*

## Installation

Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install yosys npm graphviz
sudo npm install -g netlistsvg
```

## Basic Workflow

- Write your Verilog file(s), e.g. `design.v`.

- Synthesize and export a `JSON` netlist with `Yosys`.
 
- Render an `SVG` schematic with netlistsvg.

### One-liner (combines steps 2 and 3):

```bash
yosys -p "read_verilog design.v; proc; synth -top top_module; write_json output.json" && netlistsvg output.json -o schematic.svg
```

- `-p "..."` passes a sequence of Yosys commands directly on the command line (no script file needed).

- `synth` performs generic synthesis (converts always blocks to gate-level logic).

- `netlistsvg` reads the JSON and draws an SVG.

## Specifying the Top Module

If your file contains multiple modules, explicitly choose the top-level one:

```bash
yosys -p "read_verilog design.v; proc; synth -top my_top; write_json output.json"
```

Without `-top`, `netlistsvg` may pick the first module it finds, often a submodule.

## Flattening the Schematic (remove hierarchy)
To see all gates in one flat diagram (no sub‑module boxes), insert the `flatten` command after `synth`:
```bash
yosys -p "read_verilog design.v; proc; synth -top my_top; flatten; write_json output.json" && netlistsvg output.json -o flat_schematic.svg
```

**Caution:** For large designs, a flattened schematic can become very cluttered.

## Yosys Built‑in show Command (Quick Preview)

Yosys can also produce a schematic directly (needs Graphviz dot):

```bash
yosys -p "read_verilog design.v; proc; synth -top my_top; show -format svg -prefix my_design"
```

`-format svg` (or `png`) sets the output format.

`-prefix my_design` sets the output filename (e.g. `my_design.svg`).

This skips netlistsvg entirely, but the visual style is different (bubble shapes).

## SVG Background Color

The SVG from netlistsvg has a transparent background. To add a white background:

### Option A: Insert a white rectangle right after the `<svg>` tag:

```svg
<rect width="100%" height="100%" fill="white" />
```

### Option B: Convert to PNG with a background using rsvg-convert:

```bash
rsvg-convert -b white -o schematic.png schematic.svg
```

## IEC (Rectangular) Logic Symbols

`netlistsvg` supports custom skin files to change gate appearances (e.g., from bubble to rectangular IEC 60617 symbols).

### Copy the default skin from netlistsvg:
```bash
cp /opt/homebrew/lib/node_modules/netlistsvg/built/skins/default.svg iec_skin.svg
```
(Path may differ; find with `npm list -g netlistsvg or check /usr/local/lib/...` on Linux.)

### Edit `iec_skin.svg`:

Replace gate shapes and labels with rectangular templates and IEC qualifying symbols.

Use the custom skin:
```bash
netlistsvg --skin iec_skin.svg output.json -o iec_schematic.svg
```

Creating a full IEC skin is non‑trivial, but this approach gives you full control.

## Printing Synthesis Statistics
In Yosys, use the stat command to see cell counts and hierarchy:

```bash
yosys -p "read_verilog design.v; proc; synth -top my_top; stat" -q
```

Or interactively:
```bash
yosys> read_verilog design.v
yosys> proc; synth -top my_top
yosys> stat
```

This shows how many cells, wires, and processes remain, and helps confirm no latches were inferred (look for Number of processes: 0 after synthesis).

## Useful Tips

- No latches = all `always @(*)` / `always_comb` blocks converted to combinational logic. In stat, Number of processes should become `0` after synth.

- If you see unexpected submodule boxes, check your `-top` setting or consider flatten.

- Combine `write_json` with `flatten` for a fully flat gate‑level view.

- Add `$dumpfile` and `$dumpvars` in your testbench and use `vvp` to generate VCD files. Then view them with GTKWave for timing diagrams (separate from schematic).

- For more advanced synthesis, explore Yosys commands like `abc -g gates` to map to a specific gate library.