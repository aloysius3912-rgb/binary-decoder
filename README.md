#  FYP A2113-251: Technology-Enhanced Learning (TEL) of Digital Binary Decoders

##  Introduction
This web application was developed as a Final Year Project to provide an interactive, Technology-Enhanced Learning (TEL) environment for students. The core objective is to create an accessible platform where students can actively practice, revise, and solidify their conceptual understanding of digital binary decoders.

### What is a Binary Decoder?
> A **decoder** is a combinational logic circuit that converts binary information from *n* input lines to a maximum of *2^n* unique output lines. For each unique input combination, exactly one output line is asserted (activated).

---

##  Available Features

* ** Landing Page** Includes summarized reading content and useful links to help users grasp the fundamental theories and mathematics before diving into the interactive tools.
  
* ** Showcase (Decoder Logic Solver)** A dynamic decoder solver powered by a custom Boolean logic parser. Users can input complex boolean equations (with brackets and logic operators), and the engine generates a complete Truth Table and active statuses. Supports 2-to-4, 3-to-8, and 4-to-16 decoders.

* ** Logic Function Visualizer** An interactive sandbox where students design circuits by selecting active minterms. The engine dynamically routes Bezier-curve wires from the decoder to a logic gate (OR for Active High, NAND for Active Low) and calculates the resulting canonical Boolean Function ($F$).

* ** Quiz 1.0 (Multiple Choice)** An assessment mode where students analyze a given Decoder configuration and calculate the correct logic outputs or minterms.

* ** Quiz 2.0 (Fill-in-the-Blank)** A reverse-engineering challenge: Given a dynamically generated decoder diagram with randomized inputs and wire connections, students must determine and type out the correct Boolean expression for $F$. The indestructible math engine evaluates their answer for mathematical equivalence.

---

