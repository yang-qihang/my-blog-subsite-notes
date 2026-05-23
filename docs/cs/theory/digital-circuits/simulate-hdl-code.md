[← Back to The Main Directory for Digital Circuit](./index.md){ .md-button }

# Simulating HDL Source Code Files

In a freshman-level introductory digital circuits course, students are usually introduced to a visual approach to design. We learn by dragging and dropping digital components—like logic gates—onto a diagram in Logisim or similar educational software. However, this isn't how real-world engineering works.

As the scale of a circuit increases, manually organizing it visually becomes tedious, if not completely impossible. This is where Hardware Description Languages (HDLs) come in. Since my university's course doesn't really cover this, I decided to learn it on my own.

This page covers everything you need to know about simulating HDL source code files: from setting up the necessary toolchain to frequently used commands and more nuanced details.

## 1. Choosing the right tools for yourself

Since this guide is based on my own experience, I will focus mainly on the lightweight, open-source stack. 

This combination is incredibly fast, lives entirely in your terminal, and integrates perfectly with editors like Neovim.

#### For Verilog: Icarus Verilog (`iverilog`)

- **What it is**:

    A standard open-source Verilog compiler and simulator.

- **How it works**:

    It acts similarly to a C compiler. You compile your `.v` files into an executable format, run it with `vvp`, and generate a waveform dump file.

- **Install**:

    ```bash
    sudo apt install iverilog
    ```

#### For VHDL: `GHDL`

- **What it is:**:
    
     An open-source analyzer, compiler, and simulator for VHDL.

- **How it works**:
     
     It translates VHDL directly into machine code for extremely fast execution.

- **Install**:

     ```bash
     sudo apt install ghdl
     ```

#### For Viewing Results: `GTKWave`

- **What it is**:

      A digital waveform viewer.

- **How it works**:

      When you run your testbenches, your simulation outputs a `.vcd` (Value Change Dump) file. Opening this in GTKWave allows you to visually trace your logic gates, flip-flops, and clock signals over time to verify your design.

- **Install**: 

      ```bash
      sudo apt install gtkwave
      ```

**Setup Tip:**

Setup Tip:
To integrate this into a LazyVim setup, you need to configure two things: Treesitter (using the systemverilog and vhdl parsers for syntax highlighting) and Language Servers (like `verible` and `vhdl_ls` for robust linting, autocompletion, and formatting right in your editor).

To enable HDL support, create a new configuration file at the following path and insert the code below.

```lua
-- ==============================================================================
-- Description: Custom LazyVim configuration for Hardware Description Languages.
--              Provides syntax highlighting, linting, and autocompletion 
--              for Verilog, SystemVerilog, and VHDL.
-- ==============================================================================

return {
  -- 1. Treesitter: Provides AST-based syntax highlighting
  {
    "nvim-treesitter/nvim-treesitter",
    opts = function(_, opts)
      -- Use vim.list_extend to safely append to LazyVim's default parser list 
      -- without overwriting existing parsers (like lua, markdown, c).
      if type(opts.ensure_installed) == "table" then
        vim.list_extend(opts.ensure_installed, { 
          -- Note: The nvim-treesitter community deprecated the old "verilog" 
          -- parser. Use "systemverilog" instead, which perfectly supports 
          -- standard .v files as a superset.
          "systemverilog",  
          "vhdl" 
        })
      end
    end,
  },

  -- 2. LSP Config: Provides autocompletion, live error checking, and go-to-definition
  {
    "neovim/nvim-lspconfig",
    opts = {
      -- LazyVim's lspconfig hooks into Mason automatically.
      -- Declaring servers here tells Mason to download the binaries if missing,
      -- and tells Neovim to attach them when opening .v, .sv, or .vhd files.
      servers = {
        verible = {}, -- Language server for Verilog / SystemVerilog
        vhdl_ls = {}, -- Language server for VHDL
      },
    },
  },
}
```

## 2. The lifecycle of a digital design (using Verilog in examples)

The workflow always follows three strict steps:

1. Write

2. Compile & Simulate

3. View.

### Step 1: Write the Code (The Design & The Testbench)

In hardware design, you always write two files. One is the actual circuit (the module), and the other is a "Testbench" (a fake environment that feeds inputs into your circuit to see how it reacts).

#### File 1: `half_adder.v` (The Circuit)

This is the actual hardware. We are designing a simple Half-Adder (adds two bits together).
Verilog

```verilog
module half_adder(
    input a,
    input b,
    output sum,
    output carry
);
    // Continuous assignment: this physically wires the logic gates
    assign sum = a ^ b;   // XOR gate
    assign carry = a & b; // AND gate
endmodule
```

#### File 2: `half_adder_tb.v` (The Testbench)

This file is pure simulation. It does not turn into hardware. It generates the signals (0s and 1s) and records the output.

```Verilog
module half_adder_tb;
    // Registers hold values (our inputs), Wires connect to outputs
    reg test_a;
    reg test_b;
    wire out_sum;
    wire out_carry;

    // Instantiate our circuit and connect the wires
    half_adder my_adder (
        .a(test_a),
        .b(test_b),
        .sum(out_sum),
        .carry(out_carry)
    );

    // This block runs once at the start of the simulation
    initial begin
        // CRITICAL FOR GTKWAVE: Tell the simulator to record the waveform
        $dumpfile("waveform.vcd"); 
        $dumpvars(0, half_adder_tb);

        // Feed inputs into the circuit with a #10 time delay between each
        test_a = 0; test_b = 0;
        #10 test_a = 0; test_b = 1;
        #10 test_a = 1; test_b = 0;
        #10 test_a = 1; test_b = 1;
        #10 $finish; // End the simulation
    end
endmodule
```


#### About The Dump Commands ($dumpfile and $dumpvars)

In Verilog, any function that starts with a `$` is a system task. These do not synthesize into physical hardware; they act as **instructions to the simulation** software itself.

```verilog
$dumpfile("waveform.vcd");
```
This tells the simulator the exact filename to open and write the **Value Change Dump (VCD)** data into.

```verilog
$dumpvars(level, scope);
```
This tells the simulator what signals to track.

In your code, `$dumpvars(0, half_adder_tb);` is used. The `0` means "dump all variables in `half_adder_tb` AND in all modules instantiated underneath it."

If you set the level to `1`, it would only dump signals at the top level of the testbench and **ignore the internal wires of the modules below it**. When you eventually tackle massive designs (like a full RISC-V processor architecture), dumping every single internal wire creates gigantic, slow-to-write files, so **controlling this scope becomes critical**.

### Step 2: Compile & Simulate (iverilog & vvp)

Now we drop back to the shell (Zsh/Bash) to compile these files into an executable simulation.

1. **Compile**:
     Run Icarus Verilog to compile the design and testbench into a simulation file (let's call it `sim_result`).

     ```Bash
     iverilog -o sim_result half_adder.v half_adder_tb.v
     ```
     
2. **Simulate**: Run the simulation executable using vvp (the Icarus Verilog runtime engine).

     ```Bash
     vvp sim_result
     ```

What just happened?

The vvp engine ran your testbench. Because you included the $dumpfile(`"waveform.vcd"`) command in your Verilog code, it quietly generated a file named `waveform.vcd` in your directory. This file contains the exact timing of every 1 and 0 that flipped during the simulation.

### Step 3: View the Results (`gtkwave`)

You have the data, but reading a raw `.vcd` text file is impossible. You need a visualizer.

Open the waveform:

```bash
gtkwave waveform.vcd &
```
**How to use the GTKWave GUI:**

1. When it opens, the screen will be mostly blank. 

2. On the top left, you will see a folder tree. Click on `half_adder_tb`.

3. that, a list of your signals will appear (`test_a`, `test_b`, `out_sum`, `out_carry`).

4. all of them and click the **"Append"** button (or drag them into the main black window).

5. Click the "Zoom Fit" button (it looks like a magnifying glass with a square). 

6. You will now see a beautiful, visual timing diagram. You can trace a vertical line down the screen and see exactly what `out_sum` and `out_carry` are doing at the exact nanosecond that `test_a` and `test_b` change states. 

### The VHDL Equivalent (GHDL)

If you decide to do the labs in VHDL instead of Verilog, the workflow is conceptually identical, just with different syntax and terminal commands:

```bash
# 1. Analyze (compile) the files
ghdl -a half_adder.vhd
ghdl -a half_adder_tb.vhd
# 2. Elaborate (build the executable)
ghdl -e half_adder_tb
# 3. Run and generate the waveform
ghdl -r half_adder_tb --vcd=waveform.vcd
# 4. View
gtkwave waveform.vcd
```

#### File 1: `half_adder.vhd` (The Circuit)

```vhdl
library ieee;
use ieee.std_logic_1164.all;

entity half_adder is
    port (
        a     : in  std_logic;
        b     : in  std_logic;
        sum   : out std_logic;
        carry : out std_logic
    );
end entity half_adder;

architecture behavior of half_adder is
begin
    -- Concurrent signal assignments
    sum   <= a xor b;
    carry <= a and b;
end architecture behavior;
```

File 2: `half_adder_tb.vhd` (The Testbench)

```vhdl
library ieee;
use ieee.std_logic_1164.all;

entity half_adder_tb is
    -- Testbenches have no external ports
end entity half_adder_tb;

architecture sim of half_adder_tb is
    -- 1. Declare the component we want to test
    component half_adder is
        port (
            a     : in  std_logic;
            b     : in  std_logic;
            sum   : out std_logic;
            carry : out std_logic
        );
    end component;

    -- 2. Define internal signals to wire up to our component
    signal test_a     : std_logic := '0';
    signal test_b     : std_logic := '0';
    signal out_sum    : std_logic;
    signal out_carry  : std_logic;

begin
    -- 3. Instantiate the component and map the ports (similar to Verilog's .port(wire))
    uut: half_adder port map (
        a     => test_a,
        b     => test_b,
        sum   => out_sum,
        carry => out_carry
    );

    -- 4. Drive the simulation stimulus
    stim_proc: process
    begin
        test_a <= '0'; test_b <= '0';
        wait for 10 ns;

        test_a <= '0'; test_b <= '1';
        wait for 10 ns;

        test_a <= '1'; test_b <= '0';
        wait for 10 ns;

        test_a <= '1'; test_b <= '1';
        wait for 10 ns;

        -- Suspend the process indefinitely, otherwise it loops forever
        wait; 
    end process;
end architecture sim;
```

## 3. A Difference between VHDL and Verilog about dump commands

**There are no dump commands in the VHDL testbench code**, and that is entirely by design.

This highlights one of the biggest philosophical differences between Verilog and VHDL.

### Verilog: Code and Simulator are Mixed

Verilog is a very pragmatic, hacker-friendly language. It allows you to embed simulation directives directly into your hardware code using **system tasks** like `$dumpfile` and `$dumpvars`. The code essentially "talks" to the simulator.

### VHDL: Strict Separation of Concerns

VHDL is designed to be strictly pure. The language designers believed that a hardware description file should only contain hardware descriptions and logic. It shouldn't know or care about what simulation software you are running, what a `.vcd` file is, or where you want to save it on your hard drive.

Because of this, VHDL handles waveform dumping entirely from the command line.

## 4. Loops in HDLs: Spatial vs. Temporal

Because HDLs describe both physical circuits and software testbenches, there are two distinct categories of loops. You must choose based on **when** the loop executes.

### Spatial Loops: Hardware Generation (Compilation)
**Use Case:** Designing the actual circuit module.
These act like C preprocessor macros. They do not run over time; they command the synthesizer to "unroll" the code and stamp out physical, parallel hardware gates before the circuit is built.

**Verilog:** Uses a `generate` block and a special compile-time `genvar`. 
*   **Syntax Note - Named Blocks:** The `begin` block *must* be named (e.g., `begin : gate_array`). This creates a hierarchical path so the simulator can uniquely identify and track each generated gate (e.g., `gate_array[0]`, `gate_array[1]`).
*   **Syntax Note - Incrementing:** Verilog does not have `i++` or `++i`. You must write `i = i + 1`.

```verilog
module bitwise_and (
    input  [3:0] a,
    input  [3:0] b,
    output [3:0] out
);
    genvar i; // Exists only during compilation
    
    generate
        for (i = 0; i < 4; i = i + 1) begin : gate_array
            assign out[i] = a[i] & b[i];
        end
    endgenerate
endmodule
```

**VHDL:** Implicitly declares the loop variable and requires a label at the start.
```vhdl
architecture behavior of bitwise_and is
begin
    gate_array: for i in 0 to 3 generate
        out_port(i) <= a(i) and b(i);
    end generate gate_array;
end architecture behavior;
```

### Temporal Loops: Behavioral Execution (Simulation)
**Use Case:** Writing testbenches.
These act exactly like `for` loops in C. They execute sequentially over time, driven by the simulation software, to iterate through test vectors.

**Verilog:** Uses standard `integer` types inside an `initial` or `always` block.
```verilog
module testbench;
    reg [3:0] test_val;
    integer i; // Standard runtime variable
    
    initial begin
        for (i = 0; i < 16; i = i + 1) begin
            test_val = i;
            #10; // Wait 10 nanoseconds
            $display("Testing value: %d", test_val);
        end
    end
endmodule
```

**VHDL:** Runs inside a `process`.
```vhdl
architecture sim of testbench is
    signal test_val : integer := 0;
begin
    stim_proc: process
    begin
        for i in 0 to 15 loop
            test_val <= i;
            wait for 10 ns; 
            report "Testing value: " & integer'image(test_val);
        end loop;
        wait;
    end process;
end architecture sim;
```
